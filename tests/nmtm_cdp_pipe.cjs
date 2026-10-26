// Chromium CDP pipe: null-terminated UTF-8 messages on inherited fd3/fd4.
const assert = require('node:assert/strict');
function pipeClient(child) {
  const input = child.stdio[3], output = child.stdio[4];
  assert.ok(input && output, 'Owned Electron must expose inherited CDP pipe handles');
  let nextId = 1, buffered = Buffer.alloc(0), closed = false;
  const pending = new Map();
  const rejectAll = error => { for (const item of pending.values()) { clearTimeout(item.timer); item.reject(error); } pending.clear(); };
  output.on('data', chunk => {
    buffered = Buffer.concat([buffered, chunk]);
    for (let end; (end = buffered.indexOf(0)) >= 0;) {
      const frame = buffered.subarray(0, end); buffered = buffered.subarray(end + 1);
      if (!frame.length) continue;
      let message;
      try { message = JSON.parse(frame.toString('utf8')); } catch (error) { rejectAll(error); continue; }
      const item = pending.get(message.id); if (!item) continue;
      pending.delete(message.id); clearTimeout(item.timer);
      if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
    }
  });
  output.on('error', rejectAll); input.on('error', rejectAll);
  child.once('exit', code => rejectAll(new Error('Owned Electron exited: ' + code)));
  const request = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    if (closed) { reject(new Error('CDP pipe is closed')); return; }
    const id = nextId++, timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP pipe request timed out: ' + method)); }, 30000);
    pending.set(id, { resolve, reject, timer });
    input.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
  });
  const close = () => { closed = true; rejectAll(new Error('CDP pipe closed')); input.destroy(); output.destroy(); };
  return { call: request, close, async renderer() {
    for (let attempt = 0; attempt < 120; attempt++) {
      const { targetInfos } = await request('Target.getTargets');
      const target = targetInfos.find(item => item.type === 'page');
      if (target) { const { sessionId } = await request('Target.attachToTarget', { targetId: target.targetId, flatten: true }); return { opened: Promise.resolve(), call: (method, params) => request(method, params, sessionId), close }; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('No owned Electron page appeared on the CDP pipe');
  } };
}
module.exports = { pipeClient };
