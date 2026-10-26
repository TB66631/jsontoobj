# Netease Mesh To Modle (NMTM)

NMTM is a Blockbench 5.x plugin for importing NetEase Minecraft JSON/BIN
companions, textures, cube models, triangle meshes, skeletons, and animations.
It exports the source project through separate, explicit adapters.

## Install

In Blockbench open **File > Plugins > Load Plugin from File** and select
`nmtm.js` from the repository root.

## Import

- `NMTM: Import JSON` accepts multiple JSON files and detects legacy
  `geometry.*`, custom mesh, skeleton, animation, and texture references.
- `NMTM: Choose model variant` reads `models/netease_models.json` and resolves
  referenced resources relative to the pack root.
- `NMTM: Import BIN companion` accepts runtime `.bin` files only when the JSON
  companion exists. Unknown binary payloads are not guessed.

Custom mesh resources are imported as native Blockbench Mesh objects with an
Armature and vertex weights. Legacy Bedrock geometry is imported as Groups and
Cubes with Bedrock UVs. The original FBX, GLB, Blender 4.2, and animation import
paths remain available.

## Export adapters

### EMF/CEM entity pack

Use `NMTM: Export EMF/CEM entity pack (entities only)` for the model type
supported by EMF:
cube geometry, one output texture, and a rigid parent/child part hierarchy. In
strict mode, imported NMTM triangle meshes are accepted only when every connected
component can be proved to be a closed cuboid with one rigid bone weight. Those
components are reconstructed as CEM boxes under the imported skeleton hierarchy. The dialog
selects the Minecraft version, resource namespace, target entity file name,
fallback root part, and one animation clip to bake.

The export dialog offers two geometry adapters:

- `Strict cuboid conversion` reconstructs only closed, orthogonal, six-face
  boxes and preserves their rigid source bones.
- `Voxel approximation` samples arbitrary triangles into a bounded number of
  small CEM boxes. The selected voxel size is the minimum requested fidelity.
  With automatic fitting enabled, NMTM progressively increases it when a model
  would exceed `max_voxels`, instead of aborting at box 2049. The export record
  stores requested size, actual size, and final box count. A visible maximum
  automatic voxel size prevents silent over-simplification. This mode is
  intentionally approximate: curves, thin surfaces, and blended weights cannot
  be losslessly represented by EMF.

Voxel mode can combine multiple imported NMTM parts. Each Mesh keeps an
independent prefixed skeleton branch so repeated names such as `root` and
`Bone001` do not overwrite another imported part. Strict conversion remains a
single-model adapter because its reconstructed cuboids depend on one shared
skeleton context. A `.jem` uses one output texture. Voxel mode automatically
builds an atlas for multiple source textures; strict mode requires a single
source texture.

The generated pack contains:

```text
pack.mcmeta
assets/minecraft/optifine/cem/<entity>.jem (original entity)
assets/<modid>/emf/cem/<entity>.jem (modded entity)
assets/<namespace>/textures/nmtm/<model>.png
nmtm_emf_export.json
NMTM-EMF-README.txt
```

The `.jem` uses OptiFine CEM/EMF `models`, `submodels`, `boxes`, rectangular
face UVs, pivots, rotations, scale, and `animations`. Selected Blockbench
keyframes are baked into EMF `keyframe()` expressions. Minecraft `time` is
treated as ticks, so a Blockbench animation length is converted with `time*0.05`.

EMF is an entity replacement system, not a block/item renderer. The target
entity must already exist and its part names must match the selected entity
model. A file such as `assets/minecraft/optifine/cem/chest.jem` can only target
the chest entity model; it cannot change a placed `minecraft:diamond_block` or
`minecraft:furnace`. Use the separate Java block replacement exporter for that.
Install the matching **Entity Model Features (EMF)** and **Entity Texture
Features (ETF)** client mods. Do not install dorianpb CEM together with EMF.

Strict conversion rejects arbitrary or open triangle meshes, blended/multi-bone
vertex weights, and multiple textures. Voxel conversion can approximate arbitrary
triangles and assigns each voxel to a dominant source bone; it does not preserve
smooth blended skinning. Individually rotated Blockbench Cubes and unsupported
non-uniform scale still fail compatibility checks. In the inspected NetEase pack,
roughly 14% of mesh objects were entirely reconstructable as strict cuboids; the
remaining geometry benefits from voxel approximation or requires FBX/GLB/Blender
for lossless output.

### Vanilla Java item resource pack

Use `NMTM: Export complete Java resource pack` for cube-only item models. The
exporter handles the version breaks automatically:

| Minecraft | Item adapter |
| --- | --- |
| 1.8-1.13.2 | Replace the selected base item model |
| 1.14-1.20.4 | `overrides` + `CustomModelData` |
| 1.20.5-1.21.3 | `overrides` + component syntax |
| 1.21.4+ | `assets/<namespace>/items/*.json` item mapping |

Vanilla item JSON cannot hold arbitrary triangle meshes, armatures, or
skeletal animation. NMTM reports that incompatibility instead of claiming a
lossless export.

### Vanilla Java block replacement pack

Use `NMTM: Export Java block replacement pack` to replace the visible model of
an existing block, such as `minecraft:diamond_block`. This is a complete static
resource pack, not an EMF entity pack and not a new block registry. The exporter
also maps the matching inventory item so the placed block and item icon use the
same custom model.

Cube projects are scaled and centered inside Java's `0..16` block space. NMTM
triangle Mesh projects are sampled into bounded, axis-aligned voxel elements.
The requested mesh voxel resolution is an upper quality target: automatic fit
steps it down only when it would exceed the maximum element count. A `20`
resolution target and `0.25` block margin are a good starting point for a
detailed one-block prop. The generated pack contains:

```text
pack.mcmeta
assets/<target_namespace>/blockstates/<block>.json
assets/<model_namespace>/models/block/<model>.json
assets/<model_namespace>/textures/block/<model>.png (1.13+)
assets/<model_namespace>/textures/blocks/<model>.png (1.8-1.12)
assets/<target_namespace>/models/item/<block>.json (through 1.21.3)
assets/<target_namespace>/items/<block>.json (1.21.4+)
nmtm_block_export.json
NMTM-BLOCK-README.txt
```

The default target is `minecraft:diamond_block`, which has no block-state
properties and can be replaced directly. Blocks with properties need additional
variants in their blockstate JSON. Vanilla keeps the original block collision,
lighting behavior, and game logic; the normal full-cube selection outline is
therefore still visible while aiming at a replaced diamond block. Skeletons,
skinning, and animations are not
part of a vanilla block model. Use FBX or Blender export when those must remain
lossless.

### FBX and Blender

`NMTM: Export FBX with textures and armature` and
`NMTM: Export Blender 4.2 .blend` share the same rig-preserving export path:
Blockbench exports a binary GLB with embedded images, then Blender 4.2 converts
it to binary FBX or a packed `.blend`. Both require Blender; the default path is
`D:\Program Files\Blender4.2\blender.exe`. Change it with
`NMTM: Set Blender 4.2 path` if necessary. Merely importing a GLB with Blender's
default bind-pose guessing is not equivalent to this conversion.

The Python bridge is bundled inside `nmtm.js`; installing a separate Python
script beside the plugin is unnecessary. Its script, Blender temporary
directory, and intermediate GLB live beside the chosen output, not in the
system temporary directory. Choose an E: output folder to keep those files off
C:. Conversion runs in the background with two Blender threads. A successful
process exit alone is insufficient: the plugin also checks the conversion
success marker and a nonempty destination before reporting success.

Imported NetEase bones retain their source inverse bind matrices, rest
translation/rotation/scale, hierarchy, and normalized vertex weights. The
Blender bridge adds fixed `_NMTM_bind_*` and `_NMTM_deform_*` bones below each
source control to represent bind matrices that a normal Blender rest bone
cannot express. This includes independent bind transforms, negative scale,
and shear arising from a nonuniformly scaled TRS hierarchy. The additional
bones are intentional; deleting them or applying arbitrary pose transforms
changes the binding. Animate the original source-named controls, not the fixed
helpers. An explicit source `node.matrix` containing shear is rejected instead
of being silently decomposed incorrectly.

`.blend` packs its images; FBX embeds supported texture image files and retains
the armature, vertex groups, and animation takes. Target programs may interpret
materials or FBX animation interpolation differently. Source quaternion tracks
are densely sampled for Blender, and binary FBX uses baked subframe samples;
this is not a claim of mathematically lossless interpolation for every possible
animation curve. The validation scripts compare the saved/reopened `.blend`
and reimported FBX to independent source-GLB CPU skinning.

The plugin removes only its own temporary conversion script and the
`<destination>.nmtm.glb` intermediate. Caller-supplied GLBs are retained. A
failed conversion is reported as a failure; do not treat an older file already
at the destination as evidence that a new export succeeded.

## Version catalog and disk usage

`NMTM: Refresh Minecraft version list` joins Mojang's official manifest with
Misode's generated version metadata. It records resource-pack major/minor
formats and leaves unknown snapshots unknown instead of guessing.

Only one small JSON cache is written. The default is on the non-C source or
project drive (`output/nmtm-cache/minecraft_versions.json`, or `NMTM-Cache` at
that drive root). `NMTM: Set Minecraft version cache folder` changes it. The
cache is capped at 1 MiB and refreshed at most once per 24 hours. NMTM does not
download client JARs or place Gradle/index caches on C:.

## Known limits

NetEase shader stacks such as `splitBonesGroup`, bloom, glitter, and material
layers are preserved as metadata where possible. They are exported as ordinary
textured materials unless the selected destination format supports the effect.
