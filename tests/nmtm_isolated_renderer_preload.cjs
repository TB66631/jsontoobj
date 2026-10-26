// The real renderer remains unchanged; only OS/browser-popup surfaces are denied.
for (const name of ['alert', 'confirm', 'prompt', 'print', 'open', 'focus']) {
  globalThis[name] = (...args) => {
    console.error('NMTM_BLOCKED_DIALOG:' + JSON.stringify({ name, args: args.map(String) }));
    return name === 'confirm' ? false : null;
  };
}
