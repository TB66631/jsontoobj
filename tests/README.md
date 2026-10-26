# Test inventory

The supported quick entry point is `npm test` (`npm run check`). See [docs/TESTING.md](../docs/TESTING.md) for setup, exact local dependencies, safety gates, and acceptance commands.

| Test | Scope | Default/local-only |
| --- | --- | --- |
| `build_nmtm_bridge.cjs --check` | Checked-in Python bridge matches the base64 payload embedded in `nmtm.js`. | Default, offline. |
| `nmtm_plugin_smoke.cjs` | NMTM actions and conversion/export helpers against mocked Blockbench APIs. | Default, offline; real atlas cases run only if private textures exist. Live Minecraft catalog fetch is opt-in. |
| `nmtm_java_block_export.cjs` | Resource-pack layouts for Java 1.8.8 and 1.21.4, using synthetic model/texture fixtures. | Default, offline; temporary test directory is recreated under `output/`. |
| `nmtm_hidden_bootstrap_unit.cjs` | Mocks Electron bootstrap behavior and proves show/focus/dialog/external-launch suppression paths. | Default, offline; does not launch Electron. |
| `nmtm_desktop_guard_unit.cjs` | Native desktop guard decisions including cloak verification, foreground preservation, and fail-closed paths. | Default, offline; mocked native API, no window. |
| `nmtm_cdp_pipe_unit.cjs` | CDP pipe framing, split UTF-8, target discovery, and renderer session behavior. | Default, offline; mocked streams, no TCP socket. |
| `nmtm_cdp_pipe.cjs` | Pipe-based CDP client used by hidden runtime tests. | Helper module; exercised by the unit test and rig regression. |
| `nmtm_export_contract.cjs` | Export hierarchy/filtering, transforms, inverse bind matrices, animation and Property contracts against installed Blockbench source-map APIs. | Local-only, offline, no GUI; requires installed Blockbench ASAR/source map and records plugin hash. |
| `helpers/read-blockbench-sources.cjs` | Reads installed `resources/app.asar` source-map contents directly without extracting files. | Read-only helper; `BLOCKBENCH_EXE` or `NMTM_BLOCKBENCH_ASAR` overrides the local installation path. |
| `nmtm_blockbench_runtime.cjs` | Hidden Blockbench startup and runtime smoke through a local TCP CDP endpoint. | Local-only, guarded; potential Windows security-dialog risk. Pipe transport alone does not guarantee foreground isolation. |
| `nmtm_rig_regression.cjs` | Loads actual plugin in hidden Blockbench, imports synthetic and real rigs, checks GLB skin/texture data, save/reload, preview and grouped export. | Local-only; requires Blockbench, Python, desktop accessor, desktop 2, and private asset pack. Uses CDP pipe. |
| `nmtm_rig_lifecycle.cjs` | Save/reload metadata, weights, texture decode, animation preview, and multiple-rig/group export cases. | Called by `nmtm_rig_regression.cjs`; not a standalone entry point. |
| `nmtm_conversion_contract.cjs` | Production conversion lifecycle negative cases and real Blender conversions plus reopen inspection. | Local-only/long; needs Blender and fresh runtime GLBs. Both modes overwrite its conversion report. |
| `nmtm_conversion_inspect.py` | Reopens generated Blend/FBX files and checks saved geometry, weights, images, and animation. | Child of conversion contract; requires Blender's Python environment. |
| `nmtm_blender_skin_fidelity.py` | Independent glTF CPU skinning versus evaluated Blender skinning. | Local-only; Blender, input GLBs, writes report at supplied path. |
| `nmtm_blender_bridge_fidelity.py` | Produces/reopens Blend and FBX per source GLB and compares skin/animation fidelity. | Local-only; Blender and GLBs; imports the checked-in root `nmtm_blender_bridge.py` directly. |
| `nmtm_fidelity_independent_audit.py` | Indexed triangle/corner, UV, joint-weight, image payload, and sampled motion audit. | Local-only; run through Blender's Python (`bpy`, `mathutils`, `numpy`), using previous fidelity report/artifacts and private skeleton JSONs. |
| `nmtm_render_acceptance.py` | Perturbs source control bones, numerically checks affected/unaffected vertices, renders video, and extracts contact frame. | Local-only/long; Blender, FFmpeg, a Blend/FBX artifact. Output path is explicit. |
| `nmtm_move_window_desktop.py` | Windows virtual desktop/window assignment helper. | Runtime helper; do not invoke against arbitrary windows. Orchestrator uses owned hidden test window only. |
| `nmtm_isolated_electron_main.cjs` | Test-only Electron main adapter suppressing windows, dialogs, updater and external navigation. | Copied/executed only by guarded hidden runtime harness. Never install it into Blockbench. |
| `nmtm_isolated_renderer_preload.cjs` | Test-only renderer preload/bootstrap for hidden runtime. | Local harness helper, not a production plugin file. |
| `nmtm_inprocess_desktop_guard.cjs` | Koffi-backed Windows cloak/desktop guard. | Used only by test adapter; local Koffi install is under `output/nmtm-rig-repair/native-tools/`. |

## Known portability limits

- Several local-only tests default to workstation-specific `D:/Apps/...` or `D:/Program Files/...` executables. See the environment-variable overrides in the main testing guide.
- The real-model runtime regression reads `NetMC Assets/.../vanilla_netease/`, which is private/local and is not a portable test fixture.
- The desktop accessor source defaults to a `C:/Users/.../Temp` location. Override it with a project-drive copy when required. Generated profiles/temp files belong on the workspace drive.
- The bridge fidelity test imports the root Python source directly; no generated bridge copy is required. Its GLB inputs and the independent audit's prior report/artifacts and private skeleton inputs remain local data and are absent from a clean checkout.
- The installed-API export contract does not need extracted API files, but it needs an installed Blockbench ASAR with usable source-map contents. Missing prerequisites produce an error rather than a passing result.
- The smoke test's live catalog mode performs network calls and must remain opt-in.
- Do not interpret an old JSON report as current validation: compare its recorded source hashes with the current source before relying on it.
- Generated reports, renders, profiles, isolated runtimes, and private game resources are not published with the repository. Local evidence paths in the audit documents identify workstation files, not distributable test fixtures.
