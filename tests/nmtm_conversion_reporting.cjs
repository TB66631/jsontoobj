/* Portable report-isolation regression. No Blender, GUI, network, or private assets.
 * Uses the real conversion harness in --negative-only mode and preserves any
 * pre-existing report. Only this test's newly created small directories are removed.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'output');
const HARNESS = path.join(__dirname, 'nmtm_conversion_contract.cjs');
const OWN = path.join(OUTPUT, 'conversion-reporting-' + crypto.randomBytes(8).toString('hex'));
const cleanup = new Set([OWN]);
const checks = [];
fs.mkdirSync(OWN, {recursive: true});

function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [HARNESS, ...args], {
    cwd: ROOT, windowsHide: true, encoding: 'utf8', timeout: 30000,
    env: {...process.env, NMTM_BLENDER: path.join(OWN, 'not-a-real-blender.exe'), PYTHONDONTWRITEBYTECODE: '1'}
  });
  if (result.error) throw result.error;
  assert.equal(result.status, expected, 'Unexpected harness exit for ' + JSON.stringify(args) + '\n' + result.stdout + result.stderr);
  return result;
}
function rejected(args, pattern) {
  const result = run(args, 1);
  assert.match(result.stderr, pattern);
}
function readRun(result) {
  const match = result.stdout.match(/^CONTRACT_REPORT (.+) PASS$/m);
  assert.ok(match, result.stdout);
  const filename = match[1].trim();
  const report = JSON.parse(fs.readFileSync(filename, 'utf8'));
  assert.equal(report.mode, 'negative');
  assert.equal(report.passed, true);
  assert.equal(report.mandatorySummary.negativePassed, 13);
  assert.equal(report.mandatorySummary.actualConversions, 0);
  assert.equal(report.mandatorySummary.reopenedInspections, 0);
  return {filename, report, bytes: fs.readFileSync(filename)};
}
function check(name, fn) { fn(); checks.push(name); }

try {
  const legacy = path.join(OUTPUT, 'nmtm-rig-repair/conversion-contract/report.json');
  const legacyBefore = fs.existsSync(legacy) ? fs.readFileSync(legacy) : null;
  const first = readRun(run(['--negative-only']));
  const second = readRun(run(['--negative-only']));
  cleanup.add(first.report.outputDirectory);
  cleanup.add(second.report.outputDirectory);
  check('default runs own different directories and preserve prior bytes', () => {
    assert.notEqual(first.filename, second.filename);
    assert.deepEqual(fs.readFileSync(first.filename), first.bytes);
    if (legacyBefore) assert.deepEqual(fs.readFileSync(legacy), legacyBefore);
    else assert.equal(fs.existsSync(legacy), false);
  });
  check('explicit destination rejects an existing run', () => {
    rejected(['--negative-only', '--output-dir', first.report.outputDirectory], /already exists/);
    assert.deepEqual(fs.readFileSync(first.filename), first.bytes);
  });
  check('explicit fresh destination is used without overwriting a sibling', () => {
    const destination = path.join(OWN, 'explicit-run');
    const explicit = readRun(run(['--negative-only', '--output-dir', destination]));
    assert.equal(explicit.report.outputDirectory, destination);
    assert.deepEqual(fs.readFileSync(first.filename), first.bytes);
  });
  check('platform-equivalent absolute paths terminate and remain read-only', () => {
    const equivalent = process.platform === 'win32' ? first.filename.toLowerCase()
      : path.join(path.dirname(first.filename), '..', path.basename(path.dirname(first.filename)), 'report.json');
    const summary = JSON.parse(run(['--summarize-existing', equivalent]).stdout);
    assert.equal(summary.passed, true);
    assert.deepEqual(fs.readFileSync(first.filename), first.bytes);
    rejected(['--negative-only', '--output-dir', path.dirname(equivalent)], /already exists/);
  });
  check('summary is explicit and read-only', () => {
    const summary = JSON.parse(run(['--summarize-existing', first.filename]).stdout);
    assert.equal(summary.summaryOnly, true);
    assert.equal(summary.summarySourceReport, first.filename);
    assert.equal(summary.passed, true);
    assert.deepEqual(fs.readFileSync(first.filename), first.bytes);
    rejected(['--summarize-existing'], /Missing path/);
  });
  check('summary rejects a different source hash without modifying evidence', () => {
    const file = path.join(OWN, 'different-source.json');
    const contents = JSON.stringify({...first.report, sourceSha256: '0'.repeat(64)});
    fs.writeFileSync(file, contents);
    rejected(['--summarize-existing', file], /different production source/);
    assert.equal(fs.readFileSync(file, 'utf8'), contents);
  });
  check('summary preserves a historical source change or unknown state', () => {
    for (const state of [false, undefined]) {
      const file = path.join(OWN, 'historical-source-' + String(state) + '.json');
      const contents = JSON.stringify({...first.report, sourceUnchangedDuringRun: state});
      fs.writeFileSync(file, contents);
      const summary = JSON.parse(run(['--summarize-existing', file], 1).stdout);
      assert.equal(summary.sourceUnchangedDuringRun, state);
      assert.equal(summary.currentSourceMatchesSaved, true);
      assert.equal(summary.passed, false);
      assert.equal(fs.readFileSync(file, 'utf8'), contents);
    }
  });
  check('partial all-mode report cannot receive an empty success aggregate', () => {
    const file = path.join(OWN, 'partial.json');
    const contents = JSON.stringify({...first.report, mode: 'all', negative: [], conversions: [], inspections: null});
    fs.writeFileSync(file, contents);
    const summary = JSON.parse(run(['--summarize-existing', file], 1).stdout);
    assert.equal(summary.complete, false);
    assert.equal(summary.passed, false);
    assert.equal(fs.readFileSync(file, 'utf8'), contents);
  });
  check('summary checks individual inspections even if the aggregate claims success', () => {
    const file = path.join(OWN, 'inconsistent-inspection.json');
    const contents = JSON.stringify({...first.report, mode: 'all', passed: false,
      conversions: Array.from({length: 6}, () => ({passed: true})),
      inspections: {childError: null, report: {passed: true,
        cases: Array.from({length: 6}, (_, i) => ({passed: i !== 0}))}}});
    fs.writeFileSync(file, contents);
    const summary = JSON.parse(run(['--summarize-existing', file], 1).stdout);
    assert.equal(summary.complete, true);
    assert.equal(summary.savedPassed, false);
    assert.equal(summary.mandatorySummary.reopenedInspectionsPassed, 5);
    assert.equal(summary.passed, false);
    assert.equal(fs.readFileSync(file, 'utf8'), contents);
  });
  check('mode conflicts, unknown options, duplicate options, and missing values fail', () => {
    for (const args of [
      ['--negative-only', '--real-only'], ['--real-only', '--negative-only'],
      ['--negative-only', '--summarize-existing', first.filename],
      ['--summarize-existing', first.filename, '--output-dir', path.join(OWN, 'unused')]
    ]) rejected(args, /mutually exclusive|cannot be combined/);
    rejected(['--what-is-this'], /Unknown or duplicate/);
    rejected(['--negative-only', '--negative-only'], /Unknown or duplicate/);
    rejected(['--output-dir'], /Missing path/);
    rejected(['--output-dir', '--negative-only'], /Missing path/);
  });
  check('output root, escaped paths, alternate streams, and Windows devices fail', () => {
    for (const target of [OUTPUT, path.join(ROOT, 'outside-output'), path.join(OWN, '..', '..', 'escape')])
      rejected(['--negative-only', '--output-dir', target], /under repository\/output/);
    for (const target of [path.join(OWN, 'file:stream'), path.join(OWN, 'NUL'), path.join(OWN, 'trailing.')])
      rejected(['--negative-only', '--output-dir', target], /Unsafe conversion evidence/);
  });
  check('file ancestors and linked ancestors/targets fail without changing their files', () => {
    const file = path.join(OWN, 'regular-file');
    fs.writeFileSync(file, 'preserved');
    rejected(['--negative-only', '--output-dir', path.join(file, 'child')], /not a directory|ENOTDIR/);
    const target = path.join(OWN, 'link-target');
    fs.mkdirSync(target);
    const link = path.join(OWN, 'link');
    fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
    rejected(['--negative-only', '--output-dir', path.join(link, 'child')], /links\/junctions/);
    rejected(['--negative-only', '--output-dir', link], /links\/junctions/);
    rejected(['--summarize-existing', link], /links\/junctions/);
    assert.equal(fs.readFileSync(file, 'utf8'), 'preserved');
    assert.deepEqual(fs.readdirSync(target), []);
  });
  console.log('PASS conversion reporting isolation (' + checks.length + ' groups; 3 real negative-only subprocess runs, no Blender)');
} finally {
  for (const directory of cleanup) {
    const relative = path.relative(OUTPUT, directory);
    assert.ok(relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative),
      'Refusing to remove a path outside test output');
    // Every entry is either this test's random root or a new directory returned
    // by one of its own successful harness subprocesses; never an earlier run.
    fs.rmSync(directory, {recursive: true, force: true});
  }
}
