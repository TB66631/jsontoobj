/* Exercise the shipped renderer entrypoint, not a separately maintained bridge.
 * node tests/nmtm_conversion_contract.cjs [--negative-only|--real-only]
 * --summarize-existing only recalculates aggregate classification of a saved run;
 * it requires the exact same production source hash and executes no conversions.
 * No GUI is launched. All conversion and temporary outputs are project-local.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const nativeChild = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'output/nmtm-rig-repair/conversion-contract');
const SOURCE_PATH = path.join(ROOT, 'nmtm.js');
const SOURCE = fs.readFileSync(SOURCE_PATH, 'utf8');
const BLENDER = process.env.NMTM_BLENDER || 'D:/Program Files/Blender4.2/blender.exe';
fs.mkdirSync(OUT, {recursive: true});
const sourceHash = crypto.createHash('sha256').update(SOURCE).digest('hex');
const report = {
  generatedAt: new Date().toISOString(), source: SOURCE_PATH, sourceSha256: sourceHash,
  version: (SOURCE.match(/const PLUGIN_VERSION = '([^']+)'/) || [])[1],
  blender: BLENDER, negative: [], conversions: [], inspections: null,
  mode: process.argv.includes('--negative-only') ? 'negative' : process.argv.includes('--real-only') ? 'real' : 'all'
};
const persist = () => fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2) + String.fromCharCode(10));

function makeVm(execFile, spec = {}) {
  const calls = [], notices = [], errors = [];
  class Codec { constructor(id, options) { Object.assign(this, options); } }
  class ModelFormat { constructor(id, options) { Object.assign(this, options); } }
  class Action { constructor(id, options) { Object.assign(this, options); } }
  class Group {}
  class Mesh {}
  class Cube {}
  class ArmatureBone {}
  Group.all = []; Mesh.all = []; Cube.all = []; ArmatureBone.all = [];
  const childProcess = {execFile(...args) { calls.push(args); return execFile(...args); }};
  let outputStats = 0;
  const testFs = Object.create(fs);
  testFs.existsSync = file => spec.missingBlender && /blender[.]exe$/i.test(String(file)) ? false : fs.existsSync(file);
  testFs.statSync = file => {
    if (spec.outputStatThrows && String(file).endsWith('artifact.blend') && ++outputStats === 2)
      throw new Error('INJECTED_VERIFY_STAT_THROW');
    return fs.statSync(file);
  };
  const context = {
    console: {log() {}, warn() {}, error(...args) { errors.push(args.map(String).join(' ')); }},
    require(name) { return name === 'child_process' ? childProcess : name === 'fs' ? testFs : require(name); },
    process, Buffer, setTimeout, clearTimeout, __NMTM_TEST__: {},
    Plugin: {register() {}}, Plugins: {registered: {}}, Codec, ModelFormat, Action,
    MenuBar: {addAction() {}}, Formats: {},
    Blockbench: {showQuickMessage(text) { notices.push(String(text)); },
      showMessageBox(options) { errors.push(String(options.message)); }, read() {}, export() {}},
    Filesystem: {}, Project: null, Texture: {all: []}, Mesh, Cube,
    Animation: {all: []}, ArmatureBone, Group, Codecs: {},
    localStorage: {getItem() { return null; }, setItem() {}}
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context, {filename: SOURCE_PATH});
  assert.equal(typeof context.__NMTM_TEST__.api.blenderConvert, 'function');
  return {api: context.__NMTM_TEST__.api, calls, notices, errors};
}

function checkExecution(call) {
  const [executable, args, options] = call;
  const script = args[args.indexOf('--python') + 1];
  assert.ok(args.includes('--background'));
  assert.equal(args[args.indexOf('--threads') + 1], '2');
  assert.equal(args[args.indexOf('--python-exit-code') + 1], '1');
  assert.equal(options.windowsHide, true);
  assert.equal(path.dirname(script), options.cwd);
  assert.equal(options.env.TEMP, options.cwd);
  assert.equal(options.env.TMP, options.cwd);
  assert.equal(options.env.PYTHONDONTWRITEBYTECODE, '1');
  assert.ok(path.resolve(options.cwd).startsWith(path.resolve(OUT) + path.sep));
  assert.ok(!/^c:/i.test(options.env.TEMP), 'Blender TEMP must not be on C');
  assert.ok(fs.existsSync(script), 'embedded bridge must exist while child starts');
  const embedded = SOURCE.match(/const BLENDER_BRIDGE_BASE64 = '([^']+)'/)[1];
  assert.deepEqual(fs.readFileSync(script), Buffer.from(embedded, 'base64'));
  return {executable, args, script, directory: options.cwd, temp: options.env.TEMP,
    tmp: options.env.TMP, windowsHide: options.windowsHide, threads: 2};
}

async function negativeCase(name, spec) {
  const caseDir = path.join(OUT, 'negative', name);
  fs.mkdirSync(caseDir, {recursive: true});
  const output = path.join(caseDir, 'artifact.blend');
  const input = spec.owned ? output + '.nmtm.glb' : path.join(caseDir, 'caller-owned.nmtm.glb');
  fs.writeFileSync(input, 'caller payload');
  if (fs.existsSync(output)) fs.unlinkSync(output);
  let callback, execution, doneCount = 0;
  const h = makeVm((exe, args, options, cb) => {
    execution = checkExecution([exe, args, options]);
    callback = cb;
    if (spec.execThrows) throw new Error('INJECTED_EXEC_THROW');
    return {};
  }, spec);
  const p = h.api.blenderConvert(input, output, spec.kind || 'blend', () => {
    doneCount++;
    if (spec.doneThrows) throw new Error('INJECTED_DONE_THROW');
  });
  const result = {name, owned: !!spec.owned, advisory: !!spec.advisory, execution, callbackThrows: [], passed: false};
  try {
    if (!spec.execThrows && callback) {
      if (spec.output !== undefined) fs.writeFileSync(output, spec.output);
      for (let i = 0; i < (spec.duplicate ? 2 : 1); i++) {
        try { callback(spec.exitError ? new Error('INJECTED_NONZERO_EXIT') : null,
          spec.marker ? 'NMTM_CONVERT_OK blend ' + output + '\n' : 'Blender exited without result marker\n',
          spec.exitError ? 'INJECTED STDERR' : ''); }
        catch (error) { result.callbackThrows.push(error.message); }
      }
    }
    const state = await Promise.race([p.then(value => ({settled: true, value})),
      new Promise(resolve => setTimeout(() => resolve({settled: false}), 30))]);
    Object.assign(result, state, {doneCount, retainedInput: fs.existsSync(input),
      scriptRemoved: !execution || !fs.existsSync(execution.script),
      directoryRemoved: !execution || !fs.existsSync(execution.directory),
      successNotices: h.notices, errors: h.errors});
    assert.equal(result.callbackThrows.length, 0, 'execFile callback must not leak exceptions');
    assert.equal(state.settled, true, 'returned Promise must settle');
    assert.equal(state.value, spec.success ? output : null);
    assert.equal(doneCount, spec.success ? 1 : 0, 'completion callback must fire exactly once after success');
    assert.equal(result.retainedInput, !spec.owned, 'only converter-owned input is deleted');
    assert.equal(result.scriptRemoved, true, 'temporary embedded script must be deleted');
    assert.equal(result.directoryRemoved, true, 'empty temporary conversion directory must be deleted');
    if (!spec.success) assert.equal(h.notices.length, 0, 'failed conversion must not announce success');
    result.passed = true;
  } catch (error) { result.failure = error.message; }
  report.negative.push(result); persist();
  console.log('CONTRACT_NEGATIVE', name, result.passed ? 'PASS' : result.advisory ? 'ADVISORY' : 'FAIL', result.failure || '');
  return result;
}

async function negatives() {
  const cases = [
    ['nonzero-exit-caller-retained', {exitError: true, marker: true, output: 'nonempty'}],
    ['zero-exit-without-marker', {output: 'nonempty'}],
    ['marker-without-output', {marker: true}],
    ['marker-with-empty-output', {marker: true, output: ''}],
    ['exec-throws-caller-retained', {execThrows: true}],
    ['exec-throws-owned-removed', {execThrows: true, owned: true}],
    ['nonzero-exit-owned-removed', {exitError: true, owned: true}],
    ['missing-blender-owned-removed', {missingBlender: true, owned: true}],
    ['unsupported-kind-owned-removed', {kind: 'obj', owned: true}],
    ['verification-stat-throws', {marker: true, output: 'nonempty', outputStatThrows: true, owned: true}],
    ['caller-success-retained', {marker: true, output: 'nonempty', success: true}],
    ['owned-success-removed', {marker: true, output: 'nonempty', success: true, owned: true}],
    ['completion-callback-throws', {marker: true, output: 'nonempty', success: true, doneThrows: true}],
    // Native Node execFile calls its callback once. Deliberately violating that
    // native contract is diagnostic only, not a required production invariant.
    ['duplicate-child-callback', {marker: true, output: 'nonempty', success: true, duplicate: true, advisory: true}]
  ];
  for (const [name, spec] of cases) await negativeCase(name, spec);
}

function runChild(exe, args, options) {
  return new Promise(resolve => nativeChild.execFile(exe, args, options, (error, stdout, stderr) =>
    resolve({error: error ? {message: error.message, code: error.code, signal: error.signal} : null, stdout: String(stdout), stderr: String(stderr)})));
}

async function realConversions() {
  assert.ok(fs.existsSync(BLENDER), 'Blender executable not found');
  const fixtures = ['ss_s8Time_Craft', 'cs_s6Cyber_skin_guajian_back', 'cs_s6Jiaolong_horse'];
  const artifacts = [];
  for (const name of fixtures) for (const kind of ['blend', 'fbx']) {
    const input = path.join(ROOT, 'output/nmtm-rig-repair/runtime', name + '.glb');
    const output = path.join(OUT, name + '.' + kind);
    assert.ok(fs.existsSync(input), 'Missing runtime fixture: ' + input);
    if (fs.existsSync(output)) fs.unlinkSync(output);
    let execution, child, callbackCount = 0;
    const h = makeVm((exe, args, options, cb) => {
      execution = checkExecution([exe, args, options]);
      return nativeChild.execFile(BLENDER, args, options, (error, stdout, stderr) => {
        child = {error: error ? {message: error.message, code: error.code, signal: error.signal} : null,
          stdout: String(stdout), stderr: String(stderr)};
        fs.writeFileSync(path.join(OUT, name + '-' + kind + '.log'), child.stdout + '\nSTDERR\n' + child.stderr);
        cb(error, stdout, stderr);
      });
    });
    console.log('CONTRACT_CONVERT_START', name, kind);
    const before = Date.now();
    const value = await h.api.blenderConvert(input, output, kind, () => callbackCount++);
    const caseResult = {name, kind, input, output, value, callbackCount, execution,
      durationSeconds: (Date.now() - before) / 1000,
      childError: child && child.error, marker: !!(child && child.stdout.includes('NMTM_CONVERT_OK ' + kind + ' ')),
      size: fs.existsSync(output) ? fs.statSync(output).size : 0,
      retainedCallerInput: fs.existsSync(input),
      temporaryScriptRemoved: !execution || !fs.existsSync(execution.script),
      temporaryDirectoryRemoved: !execution || !fs.existsSync(execution.directory), errors: h.errors};
    caseResult.passed = value === output && callbackCount === 1 && !caseResult.childError
      && caseResult.marker && caseResult.size > 0 && caseResult.retainedCallerInput
      && caseResult.temporaryScriptRemoved && caseResult.temporaryDirectoryRemoved;
    report.conversions.push(caseResult); persist();
    if (caseResult.passed) artifacts.push({source: input, artifact: output, kind});
    console.log('CONTRACT_CONVERT', name, kind, caseResult.passed ? 'PASS' : 'FAIL', caseResult.size);
  }
  const manifest = path.join(OUT, 'inspection-input.json');
  fs.writeFileSync(manifest, JSON.stringify({cases: artifacts}, null, 2));
  const inspectionPath = path.join(OUT, 'inspection.json');
  const inspectTemp = path.join(OUT, 'inspection-temp');
  fs.mkdirSync(inspectTemp, {recursive: true});
  const inspect = await runChild(BLENDER,
    ['--factory-startup', '--background', '--threads', '2', '--python-exit-code', '1',
      '--python', path.join(__dirname, 'nmtm_conversion_inspect.py'), '--', manifest, inspectionPath],
    {windowsHide: true, cwd: OUT,
      env: {...process.env, TEMP: inspectTemp, TMP: inspectTemp, PYTHONDONTWRITEBYTECODE: '1'},
      timeout: 15 * 60 * 1000, maxBuffer: 16 * 1024 * 1024});
  fs.writeFileSync(path.join(OUT, 'inspection.log'), inspect.stdout + '\nSTDERR\n' + inspect.stderr);
  report.inspections = {childError: inspect.error, report: fs.existsSync(inspectionPath) ? JSON.parse(fs.readFileSync(inspectionPath, 'utf8')) : null};
  persist();
  console.log('CONTRACT_INSPECTION', !inspect.error && report.inspections.report && report.inspections.report.passed ? 'PASS' : 'FAIL');
}

(async () => {
  if (process.argv.includes('--summarize-existing')) {
    const saved = JSON.parse(fs.readFileSync(path.join(OUT, 'report.json'), 'utf8'));
    assert.equal(saved.sourceSha256, sourceHash, 'Cannot reuse a run from different production source');
    Object.assign(report, saved);
    // Migrate the explicitly non-contractual extra probe from the initial run.
    const extra = report.negative.find(result => result.name === 'duplicate-child-callback');
    if (extra) extra.advisory = true;
    report.aggregateReclassifiedAt = new Date().toISOString();
  } else {
    persist();
    if (report.mode !== 'real') await negatives();
    if (report.mode !== 'negative') await realConversions();
  }
  report.sourceUnchangedDuringRun = crypto.createHash('sha256').update(fs.readFileSync(SOURCE_PATH)).digest('hex') === sourceHash;
  const mandatory = report.negative.filter(result => !result.advisory);
  report.mandatorySummary = {negativeCases: mandatory.length, negativePassed: mandatory.filter(result => result.passed).length,
    actualConversions: report.conversions.length, conversionsPassed: report.conversions.filter(result => result.passed).length,
    reopenedInspections: report.inspections && report.inspections.report ? report.inspections.report.cases.length : 0,
    reopenedInspectionsPassed: report.inspections && report.inspections.report ? report.inspections.report.cases.filter(result => result.passed).length : 0};
  report.advisoryFindings = report.negative.filter(result => result.advisory && !result.passed)
    .map(result => ({name: result.name, finding: result.failure,
      reason: 'Synthetic probe violates native execFile single-callback contract; excluded from required pass aggregate'}));
  report.passed = mandatory.every(c => c.passed) && report.conversions.every(c => c.passed)
    && (report.mode === 'negative' || !!(report.inspections && !report.inspections.childError && report.inspections.report && report.inspections.report.passed));
  persist();
  console.log('CONTRACT_REPORT', path.join(OUT, 'report.json'), report.passed ? 'PASS' : 'FAIL');
  process.exitCode = report.passed ? 0 : 1;
})().catch(error => { report.fatal = error.stack; report.passed = false; persist(); console.error(error.stack); process.exitCode = 1; });
