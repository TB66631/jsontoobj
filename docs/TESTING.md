# Testing NMTM

## Quick checks

Use Node.js 20 or newer. The default check is offline, does not open Blockbench, Blender, a browser, or a native dialog, and does not require the private Minecraft asset tree. No `npm install` is needed for these checks; the selected tests use Node's built-in modules.

```powershell
npm test
# equivalent
npm run check
```

`npm test` aliases `npm run check`. The check runner performs JavaScript syntax checks and the portable NMTM tests (bridge payload parity, plugin smoke, Java block-pack layouts, hidden-window bootstrap, desktop guard, and CDP-pipe protocol mocks). It must not run GUI tests, make network requests, or invoke the full Blender conversion suite. Use `npm run diagnose` for read-only environment and repository diagnostics; it must not change configuration or launch GUI applications.

Diagnostics may optionally write a report under the repository's `output/` tree:

```powershell
npm run diagnose
npm run diagnose -- --json
npm run diagnose -- --json --report output/diagnostics/report.json
```

All generated test files, reports, profiles, temporary scripts, Blender temporary files, rendered video, and caches should stay under the repository's `output/` directory (or next to an explicitly supplied report/output path that is itself on the repository drive). Avoid putting build/test caches on `C:`. Do not commit generated `output/` artifacts or private game assets.

## Portable tests

These commands use Node built-ins and checked-in code. They were run on this checkout with Node `v24.14.1`; all passed. The smoke test does not require the private texture pack; if the optional real atlas images are present locally, it exercises that additional case too.

```powershell
node --check nmtm.js
node tests/build_nmtm_bridge.cjs --check
node tests/nmtm_plugin_smoke.cjs
node tests/nmtm_java_block_export.cjs
node tests/nmtm_hidden_bootstrap_unit.cjs
node tests/nmtm_desktop_guard_unit.cjs
node tests/nmtm_cdp_pipe_unit.cjs
```

The Java block export test writes and then removes only `output/nmtm-java-block-export-test/`. The plugin smoke test has an opt-in live catalog mode (`NMTM_LIVE_VERSION_TEST=1`) that accesses Mojang/Misode endpoints; this mode is deliberately excluded from default checks. With manifest files supplied via `NMTM_MANIFEST_FILE` and `NMTM_MCMETA_FILE`, the same optional test can use local data instead.

The conversion lifecycle harness is not a default/portable check. It writes `output/nmtm-rig-repair/conversion-contract/report.json`; even `--negative-only` replaces that report with a negative-only aggregate. It also checks for a Blender executable (override with `NMTM_BLENDER`) and its full mode consumes fresh Blockbench GLBs under `output/nmtm-rig-repair/runtime/`. Run it only when intentionally regenerating that evidence:

```powershell
node tests/nmtm_conversion_contract.cjs --negative-only
node tests/nmtm_conversion_contract.cjs
```

The full command launches Blender in hidden/background mode, performs real `.blend`/FBX conversions and reopens artifacts. Outputs and Blender temp paths are project-local. It is an engineering acceptance suite, not a quick test.

## Local runtime acceptance

The following are opt-in acceptance runs, not GitHub-hosted/default CI tests. They require this Windows setup and, for the real-model cases, the private NetEase asset pack currently expected at:

```text
NetMC Assets/[3.8.30.293955]/assets/assets/resource_packs/vanilla_netease/
```

The test code currently defaults to these workstation paths:

| Dependency | Current default | Override |
| --- | --- | --- |
| Blockbench executable | `D:/Apps/Blockbench/Blockbench.exe` | `BLOCKBENCH_EXE` |
| Blender executable | `D:/Program Files/Blender4.2/blender.exe` | `NMTM_BLENDER` |
| Desktop-guard Python | `D:/Program Files/python/python.exe` | `NMTM_TEST_PYTHON` |
| Desktop accessor DLL source | `C:/Users/Administrator/AppData/Local/Temp/VirtualDesktopAccessor-2019-windows10.dll` | `NMTM_TEST_DESKTOP_DLL_SOURCE` |
| FBX render contact-sheet FFmpeg | `D:/Apps/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe` | `--ffmpeg` on `nmtm_render_acceptance.py` |

Before a real Blockbench test, independently confirm that a second virtual desktop exists and that desktop 2 is not the active game/work desktop. Only then explicitly set both gates in the same PowerShell process:

```powershell
$env:NMTM_ALLOW_HIDDEN_GUI = '1'
$env:NMTM_TEST_VIRTUAL_DESKTOP = '2'
```

The harness must keep the renderer cloaked/hidden and non-focusable, verify assignment to desktop 2 without switching desktops, and fail closed if that cannot be proven. Do not click through a native dialog, change Windows firewall settings, or relax the guard to make a test pass. The harness clones the installed Electron runtime into a project-local profile and loads the checked-out `nmtm.js`; it must not patch the installed `app.asar`. The desktop accessor DLL is copied into the isolated project-local test runtime. Its current default source is under `C:/Users/.../Temp`; provide a DLL source on the repository drive when avoiding all C-drive test reads is required. Test-created files remain on the workspace drive.

Run the hidden Blockbench smoke/runtime suite:

```powershell
node tests/nmtm_blockbench_runtime.cjs
```

This suite currently uses a TCP CDP port. The rig regression suite uses pipe transport (`--remote-debugging-pipe`) instead, but the latest isolated pipe run still encountered a Windows Security Alert and exited without producing fresh runtime GLBs. Pipe transport alone does not establish that a run will preserve foreground focus. The desktop-2 guard and fail-closed behavior remain mandatory for either harness:

```powershell
node tests/nmtm_rig_regression.cjs
```

On a successful run, the rig regression writes fresh GLBs and `output/nmtm-rig-repair/runtime/rig-regression.json`, tests synthetic edge cases and real models, and also saves/reloads a native Blockbench project and tests grouped/multiple-rig export. It deletes only its own generated profile directory. A failure to establish the desktop-2 guard is a hard stop, not a reason to show the window. The separate Blender fidelity evidence covers seven fixtures, of which three are real models; fixture counts must not be described as seven real models.

## Blender fidelity and visual review

These tests need Blender 4.2 and, depending on the command, generated conversion artifacts and/or real GLBs. Invoke Blender headlessly and put the report/output under `output/`. Use the installed Blender executable path or set `NMTM_BLENDER` as needed.

Compare original GLB CPU skinning to Blender-evaluated skinning:

```powershell
& 'D:/Program Files/Blender4.2/blender.exe' --background --python tests/nmtm_blender_skin_fidelity.py -- output/nmtm-rig-repair/fidelity/skin.json output/nmtm-rig-repair/runtime/ss_s8Time_Craft.glb
```

Convert each supplied GLB into both a saved Blend and FBX, reopen both and check geometry, weights, textures, and animation:

```powershell
& 'D:/Program Files/Blender4.2/blender.exe' --background --threads 2 --python-exit-code 1 --python tests/nmtm_blender_bridge_fidelity.py -- output/nmtm-rig-repair/fidelity/bridge.json output/nmtm-rig-repair/runtime/ss_s8Time_Craft.glb output/nmtm-rig-repair/runtime/cs_s6Jiaolong_horse.glb
```

`nmtm_blender_bridge_fidelity.py` imports the checked-in `nmtm_blender_bridge.py` at the repository root. No generated bridge copy or extracted implementation is required. Keep the embedded Python payload in `nmtm.js` in sync with that source; `node tests/build_nmtm_bridge.cjs --check` verifies their parity. Input GLBs and generated fidelity artifacts are local test data and are not included in a clean clone.

For a strict independent structure/texture/indexed-motion audit, first produce the bridge-fidelity report, then run:

```powershell
& 'D:/Program Files/Blender4.2/blender.exe' --background --threads 2 --python-exit-code 1 --python tests/nmtm_fidelity_independent_audit.py -- output/nmtm-rig-repair/fidelity/bridge.json output/nmtm-rig-repair/fidelity/independent-audit.json
```

This audit imports `bpy`, `mathutils`, and `numpy` and must run in Blender's Python environment. A regular Python interpreter is not a supported invocation. The audit also expects the previous fidelity report and its artifacts, source GLBs, and the private source skeleton JSON files for the named real-model cases under the NetEase asset tree. It reads those inputs without reconverting them and writes the requested audit JSON. These prerequisites are not npm dependencies or portable fixtures.

Render per-bone motion videos and extract contact-sheet frames for visual inspection:

```powershell
& 'D:/Program Files/Blender4.2/blender.exe' --background --threads 2 --python-exit-code 1 --python tests/nmtm_render_acceptance.py -- output/nmtm-rig-repair/bridge-test/jiaolong.blend --output output/nmtm-rig-repair/acceptance/jiaolong-blend --ffmpeg D:/Apps/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe
```

This writes `acceptance.json`, `isolated-bone-motion.mp4`, and `isolated-bone-contact.png` under the requested output directory. Rendering can be lengthy and is intentionally not part of default checks. Inspect the generated contact image; a passing numeric report alone is not visual acceptance.

## Interpreting results

- `npm test` / `npm run check` is a fast offline source/unit check, not a Blender export or in-game compatibility claim.
- Runtime GLBs, conversion reports, saved Blend/FBX files, renders, and PNG contact sheets are generated evidence tied to the exact plugin/bridge hashes that produced them. Re-run affected suites after changing production code; do not reuse stale artifacts as proof for a new source revision.
- A private asset tree, installed application, Blender, FFmpeg, desktop accessor, or active virtual-desktop state is a local prerequisite, not a repository-owned input.
- Keep the original source model/assets read-only. Place test outputs in a separate `output/` tree.
- Local reports, renders, original game assets, isolated runtimes, and profiles are excluded from the repository. References to their paths describe evidence available on the original workstation; a clean clone must regenerate the applicable evidence from its own permitted inputs.
