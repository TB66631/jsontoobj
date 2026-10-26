const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const { pipeClient } = require('./nmtm_cdp_pipe.cjs');
(async () => {
  const child = new EventEmitter(); child.stdio = [null, null, null, new PassThrough(), new PassThrough()];
  const requests = [];
  child.stdio[3].on('data', chunk => { for (const frame of chunk.toString().split('\0').filter(Boolean)) { const message = JSON.parse(frame); requests.push(message); const result = message.method === 'Target.getTargets' ? { targetInfos: [{ type: 'page', targetId: 'owned-page' }] } : message.method === 'Target.attachToTarget' ? { sessionId: 'owned-session' } : { result: { value: '中文' } }; const bytes = Buffer.from(JSON.stringify({ id: message.id, result }) + '\0'); const split = bytes.indexOf(Buffer.from('中文')) + 1; child.stdio[4].write(bytes.subarray(0, split > 0 ? split : 2)); child.stdio[4].write(bytes.subarray(split > 0 ? split : 2)); } });
  const renderer = await pipeClient(child).renderer();
  assert.equal((await renderer.call('Runtime.evaluate', { expression: 'true' })).result.value, '中文');
  assert.equal(requests[2].sessionId, 'owned-session'); assert.equal(requests[0].method, 'Target.getTargets'); renderer.close();
  console.log('PASS CDP pipe mocks: null framing, split UTF-8, root target discovery, flattened renderer session. No GUI/TCP listener.');
})().catch(error => { console.error(error); process.exitCode = 1; });
