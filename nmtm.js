(function () {
    'use strict';

    const PLUGIN_ID = 'nmtm';
    const PLUGIN_TITLE = 'Netease Mesh To Modle (NMTM)';
    const PLUGIN_VERSION = '0.6.0';
    const DEFAULT_BLENDER = 'D:/Program Files/Blender4.2/blender.exe';
    // Generated from nmtm_blender_bridge.py by tests/build_nmtm_bridge.cjs.
    const BLENDER_BRIDGE_BASE64 = 'IiIiTk1UTSBHTEIgLT4gQmxlbmRlci9GQlggYnJpZGdlIGZvciBCbGVuZGVyIDQuMi4KClRoaXMgZmlsZSBpcyBlbWJlZGRhYmxlOiBleGVjdXRlIGl0cyBzb3VyY2UsIHRoZW4gY2FsbCBjb252ZXJ0KHNvdXJjZSwgdGFyZ2V0LCBraW5kKS4KTm8gZmlsZXMgb3RoZXIgdGhhbiB0aGUgcmVxdWVzdGVkIGRlc3RpbmF0aW9uIGFyZSB3cml0dGVuIGR1cmluZyBjb252ZXJzaW9uLgoiIiIKaW1wb3J0IG1hdGgKZnJvbSBwYXRobGliIGltcG9ydCBQYXRoCmltcG9ydCByZQoKaW1wb3J0IGJweQppbXBvcnQgbnVtcHkgYXMgbnAKZnJvbSBtYXRodXRpbHMgaW1wb3J0IEV1bGVyLCBNYXRyaXgsIFF1YXRlcm5pb24sIFZlY3RvcgoKCmRlZiBleGFjdF9za2luX2ltcG9ydChzb3VyY2UpOgogICAgIiIiS2VlcCBnbFRGJ3MgcGVyLWluZmx1ZW5jZSBJQk0sIG5ldmVyIGJha2UgaXRzIHdlaWdodGVkIHN1bSBpbnRvIHZlcnRpY2VzLgoKICAgIEJsZW5kZXIgcmVzdCBib25lcyBhcmUgb3J0aG9nb25hbCBhbmQgY2Fubm90IHN0b3JlIGFuIGFyYml0cmFyeSBpbnZlcnNlIGJpbmQKICAgIG1hdHJpeC4gIERyaXZlciBib25lcyByZXByb2R1Y2UgdGhlIHNvdXJjZSBub2RlIGhpZXJhcmNoeTsgdHdvIGZpeGVkIGhlbHBlcgogICAgYm9uZXMgZmFjdG9yIGVhY2ggYWZmaW5lIElCTSBhcyBUKlIqUypSIHVzaW5nIFNWRC4gIEFsbCByZXN0IG1hdHJpY2VzIGFyZSB0aGUKICAgIGlkZW50aXR5LCBoZW5jZSB0aGUgQXJtYXR1cmUgbW9kaWZpZXIgZXZhbHVhdGVzIHN1bSh3ICogd29ybGRKb2ludCAqIElCTSAqIHApCiAgICBkaXJlY3RseSwgaW5jbHVkaW5nIHNoZWFyLCBuZWdhdGl2ZSBzY2FsZSwgYW5kIGdlbnVpbmVseSBtaXhlZCB3ZWlnaHRzLgogICAgTWF0ZXJpYWxzLCBub3JtYWxzLCBVVnMsIG1vcnBoIHRhcmdldHMgYW5kIGluZGljZXMgc3RpbGwgdXNlIEJsZW5kZXIncyBnbFRGCiAgICBpbXBvcnRlci4gIEl0cyBsb3NzeSBza2luX2ludG9fYmluZF9wb3NlIHN0YWdlIGFsb25lIGlzIGRpc2FibGVkIGxvY2FsbHkuCiAgICAiIiIKICAgIGZyb20gaW9fc2NlbmVfZ2x0ZjIuYmxlbmRlci5pbXAgaW1wb3J0IGdsdGYyX2JsZW5kZXJfbWVzaCBhcyBtZXNoX21vZHVsZQogICAgZnJvbSBpb19zY2VuZV9nbHRmMi5ibGVuZGVyLmltcCBpbXBvcnQgZ2x0ZjJfYmxlbmRlcl9ub2RlIGFzIG5vZGVfbW9kdWxlCiAgICBmcm9tIGlvX3NjZW5lX2dsdGYyLmlvLmltcC5nbHRmMl9pb19iaW5hcnkgaW1wb3J0IEJpbmFyeURhdGEKCiAgICBjYXB0dXJlZCwgbWVzaF9ub2RlcyA9IHt9LCBbXQogICAgb3JpZ2luYWxzID0gKG1lc2hfbW9kdWxlLmltcG9ydF91c2VyX2V4dGVuc2lvbnMsIG5vZGVfbW9kdWxlLmltcG9ydF91c2VyX2V4dGVuc2lvbnMpCgogICAgZGVmIG1lc2hfaG9vayhob29rLCBnbHRmLCAqYXJncyk6CiAgICAgICAgb3JpZ2luYWxzWzBdKGhvb2ssIGdsdGYsICphcmdzKQogICAgICAgIGNhcHR1cmVkWydnbHRmJ10gPSBnbHRmCiAgICAgICAgaWYgaG9vayA9PSAnZ2F0aGVyX2ltcG9ydF9tZXNoX29wdGlvbnMnOgogICAgICAgICAgICBhcmdzWzBdLnNraW5faW50b19iaW5kX3Bvc2UgPSBGYWxzZQoKICAgIGRlZiBub2RlX2hvb2soaG9vaywgZ2x0ZiwgKmFyZ3MpOgogICAgICAgIG9yaWdpbmFsc1sxXShob29rLCBnbHRmLCAqYXJncykKICAgICAgICBpZiBob29rID09ICdnYXRoZXJfaW1wb3J0X25vZGVfYWZ0ZXJfaG9vayc6CiAgICAgICAgICAgIHZub2RlLCBfbm9kZSwgb2JqID0gYXJncwogICAgICAgICAgICBpZiBvYmoudHlwZSA9PSAnTUVTSCcgYW5kIHZub2RlLm1lc2hfbm9kZV9pZHggaXMgbm90IE5vbmU6CiAgICAgICAgICAgICAgICBub2RlID0gZ2x0Zi5kYXRhLm5vZGVzW3Zub2RlLm1lc2hfbm9kZV9pZHhdCiAgICAgICAgICAgICAgICBpZiBub2RlLnNraW4gaXMgbm90IE5vbmU6CiAgICAgICAgICAgICAgICAgICAgbWVzaF9ub2Rlcy5hcHBlbmQoKG9iaiwgbm9kZS5za2luKSkKCiAgICBtZXNoX21vZHVsZS5pbXBvcnRfdXNlcl9leHRlbnNpb25zLCBub2RlX21vZHVsZS5pbXBvcnRfdXNlcl9leHRlbnNpb25zID0gbWVzaF9ob29rLCBub2RlX2hvb2sKICAgIHRyeToKICAgICAgICBicHkub3BzLmltcG9ydF9zY2VuZS5nbHRmKGZpbGVwYXRoPXN0cihzb3VyY2UpLCBkaXNhYmxlX2JvbmVfc2hhcGU9VHJ1ZSwKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlX3ZlcnRpY2VzPUZhbHNlLCBndWVzc19vcmlnaW5hbF9iaW5kX3Bvc2U9RmFsc2UpCiAgICBmaW5hbGx5OgogICAgICAgIG1lc2hfbW9kdWxlLmltcG9ydF91c2VyX2V4dGVuc2lvbnMsIG5vZGVfbW9kdWxlLmltcG9ydF91c2VyX2V4dGVuc2lvbnMgPSBvcmlnaW5hbHMKICAgIGlmIG5vdCBtZXNoX25vZGVzOgogICAgICAgIHJldHVybgogICAgZ2x0ZiA9IGNhcHR1cmVkWydnbHRmJ10KICAgIG5vZGVzID0gZ2x0Zi5kYXRhLm5vZGVzCiAgICBwYXJlbnRzID0ge2NoaWxkOiBpIGZvciBpLCBub2RlIGluIGVudW1lcmF0ZShub2RlcykgZm9yIGNoaWxkIGluIChub2RlLmNoaWxkcmVuIG9yIFtdKX0KICAgIHNraW5faW5kaWNlcyA9IHNvcnRlZCh7c2tpbiBmb3IgXywgc2tpbiBpbiBtZXNoX25vZGVzfSkKICAgIG5lZWRlZCA9IHNldCgpCiAgICBmb3Igc2tpbl9pbmRleCBpbiBza2luX2luZGljZXM6CiAgICAgICAgZm9yIGpvaW50IGluIGdsdGYuZGF0YS5za2luc1tza2luX2luZGV4XS5qb2ludHM6CiAgICAgICAgICAgIHdoaWxlIGpvaW50IG5vdCBpbiBuZWVkZWQ6CiAgICAgICAgICAgICAgICBuZWVkZWQuYWRkKGpvaW50KQogICAgICAgICAgICAgICAgaWYgam9pbnQgbm90IGluIHBhcmVudHM6CiAgICAgICAgICAgICAgICAgICAgYnJlYWsKICAgICAgICAgICAgICAgIGpvaW50ID0gcGFyZW50c1tqb2ludF0KICAgIG9sZF9hcm1hdHVyZXMgPSBbb2JqIGZvciBvYmogaW4gYnB5LmNvbnRleHQuc2NlbmUub2JqZWN0cyBpZiBvYmoudHlwZSA9PSAnQVJNQVRVUkUnXQogICAgZ3JvdXBfbmFtZXMgPSB7KHMsIGopOiBnbHRmLnZub2Rlc1tqXS5ibGVuZGVyX2JvbmVfbmFtZQogICAgICAgICAgICAgICAgICAgZm9yIHMgaW4gc2tpbl9pbmRpY2VzIGZvciBqIGluIGdsdGYuZGF0YS5za2luc1tzXS5qb2ludHN9CiAgICBkYXRhID0gYnB5LmRhdGEuYXJtYXR1cmVzLm5ldygnTk1UTV9FeGFjdFNraW4nKQogICAgcmlnID0gYnB5LmRhdGEub2JqZWN0cy5uZXcoJ05NVE1fRXhhY3RTa2luJywgZGF0YSkKICAgIGJweS5jb250ZXh0LnNjZW5lLmNvbGxlY3Rpb24ub2JqZWN0cy5saW5rKHJpZykKICAgIHJpZ1snbm10bV9za2luX21ldGhvZCddID0gJ2lkZW50aXR5LXJlc3QgYWZmaW5lIElCTSBoZWxwZXIgY2hhaW5zJwogICAgIyBGQlggc3RvcmVzIEV1bGVyIGN1cnZlcy4gRGVuc2UgcXVhcnRlci10aWNrIHNhbXBsaW5nIGtlZXBzIHRoZSBleHBvcnRlZAogICAgIyBFdWxlciBpbnRlcnBvbGF0aW9uIHdpdGhpbiB0aGUgc291cmNlIHF1YXRlcm5pb24gY3VydmUgdG8gc3ViLXBpeGVsIGVycm9yLgogICAgcmlnWydubXRtX2FuaW1hdGlvbl9zYW1wbGVfc3RlcCddID0gMC4wNjI1CiAgICBicHkuY29udGV4dC52aWV3X2xheWVyLm9iamVjdHMuYWN0aXZlID0gcmlnCiAgICByaWcuc2VsZWN0X3NldChUcnVlKQogICAgYnB5Lm9wcy5vYmplY3QubW9kZV9zZXQobW9kZT0nRURJVCcpCiAgICBkcml2ZXJzLCBkZWZvcm0sIGZpeGVkID0ge30sIHt9LCB7fQoKICAgIGRlZiBuZXdfYm9uZShuYW1lLCBwYXJlbnQ9Tm9uZSwgZGVmb3JtaW5nPUZhbHNlKToKICAgICAgICBib25lID0gZGF0YS5lZGl0X2JvbmVzLm5ldyhuYW1lKQogICAgICAgIGJvbmUuaGVhZCwgYm9uZS50YWlsID0gKDAsIDAsIDApLCAoMCwgLjEsIDApCiAgICAgICAgYm9uZS51c2VfZGVmb3JtID0gZGVmb3JtaW5nCiAgICAgICAgYm9uZS5pbmhlcml0X3NjYWxlID0gJ0ZVTEwnCiAgICAgICAgaWYgcGFyZW50OgogICAgICAgICAgICBib25lLnBhcmVudCA9IGRhdGEuZWRpdF9ib25lc1twYXJlbnRdCiAgICAgICAgcmV0dXJuIGJvbmUubmFtZQoKICAgIGZvciBpbmRleCBpbiBzb3J0ZWQobmVlZGVkKToKICAgICAgICBkcml2ZXJzW2luZGV4XSA9IG5ld19ib25lKG5vZGVzW2luZGV4XS5uYW1lIG9yICgnTm9kZV8nICsgc3RyKGluZGV4KSkpCiAgICBmb3IgaW5kZXggaW4gc29ydGVkKG5lZWRlZCk6CiAgICAgICAgaWYgcGFyZW50cy5nZXQoaW5kZXgpIGluIGRyaXZlcnM6CiAgICAgICAgICAgIGRhdGEuZWRpdF9ib25lc1tkcml2ZXJzW2luZGV4XV0ucGFyZW50ID0gZGF0YS5lZGl0X2JvbmVzW2RyaXZlcnNbcGFyZW50c1tpbmRleF1dXQogICAgY29udmVyc2lvbiA9IG5wLmFycmF5KFtbMSwgMCwgMCwgMF0sIFswLCAwLCAtMSwgMF0sIFswLCAxLCAwLCAwXSwgWzAsIDAsIDAsIDFdXSwgZmxvYXQpCgogICAgZGVmIGFmZmluZV9mYWN0b3JzKG1hdHJpeCk6CiAgICAgICAgaWYgbm90IG5wLmlzZmluaXRlKG1hdHJpeCkuYWxsKCkgb3IgYWJzKG5wLmxpbmFsZy5kZXQobWF0cml4WzozLCA6M10pKSA8IDFlLTEyOgogICAgICAgICAgICByYWlzZSBWYWx1ZUVycm9yKCdOTVRNIHNraW4gY29udGFpbnMgYSBub25maW5pdGUgb3Igc2luZ3VsYXIgYWZmaW5lIGJpbmQgbWF0cml4JykKICAgICAgICB1LCBzY2FsZSwgdnQgPSBucC5saW5hbGcuc3ZkKG1hdHJpeFs6MywgOjNdKQogICAgICAgIGlmIG5wLmxpbmFsZy5kZXQodSkgPCAwOgogICAgICAgICAgICB1WzosIC0xXSAqPSAtMQogICAgICAgICAgICBzY2FsZVstMV0gKj0gLTEKICAgICAgICBpZiBucC5saW5hbGcuZGV0KHZ0KSA8IDA6CiAgICAgICAgICAgIHZ0Wy0xLCA6XSAqPSAtMQogICAgICAgICAgICBzY2FsZVstMV0gKj0gLTEKICAgICAgICBmaXJzdCwgc2Vjb25kID0gbnAuZXllKDQpLCBucC5leWUoNCkKICAgICAgICBmaXJzdFs6MywgOjNdID0gdSAqIHNjYWxlCiAgICAgICAgZmlyc3RbOjMsIDNdID0gbWF0cml4WzozLCAzXQogICAgICAgIHNlY29uZFs6MywgOjNdID0gdnQKICAgICAgICByZXR1cm4gTWF0cml4KGZpcnN0LnRvbGlzdCgpKSwgTWF0cml4KHNlY29uZC50b2xpc3QoKSkKCiAgICBmb3Igc2tpbl9pbmRleCBpbiBza2luX2luZGljZXM6CiAgICAgICAgc2tpbiA9IGdsdGYuZGF0YS5za2luc1tza2luX2luZGV4XQogICAgICAgIGlibXMgPSBCaW5hcnlEYXRhLmRlY29kZV9hY2Nlc3NvcihnbHRmLCBza2luLmludmVyc2VfYmluZF9tYXRyaWNlcykucmVzaGFwZSgoLTEsIDQsIDQpKS50cmFuc3Bvc2UoKDAsIDIsIDEpKSBpZiBza2luLmludmVyc2VfYmluZF9tYXRyaWNlcyBpcyBub3QgTm9uZSBlbHNlIG5wLnJlcGVhdChucC5leWUoNClbTm9uZV0sIGxlbihza2luLmpvaW50cyksIGF4aXM9MCkKICAgICAgICBmb3Igb3JkaW5hbCwgKGpvaW50LCBpYm0pIGluIGVudW1lcmF0ZSh6aXAoc2tpbi5qb2ludHMsIGlibXMpKToKICAgICAgICAgICAgZmlyc3QsIHNlY29uZCA9IGFmZmluZV9mYWN0b3JzKGNvbnZlcnNpb24gQCBpYm0gQCBjb252ZXJzaW9uLlQpCiAgICAgICAgICAgIGhlbHBlciA9IG5ld19ib25lKCdfTk1UTV9iaW5kXyVkXyVkJyAlIChza2luX2luZGV4LCBvcmRpbmFsKSwgZHJpdmVyc1tqb2ludF0pCiAgICAgICAgICAgIGZpbmFsID0gbmV3X2JvbmUoJ19OTVRNX2RlZm9ybV8lZF8lZCcgJSAoc2tpbl9pbmRleCwgb3JkaW5hbCksIGhlbHBlciwgVHJ1ZSkKICAgICAgICAgICAgZml4ZWRbaGVscGVyXSwgZml4ZWRbZmluYWxdID0gZmlyc3QsIHNlY29uZAogICAgICAgICAgICBkZWZvcm1bc2tpbl9pbmRleCwgam9pbnRdID0gZmluYWwKICAgIGJweS5vcHMub2JqZWN0Lm1vZGVfc2V0KG1vZGU9J09CSkVDVCcpCiAgICBmb3IgYm9uZSBpbiByaWcucG9zZS5ib25lczoKICAgICAgICBib25lLnJvdGF0aW9uX21vZGUgPSAnUVVBVEVSTklPTicKICAgIGZvciBuYW1lLCBtYXRyaXggaW4gZml4ZWQuaXRlbXMoKToKICAgICAgICByaWcucG9zZS5ib25lc1tuYW1lXS5tYXRyaXhfYmFzaXMgPSBtYXRyaXgKCiAgICBkZWYgc2V0X3Rycyhib25lLCBub2RlLCBvdmVycmlkZXM9Tm9uZSk6CiAgICAgICAgb3ZlcnJpZGVzID0gb3ZlcnJpZGVzIG9yIHt9CiAgICAgICAgaWYgbm9kZS5tYXRyaXggaXMgbm90IE5vbmU6CiAgICAgICAgICAgIG1hdHJpeCA9IGNvbnZlcnNpb24gQCBucC5hcnJheShub2RlLm1hdHJpeCkucmVzaGFwZSgoNCwgNCkpLlQgQCBjb252ZXJzaW9uLlQKICAgICAgICAgICAgIyBnbFRGIG1hdHJpeCBub2RlcyBjYW5ub3QgYmUgYW5pbWF0aW9uIHRhcmdldHMuICBBIG1hdHJpeCBjb250YWluaW5nCiAgICAgICAgICAgICMgc2hlYXIgaXMgcmVqZWN0ZWQgaW5zdGVhZCBvZiBzaWxlbnRseSBsb3NpbmcgaXQgaW4gZGVjb21wb3NpdGlvbi4KICAgICAgICAgICAgYmFzaXMgPSBNYXRyaXgobWF0cml4LnRvbGlzdCgpKQogICAgICAgICAgICBib25lLm1hdHJpeF9iYXNpcyA9IGJhc2lzCiAgICAgICAgICAgIGlmIG5wLm1heChucC5hYnMobnAuYXJyYXkoYm9uZS5tYXRyaXhfYmFzaXMpIC0gbWF0cml4KSkgPiAyZS02OgogICAgICAgICAgICAgICAgcmFpc2UgVmFsdWVFcnJvcignQSBzb3VyY2Ugbm9kZSBtYXRyaXggaGFzIHNoZWFyOyB1c2Ugc291cmNlIFRSUyBub2RlcycpCiAgICAgICAgICAgIHJldHVybgogICAgICAgIHQgPSBvdmVycmlkZXMuZ2V0KCd0cmFuc2xhdGlvbicsIG5vZGUudHJhbnNsYXRpb24gb3IgWzAsIDAsIDBdKQogICAgICAgIHEgPSBvdmVycmlkZXMuZ2V0KCdyb3RhdGlvbicsIG5vZGUucm90YXRpb24gb3IgWzAsIDAsIDAsIDFdKQogICAgICAgIHMgPSBvdmVycmlkZXMuZ2V0KCdzY2FsZScsIG5vZGUuc2NhbGUgb3IgWzEsIDEsIDFdKQogICAgICAgIGJvbmUubG9jYXRpb24gPSAodFswXSwgLXRbMl0sIHRbMV0pCiAgICAgICAgcXVhdCA9IFF1YXRlcm5pb24oKHFbM10sIHFbMF0sIC1xWzJdLCBxWzFdKSkubm9ybWFsaXplZCgpCiAgICAgICAgYm9uZS5yb3RhdGlvbl9xdWF0ZXJuaW9uID0gcXVhdAogICAgICAgIGJvbmUuc2NhbGUgPSAoc1swXSwgc1syXSwgc1sxXSkKCiAgICBmb3IgaW5kZXgsIG5hbWUgaW4gZHJpdmVycy5pdGVtcygpOgogICAgICAgIHNldF90cnMocmlnLnBvc2UuYm9uZXNbbmFtZV0sIG5vZGVzW2luZGV4XSkKICAgIGZvciBvYmosIHNraW5faW5kZXggaW4gbWVzaF9ub2RlczoKICAgICAgICBvYmoucGFyZW50ID0gTm9uZQogICAgICAgIG9iai5tYXRyaXhfd29ybGQgPSBNYXRyaXguSWRlbnRpdHkoNCkKICAgICAgICBmb3IgbW9kaWZpZXIgaW4gbGlzdChvYmoubW9kaWZpZXJzKToKICAgICAgICAgICAgaWYgbW9kaWZpZXIudHlwZSA9PSAnQVJNQVRVUkUnOgogICAgICAgICAgICAgICAgb2JqLm1vZGlmaWVycy5yZW1vdmUobW9kaWZpZXIpCiAgICAgICAgc2tpbiA9IGdsdGYuZGF0YS5za2luc1tza2luX2luZGV4XQogICAgICAgIGZvciBqb2ludCBpbiBza2luLmpvaW50czoKICAgICAgICAgICAgZ3JvdXAgPSBvYmoudmVydGV4X2dyb3Vwcy5nZXQoZ3JvdXBfbmFtZXNbc2tpbl9pbmRleCwgam9pbnRdKQogICAgICAgICAgICBpZiBncm91cDoKICAgICAgICAgICAgICAgIGdyb3VwLm5hbWUgPSBkZWZvcm1bc2tpbl9pbmRleCwgam9pbnRdCiAgICAgICAgbW9kaWZpZXIgPSBvYmoubW9kaWZpZXJzLm5ldygnTk1UTSBleGFjdCBsaW5lYXIgc2tpbicsICdBUk1BVFVSRScpCiAgICAgICAgbW9kaWZpZXIub2JqZWN0ID0gcmlnCiAgICAgICAgbW9kaWZpZXIudXNlX2RlZm9ybV9wcmVzZXJ2ZV92b2x1bWUgPSBGYWxzZQogICAgZm9yIG9iaiBpbiBvbGRfYXJtYXR1cmVzOgogICAgICAgIGJweS5kYXRhLm9iamVjdHMucmVtb3ZlKG9iaiwgZG9fdW5saW5rPVRydWUpCgogICAgZGVmIHNhbXBsZXJfdmFsdWUoc2FtcGxlciwgdGltZSwgcGF0aCk6CiAgICAgICAgdGltZXMgPSBCaW5hcnlEYXRhLmRlY29kZV9hY2Nlc3NvcihnbHRmLCBzYW1wbGVyLmlucHV0KS5yZXNoYXBlKC0xKQogICAgICAgIHZhbHVlcyA9IEJpbmFyeURhdGEuZGVjb2RlX2FjY2Vzc29yKGdsdGYsIHNhbXBsZXIub3V0cHV0KS5hc3R5cGUoZmxvYXQpCiAgICAgICAgaSA9IG1pbihtYXgoaW50KG5wLnNlYXJjaHNvcnRlZCh0aW1lcywgdGltZSwgc2lkZT0ncmlnaHQnKSkgLSAxLCAwKSwgbGVuKHRpbWVzKS0xKQogICAgICAgIGogPSBtaW4oaSsxLCBsZW4odGltZXMpLTEpCiAgICAgICAgZHVyYXRpb24gPSBmbG9hdCh0aW1lc1tqXS10aW1lc1tpXSkKICAgICAgICBmID0gbWluKG1heCgodGltZS10aW1lc1tpXSkvZHVyYXRpb24sIDApLCAxKSBpZiBkdXJhdGlvbiBlbHNlIDAKICAgICAgICBtb2RlID0gc2FtcGxlci5pbnRlcnBvbGF0aW9uIG9yICdMSU5FQVInCiAgICAgICAgaWYgbW9kZSA9PSAnQ1VCSUNTUExJTkUnOgogICAgICAgICAgICBhLCBiID0gdmFsdWVzW2kqMysxXSwgdmFsdWVzW2oqMysxXQogICAgICAgICAgICB2YWx1ZSA9ICgyKmYqKjMtMypmKmYrMSkqYSArIChmKiozLTIqZipmK2YpKmR1cmF0aW9uKnZhbHVlc1tpKjMrMl0gKyAoLTIqZioqMyszKmYqZikqYiArIChmKiozLWYqZikqZHVyYXRpb24qdmFsdWVzW2oqM10KICAgICAgICBlbGlmIG1vZGUgPT0gJ1NURVAnIG9yIGkgPT0gajoKICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZXNbaV0KICAgICAgICBlbGlmIHBhdGggPT0gJ3JvdGF0aW9uJzoKICAgICAgICAgICAgYSwgYiA9IHZhbHVlc1tpXSwgdmFsdWVzW2pdCiAgICAgICAgICAgIGRvdCA9IGZsb2F0KG5wLmRvdChhLCBiKSkKICAgICAgICAgICAgaWYgZG90IDwgMDoKICAgICAgICAgICAgICAgIGIsIGRvdCA9IC1iLCAtZG90CiAgICAgICAgICAgIGRvdCA9IG1pbihtYXgoZG90LCAtMSksIDEpCiAgICAgICAgICAgIGFuZ2xlID0gbWF0aC5hY29zKGRvdCkKICAgICAgICAgICAgdmFsdWUgPSAoKDEtZikqYStmKmIpIGlmIGRvdCA+IC45OTk1IGVsc2UgKG1hdGguc2luKCgxLWYpKmFuZ2xlKSphK21hdGguc2luKGYqYW5nbGUpKmIpL21hdGguc2luKGFuZ2xlKQogICAgICAgIGVsc2U6CiAgICAgICAgICAgIHZhbHVlID0gKDEtZikqdmFsdWVzW2ldK2YqdmFsdWVzW2pdCiAgICAgICAgcmV0dXJuIHZhbHVlIC8gbnAubGluYWxnLm5vcm0odmFsdWUpIGlmIHBhdGggPT0gJ3JvdGF0aW9uJyBlbHNlIHZhbHVlCgogICAgZnBzID0gYnB5LmNvbnRleHQuc2NlbmUucmVuZGVyLmZwcyAvIGJweS5jb250ZXh0LnNjZW5lLnJlbmRlci5mcHNfYmFzZQogICAgZm9yIG9yZGluYWwsIGFuaW1hdGlvbiBpbiBlbnVtZXJhdGUoZ2x0Zi5kYXRhLmFuaW1hdGlvbnMgb3IgW10pOgogICAgICAgIGNoYW5uZWxzID0gW2NoYW5uZWwgZm9yIGNoYW5uZWwgaW4gYW5pbWF0aW9uLmNoYW5uZWxzIGlmIGNoYW5uZWwudGFyZ2V0Lm5vZGUgaW4gZHJpdmVycyBhbmQgY2hhbm5lbC50YXJnZXQucGF0aCBpbiB7J3RyYW5zbGF0aW9uJywgJ3JvdGF0aW9uJywgJ3NjYWxlJ31dCiAgICAgICAgaWYgbm90IGNoYW5uZWxzOgogICAgICAgICAgICBjb250aW51ZQogICAgICAgIG5hbWUgPSBhbmltYXRpb24ubmFtZSBvciAoJ0FuaW1hdGlvbl8nICsgc3RyKG9yZGluYWwpKQogICAgICAgIGFjdGlvbiA9IGJweS5kYXRhLmFjdGlvbnMubmV3KG5hbWUgKyAnX05NVE1fRXhhY3RTa2luJykKICAgICAgICBhY3Rpb24udXNlX2Zha2VfdXNlciA9IFRydWUKICAgICAgICByaWcuYW5pbWF0aW9uX2RhdGFfY3JlYXRlKCkuYWN0aW9uID0gYWN0aW9uCiAgICAgICAgZm9yIGNoYW5uZWwgaW4gY2hhbm5lbHM6CiAgICAgICAgICAgIGluZGV4LCBwYXRoID0gY2hhbm5lbC50YXJnZXQubm9kZSwgY2hhbm5lbC50YXJnZXQucGF0aAogICAgICAgICAgICBzYW1wbGVyID0gYW5pbWF0aW9uLnNhbXBsZXJzW2NoYW5uZWwuc2FtcGxlcl0KICAgICAgICAgICAgc291cmNlX3RpbWVzID0gQmluYXJ5RGF0YS5kZWNvZGVfYWNjZXNzb3IoZ2x0Ziwgc2FtcGxlci5pbnB1dCkucmVzaGFwZSgtMSkuYXN0eXBlKGZsb2F0KQogICAgICAgICAgICBzdGFydCwgZW5kID0gc291cmNlX3RpbWVzWzBdKmZwcywgc291cmNlX3RpbWVzWy0xXSpmcHMKICAgICAgICAgICAgZnJhbWVzID0gc2V0KGZsb2F0KHQqZnBzKSBmb3IgdCBpbiBzb3VyY2VfdGltZXMpCiAgICAgICAgICAgIHNhbXBsZV9zdGVwID0gZmxvYXQocmlnLmdldCgnbm10bV9hbmltYXRpb25fc2FtcGxlX3N0ZXAnLCAwLjA2MjUpKQogICAgICAgICAgICBmcmFtZXMudXBkYXRlKGZsb2F0KGZyYW1lKSpzYW1wbGVfc3RlcCBmb3IgZnJhbWUgaW4gcmFuZ2UobWF0aC5jZWlsKHN0YXJ0L3NhbXBsZV9zdGVwKSwgbWF0aC5mbG9vcihlbmQvc2FtcGxlX3N0ZXApKzEpKQogICAgICAgICAgICBib25lID0gcmlnLnBvc2UuYm9uZXNbZHJpdmVyc1tpbmRleF1dCiAgICAgICAgICAgIHByb3BlcnR5X25hbWUgPSB7J3RyYW5zbGF0aW9uJzogJ2xvY2F0aW9uJywgJ3JvdGF0aW9uJzogJ3JvdGF0aW9uX3F1YXRlcm5pb24nLCAnc2NhbGUnOiAnc2NhbGUnfVtwYXRoXQogICAgICAgICAgICBmb3IgZnJhbWUgaW4gc29ydGVkKGZyYW1lcyk6CiAgICAgICAgICAgICAgICB2YWx1ZSA9IHNhbXBsZXJfdmFsdWUoc2FtcGxlciwgZnJhbWUvZnBzLCBwYXRoKQogICAgICAgICAgICAgICAgc2V0X3Rycyhib25lLCBub2Rlc1tpbmRleF0sIHtwYXRoOiB2YWx1ZX0pCiAgICAgICAgICAgICAgICBib25lLmtleWZyYW1lX2luc2VydChwcm9wZXJ0eV9uYW1lLCBmcmFtZT1mcmFtZSwgZ3JvdXA9Ym9uZS5uYW1lKQogICAgICAgICAgICBkYXRhX3BhdGggPSBib25lLnBhdGhfZnJvbV9pZChwcm9wZXJ0eV9uYW1lKQogICAgICAgICAgICBmb3IgY3VydmUgaW4gYWN0aW9uLmZjdXJ2ZXM6CiAgICAgICAgICAgICAgICBpZiBjdXJ2ZS5kYXRhX3BhdGggPT0gZGF0YV9wYXRoOgogICAgICAgICAgICAgICAgICAgIGZvciBrZXkgaW4gY3VydmUua2V5ZnJhbWVfcG9pbnRzOgogICAgICAgICAgICAgICAgICAgICAgICBrZXkuaW50ZXJwb2xhdGlvbiA9ICdDT05TVEFOVCcgaWYgc2FtcGxlci5pbnRlcnBvbGF0aW9uID09ICdTVEVQJyBlbHNlICdMSU5FQVInCiAgICAgICAgdHJhY2sgPSByaWcuYW5pbWF0aW9uX2RhdGEubmxhX3RyYWNrcy5uZXcoKQogICAgICAgIHRyYWNrLm5hbWUgPSBuYW1lCiAgICAgICAgdHJhY2suc3RyaXBzLm5ldyhuYW1lLCBtYXRoLmZsb29yKGFjdGlvbi5mcmFtZV9yYW5nZVswXSksIGFjdGlvbikKICAgIGlmIHJpZy5hbmltYXRpb25fZGF0YToKICAgICAgICByaWcuYW5pbWF0aW9uX2RhdGEuYWN0aW9uID0gTm9uZQogICAgICAgIHJpZy5hbmltYXRpb25fZGF0YS51c2VfbmxhID0gRmFsc2UKICAgIGZvciBpbmRleCwgbmFtZSBpbiBkcml2ZXJzLml0ZW1zKCk6CiAgICAgICAgc2V0X3RycyhyaWcucG9zZS5ib25lc1tuYW1lXSwgbm9kZXNbaW5kZXhdKQogICAgYnB5LmNvbnRleHQudmlld19sYXllci51cGRhdGUoKQoKCmRlZiBtb2RlbF9vYmplY3RzKCk6CiAgICAiIiJFeGNsdWRlIGdsVEYncyBkaXNwbGF5LW9ubHkgYm9uZSBzaGFwZXMsIGluY2x1ZGluZyBsaW5rZWQgaGVscGVycy4iIiIKICAgIHNjZW5lX29iamVjdHMgPSBsaXN0KGJweS5jb250ZXh0LnNjZW5lLm9iamVjdHMpCiAgICBzaGFwZXMgPSB7Ym9uZS5jdXN0b21fc2hhcGUgZm9yIG9iaiBpbiBzY2VuZV9vYmplY3RzIGlmIG9iai50eXBlID09ICdBUk1BVFVSRScKICAgICAgICAgICAgICBmb3IgYm9uZSBpbiBvYmoucG9zZS5ib25lcyBpZiBib25lLmN1c3RvbV9zaGFwZX0KICAgIHJldHVybiBbb2JqIGZvciBvYmogaW4gc2NlbmVfb2JqZWN0cwogICAgICAgICAgICBpZiBvYmoudHlwZSBpbiB7J01FU0gnLCAnQVJNQVRVUkUnLCAnRU1QVFknfSBhbmQgb2JqIG5vdCBpbiBzaGFwZXMKICAgICAgICAgICAgYW5kIG5vdCAob2JqLnVzZXJzX2NvbGxlY3Rpb24gYW5kIGFsbCgKICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24ubmFtZS5zdGFydHN3aXRoKCdnbFRGX25vdF9leHBvcnRlZCcpCiAgICAgICAgICAgICAgICBmb3IgY29sbGVjdGlvbiBpbiBvYmoudXNlcnNfY29sbGVjdGlvbikpXQoKCmRlZiBhbmltYXRpb25fb3duZXJzKG9iamVjdHMpOgogICAgb3duZXJzID0gbGlzdChvYmplY3RzKQogICAgZm9yIG9iaiBpbiBvYmplY3RzOgogICAgICAgIGtleXMgPSBnZXRhdHRyKG9iai5kYXRhLCAnc2hhcGVfa2V5cycsIE5vbmUpIGlmIG9iai5kYXRhIGVsc2UgTm9uZQogICAgICAgIGlmIGtleXMgYW5kIGtleXMgbm90IGluIG93bmVyczoKICAgICAgICAgICAgb3duZXJzLmFwcGVuZChrZXlzKQogICAgcmV0dXJuIG93bmVycwoKCmRlZiBhbmltYXRpb25fY2xpcHMob2JqZWN0cyk6CiAgICAiIiJBIGdsVEYgY2xpcCBjYW4gaGF2ZSBzZXBhcmF0ZSBhY3Rpb25zIG9uIHNldmVyYWwgb2JqZWN0cy9zaGFwZSBrZXlzLiIiIgogICAgY2xpcHMgPSB7fQogICAgZm9yIG93bmVyIGluIGFuaW1hdGlvbl9vd25lcnMob2JqZWN0cyk6CiAgICAgICAgZGF0YSA9IG93bmVyLmFuaW1hdGlvbl9kYXRhCiAgICAgICAgaWYgbm90IGRhdGE6CiAgICAgICAgICAgIGNvbnRpbnVlCiAgICAgICAgc3Rhc2hlZCA9IHNldCgpCiAgICAgICAgIyBnbFRGIGluc2VydHMgdHJhY2tzIGluIHJldmVyc2UgYW5pbWF0aW9uIG9yZGVyLgogICAgICAgIGZvciB0cmFjayBpbiByZXZlcnNlZChsaXN0KGRhdGEubmxhX3RyYWNrcykpOgogICAgICAgICAgICBmb3Igc3RyaXAgaW4gdHJhY2suc3RyaXBzOgogICAgICAgICAgICAgICAgaWYgc3RyaXAuYWN0aW9uOgogICAgICAgICAgICAgICAgICAgIGNsaXBzLnNldGRlZmF1bHQodHJhY2submFtZSwgW10pLmFwcGVuZCgob3duZXIsIHN0cmlwLmFjdGlvbikpCiAgICAgICAgICAgICAgICAgICAgc3Rhc2hlZC5hZGQoc3RyaXAuYWN0aW9uKQogICAgICAgIGlmIGRhdGEuYWN0aW9uIGFuZCBkYXRhLmFjdGlvbiBub3QgaW4gc3Rhc2hlZDoKICAgICAgICAgICAgY2xpcHMuc2V0ZGVmYXVsdChkYXRhLmFjdGlvbi5uYW1lLCBbXSkuYXBwZW5kKChvd25lciwgZGF0YS5hY3Rpb24pKQogICAgcmV0dXJuIGNsaXBzCgoKZGVmIGNhcHR1cmVfZGVmYXVsdHMob2JqZWN0cyk6CiAgICAiIiJEbyBub3QgcmVwbGFjZSBwb3NlIHNjYWxlcyB3aXRoIGlkZW50aXR5OiBnbFRGIG1heSBoYXZlIHNjYWxlZCBqb2ludHMuIiIiCiAgICByZXN1bHQgPSBbXQogICAgZm9yIG9iaiBpbiBvYmplY3RzOgogICAgICAgIHJlc3VsdC5hcHBlbmQoKG9iaiwgb2JqLm1hdHJpeF9iYXNpcy5jb3B5KCkpKQogICAgICAgIGlmIG9iai50eXBlID09ICdBUk1BVFVSRSc6CiAgICAgICAgICAgIHJlc3VsdC5leHRlbmQoKGJvbmUsIGJvbmUubWF0cml4X2Jhc2lzLmNvcHkoKSkgZm9yIGJvbmUgaW4gb2JqLnBvc2UuYm9uZXMpCiAgICByZXR1cm4gcmVzdWx0CgoKZGVmIHBhY2tfaW1hZ2VzKCk6CiAgICAiIiJEaXN0aW5jdCB1c2VmdWwgZmlsZW5hbWVzIGF2b2lkIEZCWCBkZWR1cGxpY2F0aW5nIGVtcHR5IGltYWdlIHBhdGhzLiIiIgogICAgdXNlZCA9IHNldCgpCiAgICBmb3IgaW1hZ2UgaW4gYnB5LmRhdGEuaW1hZ2VzOgogICAgICAgIGlmIGltYWdlLnR5cGUgaW4geydSRU5ERVJfUkVTVUxUJywgJ0NPTVBPU0lUSU5HJ306CiAgICAgICAgICAgIGNvbnRpbnVlCiAgICAgICAgaWYgbWluKGltYWdlLnNpemUpIDw9IDA6CiAgICAgICAgICAgIHJhaXNlIFJ1bnRpbWVFcnJvcignVGV4dHVyZSBoYXMgbm8gcmVhZGFibGUgcGl4ZWxzOiAnICsgaW1hZ2UubmFtZSkKICAgICAgICBpZiBub3QgaW1hZ2UucGFja2VkX2ZpbGU6CiAgICAgICAgICAgIGltYWdlLnBhY2soKQogICAgICAgIGlmIG5vdCBpbWFnZS5wYWNrZWRfZmlsZToKICAgICAgICAgICAgcmFpc2UgUnVudGltZUVycm9yKCdDb3VsZCBub3QgcGFjayB0ZXh0dXJlOiAnICsgaW1hZ2UubmFtZSkKICAgICAgICBwYXlsb2FkID0gaW1hZ2UucGFja2VkX2ZpbGUuZGF0YQogICAgICAgIGV4dGVuc2lvbiA9ICcuanBnJyBpZiBwYXlsb2FkWzozXSA9PSBiJ1x4ZmZceGQ4XHhmZicgZWxzZSAnLnBuZycKICAgICAgICBpZiBwYXlsb2FkWzo0XSA9PSBiJ1JJRkYnOgogICAgICAgICAgICBleHRlbnNpb24gPSAnLndlYnAnCiAgICAgICAgc3RlbSA9IFBhdGgoaW1hZ2UubmFtZSkuc3RlbQogICAgICAgIHN0ZW0gPSByZS5zdWIocidbPD46Ii9cXHw/Klx4MDAtXHgxZl0nLCAnXycsIHN0ZW0pLnN0cmlwKCcgLicpIG9yICd0ZXh0dXJlJwogICAgICAgIG5hbWUgPSBzdGVtICsgZXh0ZW5zaW9uCiAgICAgICAgY291bnRlciA9IDIKICAgICAgICB3aGlsZSBuYW1lLmNhc2Vmb2xkKCkgaW4gdXNlZDoKICAgICAgICAgICAgbmFtZSA9IHN0ZW0gKyAnXycgKyBzdHIoY291bnRlcikgKyBleHRlbnNpb24KICAgICAgICAgICAgY291bnRlciArPSAxCiAgICAgICAgdXNlZC5hZGQobmFtZS5jYXNlZm9sZCgpKQogICAgICAgIGltYWdlLmZpbGVwYXRoX3JhdyA9ICcvLycgKyBuYW1lCgoKZGVmIGV4cG9ydF9mYngodGFyZ2V0LCBvYmplY3RzLCBjbGlwcywgZGVmYXVsdHMpOgogICAgIiIiQmFrZSBlYWNoIGNvbXBsZXRlIHNvdXJjZSBjbGlwIG9uY2UsIG5vdCBldmVyeSBhY3Rpb24gb250byBldmVyeSByaWcuCgogICAgQmxlbmRlcidzIGJ1aWx0LWluIE5MQSBtb2RlIGJha2VzIG9uZSBzdHJpcCBhdCBhIHRpbWUsIGxvc2luZyBzeW5jaHJvbml6ZWQKICAgIG9iamVjdHMuIEl0cyBhbGwtYWN0aW9ucyBtb2RlIGNhbiByZXRhcmdldCBjb21wYXRpYmxlIGFjdGlvbnMgdG8gb3RoZXIgcmlncy4KICAgIFJlcGxhY2Ugb25seSB0aGF0IGNvbGxlY3Rpb24gc3RhZ2Ugd2hpbGUgcmV0YWluaW5nIEJsZW5kZXIncyBGQlggd3JpdGVyIGFuZAogICAgc2FtcGxlL2Jha2UgaW1wbGVtZW50YXRpb24uIFRoZSBvcmlnaW5hbCBmdW5jdGlvbiBpcyByZXN0b3JlZCBldmVuIG9uIGVycm9yLgogICAgIiIiCiAgICBmcm9tIGlvX3NjZW5lX2ZieCBpbXBvcnQgZXhwb3J0X2ZieF9iaW4KICAgIGZyb20gaW9fc2NlbmVfZmJ4LmZieF91dGlscyBpbXBvcnQgT2JqZWN0V3JhcHBlcgoKICAgIG9yaWdpbmFsID0gZXhwb3J0X2ZieF9iaW4uZmJ4X2FuaW1hdGlvbnMKICAgIG9yaWdpbmFsX29iamVjdF90eCA9IE9iamVjdFdyYXBwZXIuZmJ4X29iamVjdF90eAoKICAgIGRlZiBleGFjdF9sb2NhbF90eCh3cmFwcGVyLCBzY2VuZV9kYXRhLCByZXN0PUZhbHNlLCByb3RfZXVsZXJfY29tcGF0PU5vbmUpOgogICAgICAgIGJhc2UgPSBvcmlnaW5hbF9vYmplY3RfdHgod3JhcHBlciwgc2NlbmVfZGF0YSwgcmVzdCwgcm90X2V1bGVyX2NvbXBhdCkKICAgICAgICAjIEEgcXVhdGVybmlvbi0+bWF0cml4LT5kZWNvbXBvc2UtPkV1bGVyIGZsb2F0MzIgcm91bmQtdHJpcCBsb3NlcwogICAgICAgICMgcHJlY2lzaW9uIGNsb3NlIHRvIGdpbWJhbCBsb2NrLiBVc2Uga25vd24gbG9jYWwgY2hhbm5lbHMgZGlyZWN0bHkuCiAgICAgICAgaWYgKHdyYXBwZXIuaXNfYm9uZSBhbmQgd3JhcHBlci5hcm1hdHVyZS5iZGF0YS5nZXQoJ25tdG1fc2tpbl9tZXRob2QnKQogICAgICAgICAgICAgICAgYW5kIG5vdCByZXN0IGFuZCBub3Qgc2NlbmVfZGF0YS5zZXR0aW5ncy5ib25lX2NvcnJlY3Rpb25fbWF0cml4KToKICAgICAgICAgICAgYm9uZSA9IHdyYXBwZXIuYmRhdGFfcG9zZV9ib25lCiAgICAgICAgICAgIGlmIGJvbmUucm90YXRpb25fbW9kZSA9PSAnUVVBVEVSTklPTic6CiAgICAgICAgICAgICAgICB3LCB4LCB5LCB6ID0gbnAuYXNhcnJheShib25lLnJvdGF0aW9uX3F1YXRlcm5pb24sIGR0eXBlPW5wLmZsb2F0NjQpCiAgICAgICAgICAgICAgICBub3JtID0gbWF0aC5zcXJ0KHcqdyt4KngreSp5K3oqeikKICAgICAgICAgICAgICAgIHcsIHgsIHksIHogPSB3L25vcm0sIHgvbm9ybSwgeS9ub3JtLCB6L25vcm0KICAgICAgICAgICAgICAgIGFuZ2xlcyA9IChtYXRoLmF0YW4yKDIqKHcqeCt5KnopLCAxLTIqKHgqeCt5KnkpKSwKICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRoLmFzaW4obWluKG1heCgyKih3Knkteip4KSwgLTEpLCAxKSksCiAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0aC5hdGFuMigyKih3KnoreCp5KSwgMS0yKih5Knkreip6KSkpCiAgICAgICAgICAgICAgICByb3RhdGlvbiA9IEV1bGVyKGFuZ2xlcywgJ1hZWicpCiAgICAgICAgICAgICAgICBpZiByb3RfZXVsZXJfY29tcGF0IGlzIG5vdCBOb25lOgogICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uLm1ha2VfY29tcGF0aWJsZShyb3RfZXVsZXJfY29tcGF0KQogICAgICAgICAgICBlbHNlOgogICAgICAgICAgICAgICAgcm90YXRpb24gPSBib25lLnJvdGF0aW9uX2V1bGVyLmNvcHkoKQogICAgICAgICAgICAjIFByZXNlcnZlIGFsbCBheGlzL3VuaXQvbmVnYXRpdmUtc2NhbGUgY29ycmVjdGlvbnMgZnJvbSB0aGUgd3JpdGVyLgogICAgICAgICAgICAjIFJlcGxhY2Ugb25seSB3aGVuIHRoZSB0d28gZGVjb21wb3NpdGlvbnMgZGVzY3JpYmUgdGhlIHNhbWUgcm90YXRpb24uCiAgICAgICAgICAgIGlmIGFicyhiYXNlWzFdLnRvX3F1YXRlcm5pb24oKS5kb3Qocm90YXRpb24udG9fcXVhdGVybmlvbigpKSkgPiAuOTk5OTk5OgogICAgICAgICAgICAgICAgcmV0dXJuIGJhc2VbMF0sIHJvdGF0aW9uLCBiYXNlWzJdLCBiYXNlWzNdLCBiYXNlWzRdCiAgICAgICAgcmV0dXJuIGJhc2UKICAgIG93bmVycyA9IGFuaW1hdGlvbl9vd25lcnMob2JqZWN0cykKICAgIHN0YXRlcyA9IFsob3duZXIsIG93bmVyLmFuaW1hdGlvbl9kYXRhLmFjdGlvbiwgb3duZXIuYW5pbWF0aW9uX2RhdGEudXNlX25sYSkKICAgICAgICAgICAgICBmb3Igb3duZXIgaW4gb3duZXJzIGlmIG93bmVyLmFuaW1hdGlvbl9kYXRhXQogICAga2V5X2RlZmF1bHRzID0gWyhrZXksIGtleS52YWx1ZSkgZm9yIG93bmVyIGluIG93bmVycwogICAgICAgICAgICAgICAgICAgIGlmIGlzaW5zdGFuY2Uob3duZXIsIGJweS50eXBlcy5LZXkpIGZvciBrZXkgaW4gb3duZXIua2V5X2Jsb2Nrc10KCiAgICBkZWYgZ3JvdXBlZF9hbmltYXRpb25zKHNjZW5lX2RhdGEpOgogICAgICAgIGFuaW1hdGlvbnMsIGFuaW1hdGVkID0gW10sIHNldCgpCiAgICAgICAgZnJhbWVfc3RhcnQsIGZyYW1lX2VuZCA9IGZsb2F0KCdpbmYnKSwgLWZsb2F0KCdpbmYnKQogICAgICAgIHNjZW5lID0gc2NlbmVfZGF0YS5zY2VuZQogICAgICAgIHNhdmVkX2ZyYW1lLCBzYXZlZF9zdWJmcmFtZSA9IHNjZW5lLmZyYW1lX2N1cnJlbnQsIHNjZW5lLmZyYW1lX3N1YmZyYW1lCiAgICAgICAgdHJ5OgogICAgICAgICAgICBmb3IgbmFtZSwgYmluZGluZ3MgaW4gY2xpcHMuaXRlbXMoKToKICAgICAgICAgICAgICAgIGZvciBvd25lciwgX2FjdGlvbiwgX3VzZV9ubGEgaW4gc3RhdGVzOgogICAgICAgICAgICAgICAgICAgIG93bmVyLmFuaW1hdGlvbl9kYXRhLmFjdGlvbiA9IE5vbmUKICAgICAgICAgICAgICAgICAgICBvd25lci5hbmltYXRpb25fZGF0YS51c2VfbmxhID0gRmFsc2UKICAgICAgICAgICAgICAgIGZvciB0YXJnZXRfb2JqZWN0LCBtYXRyaXggaW4gZGVmYXVsdHM6CiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0X29iamVjdC5tYXRyaXhfYmFzaXMgPSBtYXRyaXguY29weSgpCiAgICAgICAgICAgICAgICBmb3Iga2V5LCB2YWx1ZSBpbiBrZXlfZGVmYXVsdHM6CiAgICAgICAgICAgICAgICAgICAga2V5LnZhbHVlID0gdmFsdWUKICAgICAgICAgICAgICAgIGZvciBvd25lciwgYWN0aW9uIGluIGJpbmRpbmdzOgogICAgICAgICAgICAgICAgICAgIG93bmVyLmFuaW1hdGlvbl9kYXRhX2NyZWF0ZSgpLmFjdGlvbiA9IGFjdGlvbgogICAgICAgICAgICAgICAgc3RhcnQgPSBtaW4oZmxvYXQoYWN0aW9uLmZyYW1lX3JhbmdlWzBdKSBmb3IgXywgYWN0aW9uIGluIGJpbmRpbmdzKQogICAgICAgICAgICAgICAgZW5kID0gbWF4KGZsb2F0KGFjdGlvbi5mcmFtZV9yYW5nZVsxXSkgZm9yIF8sIGFjdGlvbiBpbiBiaW5kaW5ncykKICAgICAgICAgICAgICAgIHNjZW5lLmZyYW1lX3NldChtYXRoLmZsb29yKHN0YXJ0KSwgc3ViZnJhbWU9c3RhcnQgLSBtYXRoLmZsb29yKHN0YXJ0KSkKICAgICAgICAgICAgICAgIGJweS5jb250ZXh0LnZpZXdfbGF5ZXIudXBkYXRlKCkKICAgICAgICAgICAgICAgICMgQSByZWFsIFJOQSBhY3Rpb24gaXMgYSBzdXBwb3J0ZWQgRkJYIGlkZW50aXR5LCBidXQgdGhlIHN0YWNrCiAgICAgICAgICAgICAgICAjIG5hbWUgaXMgdGhlIHNvdXJjZSBnbFRGIGNsaXAsIG5vdCBhbiBvYmplY3Qtc3BlY2lmaWMgYWN0aW9uLgogICAgICAgICAgICAgICAgYW5pbWF0aW9uID0gZXhwb3J0X2ZieF9iaW4uZmJ4X2FuaW1hdGlvbnNfZG8oCiAgICAgICAgICAgICAgICAgICAgc2NlbmVfZGF0YSwgYmluZGluZ3NbMF1bMV0sIHN0YXJ0LCBlbmQsIFRydWUsIGZvcmNlX2tlZXA9VHJ1ZSkKICAgICAgICAgICAgICAgIGlmIGFuaW1hdGlvbjoKICAgICAgICAgICAgICAgICAgICBzdGFja19rZXksIHN0YWNrLCBsYXllcl9rZXksIF8sIGZpcnN0LCBsYXN0ID0gYW5pbWF0aW9uCiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9ucy5hcHBlbmQoKHN0YWNrX2tleSwgc3RhY2ssIGxheWVyX2tleSwgbmFtZS5lbmNvZGUoJ3V0Zi04JyksIGZpcnN0LCBsYXN0KSkKICAgICAgICAgICAgICAgICAgICBmcmFtZV9zdGFydCwgZnJhbWVfZW5kID0gbWluKGZyYW1lX3N0YXJ0LCBmaXJzdCksIG1heChmcmFtZV9lbmQsIGxhc3QpCiAgICAgICAgICAgICAgICAgICAgZm9yIGVsZW1lbnRfa2V5LCAoXywgY3VydmVzKSBpbiBzdGFjay5pdGVtcygpOgogICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRlZC51cGRhdGUoKGVsZW1lbnRfa2V5LCBwcm9wKSBmb3IgcHJvcCBpbiBjdXJ2ZXMpCiAgICAgICAgZmluYWxseToKICAgICAgICAgICAgZm9yIG93bmVyLCBhY3Rpb24sIHVzZV9ubGEgaW4gc3RhdGVzOgogICAgICAgICAgICAgICAgb3duZXIuYW5pbWF0aW9uX2RhdGEuYWN0aW9uID0gYWN0aW9uCiAgICAgICAgICAgICAgICBvd25lci5hbmltYXRpb25fZGF0YS51c2VfbmxhID0gdXNlX25sYQogICAgICAgICAgICBmb3IgdGFyZ2V0X29iamVjdCwgbWF0cml4IGluIGRlZmF1bHRzOgogICAgICAgICAgICAgICAgdGFyZ2V0X29iamVjdC5tYXRyaXhfYmFzaXMgPSBtYXRyaXguY29weSgpCiAgICAgICAgICAgIGZvciBrZXksIHZhbHVlIGluIGtleV9kZWZhdWx0czoKICAgICAgICAgICAgICAgIGtleS52YWx1ZSA9IHZhbHVlCiAgICAgICAgICAgIHNjZW5lLmZyYW1lX3NldChzYXZlZF9mcmFtZSwgc3ViZnJhbWU9c2F2ZWRfc3ViZnJhbWUpCiAgICAgICAgcmV0dXJuIGFuaW1hdGlvbnMsIGFuaW1hdGVkLCBmcmFtZV9zdGFydCwgZnJhbWVfZW5kCgogICAgYnB5Lm9wcy5vYmplY3Quc2VsZWN0X2FsbChhY3Rpb249J0RFU0VMRUNUJykKICAgIGZvciBvYmogaW4gb2JqZWN0czoKICAgICAgICBvYmouaGlkZV9zZXQoRmFsc2UpCiAgICAgICAgb2JqLmhpZGVfc2VsZWN0ID0gRmFsc2UKICAgICAgICBvYmouc2VsZWN0X3NldChUcnVlKQogICAgYnB5LmNvbnRleHQudmlld19sYXllci5vYmplY3RzLmFjdGl2ZSA9IG5leHQoKG8gZm9yIG8gaW4gb2JqZWN0cyBpZiBvLnR5cGUgPT0gJ0FSTUFUVVJFJyksIG9iamVjdHNbMF0pCiAgICBleHBvcnRfZmJ4X2Jpbi5mYnhfYW5pbWF0aW9ucyA9IGdyb3VwZWRfYW5pbWF0aW9ucwogICAgT2JqZWN0V3JhcHBlci5mYnhfb2JqZWN0X3R4ID0gZXhhY3RfbG9jYWxfdHgKICAgIHRyeToKICAgICAgICBicHkub3BzLmV4cG9ydF9zY2VuZS5mYngoCiAgICAgICAgICAgIGZpbGVwYXRoPXN0cih0YXJnZXQpLCB1c2Vfc2VsZWN0aW9uPVRydWUsCiAgICAgICAgICAgIG9iamVjdF90eXBlcz17J0FSTUFUVVJFJywgJ01FU0gnLCAnRU1QVFknfSwgdXNlX21lc2hfbW9kaWZpZXJzPVRydWUsCiAgICAgICAgICAgIGFkZF9sZWFmX2JvbmVzPUZhbHNlLCB1c2VfYXJtYXR1cmVfZGVmb3JtX29ubHk9RmFsc2UsCiAgICAgICAgICAgIGJha2VfYW5pbT1ib29sKGNsaXBzKSwgYmFrZV9hbmltX3VzZV9hbGxfYWN0aW9ucz1GYWxzZSwKICAgICAgICAgICAgYmFrZV9hbmltX3VzZV9ubGFfc3RyaXBzPUZhbHNlLCBiYWtlX2FuaW1fdXNlX2FsbF9ib25lcz1UcnVlLAogICAgICAgICAgICBiYWtlX2FuaW1fc3RlcD0wLjA2MjUsIGJha2VfYW5pbV9zaW1wbGlmeV9mYWN0b3I9MC4wLAogICAgICAgICAgICBwYXRoX21vZGU9J0NPUFknLCBlbWJlZF90ZXh0dXJlcz1UcnVlLCBheGlzX2ZvcndhcmQ9Jy1aJywgYXhpc191cD0nWScpCiAgICBmaW5hbGx5OgogICAgICAgIGV4cG9ydF9mYnhfYmluLmZieF9hbmltYXRpb25zID0gb3JpZ2luYWwKICAgICAgICBPYmplY3RXcmFwcGVyLmZieF9vYmplY3RfdHggPSBvcmlnaW5hbF9vYmplY3RfdHgKCgpkZWYgY29udmVydChzb3VyY2UsIHRhcmdldCwga2luZCk6CiAgICBpZiBraW5kIG5vdCBpbiB7J2JsZW5kJywgJ2ZieCd9OgogICAgICAgIHJhaXNlIFZhbHVlRXJyb3IoJ1Vuc3VwcG9ydGVkIE5NVE0gY29udmVyc2lvbjogJyArIHN0cihraW5kKSkKICAgIGJweS5vcHMud20ucmVhZF9mYWN0b3J5X3NldHRpbmdzKHVzZV9lbXB0eT1UcnVlKQogICAgYnB5LmNvbnRleHQucHJlZmVyZW5jZXMuZmlsZXBhdGhzLnVzZV9zY3JpcHRzX2F1dG9fZXhlY3V0ZSA9IEZhbHNlCiAgICAjIEtlZXAgYWN0dWFsIGVkaXRhYmxlIGJvbmVzOyBzdXBwcmVzcyB0aGUgZXh0cmEgSWNvc3BoZXJlIGRpc3BsYXkgbWVzaC4KICAgIGV4YWN0X3NraW5faW1wb3J0KHNvdXJjZSkKICAgIG9iamVjdHMgPSBtb2RlbF9vYmplY3RzKCkKICAgIGlmIG5vdCBhbnkob2JqLnR5cGUgPT0gJ01FU0gnIGZvciBvYmogaW4gb2JqZWN0cyk6CiAgICAgICAgcmFpc2UgUnVudGltZUVycm9yKCdUaGUgR0xCIGNvbnRhaW5zIG5vIG1vZGVsIG1lc2ggb2JqZWN0cy4nKQogICAgZGVmYXVsdHMgPSBjYXB0dXJlX2RlZmF1bHRzKG9iamVjdHMpCiAgICBjbGlwcyA9IGFuaW1hdGlvbl9jbGlwcyhvYmplY3RzKQogICAgZm9yIGJpbmRpbmdzIGluIGNsaXBzLnZhbHVlcygpOgogICAgICAgIGZvciBfb3duZXIsIGFjdGlvbiBpbiBiaW5kaW5nczoKICAgICAgICAgICAgYWN0aW9uLnVzZV9mYWtlX3VzZXIgPSBUcnVlCiAgICBwYWNrX2ltYWdlcygpCiAgICBzY2VuZSA9IGJweS5jb250ZXh0LnNjZW5lCiAgICBpZiBjbGlwczoKICAgICAgICBhY3Rpb25zID0ge2FjdGlvbiBmb3IgYmluZGluZ3MgaW4gY2xpcHMudmFsdWVzKCkgZm9yIF8sIGFjdGlvbiBpbiBiaW5kaW5nc30KICAgICAgICBzY2VuZS5mcmFtZV9zdGFydCA9IG1hdGguZmxvb3IobWluKGFjdGlvbi5mcmFtZV9yYW5nZVswXSBmb3IgYWN0aW9uIGluIGFjdGlvbnMpKQogICAgICAgIHNjZW5lLmZyYW1lX2VuZCA9IG1hdGguY2VpbChtYXgoYWN0aW9uLmZyYW1lX3JhbmdlWzFdIGZvciBhY3Rpb24gaW4gYWN0aW9ucykpCiAgICBzY2VuZS5mcmFtZV9zZXQoc2NlbmUuZnJhbWVfc3RhcnQpCiAgICBpZiBraW5kID09ICdibGVuZCc6CiAgICAgICAgYnB5Lm9wcy53bS5zYXZlX2FzX21haW5maWxlKGZpbGVwYXRoPXN0cih0YXJnZXQpLCBjaGVja19leGlzdGluZz1GYWxzZSkKICAgIGVsc2U6CiAgICAgICAgZXhwb3J0X2ZieChQYXRoKHRhcmdldCksIG9iamVjdHMsIGNsaXBzLCBkZWZhdWx0cykKICAgIHByaW50KCdOTVRNX0NPTlZFUlRfT0snLCBraW5kLCBzdHIodGFyZ2V0KSwgJ21lc2hlcycsCiAgICAgICAgICBzdW0ob2JqLnR5cGUgPT0gJ01FU0gnIGZvciBvYmogaW4gb2JqZWN0cyksICdjbGlwcycsIGxlbihjbGlwcyksIGZsdXNoPVRydWUpCgoKaWYgX19uYW1lX18gPT0gJ19fbWFpbl9fJzoKICAgIGltcG9ydCBzeXMKICAgIGFyZ3VtZW50cyA9IHN5cy5hcmd2W3N5cy5hcmd2LmluZGV4KCctLScpICsgMTpdIGlmICctLScgaW4gc3lzLmFyZ3YgZWxzZSBbXQogICAgaWYgbGVuKGFyZ3VtZW50cykgPT0gMzoKICAgICAgICBjb252ZXJ0KCphcmd1bWVudHMpCg==';
    const nodeRequire = typeof require === 'function' ? require : null;
    const fs = nodeRequire ? nodeRequire('fs') : null;
    const path = nodeRequire ? nodeRequire('path') : null;
    const zlib = nodeRequire ? nodeRequire('zlib') : null;
    const childProcess = nodeRequire ? nodeRequire('child_process') : null;
    const NodeBuffer = nodeRequire ? nodeRequire('buffer').Buffer : null;
    const VERSION_MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
    const MCMETA_VERSIONS_URL = 'https://raw.githubusercontent.com/misode/mcmeta/summary/versions/data.min.json';
    const VERSION_CACHE_TTL = 24 * 60 * 60 * 1000;
    const VERSION_CACHE_LIMIT = 1024 * 1024;
    const runtime = {
        textures: new Map(),
        blenderPath: DEFAULT_BLENDER,
        lastImport: null,
        versionCatalog: null,
        versionCacheDirectory: null
    };

    function notify(text) {
        if (typeof Blockbench !== 'undefined' && Blockbench.showQuickMessage) Blockbench.showQuickMessage(String(text));
    }
    function fail(text, error) {
        console.error('[NMTM]', text, error || '');
        const detail = error ? '\n' + (error.message || error) : '';
        if (typeof Blockbench !== 'undefined' && Blockbench.showMessageBox) {
            Blockbench.showMessageBox({ title: PLUGIN_TITLE, message: String(text) + detail, buttons: ['dialog.confirm'] });
        } else notify(text);
    }
    function fileExists(value) {
        try { return !!(fs && value && fs.existsSync(value) && fs.statSync(value).isFile()); } catch (_) { return false; }
    }
    function dirExists(value) {
        try { return !!(fs && value && fs.existsSync(value) && fs.statSync(value).isDirectory()); } catch (_) { return false; }
    }
    function join(...parts) { return path ? path.normalize(path.join(...parts.filter(Boolean))) : parts.filter(Boolean).join('/'); }
    function jsonFile(value) {
        if (!fileExists(value)) return null;
        try { return JSON.parse(fs.readFileSync(value, 'utf8')); } catch (error) { fail('Could not parse JSON: ' + value, error); return null; }
    }
    function jsonText(value) {
        try { return JSON.parse(value); } catch (error) { fail('Could not parse selected JSON.', error); return null; }
    }
    function packRoot(filePath) {
        if (!path || !filePath) return null;
        let cursor = dirExists(filePath) ? filePath : path.dirname(filePath);
        for (let i = 0; i < 16; i++) {
            if (dirExists(join(cursor, 'textures'))) return cursor;
            const parent = path.dirname(cursor);
            if (parent === cursor) break;
            cursor = parent;
        }
        return null;
    }
    function resolveResource(sourceFile, reference, kind) {
        if (!reference || typeof reference !== 'string') return null;
        const clean = reference.replace(/\\/g, '/').replace(/^\/+/, '');
        const root = packRoot(sourceFile);
        const base = path ? path.dirname(sourceFile) : '';
        const candidates = [join(base, clean)];
        if (root) {
            candidates.push(join(root, kind === 'texture' ? 'textures' : 'models', clean));
            if (kind === 'texture') candidates.push(join(root, 'textures', 'models', clean));
        }
        if (root && clean.startsWith('textures/')) candidates.push(join(root, clean));
        const expanded = [];
        candidates.forEach(candidate => {
            expanded.push(candidate);
            if (!/\.[A-Za-z0-9]+$/.test(candidate)) {
                if (kind === 'texture') expanded.push(candidate + '.png', candidate + '.tga', candidate + '.jpg');
                else expanded.push(candidate + '.json');
            }
        });
        return expanded.find(fileExists) || null;
    }
    function pngSize(filePath) {
        if (!fs || !fileExists(filePath) || !/\.png$/i.test(filePath)) return null;
        try {
            const b = fs.readFileSync(filePath);
            if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
        } catch (_) { /* optional metadata */ }
        return null;
    }
    function addTexture(filePath) {
        if (!filePath || !fileExists(filePath) || typeof Texture === 'undefined') return null;
        const key = String(filePath).toLowerCase();
        if (runtime.textures.has(key)) {
            const cached = runtime.textures.get(key);
            // Texture.all belongs to the active project. A previous project's
            // UUID cannot be assigned to faces in a newly opened project.
            if (Texture.all.includes(cached)) return cached;
            runtime.textures.delete(key);
        }
        try {
            let texture;
            // Blockbench validates resource names as lowercase. Loading bitmap bytes
            // through a data URL keeps the sanitized name instead of restoring the
            // original filename (which may contain uppercase characters).
            if (fs && path && /\.(png|jpe?g)$/i.test(filePath)) {
                const safeName = path.basename(filePath)
                    .toLowerCase()
                    .replace(/[^a-z0-9_.-]/g, '_');
                const mime = /\.jpe?g$/i.test(filePath) ? 'image/jpeg' : 'image/png';
                const source = `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
                texture = new Texture({ name: safeName, mode: 'bitmap', keep_size: true });
                if (texture.flags && texture.flags.add) texture.flags.add('update_uv_size_from_resolution');
                texture.fromDataURL(source).add(false);
            } else {
                texture = new Texture({ name: path ? path.basename(filePath).toLowerCase() : filePath, keep_size: true });
                if (texture.flags && texture.flags.add) texture.flags.add('update_uv_size_from_resolution');
                texture.fromPath(filePath).add(false);
            }
            texture.nmtm_source_path = filePath;
            texture.nmtm_size = pngSize(filePath);
            // Mesh UVs are stored in texture pixels. With per-texture UV
            // sizing enabled, Blockbench otherwise defaults to a 16x16 UV
            // canvas and samples the imported mesh outside the bitmap.
            const uvWidth = texture.nmtm_size && texture.nmtm_size.width || texture.width;
            const uvHeight = texture.nmtm_size && texture.nmtm_size.height || texture.display_height || texture.height;
            if (Number(uvWidth) > 0 && Number(uvHeight) > 0) {
                texture.uv_width = Number(uvWidth);
                texture.uv_height = Number(uvHeight);
            }
            runtime.textures.set(key, texture);
            if (texture.nmtm_size && typeof Project !== 'undefined' && (Project.texture_width === 16 || !Project.texture_width)) {
                Project.texture_width = texture.nmtm_size.width;
                Project.texture_height = texture.nmtm_size.height;
            }
            return texture;
        } catch (error) { console.warn('[NMTM] Texture load failed', filePath, error); return null; }
    }
    function references(value) {
        const out = [];
        if (typeof value === 'string') out.push(value);
        else if (Array.isArray(value)) value.forEach(item => out.push(...references(item)));
        else if (value && typeof value === 'object') Object.values(value).forEach(item => out.push(...references(item)));
        return out;
    }
    function entryTextureRefs(entry) {
        const result = [];
        if (!entry || typeof entry !== 'object') return result;
        result.push(...references(entry.texture), ...references(entry.material));
        return [...new Set(result)];
    }
    function loadTextures(sourceFile, entry, fallback) {
        const refs = [];
        if (fallback) refs.push(fallback);
        refs.push(...entryTextureRefs(entry));
        const loaded = [];
        const seen = new Set();
        refs.forEach(ref => {
            if (!ref || seen.has(ref)) return;
            seen.add(ref);
            const texture = addTexture(resolveResource(sourceFile, ref, 'texture'));
            if (texture) loaded.push(texture);
        });
        return loaded;
    }
    function textureFor(sourceFile, entry, fallback) {
        const textures = loadTextures(sourceFile, entry, fallback);
        return textures[0] || null;
    }
    function ensureProject() {
        if (typeof setupProject === 'function' && typeof Format !== 'undefined' && Format !== NMTM_FORMAT) setupProject(NMTM_FORMAT);
        if (typeof Project !== 'undefined') {
            Project.name = Project.name || 'nmtm_model';
            Project.texture_width = Project.texture_width || 64;
            Project.texture_height = Project.texture_height || 64;
        }
    }
    function vector(value, fallback) {
        const source = Array.isArray(value) ? value : fallback || [0, 0, 0];
        return source.slice(0, 3).map(item => Number(item) || 0).concat([0, 0, 0]).slice(0, 3);
    }
    function meshUV(value, width, height) {
        // NetEase mesh UVs are normalized coordinates with a top-left origin.
        // MeshFace stores pixel coordinates in that same orientation; the
        // Blockbench renderer performs the GPU V flip itself, so do not flip V
        // here as well.
        const u = Number(value && value[0]);
        const v = Number(value && value[1]);
        return [
            (Number.isFinite(u) ? u : 0) * width,
            (Number.isFinite(v) ? v : 0) * height
        ];
    }
    function quaternionArray(value) {
        const q = (Array.isArray(value) ? value : [0, 0, 0, 1]).slice(0, 4).map(item => Number(item) || 0);
        while (q.length < 4) q.push(q.length === 3 ? 1 : 0);
        const length = Math.hypot(q[0], q[1], q[2], q[3]);
        if (!Number.isFinite(length) || length < 1e-12) return [0, 0, 0, 1];
        for (let index = 0; index < 4; index++) q[index] /= length;
        return q;
    }
    function quaternionEuler(value) {
        const q = quaternionArray(value);
        if (typeof THREE === 'undefined') return [0, 0, 0];
        // ArmatureBone.preview_controller applies rotation values using the
        // active format's Euler order. Convert with that same order or the
        // values will be interpreted as a different orientation at runtime.
        const order = typeof Format !== 'undefined' && Format.euler_order ? Format.euler_order : 'XYZ';
        const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(q[0], q[1], q[2], q[3]), order);
        return [Math.radToDeg(e.x), Math.radToDeg(e.y), Math.radToDeg(e.z)];
    }
    function quaternionDeltaEuler(value, restValue) {
        if (typeof THREE === 'undefined') return quaternionEuler(value);
        const frame = new THREE.Quaternion(...quaternionArray(value)).normalize();
        const rest = new THREE.Quaternion(...quaternionArray(restValue)).normalize();
        const delta = rest.clone().invert().multiply(frame).normalize();
        return quaternionEuler(delta.toArray());
    }
    function geometryRoot(data) {
        if (!data || typeof data !== 'object') return null;
        const key = Object.keys(data).find(item => item.startsWith('geometry.'));
        return key && data[key] && Array.isArray(data[key].bones) ? { name: key.slice(9), value: data[key] } : null;
    }
    function isIndex(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
        return Object.values(data).some(item => item && typeof item === 'object' && (item.mesh || item.skeleton || item.mesh_fb));
    }
    function isCustom(data) { return !!(data && typeof data === 'object' && (data.mesh || data.skeleton || data.animation)); }

    const RIG_PROPERTIES = [];
    const RIG_LISTENERS = [];
    let rigRotationOriginal = null;
    let rigRotationWrapper = null;
    function normalizedSkeleton(data) {
        const records = Array.isArray(data && data.skeleton) ? data.skeleton : [];
        const expanded = records.map(record => {
            if (!Array.isArray(record)) return record;
            if (record.length !== 24) throw new Error('Unsupported compact NetEase skeleton record.');
            const parent = typeof record[1] === 'number' && records[record[1]] ? records[record[1]][0] : record[1];
            return {name: record[0], parent, initpos: record.slice(2, 5), initquaternion: record.slice(5, 9),
                initscale: record.slice(9, 12), offmtx: [record.slice(12, 16), record.slice(16, 20), record.slice(20, 24)]};
        });
        const names = new Map();
        expanded.forEach(record => {
            if (!record || !record.name || names.has(String(record.name))) throw new Error('Missing or duplicate bone name: ' + (record && record.name));
            names.set(String(record.name), record);
            for (const [field, count] of [['initpos', 3], ['initquaternion', 4], ['initscale', 3]]) {
                if (record[field] && (!Array.isArray(record[field]) || record[field].length !== count || !record[field].every(Number.isFinite))) throw new Error('Invalid ' + field + ' in bone ' + record.name);
            }
            if (record.initscale && record.initscale.some(value => Math.abs(value) < 1e-12)) throw new Error('Zero rest scale in bone ' + record.name);
            sourceInverseBind(record);
        });
        const complete = new Set(), active = new Set();
        const visit = record => {
            if (complete.has(record.name)) return;
            if (active.has(record.name)) throw new Error('Cyclic bone hierarchy at ' + record.name);
            active.add(record.name);
            const parent = record.parent && String(record.parent);
            if (parent && parent !== String(record.name)) {
                if (!names.has(parent)) throw new Error('Unknown parent bone ' + parent + ' for ' + record.name);
                visit(names.get(parent));
            }
            active.delete(record.name); complete.add(record.name);
        };
        expanded.forEach(visit);
        return Object.assign({}, data, {skeleton: expanded});
    }
    function sourceInverseBind(record) {
        if (!record || record.offmtx === undefined || record.offmtx === null) return null;
        const values = Array.isArray(record.offmtx) ? record.offmtx.flat() : [];
        if (values.length !== 12 && values.length !== 16) throw new Error('Invalid inverse bind matrix in bone ' + record.name + ': expected 12 or 16 values.');
        if (!values.every(Number.isFinite)) throw new Error('Non-finite inverse bind matrix in bone ' + record.name);
        const matrix = new THREE.Matrix4().set(...(values.length === 12 ? values.concat([0, 0, 0, 1]) : values));
        if (Math.abs(matrix.determinant()) < 1e-12) throw new Error('Singular inverse bind matrix in bone ' + record.name);
        return matrix;
    }
    function applyRigRestTransform(bone) {
        if (!bone || !bone.nmtm_binding || !bone.nmtm_binding.enabled || !bone.scene_object) return;
        const object = bone.scene_object;
        object.scale.fromArray(bone.nmtm_rest_scale || [1, 1, 1]);
        object.updateMatrixWorld(true);
        const inverse = sourceInverseBind(bone.nmtm_binding);
        if (inverse) object.inverse_bind_matrix.copy(inverse);
        else {
            const armature = bone.getArmature();
            object.inverse_bind_matrix.copy(armature.scene_object.matrixWorld).invert().multiply(object.matrixWorld).invert();
        }
    }
    function installRigSupport() {
        if (RIG_LISTENERS.length || typeof ArmatureBone === 'undefined' || !ArmatureBone.preview_controller) return;
        if (typeof Property === 'function') {
            for (const [type, name, defaults] of [
                ['object', 'nmtm_binding', {}], ['vector', 'nmtm_rest_position', [0, 0, 0]],
                ['array', 'nmtm_rest_quaternion', [0, 0, 0, 1]], ['vector', 'nmtm_rest_scale', [1, 1, 1]]
            ]) RIG_PROPERTIES.push(new Property(ArmatureBone, type, name, {default: defaults}));
            for (const [type, name] of [['object', 'nmtm_source_section'], ['object', 'nmtm_skeleton_data'], ['string', 'nmtm_model_name']]) {
                RIG_PROPERTIES.push(new Property(Mesh, type, name));
            }
        }
        const listen = (target, event, callback) => {
            target.on(event, callback);
            RIG_LISTENERS.push(() => target.removeListener(event, callback));
        };
        listen(ArmatureBone.preview_controller, 'update_transform', ({element}) => applyRigRestTransform(element));
        listen(Blockbench, 'display_default_pose', ({reduced_updates}) => {
            const bones = ArmatureBone.all.filter(b => b.nmtm_binding && b.nmtm_binding.enabled);
            bones.forEach(applyRigRestTransform);
            if (bones.length && !reduced_updates && typeof Animator !== 'undefined') Animator.displayMeshDeformation();
        });
        const prototype = ArmatureBone.animator && ArmatureBone.animator.prototype;
        if (prototype) {
            rigRotationOriginal = prototype.displayRotation;
            rigRotationWrapper = function (values, multiplier = 1) {
                const bone = this.getElement();
                if (!bone || !bone.nmtm_binding || !bone.nmtm_binding.enabled) return rigRotationOriginal.call(this, values, multiplier);
                this.group = bone;
                if (values) {
                    let delta;
                    if (values.length === 4) {
                        delta = new THREE.Quaternion(...values).normalize();
                    } else {
                        const radians = values.map(v => Math.degToRad(v));
                        const useQuaternions = Format.per_animator_rotation_interpolation ? this.quaternion_interpolation : Format.quaternion_interpolation;
                        const fix = bone.scene_object.fix_rotation;
                        // BoneAnimator.interpolate returns absolute Euler minus
                        // the rest Euler after quaternion slerp. Reconstruct its
                        // absolute quaternion before deriving the local delta.
                        if (useQuaternions && fix) {
                            delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(
                                radians[0] + fix.x, radians[1] + fix.y, radians[2] + fix.z, Format.euler_order));
                            delta.premultiply(new THREE.Quaternion().setFromEuler(fix).invert()).normalize();
                        } else {
                            delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(...radians, Format.euler_order));
                        }
                    }
                    if (multiplier !== 1) delta.slerpQuaternions(new THREE.Quaternion(), delta.clone(), multiplier);
                    bone.scene_object.quaternion.multiply(delta).normalize();
                }
                return this;
            };
            prototype.displayRotation = rigRotationWrapper;
        }
    }
    function createRig(skeletonData, modelName) {
        if (typeof Armature === 'undefined' || typeof ArmatureBone === 'undefined') throw new Error('Armature API is unavailable in this Blockbench build.');
        installRigSupport();
        skeletonData = normalizedSkeleton(skeletonData);
        const armature = new Armature({ name: (modelName || 'NeteaseModel') + '_Armature' }).addTo().init();
        armature.isOpen = true;
        const records = Array.isArray(skeletonData && skeletonData.skeleton) ? skeletonData.skeleton : [];
        const map = Object.create(null);
        const makeBone = (record, fallbackName) => {
            const restPosition = vector(record.initpos || record.pos);
            const restQuaternion = quaternionArray(record.initquaternion || record.quaternion);
            const restScale = vector(record.initscale, [1, 1, 1]);
            const bone = new ArmatureBone({ name: String(record.name || fallbackName), origin: restPosition, rotation: quaternionEuler(restQuaternion), length: 1, width: 0.5, connected: false });
            // Keep source-space bind data for converting absolute animation tracks
            // into Blockbench's additive position/rotation channels.
            bone.nmtm_rest_position = restPosition.slice();
            bone.nmtm_rest_quaternion = restQuaternion.slice();
            bone.nmtm_rest_scale = restScale.slice();
            bone.nmtm_binding = {enabled: true, name: String(record.name || fallbackName), offmtx: record.offmtx ? JSON.parse(JSON.stringify(record.offmtx)) : null};
            return bone;
        };
        const pending = records.slice();
        let guard = 0;
        while (pending.length && guard++ < records.length * 3 + 3) {
            const record = pending.shift();
            const name = String(record.name || 'bone_' + guard);
            const parentName = record.parent && record.parent !== name ? String(record.parent) : null;
            if (parentName && !map[parentName]) { pending.push(record); continue; }
            const bone = makeBone(record, name);
            bone.addTo(parentName && map[parentName] ? map[parentName] : armature).init();
            map[name] = bone;
        }
        pending.forEach(record => {
            const name = String(record.name || 'bone_' + (++guard));
            const bone = makeBone(record, name);
            bone.addTo(armature).init();
            map[name] = bone;
        });
        if (typeof THREE !== 'undefined') Object.values(map).forEach(bone => {
            const child = bone.children && bone.children[0];
            if (child) bone.length = Math.max(0.1, new THREE.Vector3().fromArray(child.origin).length());
        });
        return { armature, bones: map };
    }

    function keyframes(track) { return Array.isArray(track && track.keyframes) ? track.keyframes : (Array.isArray(track && track.keyFrames) ? track.keyFrames : []); }
    function addAnimation(data, fallbackName, boneMap) {
        const raw = data && data.animation && !data.tracks ? data.animation : data;
        if (!raw || !Array.isArray(raw.tracks) || !raw.tracks.length || typeof Animation === 'undefined' || typeof BoneAnimator === 'undefined') return null;
        const animation = new Animation({ name: raw.name || fallbackName || 'animation', length: Number(raw.length || raw.duration || 0), loop: raw.loop ? 'loop' : 'once' }).add();
        let used = 0;
        raw.tracks.forEach(track => {
            const bone = boneMap[track.bone] || Object.values(boneMap).find(item => item.name === track.bone);
            if (!bone) return;
            const animator = typeof animation.getBoneAnimator === 'function'
                ? animation.getBoneAnimator(bone)
                : new BoneAnimator(bone.uuid, animation, bone.name);
            if (!animator) return;
            animator.quaternion_interpolation = true;
            // ArmatureBoneAnimator inherits Blockbench's keyframe interpolation,
            // which expects the animated element through both aliases.
            animator.element = bone;
            animator.group = bone;
            animation.animators[bone.uuid] = animator;
            const maskValue = track.chanelMask !== undefined ? track.chanelMask : track.channelMask;
            const mask = maskValue === undefined || maskValue === null ? null : Number(maskValue);
            const channelEnabled = bit => mask === null || !Number.isFinite(mask) || (mask & bit) !== 0;
            keyframes(track).forEach(frame => {
                const time = Number(frame.time || 0);
                if (channelEnabled(1) && Array.isArray(frame.pos) && frame.pos.length >= 3) {
                    const absolute = vector(frame.pos);
                    const rest = bone.nmtm_rest_position || bone.origin || [0, 0, 0];
                    const v = absolute.map((item, index) => item - (Number(rest[index]) || 0));
                    animator.addKeyframe({ time, channel: 'position', data_points: [{ x: v[0], y: v[1], z: v[2] }] });
                    used++;
                }
                if (channelEnabled(2) && Array.isArray(frame.quaternion) && frame.quaternion.length >= 4) {
                    const r = quaternionDeltaEuler(frame.quaternion, bone.nmtm_rest_quaternion);
                    animator.addKeyframe({ time, channel: 'rotation', data_points: [{ x: r[0], y: r[1], z: r[2] }] });
                    used++;
                } else if (channelEnabled(2) && Array.isArray(frame.rotation) && frame.rotation.length >= 3) {
                    const absolute = new THREE.Quaternion().setFromEuler(new THREE.Euler(...vector(frame.rotation).map(v => Math.degToRad(v)), Format.euler_order));
                    const r = quaternionDeltaEuler(absolute.toArray(), bone.nmtm_rest_quaternion);
                    animator.addKeyframe({ time, channel: 'rotation', data_points: [{ x: r[0], y: r[1], z: r[2] }] });
                    used++;
                }
                if (channelEnabled(4) && Array.isArray(frame.scale) && frame.scale.length >= 3) {
                    const sourceScale = vector(frame.scale, [1, 1, 1]);
                    const restScale = bone.nmtm_rest_scale || [1, 1, 1];
                    const s = sourceScale.map((item, index) => Math.abs(Number(restScale[index])) > 1e-8 ? item / Number(restScale[index]) : item);
                    animator.addKeyframe({ time, channel: 'scale', data_points: [{ x: s[0], y: s[1], z: s[2] }] });
                    used++;
                }
                if (time > animation.length) animation.length = time;
            });
        });
        if (typeof animation.setLength === 'function') animation.setLength(animation.length);
        if (typeof animation.calculateSnappingFromKeyframes === 'function') animation.calculateSnappingFromKeyframes();
        if (!used) { animation.remove(); return null; }
        return animation;
    }

    function importCustom(meshData, skeletonData, animationList, sourceFile, modelName, variant) {
        if (!skeletonData || !Array.isArray(skeletonData.skeleton) || !skeletonData.skeleton.length) {
            throw new Error('NMTM cannot import a skinned mesh without its matching skeleton JSON. Select the index entry or place the *_skeleton.json beside the mesh.');
        }
        skeletonData = normalizedSkeleton(skeletonData);
        const names = new Set(skeletonData.skeleton.map(record => String(record.name)));
        // Validate before creating any editor objects, so a bad pair does not
        // leave a half-imported armature or silently drop skin influences.
        for (const section of meshData && meshData.mesh || []) for (const vertex of section.vertices || []) {
            const influences = new Set();
            for (const pair of vertex.weight || []) {
                const name = String(pair && pair[0]), weight = Number(pair && pair[1]);
                if (!names.has(name)) throw new Error('NMTM mesh references missing bone "' + name + '".');
                if (!Number.isFinite(weight) || weight < 0) throw new Error('Invalid skin weight for bone ' + name);
                if (weight > 0) influences.add(name);
            }
            if (!influences.size) throw new Error('NMTM vertex has no positive skin weight.');
            if (influences.size > 4) throw new Error('More than four bone influences per vertex are not supported by this Blockbench build.');
        }
        ensureProject();
        const rig = createRig(skeletonData, modelName || 'NeteaseModel');
        const refs = entryTextureRefs(variant || {});
        const fallback = textureFor(sourceFile, variant || {}, refs[0]);
        loadTextures(sourceFile, variant || {}, refs[0]);
        let sections = 0;
        (Array.isArray(meshData && meshData.mesh) ? meshData.mesh : []).forEach(section => {
            const vertices = Array.isArray(section.vertices) ? section.vertices : [];
            if (!vertices.length) return;
            const texture = textureFor(sourceFile, section, refs[0]) || fallback;
            loadTextures(sourceFile, section, refs[0]);
            const dimensions = texture && (texture.nmtm_size || pngSize(texture.nmtm_source_path));
            const width = dimensions ? dimensions.width : (Project.texture_width || 64);
            const height = dimensions ? dimensions.height : (Project.texture_height || 64);
            const mesh = new Mesh({ name: (modelName || 'model') + '_Mesh_' + sections });
            mesh.vertices = {};
            mesh.faces = {};
            mesh.nmtm_source_section = section;
            mesh.nmtm_skeleton_data = skeletonData || null;
            mesh.nmtm_bones = rig.bones;
            mesh.nmtm_model_name = String(modelName || 'model');
            mesh.addTo(rig.armature).init();
            const keys = mesh.addVertices(...vertices.map(item => vector(item.pos)));
            vertices.forEach((item, vertexIndex) => {
                const weights = Array.isArray(item.weight) ? item.weight : [];
                const combined = new Map();
                weights.forEach(pair => {
                    const boneName = String(pair && pair[0]);
                    const weight = Number(pair && pair[1]);
                    if (!rig.bones[boneName]) throw new Error('NMTM mesh references missing bone \"' + boneName + '\" at section ' + sections + ', vertex ' + vertexIndex + '.');
                    if (Number.isFinite(weight) && weight > 0) combined.set(boneName, (combined.get(boneName) || 0) + weight);
                });
                const total = Array.from(combined.values()).reduce((sum, weight) => sum + weight, 0);
                if (weights.length && total <= 1e-12) throw new Error('NMTM vertex has no positive skin weight at section ' + sections + ', vertex ' + vertexIndex + '.');
                combined.forEach((weight, boneName) => rig.bones[boneName].setVertexWeight(mesh, keys[vertexIndex], weight / total));
            });
            (Array.isArray(section.indices) ? section.indices : []).forEach(indices => {
                if (!Array.isArray(indices) || indices.length < 3) return;
                const selected = indices.slice(0, 4).filter(index => Number.isInteger(index) && keys[index]);
                if (selected.length < 3) return;
                const uv = {};
                selected.forEach(index => { const value = Array.isArray(vertices[index].uvcoord) ? vertices[index].uvcoord : [0, 0]; uv[keys[index]] = meshUV(value, width, height); });
                const face = new MeshFace(mesh, { vertices: selected.map(index => keys[index]), uv });
                if (texture) face.texture = texture.uuid;
                mesh.addFaces(face);
            });
            mesh.init();
            mesh.sortAllFaceVertices();
            sections++;
        });
        (animationList || []).forEach(item => addAnimation(item.data || item, item.name || item.key, rig.bones));
        if (typeof Canvas !== 'undefined') { Canvas.updateAllBones(); Canvas.updateView({ elements: Mesh.all.concat(ArmatureBone.all), element_aspects: { geometry: true, faces: true, transform: true } }); }
        runtime.lastImport = { sourceFile, modelName, armature: rig.armature, bones: rig.bones, variant };
        Project.name = modelName || Project.name;
        Project.nmtm_source = String(sourceFile || '').replace(/\\/g, '/');
        Project.nmtm_variant = variant ? JSON.parse(JSON.stringify(variant)) : null;
        notify('NMTM imported ' + sections + ' mesh section(s) and ' + Object.keys(rig.bones).length + ' bone(s)');
        return rig.armature;
    }

    function importLegacy(model, sourceFile) {
        const root = geometryRoot(model);
        if (!root) return false;
        ensureProject();
        const description = root.value.description || root.value;
        Project.name = root.name || Project.name;
        Project.texture_width = Number(description.texturewidth || description.texture_width || 64);
        Project.texture_height = Number(description.textureheight || description.texture_height || 64);
        const texture = addTexture(path ? join(path.dirname(sourceFile), root.name + '.png') : null);
        const groups = {};
        (root.value.bones || []).forEach(boneData => {
            const group = new Group({ name: boneData.name || 'bone', origin: vector(boneData.pivot), rotation: vector(boneData.rotation) }).init();
            group.isOpen = true;
            if (group.origin) group.origin[0] *= -1;
            if (group.rotation) { group.rotation[0] *= -1; group.rotation[1] *= -1; }
            group.mirror_uv = boneData.mirror === true;
            group.addTo(boneData.parent && groups[boneData.parent] ? groups[boneData.parent] : 'root');
            groups[boneData.name] = group;
            (boneData.cubes || []).forEach(cubeData => {
                try {
                    const cube = Codecs.bedrock && Codecs.bedrock.parseCube ? Codecs.bedrock.parseCube(cubeData, group, boneData) : null;
                    if (cube && texture) Object.values(cube.faces || {}).forEach(face => { face.texture = texture.uuid; });
                } catch (error) { console.warn('[NMTM] Legacy cube import failed', error); }
            });
        });
        if (typeof Canvas !== 'undefined') Canvas.updateAllBones();
        runtime.lastImport = { sourceFile, modelName: root.name, legacy: true };
        Project.nmtm_source = String(sourceFile || '').replace(/\\/g, '/');
        notify('NMTM imported legacy geometry with ' + (root.value.bones || []).length + ' bone(s)');
        return true;
    }

    function resourceStem(sourceFile) {
        if (!path || !sourceFile) return 'NeteaseModel';
        return path.basename(sourceFile)
            .replace(/\.(json|bin)$/i, '')
            .replace(/_(mesh|skeleton|animation(?:_.*)?)$/i, '');
    }
    function resourceDirectory(sourceFile, type) {
        if (!path || !sourceFile) return null;
        const dir = path.dirname(sourceFile);
        return dir.replace(/[\\/](mesh|skeleton|animation)$/i, path.sep + type);
    }
    function sibling(sourceFile, type) {
        if (!path || !sourceFile || (type !== 'mesh' && type !== 'skeleton')) return null;
        const stem = resourceStem(sourceFile);
        const targetName = stem + '_' + type + '.json';
        const targetDir = resourceDirectory(sourceFile, type);
        const candidates = [join(targetDir, targetName), join(path.dirname(sourceFile), targetName)];
        return candidates.find(fileExists) || null;
    }
    function discoveredAnimations(sourceFile) {
        if (!fs || !path || !sourceFile) return [];
        const base = resourceStem(sourceFile);
        const dir = resourceDirectory(sourceFile, 'animation');
        if (!dirExists(dir)) return [];
        const prefix = (base + '_animation_').toLowerCase();
        return fs.readdirSync(dir)
            .filter(name => name.toLowerCase().startsWith(prefix) && name.toLowerCase().endsWith('.json'))
            .sort()
            .map(name => join(dir, name));
    }
    function importCustomFile(data, sourceFile) {
        const meshPath = data.mesh ? sourceFile : sibling(sourceFile, 'mesh');
        const skeletonPath = data.skeleton ? sourceFile : sibling(sourceFile, 'skeleton');
        const meshData = data.mesh ? data : jsonFile(meshPath);
        const skeletonData = data.skeleton ? data : jsonFile(skeletonPath);
        const animations = [];
        const animationPaths = new Set();
        const pushAnimation = (value, name, filePath) => {
            const key = filePath && path ? path.normalize(filePath).toLowerCase() : null;
            if (!value || (key && animationPaths.has(key))) return;
            if (key) animationPaths.add(key);
            animations.push({ data: value, name });
        };
        if (data.animation) pushAnimation(data, data.animation.name || 'animation', sourceFile);
        discoveredAnimations(sourceFile).forEach(filePath => {
            pushAnimation(jsonFile(filePath), path.basename(filePath, '.json'), filePath);
        });
        if (!meshData && !skeletonData) { fail('This JSON is not a supported Netease resource.'); return false; }
        const name = resourceStem(sourceFile);
        return importCustom(meshData, skeletonData, animations, meshPath || sourceFile, name, null);
    }
    function importVariant(indexFile, key, entry) {
        const meshPath = resolveResource(indexFile, entry.mesh, 'model');
        const skeletonPath = resolveResource(indexFile, entry.skeleton, 'model');
        const animations = [];
        references(entry.animation).forEach(reference => { const filePath = resolveResource(indexFile, reference, 'model'); const data = jsonFile(filePath); if (data) animations.push({ data, name: path.basename(filePath, '.json') }); });
        if (!meshPath && !skeletonPath) { fail('Variant has no readable mesh or skeleton JSON: ' + key); return false; }
        return importCustom(jsonFile(meshPath), jsonFile(skeletonPath), animations, meshPath || indexFile, key, entry);
    }
    function pickVariant(data, indexFile) {
        const keys = Object.keys(data).filter(key => data[key] && typeof data[key] === 'object').sort();
        if (!keys.length) { fail('No model variants were found.'); return; }
        const options = {}; keys.forEach(key => { options[key] = key; });
        new Dialog({ id: 'nmtm_variant_picker', title: 'NMTM: Choose model variant', width: 720, form: { variant: { type: 'select', label: 'Variant', options, value: keys[0] } }, onConfirm(result) { importVariant(indexFile, result.variant, data[result.variant]); } }).show();
    }
    function parseModel(data, sourceFile) {
        if (!data || typeof data !== 'object') { fail('NMTM received empty JSON data.'); return false; }
        if (isIndex(data)) return pickVariant(data, sourceFile);
        if (geometryRoot(data)) return importLegacy(data, sourceFile);
        if (isCustom(data)) return importCustomFile(data, sourceFile);
        fail('Unsupported JSON structure. Expected geometry.*, mesh/skeleton/animation, or netease_models.json.');
        return false;
    }
    function selectedFiles(value) {
        if (Array.isArray(value)) return value.filter(Boolean);
        return value ? [value] : [];
    }
    function importIdentity(value) {
        if (!value) return null;
        const normalized = path ? path.normalize(String(value)).toLowerCase() : String(value).toLowerCase();
        return normalized.replace(/_(mesh|skeleton|animation(?:_[^\\/]+)?)\.json$/i, '');
    }
    function openJson(indexOnly) {
        Blockbench.import({ resource_id: 'nmtm_json', type: 'Netease JSON', extensions: ['json'], multiple: true }, files => {
            const selected = selectedFiles(files);
            if (!selected.length) return;
            let imported = 0;
            const seen = new Set();
            selected.forEach(file => {
                const key = importIdentity(file.path || file.name);
                if (key && seen.has(key)) return;
                if (key) seen.add(key);
                const data = typeof file.content === 'string' ? jsonText(file.content) : file.content;
                if (!data || (indexOnly && !isIndex(data))) {
                    if (indexOnly) fail('Selected JSON is not a netease_models.json index: ' + (file.path || file.name || 'unknown'));
                    return;
                }
                try {
                    ensureProject();
                    parseModel(data, file.path);
                    imported++;
                } catch (error) { fail('NMTM import failed: ' + (file.path || file.name || 'unknown'), error); }
            });
            if (selected.length > 1) notify('NMTM processed ' + imported + '/' + selected.length + ' JSON file(s)');
        });
    }
    function openBin() {
        Blockbench.import({ resource_id: 'nmtm_bin', type: 'Netease BIN', extensions: ['bin'], multiple: true }, files => {
            const selected = selectedFiles(files);
            if (!selected.length) return;
            let imported = 0;
            const seen = new Set();
            selected.forEach(file => {
                if (!file || !file.path) return;
                const companion = file.path.replace(/\.bin$/i, '.json');
                const key = importIdentity(companion);
                if (key && seen.has(key)) return;
                if (key) seen.add(key);
                const data = jsonFile(companion);
                if (data) {
                    try { parseModel(data, companion); imported++; } catch (error) { fail('NMTM import failed: ' + companion, error); }
                    notify('NMTM used the JSON companion for ' + path.basename(file.path));
                    return;
                }
                let header = 'unknown';
                try { header = fs.readFileSync(file.path).subarray(0, 32).toString('ascii').replace(/[^A-Z]/g, '') || header; } catch (_) { /* optional */ }
                fail('Raw Netease BIN has no JSON companion: ' + file.path + '. Runtime header: ' + header);
            });
            if (selected.length > 1) notify('NMTM processed ' + imported + '/' + selected.length + ' BIN file(s)');
        });
    }

    function writeTextures(fbxPath, done) {
        const textures = typeof Texture !== 'undefined' ? Texture.all.filter(item => item && item.source && !item.error) : [];
        if (!textures.length) { done(); return; }
        let remaining = textures.length;
        const finish = () => { if (--remaining <= 0) done(); };
        const dir = path ? path.dirname(fbxPath) : '';
        textures.forEach(texture => {
            let name = texture.name || 'texture.png';
            if (!/\.[A-Za-z0-9]+$/.test(name)) name += '.png';
            Blockbench.writeFile(join(dir, name), { content: texture.source, savetype: 'image' }, finish);
        });
    }
    function safeFileName(value, fallback) {
        const cleaned = String(value || fallback || 'nmtm_item')
            .toLowerCase()
            .replace(/[^a-z0-9_.-]+/g, '_')
            .replace(/^_+|_+$/g, '');
        return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : String(fallback || 'nmtm_item');
    }
    function safeNamespace(value) {
        const cleaned = String(value || 'nmtm')
            .toLowerCase()
            .replace(/[^a-z0-9_.-]+/g, '_')
            .replace(/^_+|_+$/g, '');
        return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : 'nmtm';
    }
    function safeResourcePath(value, fallback) {
        const segments = String(value || fallback || 'model')
            .replace(/\\/g, '/')
            .toLowerCase()
            .split('/')
            .map(segment => segment.replace(/[^a-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, ''))
            .filter(segment => segment && segment !== '.' && segment !== '..');
        return segments.join('/') || String(fallback || 'model');
    }
    function resourceLocation(value, defaultNamespace, defaultPath) {
        const raw = String(value || '').trim();
        const separator = raw.indexOf(':');
        const namespace = safeNamespace(separator >= 0 ? raw.slice(0, separator) : defaultNamespace);
        const resource = safeResourcePath(separator >= 0 ? raw.slice(separator + 1) : raw, defaultPath);
        return { namespace, resource, id: namespace + ':' + resource };
    }
    function selectedMeshes() {
        if (typeof Mesh === 'undefined') return [];
        const pool = Array.isArray(Mesh.all) ? Mesh.all.filter(item => item && !item.error) : [];
        const selected = pool.filter(item => item.selected);
        return selected.length ? selected : pool;
    }
    function selectedTexture() {
        if (typeof Texture === 'undefined') return null;
        if (Texture.selected && Texture.selected.source && !Texture.selected.error) return Texture.selected;
        return Texture.all.find(item => item && item.source && !item.error) || null;
    }
    function selectedMeshTexture(meshes) {
        if (typeof Texture === 'undefined') return null;
        const ids = [];
        (meshes || []).forEach(mesh => Object.values(mesh.faces || {}).forEach(face => {
            if (face && face.texture && !ids.includes(face.texture)) ids.push(face.texture);
        }));
        return ids.map(id => Texture.all.find(texture => texture && texture.uuid === id && texture.source && !texture.error)).find(Boolean)
            || selectedTexture();
    }
    function writeJsonSync(filePath, data) {
        if (!fs || !path) return false;
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8');
        return true;
    }
    function writeTextSync(filePath, content) {
        if (!fs || !path) return false;
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, String(content), 'utf8');
        return true;
    }
    function textureBuffer(texture) {
        if (!fs || !NodeBuffer || !texture) return null;
        const sourcePath = texture.nmtm_source_path || (typeof texture.source === 'string' && fileExists(texture.source) ? texture.source : null);
        if (sourcePath && fileExists(sourcePath)) return fs.readFileSync(sourcePath);
        const source = String(texture.source || '');
        const match = /^data:image\/[a-z0-9.+-]+;base64,(.+)$/i.exec(source);
        return match ? NodeBuffer.from(match[1], 'base64') : null;
    }
    function pngPaeth(left, up, upperLeft) {
        const prediction = left + up - upperLeft;
        const leftDistance = Math.abs(prediction - left);
        const upDistance = Math.abs(prediction - up);
        const upperLeftDistance = Math.abs(prediction - upperLeft);
        return leftDistance <= upDistance && leftDistance <= upperLeftDistance ? left : (upDistance <= upperLeftDistance ? up : upperLeft);
    }
    function decodePngRgba(buffer) {
        if (!NodeBuffer || !zlib || !buffer || buffer.length < 33 || buffer.readUInt32BE(0) !== 0x89504e47) {
            throw new Error('EMF texture atlasing requires readable PNG source textures.');
        }
        let cursor = 8;
        let header = null;
        let palette = null;
        let transparency = null;
        const dataChunks = [];
        while (cursor + 12 <= buffer.length) {
            const length = buffer.readUInt32BE(cursor);
            const type = buffer.toString('ascii', cursor + 4, cursor + 8);
            const dataStart = cursor + 8;
            const dataEnd = dataStart + length;
            if (dataEnd + 4 > buffer.length) throw new Error('PNG chunk extends beyond the source texture.');
            const data = buffer.subarray(dataStart, dataEnd);
            if (type === 'IHDR') header = {
                width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8],
                colorType: data[9], compression: data[10], filter: data[11], interlace: data[12]
            };
            else if (type === 'PLTE') palette = NodeBuffer.from(data);
            else if (type === 'tRNS') transparency = NodeBuffer.from(data);
            else if (type === 'IDAT') dataChunks.push(data);
            else if (type === 'IEND') break;
            cursor = dataEnd + 4;
        }
        if (!header || !header.width || !header.height || !dataChunks.length) throw new Error('PNG source texture is missing IHDR or IDAT data.');
        if (header.bitDepth !== 8 || header.compression !== 0 || header.filter !== 0 || ![0, 1].includes(header.interlace)) {
            throw new Error('EMF texture atlasing supports 8-bit PNG textures with standard or Adam7 scanlines.');
        }
        const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header.colorType];
        if (!channels) throw new Error('Unsupported PNG color type ' + header.colorType + ' for EMF texture atlas.');
        if (header.colorType === 3 && !palette) throw new Error('Indexed PNG source texture has no palette.');
        const inflated = zlib.inflateSync(NodeBuffer.concat(dataChunks));
        const raw = NodeBuffer.alloc(header.width * header.height * channels);
        const decodePass = (inputOffset, passWidth, passHeight) => {
            const rowBytes = passWidth * channels;
            const pass = NodeBuffer.alloc(rowBytes * passHeight);
            let input = inputOffset;
            for (let y = 0; y < passHeight; y++) {
                if (input >= inflated.length) throw new Error('PNG source texture has incomplete pixel data.');
                const filter = inflated[input++];
                const rowStart = y * rowBytes;
                const previousStart = (y - 1) * rowBytes;
                for (let x = 0; x < rowBytes; x++) {
                    if (input >= inflated.length) throw new Error('PNG source texture has incomplete pixel data.');
                    const encoded = inflated[input++];
                    const left = x >= channels ? pass[rowStart + x - channels] : 0;
                    const up = y > 0 ? pass[previousStart + x] : 0;
                    const upperLeft = y > 0 && x >= channels ? pass[previousStart + x - channels] : 0;
                    let value;
                    if (filter === 0) value = encoded;
                    else if (filter === 1) value = encoded + left;
                    else if (filter === 2) value = encoded + up;
                    else if (filter === 3) value = encoded + Math.floor((left + up) / 2);
                    else if (filter === 4) value = encoded + pngPaeth(left, up, upperLeft);
                    else throw new Error('Unsupported PNG scanline filter ' + filter + '.');
                    pass[rowStart + x] = value & 255;
                }
            }
            return { pass, nextInput: input };
        };
        if (header.interlace === 0) {
            const decodedPass = decodePass(0, header.width, header.height);
            decodedPass.pass.copy(raw);
        } else {
            const passes = [
                [0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4],
                [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]
            ];
            let input = 0;
            passes.forEach(([startX, startY, stepX, stepY]) => {
                const passWidth = header.width > startX ? Math.ceil((header.width - startX) / stepX) : 0;
                const passHeight = header.height > startY ? Math.ceil((header.height - startY) / stepY) : 0;
                if (!passWidth || !passHeight) return;
                const decodedPass = decodePass(input, passWidth, passHeight);
                input = decodedPass.nextInput;
                for (let y = 0; y < passHeight; y++) {
                    for (let x = 0; x < passWidth; x++) {
                        const sourcePixel = (y * passWidth + x) * channels;
                        const targetPixel = ((startY + y * stepY) * header.width + startX + x * stepX) * channels;
                        decodedPass.pass.copy(raw, targetPixel, sourcePixel, sourcePixel + channels);
                    }
                }
            });
        }
        const rgba = NodeBuffer.alloc(header.width * header.height * 4);
        const transparentGray = transparency && transparency.length >= 2 ? transparency.readUInt16BE(0) & 255 : -1;
        const transparentRgb = transparency && transparency.length >= 6
            ? [transparency.readUInt16BE(0) & 255, transparency.readUInt16BE(2) & 255, transparency.readUInt16BE(4) & 255]
            : null;
        for (let pixel = 0; pixel < header.width * header.height; pixel++) {
            const source = pixel * channels;
            const target = pixel * 4;
            let red = 0, green = 0, blue = 0, alpha = 255;
            if (header.colorType === 0) {
                red = green = blue = raw[source];
                if (red === transparentGray) alpha = 0;
            } else if (header.colorType === 2) {
                red = raw[source]; green = raw[source + 1]; blue = raw[source + 2];
                if (transparentRgb && red === transparentRgb[0] && green === transparentRgb[1] && blue === transparentRgb[2]) alpha = 0;
            } else if (header.colorType === 3) {
                const index = raw[source];
                red = palette[index * 3] || 0; green = palette[index * 3 + 1] || 0; blue = palette[index * 3 + 2] || 0;
                alpha = transparency && index < transparency.length ? transparency[index] : 255;
            } else if (header.colorType === 4) {
                red = green = blue = raw[source]; alpha = raw[source + 1];
            } else {
                red = raw[source]; green = raw[source + 1]; blue = raw[source + 2]; alpha = raw[source + 3];
            }
            rgba[target] = red; rgba[target + 1] = green; rgba[target + 2] = blue; rgba[target + 3] = alpha;
        }
        return { width: header.width, height: header.height, rgba };
    }
    let pngCrcTable = null;
    function pngCrc32(buffer) {
        if (!pngCrcTable) {
            pngCrcTable = Array.from({ length: 256 }, (_, index) => {
                let value = index;
                for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
                return value >>> 0;
            });
        }
        let crc = 0xffffffff;
        for (const byte of buffer) crc = pngCrcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
        return (crc ^ 0xffffffff) >>> 0;
    }
    function pngChunk(type, data) {
        const typeBuffer = NodeBuffer.from(type, 'ascii');
        const output = NodeBuffer.alloc(data.length + 12);
        output.writeUInt32BE(data.length, 0);
        typeBuffer.copy(output, 4);
        data.copy(output, 8);
        output.writeUInt32BE(pngCrc32(NodeBuffer.concat([typeBuffer, data])), data.length + 8);
        return output;
    }
    function encodePngRgba(width, height, rgba) {
        if (!NodeBuffer || !zlib || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || !rgba || rgba.length !== width * height * 4) {
            throw new Error('Invalid RGBA image for PNG encoding.');
        }
        const header = NodeBuffer.alloc(13);
        header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
        header[8] = 8; header[9] = 6; header[10] = 0; header[11] = 0; header[12] = 0;
        const scanlines = NodeBuffer.alloc((width * 4 + 1) * height);
        for (let y = 0; y < height; y++) rgba.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
        return NodeBuffer.concat([
            NodeBuffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
            pngChunk('IHDR', header),
            pngChunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })),
            pngChunk('IEND', NodeBuffer.alloc(0))
        ]);
    }
    function nextPowerOfTwo(value) {
        let result = 1;
        while (result < value && result < 16384) result *= 2;
        return result;
    }
    function emfTextureForMesh(mesh, fallback) {
        if (typeof Texture === 'undefined') return fallback || null;
        const ids = Object.values(mesh && mesh.faces || {}).map(face => face && face.texture).filter(Boolean);
        return ids.map(id => Texture.all.find(texture => texture && texture.uuid === id && texture.source && !texture.error)).find(Boolean) || fallback || null;
    }
    function buildEmfTextureAtlas(meshes, fallbackTexture) {
        const meshTextures = (meshes || []).map(mesh => emfTextureForMesh(mesh, fallbackTexture));
        if (meshTextures.some(texture => !texture)) throw new Error('One or more selected Mesh sections have no readable texture for the EMF atlas.');
        const unique = [];
        meshTextures.forEach(texture => { if (!unique.includes(texture)) unique.push(texture); });
        const decoded = unique.map(texture => {
            const buffer = textureBuffer(texture);
            if (!buffer) throw new Error('Could not read texture ' + (texture.name || texture.uuid || 'unknown') + ' for the EMF atlas.');
            return Object.assign({ texture }, decodePngRgba(buffer));
        });
        if (decoded.length === 1) {
            return {
                buffer: textureBuffer(decoded[0].texture), width: decoded[0].width, height: decoded[0].height,
                sourceCount: 1,
                meshRegions: meshTextures.map(() => ({ x: 0, y: 0, width: decoded[0].width, height: decoded[0].height }))
            };
        }
        const cellWidth = Math.max(...decoded.map(image => image.width));
        const cellHeight = Math.max(...decoded.map(image => image.height));
        const columns = Math.ceil(Math.sqrt(decoded.length));
        const rows = Math.ceil(decoded.length / columns);
        const width = nextPowerOfTwo(cellWidth * columns);
        const height = nextPowerOfTwo(cellHeight * rows);
        if (width > 8192 || height > 8192) throw new Error('EMF texture atlas would exceed 8192x8192 pixels. Export fewer texture variants together.');
        const rgba = NodeBuffer.alloc(width * height * 4);
        rgba.fill(0);
        const regions = new Map();
        decoded.forEach((image, index) => {
            const x = (index % columns) * cellWidth;
            const y = Math.floor(index / columns) * cellHeight;
            for (let row = 0; row < image.height; row++) {
                image.rgba.copy(rgba, ((y + row) * width + x) * 4, row * image.width * 4, (row + 1) * image.width * 4);
            }
            regions.set(image.texture, { x, y, width: image.width, height: image.height });
        });
        return {
            buffer: encodePngRgba(width, height, rgba), width, height, sourceCount: decoded.length,
            meshRegions: meshTextures.map(texture => regions.get(texture))
        };
    }
    function projectStartPath() {
        const projectPath = typeof Project !== 'undefined' && Project
            ? (Project.export_path || Project.save_path || Project.nmtm_source)
            : null;
        return projectPath && path
            ? (dirExists(projectPath) ? projectPath : path.dirname(projectPath))
            : undefined;
    }
    function versionParts(value) {
        const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(String(value || ''));
        return match ? [Number(match[1]), Number(match[2] || 0), Number(match[3] || 0)] : null;
    }
    function compareRelease(a, b) {
        const left = versionParts(a);
        const right = versionParts(b);
        if (!left || !right) return 0;
        for (let i = 0; i < 3; i++) {
            if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
        }
        return 0;
    }
    function fallbackPackFormat(id) {
        const v = versionParts(id);
        if (!v) return null;
        const [major, minor, patch] = v;
        if (major >= 26) {
            if (major === 26 && minor === 1) return { major: 84, minor: 0 };
            if (major === 26 && minor === 2) return { major: 88, minor: 0 };
            return null;
        }
        if (major !== 1) return null;
        if (minor === 8) return { major: 1, minor: 0 };
        if (minor <= 10) return { major: 2, minor: 0 };
        if (minor <= 12) return { major: 3, minor: 0 };
        if (minor <= 14) return { major: 4, minor: 0 };
        if (minor === 15 || (minor === 16 && patch <= 1)) return { major: 5, minor: 0 };
        if (minor === 16) return { major: 6, minor: 0 };
        if (minor === 17) return { major: 7, minor: 0 };
        if (minor === 18) return { major: 8, minor: 0 };
        if (minor === 19 && patch <= 2) return { major: 9, minor: 0 };
        if (minor === 19 && patch === 3) return { major: 12, minor: 0 };
        if (minor === 19 && patch === 4) return { major: 13, minor: 0 };
        if (minor === 20 && patch <= 1) return { major: 15, minor: 0 };
        if (minor === 20 && patch === 2) return { major: 18, minor: 0 };
        if (minor === 20 && patch <= 4) return { major: 22, minor: 0 };
        if (minor === 20 && patch <= 6) return { major: 32, minor: 0 };
        if (minor === 21 && patch <= 1) return { major: 34, minor: 0 };
        if (minor === 21 && patch <= 3) return { major: 42, minor: 0 };
        if (minor === 21 && patch === 4) return { major: 46, minor: 0 };
        if (minor === 21 && patch === 5) return { major: 55, minor: 0 };
        if (minor === 21 && patch === 6) return { major: 63, minor: 0 };
        if (minor === 21 && patch <= 8) return { major: 64, minor: 0 };
        if (minor === 21 && patch <= 10) return { major: 69, minor: 0 };
        if (minor === 21 && patch === 11) return { major: 75, minor: 0 };
        return null;
    }
    function fallbackVersionCatalog() {
        const ids = [
            '26.2', '26.1.2', '26.1.1', '26.1', '1.21.11', '1.21.10', '1.21.9', '1.21.8', '1.21.7',
            '1.21.6', '1.21.5', '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21', '1.20.6', '1.20.5',
            '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20', '1.19.4', '1.19.3', '1.19.2', '1.19.1',
            '1.19', '1.18.2', '1.18.1', '1.18', '1.17.1', '1.17', '1.16.5', '1.16.4', '1.16.3',
            '1.16.2', '1.16.1', '1.16', '1.15.2', '1.15.1', '1.15', '1.14.4', '1.14.3', '1.14.2',
            '1.14.1', '1.14', '1.13.2', '1.13.1', '1.13', '1.12.2', '1.12.1', '1.12', '1.11.2',
            '1.11.1', '1.11', '1.10.2', '1.10.1', '1.10', '1.9.4', '1.9.3', '1.9.2', '1.9.1', '1.9',
            '1.8.9', '1.8.8'
        ];
        return {
            schema: 1,
            fetched_at: 0,
            source: 'built-in',
            latest: { release: ids[0], snapshot: null },
            versions: ids.map(id => Object.assign({ id, type: 'release', releaseTime: null }, fallbackPackFormat(id)))
        };
    }
    function pluginRecord() {
        if (typeof Plugins === 'undefined' || !Plugins.registered) return null;
        const key = Object.keys(Plugins.registered).find(id => id.toLowerCase() === PLUGIN_ID);
        return key ? Plugins.registered[key] : null;
    }
    function workspaceRootFromSource() {
        if (!path || typeof Project === 'undefined' || !Project || !Project.nmtm_source) return null;
        let cursor = path.dirname(Project.nmtm_source);
        for (let depth = 0; depth < 24; depth++) {
            if (fileExists(join(cursor, 'nmtm.js'))) return cursor;
            const parent = path.dirname(cursor);
            if (parent === cursor) break;
            cursor = parent;
        }
        return null;
    }
    function defaultVersionCacheDirectory() {
        if (!path) return null;
        try {
            const stored = typeof localStorage !== 'undefined' && localStorage.getItem('nmtm_version_cache_directory');
            if (stored) return stored;
        } catch (_) { /* optional preference */ }
        const record = pluginRecord();
        const pluginPath = record && record.path;
        if (pluginPath && /^[A-Za-z]:[\\/]/.test(pluginPath) && !/^c:/i.test(pluginPath)) {
            return join(path.dirname(pluginPath), 'output', 'nmtm-cache');
        }
        const source = typeof Project !== 'undefined' && Project && Project.nmtm_source;
        if (source && /^[A-Za-z]:[\\/]/.test(source) && !/^c:/i.test(source)) {
            const workspace = workspaceRootFromSource();
            if (workspace) return join(workspace, 'output', 'nmtm-cache');
            return join(path.parse(source).root, 'NMTM-Cache');
        }
        return null;
    }
    function versionCacheFile() {
        const directory = runtime.versionCacheDirectory || defaultVersionCacheDirectory();
        return directory ? join(directory, 'minecraft_versions.json') : null;
    }
    function readVersionCache() {
        const filePath = versionCacheFile();
        if (!fileExists(filePath)) return null;
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return data && data.schema === 1 && Array.isArray(data.versions) ? data : null;
        } catch (error) {
            console.warn('[NMTM] Ignoring invalid version cache', error);
            return null;
        }
    }
    function writeVersionCache(data) {
        const filePath = versionCacheFile();
        if (!filePath || !fs || !path) return false;
        const content = JSON.stringify(data);
        if (NodeBuffer && NodeBuffer.byteLength(content, 'utf8') > VERSION_CACHE_LIMIT) throw new Error('Version cache exceeded 1 MiB.');
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        const tempPath = filePath + '.new';
        fs.writeFileSync(tempPath, content, 'utf8');
        JSON.parse(fs.readFileSync(tempPath, 'utf8'));
        fs.copyFileSync(tempPath, filePath);
        fs.unlinkSync(tempPath);
        return true;
    }
    async function fetchJson(url) {
        if (typeof fetch !== 'function') throw new Error('Network fetch is unavailable in this Blockbench build.');
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeout = setTimeout(() => { if (controller) controller.abort(); }, 10000);
        try {
            const response = await fetch(url, { cache: 'no-store', signal: controller ? controller.signal : undefined });
            if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + url);
            return await response.json();
        } finally {
            clearTimeout(timeout);
        }
    }
    function buildVersionCatalog(manifest, mcmeta) {
        const metaById = new Map((Array.isArray(mcmeta) ? mcmeta : []).map(item => [item.id, item]));
        const versions = (manifest.versions || []).map(item => {
            const meta = metaById.get(item.id);
            const verified = meta && (!meta.sha1 || !item.sha1 || meta.sha1 === item.sha1);
            const fallback = item.type === 'release' ? fallbackPackFormat(item.id) : null;
            const format = verified && Number.isFinite(Number(meta.resource_pack_version))
                ? { major: Number(meta.resource_pack_version), minor: Number(meta.resource_pack_version_minor) || 0 }
                : fallback;
            return format ? {
                id: item.id,
                type: item.type,
                releaseTime: item.releaseTime,
                sha1: item.sha1,
                dataVersion: verified ? Number(meta.data_version) || null : null,
                protocolVersion: verified ? Number(meta.protocol_version) || null : null,
                major: format.major,
                minor: format.minor
            } : null;
        }).filter(Boolean);
        if (!versions.length) throw new Error('The online manifests contained no usable resource-pack versions.');
        return { schema: 1, fetched_at: Date.now(), source: 'online', latest: manifest.latest || {}, versions };
    }
    async function refreshVersionCatalog(showResult) {
        const [manifest, mcmeta] = await Promise.all([fetchJson(VERSION_MANIFEST_URL), fetchJson(MCMETA_VERSIONS_URL)]);
        const catalog = buildVersionCatalog(manifest, mcmeta);
        runtime.versionCatalog = catalog;
        writeVersionCache(catalog);
        if (showResult) notify('NMTM cached ' + catalog.versions.length + ' Minecraft versions at ' + (versionCacheFile() || 'memory only'));
        return catalog;
    }
    async function getVersionCatalog(refreshStale) {
        if (!runtime.versionCatalog) runtime.versionCatalog = readVersionCache() || fallbackVersionCatalog();
        const stale = !runtime.versionCatalog.fetched_at || Date.now() - runtime.versionCatalog.fetched_at > VERSION_CACHE_TTL;
        if (refreshStale && stale) {
            notify('NMTM is refreshing the Minecraft version list...');
            try { await refreshVersionCatalog(false); }
            catch (error) {
                console.warn('[NMTM] Version refresh failed; using cached data', error);
                notify('NMTM could not refresh versions; using the last valid list.');
            }
        }
        return runtime.versionCatalog;
    }
    async function refreshMinecraftVersions() {
        try {
            if (!versionCacheFile()) {
                const selected = chooseFolder(projectStartPath());
                if (!selected) return;
                runtime.versionCacheDirectory = selected;
                try { localStorage.setItem('nmtm_version_cache_directory', selected); } catch (_) { /* optional preference */ }
            }
            await refreshVersionCatalog(true);
        } catch (error) { fail('Could not refresh the Minecraft version list.', error); }
    }
    function setVersionCacheFolder() {
        const selected = chooseFolder(runtime.versionCacheDirectory || defaultVersionCacheDirectory() || projectStartPath());
        if (!selected) return;
        runtime.versionCacheDirectory = selected;
        runtime.versionCatalog = null;
        try { localStorage.setItem('nmtm_version_cache_directory', selected); } catch (_) { /* optional preference */ }
        notify('NMTM version cache folder: ' + selected);
    }
    function chooseFolder(defaultPath, resourceId, title) {
        try {
            if (typeof Filesystem === 'undefined' || typeof Filesystem.pickDirectory !== 'function') {
                fail('This Blockbench build does not provide a folder picker.');
                return null;
            }
            return Filesystem.pickDirectory({
                title: title || 'NMTM: Select output folder',
                startpath: defaultPath || undefined,
                resource_id: resourceId || 'nmtm_output_folder'
            });
        } catch (error) {
            console.warn('[NMTM] Folder picker failed', error);
            fail('Could not open the output-folder picker.', error);
            return null;
        }
    }
    function packFormatValue(version) {
        return Number(version.minor) ? [Number(version.major), Number(version.minor)] : Number(version.major);
    }
    function packMetadata(version, description) {
        const value = packFormatValue(version);
        return Number(version.major) >= 65
            ? { pack: { min_format: Array.isArray(value) ? value : [value, 0], max_format: Array.isArray(value) ? value : [value, 0], description } }
            : { pack: { pack_format: value, description } };
    }
    function itemModelEra(version) {
        if (Number(version.major) >= 46) return 'item_definition';
        if (Number(version.major) >= 32) return 'component_cmd';
        if (version.type === 'release' && compareRelease(version.id, '1.14') >= 0) return 'legacy_cmd';
        if (version.type !== 'release' && Number(version.major) >= 4 && Date.parse(version.releaseTime || 0) >= Date.parse('2019-04-23T00:00:00Z')) return 'legacy_cmd';
        return 'replace_item';
    }
    function textureFolderForVersion(version) {
        return Number(version.major) >= 4 ? 'item' : 'items';
    }
    function blockTextureFolderForVersion(version) {
        return Number(version.major) >= 4 ? 'block' : 'blocks';
    }
    function blockStateData(version, modelReference) {
        const variant = Number(version.major) >= 4 ? '' : 'normal';
        return { variants: { [variant]: { model: modelReference } } };
    }
    function versionOptions(catalog) {
        const options = {};
        const releases = catalog.versions.filter(item => item.type === 'release');
        const snapshots = catalog.versions.filter(item => item.type !== 'release');
        releases.concat(snapshots).forEach(item => {
            const format = Number(item.minor) ? item.major + '.' + item.minor : item.major;
            options[item.id] = item.id + ' - resource pack ' + format + (item.type === 'release' ? '' : ' [snapshot]');
        });
        return options;
    }
    function vanillaCompatibility() {
        const problems = [];
        const meshes = typeof Mesh !== 'undefined' && Array.isArray(Mesh.all) ? Mesh.all : [];
        const cubes = typeof Cube !== 'undefined' && Array.isArray(Cube.all) ? Cube.all : [];
        const animations = typeof Animation !== 'undefined' && Array.isArray(Animation.all) ? Animation.all : [];
        const bones = typeof ArmatureBone !== 'undefined' && Array.isArray(ArmatureBone.all) ? ArmatureBone.all : [];
        const groups = typeof Group !== 'undefined' && Array.isArray(Group.all) ? Group.all : [];
        if (meshes.length) problems.push(meshes.length + ' triangle mesh section(s)');
        if (bones.length) problems.push(bones.length + ' weighted armature bone(s)');
        if (animations.length) problems.push(animations.length + ' animation(s)');
        if (!cubes.length) problems.push('no Java-compatible cubes');
        const rotatedGroups = groups.filter(group => Array.isArray(group.rotation) && group.rotation.some(value => Math.abs(Number(value) || 0) > 0.0001));
        if (rotatedGroups.length) problems.push(rotatedGroups.length + ' rotated group transform(s)');
        const unsupportedCubes = cubes.filter(cube => {
            const rotation = Array.isArray(cube.rotation) ? cube.rotation.map(value => Number(value) || 0) : [0, 0, 0];
            const active = rotation.filter(value => Math.abs(value) > 0.0001);
            return active.length > 1 || active.some(value => ![-45, -22.5, 22.5, 45].some(allowed => Math.abs(value - allowed) < 0.0001));
        });
        if (unsupportedCubes.length) problems.push(unsupportedCubes.length + ' cube rotation(s) outside vanilla limits');
        return { compatible: problems.length === 0, problems };
    }
    function offerEmfExport(problems) {
        Blockbench.showMessageBox({
            title: 'NMTM: Java model limit',
            icon: 'warning',
            message: 'A vanilla Java item model cannot preserve this model exactly. Unsupported data: ' + problems.join(', ') + '. EMF/CEM can use strict rigid cuboids or a lossy voxel approximation for curves and irregular meshes.',
            buttons: ['Export EMF/CEM entity pack', 'dialog.cancel'],
            cancelIndex: 1
        }, result => { if (result === 0) exportEmfEntityPackPrompt(); });
    }
    function defaultItemDisplay() {
        return {
            thirdperson_righthand: { rotation: [75, 45, 0], translation: [0, 2.5, 0], scale: [0.375, 0.375, 0.375] },
            thirdperson_lefthand: { rotation: [75, 225, 0], translation: [0, 2.5, 0], scale: [0.375, 0.375, 0.375] },
            firstperson_righthand: { rotation: [0, 45, 0], translation: [0, 0, 0], scale: [0.4, 0.4, 0.4] },
            firstperson_lefthand: { rotation: [0, 225, 0], translation: [0, 0, 0], scale: [0.4, 0.4, 0.4] },
            gui: { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] },
            ground: { translation: [0, 3, 0], scale: [0.25, 0.25, 0.25] },
            fixed: { scale: [0.5, 0.5, 0.5] }
        };
    }
    function compileVanillaModel(textureReference) {
        const codec = typeof Codecs !== 'undefined' && Codecs.java_block;
        if (!codec || typeof codec.compile !== 'function') throw new Error('Blockbench Java model codec is unavailable.');
        const cubes = Cube.all || [];
        const selected = cubes.filter(cube => cube.selected);
        const exportSet = new Set(selected.length ? selected : cubes.filter(cube => cube.export !== false));
        const original = cubes.map(cube => cube.export);
        try {
            cubes.forEach(cube => { cube.export = exportSet.has(cube); });
            const model = codec.compile({
                raw: true,
                prevent_dialog: true,
                comment: false,
                parent: false,
                textures: false,
                groups: false,
                elements: true,
                display: true
            });
            if (!model || !Array.isArray(model.elements) || !model.elements.length) throw new Error('No selected Java-compatible cube elements were produced.');
            delete model.format_version;
            delete model.credit;
            model.textures = { layer0: textureReference };
            model.elements.forEach(element => Object.values(element.faces || {}).forEach(face => { face.texture = '#layer0'; }));
            if (!model.display || !Object.keys(model.display).length) model.display = defaultItemDisplay();
            return model;
        } finally {
            cubes.forEach((cube, index) => { cube.export = original[index]; });
        }
    }
    function fitJavaBlockModel(model, margin) {
        const result = JSON.parse(JSON.stringify(model));
        const elements = Array.isArray(result.elements) ? result.elements : [];
        if (!elements.length) throw new Error('The Java block model contains no elements to fit.');
        const minimum = [Infinity, Infinity, Infinity];
        const maximum = [-Infinity, -Infinity, -Infinity];
        elements.forEach(element => {
            const from = vector(element.from, [0, 0, 0]);
            const to = vector(element.to, [0, 0, 0]);
            for (let axis = 0; axis < 3; axis++) {
                minimum[axis] = Math.min(minimum[axis], from[axis], to[axis]);
                maximum[axis] = Math.max(maximum[axis], from[axis], to[axis]);
            }
        });
        const safeMargin = Math.max(0, Math.min(7.5, Number(margin) || 0));
        const available = 16 - safeMargin * 2;
        const span = maximum.map((value, axis) => value - minimum[axis]);
        const longest = Math.max(...span);
        if (!(longest > 0)) throw new Error('The Java block model has zero-size bounds.');
        const scale = available / longest;
        const center = minimum.map((value, axis) => (value + maximum[axis]) / 2);
        const transform = point => vector(point).map((value, axis) => emfRound((value - center[axis]) * scale + 8));
        elements.forEach(element => {
            const from = transform(element.from);
            const to = transform(element.to);
            element.from = from.map((value, axis) => Math.min(value, to[axis]));
            element.to = from.map((value, axis) => Math.max(value, to[axis]));
            if (element.rotation && Array.isArray(element.rotation.origin)) element.rotation.origin = transform(element.rotation.origin);
        });
        result.display = result.display && Object.keys(result.display).length ? result.display : defaultItemDisplay();
        return result;
    }
    function javaUvPixel(value, textureSize) {
        const width = Math.max(1, Number(textureSize && textureSize[0]) || 16);
        const height = Math.max(1, Number(textureSize && textureSize[1]) || 16);
        const uv = Array.isArray(value) ? value : [0, 0];
        const x = nmtmClamp(Math.floor((Number(uv[0]) || 0) * width), 0, width - 1);
        const y = nmtmClamp(Math.floor((Number(uv[1]) || 0) * height), 0, height - 1);
        return [
            emfRound(x * 16 / width),
            emfRound(y * 16 / height),
            emfRound((x + 1) * 16 / width),
            emfRound((y + 1) * 16 / height)
        ];
    }
    function nmtmBlockVoxelLimitError(message, reason) {
        const error = new Error(message);
        error.code = 'NMTM_BLOCK_VOXEL_LIMIT';
        error.reason = reason || 'element_limit';
        return error;
    }
    function nmtmBlockVoxelModel(meshes, textureReference, textureSize, resolution, maxElements, margin) {
        const sources = (meshes || []).map(mesh => ({ mesh, section: mesh && mesh.nmtm_source_section })).filter(item => item.section && Array.isArray(item.section.vertices));
        if (!sources.length) throw new Error('The selected Mesh has no original NMTM geometry metadata. Re-import its JSON before block export.');
        const points = sources.flatMap(item => item.section.vertices.map(vertex => vector(vertex.pos)));
        if (!points.length) throw new Error('The selected Mesh contains no vertices.');
        const minimum = [Infinity, Infinity, Infinity];
        const maximum = [-Infinity, -Infinity, -Infinity];
        points.forEach(point => point.forEach((value, axis) => {
            minimum[axis] = Math.min(minimum[axis], value);
            maximum[axis] = Math.max(maximum[axis], value);
        }));
        const safeMargin = Math.max(0, Math.min(7.5, Number(margin) || 0));
        const available = 16 - safeMargin * 2;
        const span = maximum.map((value, axis) => value - minimum[axis]);
        const longest = Math.max(...span);
        if (!(longest > 0)) throw new Error('The selected Mesh has zero-size bounds.');
        const fitScale = available / longest;
        const sourceCenter = minimum.map((value, axis) => (value + maximum[axis]) / 2);
        const gridResolution = Math.max(4, Math.min(64, Math.round(Number(resolution) || 16)));
        const voxelSize = available / gridResolution;
        const elementLimit = Math.max(64, Math.min(8192, Math.round(Number(maxElements) || 2048)));
        const transform = point => vector(point).map((value, axis) => (value - sourceCenter[axis]) * fitScale + 8);
        const cells = new Map();
        let sampleCount = 0;
        const sampleBudget = Math.max(32768, elementLimit * 512);
        const addSample = (point, uv) => {
            if (++sampleCount > sampleBudget) throw nmtmBlockVoxelLimitError('Block voxelization exceeded its sampling budget.', 'sample_budget');
            const cell = point.map(value => nmtmClamp(Math.floor((value - safeMargin) / voxelSize), 0, gridResolution - 1));
            const key = cell.join(':');
            const center = cell.map(value => safeMargin + (value + 0.5) * voxelSize);
            const distance = point.reduce((total, value, axis) => total + Math.pow(value - center[axis], 2), 0);
            const current = cells.get(key);
            if (!current || distance < current.distance) cells.set(key, { cell, uv, distance });
            if (cells.size > elementLimit) throw nmtmBlockVoxelLimitError('Block voxelization exceeded the ' + elementLimit + ' element limit.', 'element_limit');
        };
        sources.forEach(({ section }) => {
            nmtmFaceTriangles(section).forEach(triangle => {
                const trianglePoints = triangle.map(index => transform(section.vertices[index].pos));
                const uvs = triangle.map(index => section.vertices[index].uvcoord || [0, 0]);
                const distance = (a, b) => Math.sqrt(a.reduce((total, value, axis) => total + Math.pow(value - b[axis], 2), 0));
                const longestEdge = Math.max(distance(trianglePoints[0], trianglePoints[1]), distance(trianglePoints[1], trianglePoints[2]), distance(trianglePoints[2], trianglePoints[0]));
                const steps = Math.max(1, Math.min(256, Math.ceil(longestEdge / (voxelSize * 0.45))));
                for (let left = 0; left <= steps; left++) {
                    for (let right = 0; right <= steps - left; right++) {
                        const b = left / steps;
                        const c = right / steps;
                        const a = 1 - b - c;
                        const point = [0, 1, 2].map(axis => trianglePoints[0][axis] * a + trianglePoints[1][axis] * b + trianglePoints[2][axis] * c);
                        const uv = [0, 1].map(axis => (Number(uvs[0][axis]) || 0) * a + (Number(uvs[1][axis]) || 0) * b + (Number(uvs[2][axis]) || 0) * c);
                        addSample(point, uv);
                    }
                }
            });
        });
        if (!cells.size) throw new Error('The selected Mesh produced no block voxels.');
        const directions = {
            down: [0, -1, 0], up: [0, 1, 0], north: [0, 0, -1],
            south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0]
        };
        const hasCell = cell => cells.has(cell.join(':'));
        const elements = [];
        cells.forEach(({ cell, uv }) => {
            const from = cell.map(value => emfRound(safeMargin + value * voxelSize));
            const to = from.map(value => emfRound(value + voxelSize));
            const faces = {};
            Object.keys(directions).forEach(direction => {
                const offset = directions[direction];
                const neighbor = cell.map((value, axis) => value + offset[axis]);
                if (!hasCell(neighbor)) faces[direction] = { uv: javaUvPixel(uv, textureSize), texture: '#texture' };
            });
            if (Object.keys(faces).length) elements.push({ from, to, faces });
        });
        return {
            ambientocclusion: false,
            textures: { particle: textureReference, texture: textureReference },
            elements,
            display: defaultItemDisplay()
        };
    }
    function nmtmAdaptiveBlockVoxelModel(meshes, textureReference, textureSize, resolution, maxElements, margin, autoFit) {
        const requestedResolution = Math.max(4, Math.min(64, Math.round(Number(resolution) || 20)));
        const elementLimit = Math.max(64, Math.min(8192, Math.round(Number(maxElements) || 2048)));
        const automaticallyFit = autoFit !== false;
        let actualResolution = requestedResolution;
        let lastError = null;
        while (actualResolution >= 4) {
            try {
                const model = nmtmBlockVoxelModel(meshes, textureReference, textureSize, actualResolution, elementLimit, margin);
                return {
                    model,
                    requestedResolution,
                    actualResolution,
                    automaticallyFit,
                    adjusted: actualResolution !== requestedResolution
                };
            } catch (error) {
                lastError = error;
                if (!automaticallyFit || !error || error.code !== 'NMTM_BLOCK_VOXEL_LIMIT' || actualResolution <= 4) throw error;
                actualResolution--;
            }
        }
        throw new Error(
            'Automatic block voxel fitting could not stay under the ' + elementLimit
            + ' element limit, even at resolution 4. Export fewer selected mesh sections or raise the limit. '
            + (lastError && lastError.message ? lastError.message : '')
        );
    }
    function blockItemMapping(version, modelReference) {
        return itemModelEra(version) === 'item_definition'
            ? { model: { type: 'minecraft:model', model: modelReference } }
            : { parent: modelReference };
    }
    function blockGeometrySelection() {
        const meshes = typeof Mesh !== 'undefined' && Array.isArray(Mesh.all)
            ? Mesh.all.filter(mesh => mesh && mesh.export !== false && !mesh.error)
            : [];
        const cubes = typeof Cube !== 'undefined' && Array.isArray(Cube.all)
            ? Cube.all.filter(cube => cube && cube.export !== false)
            : [];
        const selectedMeshList = meshes.filter(mesh => mesh.selected);
        const selectedCubeList = cubes.filter(cube => cube.selected);
        if (selectedMeshList.length) return { type: 'mesh', meshes: selectedMeshList, label: 'selected Mesh sections' };
        if (selectedCubeList.length) return { type: 'cubes', cubes: selectedCubeList, label: 'selected Cubes' };
        if (meshes.length) return { type: 'mesh', meshes, label: 'all visible Mesh sections' };
        if (cubes.length) return { type: 'cubes', cubes, label: 'all visible Cubes' };
        return null;
    }
    function validateJavaBlockModelData(model) {
        const elements = model && Array.isArray(model.elements) ? model.elements : [];
        if (!elements.length) throw new Error('The generated block model contains no visible elements.');
        elements.forEach((element, index) => {
            if (![element.from, element.to].every(point => Array.isArray(point) && point.length === 3 && point.every(Number.isFinite))) {
                throw new Error('Block element ' + index + ' has invalid coordinates.');
            }
            const faces = Object.values(element.faces || {});
            if (!faces.length) throw new Error('Block element ' + index + ' has no visible faces.');
            faces.forEach(face => {
                if (face.uv && (!Array.isArray(face.uv) || face.uv.length !== 4 || !face.uv.every(Number.isFinite))) {
                    throw new Error('Block element ' + index + ' has an invalid face UV.');
                }
            });
        });
        return model;
    }
    function exportJavaBlockPack(outputRoot, catalog, initialGeometry) {
        const geometry = initialGeometry || blockGeometrySelection();
        if (!geometry) { fail('No Mesh or Cube geometry was found for the block replacement pack.'); return; }
        const texture = geometry.type === 'mesh' ? selectedMeshTexture(geometry.meshes) : selectedTexture();
        if (!texture) { fail('No texture was found for the block replacement pack.'); return; }
        const defaultModel = safeResourcePath(Project.name || 'nmtm_block', 'nmtm_block');
        const options = versionOptions(catalog);
        const defaultVersion = options[catalog.latest && catalog.latest.release] ? catalog.latest.release : Object.keys(options)[0];
        new Dialog({
            id: 'nmtm_java_block_pack',
            title: 'NMTM: Export Java block replacement pack',
            width: 760,
            form: {
                version: { type: 'select', label: 'Minecraft version', options, value: defaultVersion },
                pack: { type: 'text', label: 'Resource pack folder', value: safeFileName(defaultModel + '_diamond_block_pack') },
                description: { type: 'text', label: 'Pack description', value: 'NMTM replacement for the diamond block' },
                target_block: { type: 'text', label: 'Block to replace', value: 'minecraft:diamond_block' },
                model_namespace: { type: 'text', label: 'Model namespace', value: 'nmtm' },
                model_name: { type: 'text', label: 'Model name', value: defaultModel },
                voxel_resolution: { type: 'number', label: 'Maximum mesh voxel resolution', value: 20, min: 4, max: 64, step: 1, condition: () => geometry.type === 'mesh' },
                max_elements: { type: 'number', label: 'Maximum model elements', value: 2048, min: 64, max: 8192, step: 64, condition: () => geometry.type === 'mesh' },
                auto_voxel_fit: { type: 'checkbox', label: 'Automatically reduce resolution to fit element limit', value: true, condition: () => geometry.type === 'mesh' },
                margin: { type: 'number', label: 'Block margin', value: 0.25, min: 0, max: 7.5, step: 0.125 },
                pack_icon: { type: 'checkbox', label: 'Use square texture as pack icon', value: true }
            },
            onConfirm(result) {
                try {
                    const version = catalog.versions.find(item => item.id === result.version);
                    if (!version) throw new Error('The selected Minecraft version is missing from the version catalog.');
                    const targetBlock = resourceLocation(result.target_block, 'minecraft', 'diamond_block');
                    const modelResource = resourceLocation(result.model_name, result.model_namespace, defaultModel);
                    const packName = safeFileName(result.pack, defaultModel + '_diamond_block_pack');
                    const packRoot = join(outputRoot, packName);
                    const textureFolder = blockTextureFolderForVersion(version);
                    const modelReference = modelResource.namespace + ':block/' + modelResource.resource;
                    const textureReference = modelResource.namespace + ':' + textureFolder + '/' + modelResource.resource;
                    const textureData = textureBuffer(texture);
                    const dimensions = pngBufferSize(textureData);
                    if (!textureData || !dimensions) throw new Error('The selected texture must be readable PNG data.');

                    // Finish all expensive conversion before creating the pack on disk.
                    const voxelResult = geometry.type === 'mesh'
                        ? nmtmAdaptiveBlockVoxelModel(
                            geometry.meshes,
                            textureReference,
                            [dimensions.width, dimensions.height],
                            result.voxel_resolution,
                            result.max_elements,
                            result.margin,
                            result.auto_voxel_fit !== false
                        )
                        : null;
                    const model = validateJavaBlockModelData(voxelResult
                        ? voxelResult.model
                        : fitJavaBlockModel(compileVanillaModel(textureReference), result.margin));
                    const blockstate = blockStateData(version, modelReference);
                    const itemMapping = blockItemMapping(version, modelReference);
                    const itemDefinition = itemModelEra(version) === 'item_definition';
                    const blockstateRelative = 'assets/' + targetBlock.namespace + '/blockstates/' + targetBlock.resource + '.json';
                    const modelRelative = 'assets/' + modelResource.namespace + '/models/block/' + modelResource.resource + '.json';
                    const textureRelative = 'assets/' + modelResource.namespace + '/textures/' + textureFolder + '/' + modelResource.resource + '.png';
                    const itemRelative = itemDefinition
                        ? 'assets/' + targetBlock.namespace + '/items/' + targetBlock.resource + '.json'
                        : 'assets/' + targetBlock.namespace + '/models/item/' + targetBlock.resource + '.json';
                    const descriptor = {
                        generator: 'Netease Mesh To Modle',
                        generator_version: PLUGIN_VERSION,
                        adapter: 'vanilla_java_block_replacement',
                        minecraft_version: version.id,
                        resource_pack_format: packFormatValue(version),
                        target_block: targetBlock.id,
                        model: modelReference,
                        texture: textureReference,
                        geometry: geometry.type === 'mesh' ? 'voxel_approximation' : 'java_cubes',
                        source_selection: geometry.label,
                        element_count: model.elements.length,
                        voxel_resolution_requested: geometry.type === 'mesh' ? voxelResult.requestedResolution : null,
                        voxel_resolution: geometry.type === 'mesh' ? voxelResult.actualResolution : null,
                        voxel_resolution_auto_adjusted: geometry.type === 'mesh' ? voxelResult.adjusted : false,
                        voxel_auto_fit: geometry.type === 'mesh' ? voxelResult.automaticallyFit : false,
                        block_margin: Math.max(0, Math.min(7.5, Number(result.margin) || 0))
                    };
                    const files = [
                        ['pack.mcmeta', packMetadata(version, String(result.description || 'NMTM block replacement pack'))],
                        [blockstateRelative, blockstate],
                        [modelRelative, model],
                        [itemRelative, itemMapping],
                        ['nmtm_block_export.json', descriptor]
                    ];
                    files.forEach(([relative, data]) => writeJsonSync(join(packRoot, ...relative.split('/')), data));
                    const texturePath = join(packRoot, ...textureRelative.split('/'));
                    fs.mkdirSync(path.dirname(texturePath), { recursive: true });
                    fs.writeFileSync(texturePath, textureData);
                    writeTextSync(join(packRoot, 'NMTM-BLOCK-README.txt'), [
                        'Netease Mesh To Modle - Vanilla Java Block Replacement Pack', '',
                        'Target Minecraft: ' + version.id,
                        'Replaced block: ' + targetBlock.id,
                        'Install this folder directly inside .minecraft/resourcepacks and enable it.',
                        'Test in game: /setblock ~ ~ ~ ' + targetBlock.id,
                        'The inventory item for the same block is mapped to this model too.', '',
                        geometry.type === 'mesh'
                            ? 'Geometry: static voxel approximation at resolution ' + descriptor.voxel_resolution + (descriptor.voxel_resolution_auto_adjusted ? ' (reduced automatically from ' + descriptor.voxel_resolution_requested + ' to fit the element limit)' : '') + ' with ' + model.elements.length + ' visible elements.'
                            : 'Geometry: static Java Cube elements fitted inside the 0..16 block space.',
                        'Vanilla block collision remains the original full block and does not follow the visible model.',
                        'Vanilla block models cannot contain skeletons or skeletal animation; use FBX/Blender export when those must be preserved.',
                        'Blocks with state properties need additional variants in their blockstate JSON. The default diamond block has no state properties.'
                    ].join('\r\n'));
                    if (result.pack_icon && dimensions.width === dimensions.height) fs.writeFileSync(join(packRoot, 'pack.png'), textureData);
                    validatePackFiles(packRoot, ['pack.mcmeta', blockstateRelative, modelRelative, textureRelative, itemRelative, 'nmtm_block_export.json']);
                    notify('Java block replacement pack exported: ' + packRoot + (voxelResult && voxelResult.adjusted ? ' (voxel resolution reduced to ' + voxelResult.actualResolution + ')' : ''));
                } catch (error) {
                    fail('Could not export the Java block replacement pack.', error);
                    return false;
                }
            }
        }).show();
    }
    async function exportJavaBlockPackPrompt() {
        const geometry = blockGeometrySelection();
        if (!geometry) { fail('No Mesh or Cube geometry was found for block export.'); return; }
        const texture = geometry.type === 'mesh' ? selectedMeshTexture(geometry.meshes) : selectedTexture();
        if (!texture) { fail('No readable texture was found for block export.'); return; }
        const catalog = await getVersionCatalog(true);
        const target = chooseFolder(projectStartPath(), 'nmtm_java_block_pack', 'NMTM: Select resourcepacks folder or export folder');
        if (!target) return;
        exportJavaBlockPack(target, catalog, geometry);
    }
    function pngBufferSize(buffer) {
        return buffer && buffer.length >= 24 && buffer.readUInt32BE(0) === 0x89504e47
            ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
            : null;
    }
    function giveCommand(version, era, namespace, modelName, baseItem, customModelData) {
        if (era === 'item_definition') return '/give @s minecraft:' + baseItem + '[minecraft:item_model="' + namespace + ':' + modelName + '"]';
        if (era === 'component_cmd') return '/give @s minecraft:' + baseItem + '[minecraft:custom_model_data=' + customModelData + ']';
        if (era === 'legacy_cmd') return '/give @s minecraft:' + baseItem + '{CustomModelData:' + customModelData + '}';
        return '/give @s minecraft:' + baseItem;
    }
    function validatePackFiles(packRoot, required) {
        required.forEach(relative => {
            const filePath = join(packRoot, ...relative.split('/'));
            if (!fileExists(filePath)) throw new Error('Generated pack is missing ' + relative);
            if (/\.json$|\.mcmeta$/i.test(filePath)) JSON.parse(fs.readFileSync(filePath, 'utf8'));
        });
    }
    function exportJavaResourcePack(outputRoot, catalog) {
        const texture = selectedTexture();
        if (!texture) { fail('No texture was found for the Java resource pack.'); return; }
        const defaultModel = safeFileName(Project.name || 'nmtm_model');
        const options = versionOptions(catalog);
        const defaultVersion = options[catalog.latest && catalog.latest.release] ? catalog.latest.release : Object.keys(options)[0];
        new Dialog({
            id: 'nmtm_java_resource_pack',
            title: 'NMTM: Export complete Java resource pack',
            width: 720,
            form: {
                version: { type: 'select', label: 'Minecraft version', options, value: defaultVersion },
                pack: { type: 'text', label: 'Resource pack folder', value: safeFileName(defaultModel + '_resource_pack') },
                description: { type: 'text', label: 'Pack description', value: 'NMTM model for Minecraft Java Edition' },
                namespace: { type: 'text', label: 'Namespace', value: 'nmtm' },
                base_item: { type: 'text', label: 'Base item id', value: 'stick' },
                model_name: { type: 'text', label: 'Model name', value: defaultModel },
                custom_model_data: { type: 'number', label: 'Custom model data', value: 1, min: 1 },
                handheld: { type: 'checkbox', label: 'Base item uses handheld parent', value: false },
                pack_icon: { type: 'checkbox', label: 'Use square model texture as pack icon', value: true }
            },
            onConfirm(result) {
                try {
                    const version = catalog.versions.find(item => item.id === result.version);
                    if (!version) throw new Error('The selected Minecraft version is missing from the version catalog.');
                    const compatibility = vanillaCompatibility();
                    if (!compatibility.compatible) {
                        const strictEmf = emfCompatibility();
                        const emf = strictEmf.compatible ? strictEmf : emfCompatibility({ geometryMode: 'voxel' });
                        if (emf.compatible) offerEmfExport(emf.problems);
                        else fail('This project is not representable by a vanilla item model or EMF/CEM entity model. ' + emf.problems.join(', '));
                        return;
                    }
                    const packName = safeFileName(result.pack, defaultModel + '_resource_pack');
                    const namespace = safeNamespace(result.namespace);
                    const baseItem = safeFileName(String(result.base_item || 'stick').split(':').pop(), 'stick');
                    const modelName = safeFileName(result.model_name, defaultModel);
                    const customModelData = Math.max(1, Number(result.custom_model_data) || 1);
                    const textureFolder = textureFolderForVersion(version);
                    const textureReference = namespace + ':' + textureFolder + '/' + modelName;
                    const modelReference = namespace + ':item/' + modelName;
                    const era = itemModelEra(version);
                    const packRoot = join(outputRoot, packName);
                    const modelPath = join(packRoot, 'assets', namespace, 'models', 'item', modelName + '.json');
                    const texturePath = join(packRoot, 'assets', namespace, 'textures', textureFolder, modelName + '.png');
                    const packMetaPath = join(packRoot, 'pack.mcmeta');
                    const descriptorPath = join(packRoot, 'nmtm_export.json');
                    const textureData = textureBuffer(texture);
                    if (!textureData) throw new Error('The selected texture could not be read as PNG data.');
                    writeJsonSync(packMetaPath, packMetadata(version, String(result.description || 'NMTM resource pack')));
                    writeJsonSync(modelPath, compileVanillaModel(textureReference));
                    fs.mkdirSync(path.dirname(texturePath), { recursive: true });
                    fs.writeFileSync(texturePath, textureData);
                    const required = ['pack.mcmeta', 'assets/' + namespace + '/models/item/' + modelName + '.json', 'assets/' + namespace + '/textures/' + textureFolder + '/' + modelName + '.png'];
                    if (era === 'item_definition') {
                        const itemPath = join(packRoot, 'assets', namespace, 'items', modelName + '.json');
                        writeJsonSync(itemPath, { model: { type: 'minecraft:model', model: modelReference } });
                        required.push('assets/' + namespace + '/items/' + modelName + '.json');
                    } else {
                        const overridePath = join(packRoot, 'assets', 'minecraft', 'models', 'item', baseItem + '.json');
                        const override = era === 'replace_item'
                            ? { parent: modelReference }
                            : {
                                parent: result.handheld ? 'minecraft:item/handheld' : 'minecraft:item/generated',
                                textures: { layer0: 'minecraft:item/' + baseItem },
                                overrides: [{ predicate: { custom_model_data: customModelData }, model: modelReference }]
                            };
                        writeJsonSync(overridePath, override);
                        required.push('assets/minecraft/models/item/' + baseItem + '.json');
                    }
                    const command = giveCommand(version, era, namespace, modelName, baseItem, customModelData);
                    const descriptor = {
                        generator: 'Netease Mesh To Modle',
                        generator_version: PLUGIN_VERSION,
                        minecraft_version: version.id,
                        resource_pack_format: packFormatValue(version),
                        model_mode: era,
                        namespace,
                        model_name: modelName,
                        base_item: baseItem,
                        custom_model_data: era === 'replace_item' || era === 'item_definition' ? null : customModelData,
                        give_command: command
                    };
                    writeJsonSync(descriptorPath, descriptor);
                    writeTextSync(join(packRoot, 'NMTM-README.txt'), [
                        'Netease Mesh To Modle - Complete Java Resource Pack',
                        '',
                        'Target Minecraft: ' + version.id,
                        'Resource pack format: ' + JSON.stringify(packFormatValue(version)),
                        'Install: Place this folder directly inside .minecraft/resourcepacks and enable it.',
                        'Get the item: ' + command,
                        '',
                        era === 'replace_item' ? 'This Minecraft version has no general CustomModelData support, so the selected base item is replaced globally.' : 'This pack targets one exact Minecraft version.',
                        'If another pack also replaces minecraft:item/' + baseItem + ', merge its model overrides manually.'
                    ].join('\r\n'));
                    const dimensions = pngBufferSize(textureData);
                    if (result.pack_icon && dimensions && dimensions.width === dimensions.height) fs.writeFileSync(join(packRoot, 'pack.png'), textureData);
                    validatePackFiles(packRoot, required);
                    notify('Complete Java resource pack exported: ' + packRoot);
                } catch (error) { fail('Could not export the complete Java resource pack.', error); }
            }
        }).show();
    }
    async function exportJavaResourcePackPrompt() {
        const compatibility = vanillaCompatibility();
        if (!compatibility.compatible) {
            const strictEmf = emfCompatibility();
            const emf = strictEmf.compatible ? strictEmf : emfCompatibility({ geometryMode: 'voxel' });
            if (emf.compatible) offerEmfExport(emf.problems);
            else fail('This project is not representable by a vanilla item model or EMF/CEM entity model. ' + emf.problems.join(', '));
            return;
        }
        const catalog = await getVersionCatalog(true);
        const target = chooseFolder(projectStartPath(), 'nmtm_java_resource_pack', 'NMTM: Select resourcepacks folder or export folder');
        if (!target) return;
        exportJavaResourcePack(target, catalog);
    }
    function emfRound(value) {
        const number = Number(value) || 0;
        return Math.abs(number) < 0.000001 ? 0 : Number(number.toFixed(5));
    }
    function emfArray(value, fallback) {
        return vector(value, fallback).map(emfRound);
    }
    function emfParent(element) {
        const parent = element && element.parent;
        return parent && typeof parent === 'object' ? parent : null;
    }
    function emfGroupOrigin(group) {
        return emfArray(group && group.origin, [0, 0, 0]);
    }
    function emfGroupRotation(group) {
        return emfArray(group && group.rotation, [0, 0, 0]);
    }
    function emfGroupScale(group) {
        return emfArray(group && group.scale, [1, 1, 1]);
    }
    function emfGroupsForCubes(cubes) {
        const groups = new Set();
        cubes.forEach(element => {
            let parent = emfParent(element);
            let guard = 0;
            while (parent && guard++ < 256) {
                if (typeof Group !== 'undefined' && parent instanceof Group) groups.add(parent);
                parent = emfParent(parent);
            }
        });
        return groups;
    }
    function emfCubeTextureIds(cubes) {
        const ids = new Set();
        cubes.forEach(cube => Object.values(cube.faces || {}).forEach(face => {
            if (face && face.texture) ids.add(face.texture);
        }));
        return [...ids];
    }
    function emfTexturesForCubes(cubes) {
        if (typeof Texture === 'undefined') return [];
        return emfCubeTextureIds(cubes)
            .map(id => Texture.all.find(texture => texture && texture.uuid === id && texture.source && !texture.error))
            .filter(Boolean);
    }
    function nmtmPositionKey(value) {
        return vector(value).map(number => Math.round(number * 100000)).join(',');
    }
    function nmtmSectionComponents(section) {
        const vertices = Array.isArray(section && section.vertices) ? section.vertices : [];
        const faces = (Array.isArray(section && section.indices) ? section.indices : [])
            .filter(face => Array.isArray(face) && face.length >= 3)
            .map(face => face.filter(index => Number.isInteger(index) && vertices[index]).slice(0, 4))
            .filter(face => face.length >= 3);
        const keys = vertices.map(vertex => nmtmPositionKey(vertex.pos));
        if (faces.length && faces.length % 12 === 0 && faces.every(face => face.length === 3)) {
            const sequential = [];
            for (let offset = 0; offset < faces.length; offset += 12) {
                const componentFaces = faces.slice(offset, offset + 12);
                const vertexIndices = [...new Set(componentFaces.flat())];
                const positions = new Set(vertexIndices.map(index => keys[index]));
                sequential.push({ positions, faces: componentFaces, vertexIndices });
            }
            // NetEase commonly writes each cuboid as twelve consecutive triangles.
            // Prefer those source boundaries so touching boxes do not merge by position.
            if (sequential.every(component => component.positions.size === 8)) return sequential;
        }
        const adjacency = new Map(keys.map(key => [key, new Set()]));
        faces.forEach(face => {
            for (let left = 0; left < face.length; left++) {
                for (let right = left + 1; right < face.length; right++) {
                    const a = keys[face[left]];
                    const b = keys[face[right]];
                    if (!a || !b || a === b) continue;
                    adjacency.get(a).add(b);
                    adjacency.get(b).add(a);
                }
            }
        });
        const seen = new Set();
        const components = [];
        adjacency.forEach((_, start) => {
            if (seen.has(start)) return;
            const positions = new Set();
            const pending = [start];
            while (pending.length) {
                const key = pending.pop();
                if (seen.has(key)) continue;
                seen.add(key);
                positions.add(key);
                adjacency.get(key).forEach(neighbor => { if (!seen.has(neighbor)) pending.push(neighbor); });
            }
            const componentFaces = faces.filter(face => face.every(index => positions.has(keys[index])));
            const vertexIndices = vertices.map((_, index) => index).filter(index => positions.has(keys[index]));
            components.push({ positions, faces: componentFaces, vertexIndices });
        });
        return components;
    }
    function nmtmRawSubtract(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }
    function nmtmRawDot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    function nmtmRawCross(a, b) {
        return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }
    function nmtmRawNormalize(value) {
        const length = Math.sqrt(nmtmRawDot(value, value));
        return length > 1e-8 ? value.map(number => number / length) : null;
    }
    function nmtmStrictCuboidReason(section, component) {
        const vertices = section.vertices || [];
        const points = new Map();
        component.vertexIndices.forEach(index => {
            const position = vector(vertices[index].pos);
            points.set(nmtmPositionKey(position), position);
        });
        const faceData = component.faces.map(face => {
            const facePoints = face.map(index => points.get(nmtmPositionKey(vertices[index].pos)));
            const normal = nmtmRawNormalize(nmtmRawCross(nmtmRawSubtract(facePoints[1], facePoints[0]), nmtmRawSubtract(facePoints[2], facePoints[0])));
            return { face, normal };
        });
        if (faceData.some(item => !item.normal)) return 'component contains a degenerate triangle';
        const axes = [];
        faceData.forEach(item => {
            if (!axes.some(axis => Math.abs(nmtmRawDot(axis, item.normal)) > 0.9999)) axes.push(item.normal);
        });
        if (axes.length !== 3) return 'component does not have exactly three cuboid face axes';
        if (Math.abs(nmtmRawDot(axes[0], axes[1])) > 0.001 || Math.abs(nmtmRawDot(axes[0], axes[2])) > 0.001 || Math.abs(nmtmRawDot(axes[1], axes[2])) > 0.001) {
            return 'component face axes are not perpendicular';
        }
        const projectedKeys = new Set();
        const projectedValues = [new Set(), new Set(), new Set()];
        points.forEach(point => {
            const projected = axes.map(axis => Math.round(nmtmRawDot(point, axis) * 100000));
            projected.forEach((value, axis) => projectedValues[axis].add(value));
            projectedKeys.add(projected.join(','));
        });
        if (projectedValues.some(values => values.size !== 2) || projectedKeys.size !== 8) return 'component corners do not form one rectangular cuboid';
        const sides = new Map();
        faceData.forEach(item => {
            let axis = 0;
            let alignment = 0;
            axes.forEach((candidate, candidateAxis) => {
                const value = Math.abs(nmtmRawDot(candidate, item.normal));
                if (value > alignment) { alignment = value; axis = candidateAxis; }
            });
            const side = axis + ':' + (nmtmRawDot(axes[axis], item.normal) < 0 ? '-' : '+');
            if (!sides.has(side)) sides.set(side, []);
            sides.get(side).push(item.face);
        });
        if (sides.size !== 6 || [...sides.values()].some(faces => faces.reduce((total, face) => total + (face.length === 4 ? 2 : 1), 0) !== 2)) {
            return 'component does not contain six complete cuboid faces';
        }
        for (const faces of sides.values()) {
            const uvs = new Set();
            const us = new Set();
            const vs = new Set();
            faces.forEach(face => face.forEach(index => {
                const uv = vertices[index].uvcoord;
                if (!Array.isArray(uv) || !Number.isFinite(Number(uv[0])) || !Number.isFinite(Number(uv[1]))) return;
                const u = Math.round(Number(uv[0]) * 100000);
                const v = Math.round(Number(uv[1]) * 100000);
                us.add(u);
                vs.add(v);
                uvs.add(u + ',' + v);
            }));
            if (us.size !== 2 || vs.size !== 2 || uvs.size !== 4) return 'component has a face whose UVs are not one axis-aligned rectangle';
        }
        return null;
    }
    function nmtmRigidBone(section, component) {
        const vertices = section.vertices || [];
        let boneName = null;
        let unweighted = true;
        for (const index of component.vertexIndices) {
            const weights = Array.isArray(vertices[index].weight) ? vertices[index].weight : [];
            if (!weights.length) continue;
            unweighted = false;
            if (weights.length !== 1 || Number(weights[0][1]) < 0.999) return null;
            const candidate = String(weights[0][0]);
            if (boneName !== null && boneName !== candidate) return null;
            boneName = candidate;
        }
        return unweighted ? 'root' : boneName;
    }
    function nmtmMeshCuboidAnalysis(mesh) {
        const section = mesh && mesh.nmtm_source_section;
        if (!section || !Array.isArray(section.vertices)) return { compatible: false, reason: 'missing original NMTM mesh metadata', components: [] };
        const components = nmtmSectionComponents(section);
        const result = [];
        for (const component of components) {
            const triangleCount = component.faces.reduce((total, face) => total + (face.length === 4 ? 2 : 1), 0);
            if (component.positions.size !== 8 || triangleCount !== 12) {
                return { compatible: false, reason: component.positions.size + '-vertex/' + triangleCount + '-triangle component is not a closed cuboid', components: result };
            }
            const cuboidReason = nmtmStrictCuboidReason(section, component);
            if (cuboidReason) return { compatible: false, reason: cuboidReason, components: result };
            const bone = nmtmRigidBone(section, component);
            if (!bone) return { compatible: false, reason: 'cuboid component uses mixed bones or blended vertex weights', components: result };
            result.push({ mesh, section, component, bone });
        }
        return components.length
            ? { compatible: true, reason: null, components: result }
            : { compatible: false, reason: 'mesh has no connected geometry components', components: [] };
    }
    function emfTextureIdsForMeshes(meshes) {
        const ids = new Set();
        meshes.forEach(mesh => Object.values(mesh.faces || {}).forEach(face => {
            if (face && face.texture) ids.add(face.texture);
        }));
        return [...ids];
    }
    function emfTexturesForMeshes(meshes) {
        if (typeof Texture === 'undefined') return [];
        return emfTextureIdsForMeshes(meshes)
            .map(id => Texture.all.find(texture => texture && texture.uuid === id && texture.source && !texture.error))
            .filter(Boolean);
    }
    function emfCompatibility(options) {
        const geometryMode = options && options.geometryMode === 'voxel' ? 'voxel' : 'strict';
        const requestedVoxelSize = Math.max(0.125, Math.min(8, Number(options && options.voxelSize) || 1));
        const cubes = typeof Cube !== 'undefined' && Array.isArray(Cube.all) ? Cube.all.filter(cube => cube && !cube.error) : [];
        const meshes = typeof Mesh !== 'undefined' && Array.isArray(Mesh.all) ? Mesh.all.filter(mesh => mesh && !mesh.error) : [];
        const bones = typeof ArmatureBone !== 'undefined' && Array.isArray(ArmatureBone.all) ? ArmatureBone.all : [];
        const selected = cubes.filter(cube => cube.selected);
        const selectedMeshItems = meshes.filter(mesh => mesh.selected);
        const hasGeometrySelection = selected.length > 0 || selectedMeshItems.length > 0;
        const exportCubes = hasGeometrySelection ? selected : cubes.filter(cube => cube.export !== false);
        const exportMeshes = hasGeometrySelection ? selectedMeshItems : meshes.filter(mesh => mesh.export !== false);
        const problems = [];
        if (exportMeshes.length && exportCubes.length) problems.push('mixed Cube and Mesh geometry must be exported separately');
        if (exportMeshes.length) {
            const models = new Set(exportMeshes.map(mesh => mesh.nmtm_model_name || ''));
            if (geometryMode !== 'voxel' && models.size > 1) problems.push('strict conversion requires meshes from one imported NMTM model');
            const textures = emfTexturesForMeshes(exportMeshes);
            if (textures.length > 1 && geometryMode !== 'voxel') problems.push(textures.length + ' textures (strict .jem conversion has one texture)');
            if (geometryMode === 'voxel') {
                exportMeshes.forEach((mesh, index) => {
                    if (!mesh.nmtm_source_section || !Array.isArray(mesh.nmtm_source_section.vertices)) {
                        problems.push('mesh ' + (mesh.name || index) + ': missing original NMTM mesh metadata');
                    }
                    nmtmSkeletonRecords(mesh).forEach(record => {
                        const scale = vector(record.initscale || record.scale, [1, 1, 1]);
                        if (Math.max(...scale) - Math.min(...scale) > 0.0001) problems.push('non-uniform source bone scale on ' + record.name);
                    });
                });
                return {
                    compatible: problems.length === 0,
                    problems: [...new Set(problems)],
                    mode: 'nmtm_voxels',
                    cubes: [],
                    groups: new Set(),
                    textures,
                    meshes: exportMeshes,
                    bones,
                    meshComponents: [],
                    sourceModelCount: models.size,
                    voxelSize: requestedVoxelSize,
                    maxVoxels: Math.max(64, Math.min(8192, Math.round(Number(options && options.maxVoxels) || 2048))),
                    autoVoxelFit: !options || options.autoVoxelFit !== false,
                    maxAutoVoxelSize: Math.max(requestedVoxelSize, Math.min(64, Number(options && options.maxAutoVoxelSize) || 8))
                };
            }
            const analyses = exportMeshes.map(nmtmMeshCuboidAnalysis);
            analyses.forEach((analysis, index) => {
                if (!analysis.compatible) problems.push('mesh ' + (exportMeshes[index].name || index) + ': ' + analysis.reason);
            });
            analyses.forEach((analysis, index) => {
                const records = nmtmSkeletonRecords(exportMeshes[index]);
                if (!records.length) return;
                const byName = new Map(records.map(record => [String(record.name), record]));
                const needed = new Set(analysis.components.map(component => component.bone));
                [...needed].forEach(name => {
                    let record = byName.get(name);
                    if (!record) {
                        problems.push('mesh ' + (exportMeshes[index].name || index) + ': weighted bone ' + name + ' is missing from the source skeleton');
                        return;
                    }
                    let guard = 0;
                    while (record && guard++ < 256) {
                        const scale = vector(record.initscale || record.scale, [1, 1, 1]);
                        if (Math.max(...scale) - Math.min(...scale) > 0.0001) {
                            problems.push('non-uniform source bone scale on ' + record.name);
                            break;
                        }
                        if (!record.parent || String(record.parent) === String(record.name)) break;
                        record = byName.get(String(record.parent));
                    }
                });
            });
            return {
                compatible: problems.length === 0,
                problems: [...new Set(problems)],
                mode: 'nmtm_cuboids',
                cubes: [],
                groups: new Set(),
                textures,
                meshes: exportMeshes,
                bones,
                meshComponents: analyses.flatMap(analysis => analysis.components)
            };
        }
        if (!exportCubes.length) problems.push('no cubes or convertible NMTM cuboid meshes');
        if (bones.length) problems.push(bones.length + ' armature bone(s) without convertible NMTM mesh geometry');
        const unsupportedParents = exportCubes.filter(cube => {
            const parent = emfParent(cube);
            return parent && typeof Group !== 'undefined' && !(parent instanceof Group);
        });
        if (unsupportedParents.length) problems.push(unsupportedParents.length + ' cubes are not attached to CEM groups');
        const rotatedCubes = exportCubes.filter(cube => {
            const rotation = Array.isArray(cube.rotation) ? cube.rotation : [0, 0, 0];
            return rotation.some(value => Math.abs(Number(value) || 0) > 0.0001);
        });
        if (rotatedCubes.length) problems.push(rotatedCubes.length + ' rotated cubes; CEM boxes cannot carry per-cube rotation');
        const textures = emfTexturesForCubes(exportCubes);
        if (textures.length > 1) problems.push(textures.length + ' textures (a .jem has one texture)');
        const groups = emfGroupsForCubes(exportCubes);
        groups.forEach(group => {
            const scale = emfGroupScale(group);
            if (Math.max(...scale) - Math.min(...scale) > 0.0001) problems.push('non-uniform scale on ' + group.name);
        });
        return { compatible: problems.length === 0, problems, mode: 'cubes', cubes: exportCubes, groups, textures, meshes: [], bones: [], meshComponents: [] };
    }
    function emfPartName(value, fallback) {
        const raw = safeFileName(value, fallback || 'part');
        const aliases = {
            leftarm: 'left_arm', rightarm: 'right_arm', leftleg: 'left_leg', rightleg: 'right_leg',
            leftsleeve: 'left_sleeve', rightsleeve: 'right_sleeve', bodydown: 'body', root: fallback || 'root'
        };
        return aliases[raw.replace(/_/g, '')] || raw;
    }
    function emfRelativeOrigin(group, parentGroup) {
        const origin = emfGroupOrigin(group);
        const parent = parentGroup ? emfGroupOrigin(parentGroup) : [0, 0, 0];
        return origin.map((value, index) => emfRound(value - parent[index]));
    }
    function emfCubeBounds(cube) {
        const from = emfArray(cube.from || cube.origin, [0, 0, 0]);
        let to = Array.isArray(cube.to) ? emfArray(cube.to, [0, 0, 0]) : null;
        if (!to) {
            const size = emfArray(cube.size, [0, 0, 0]);
            to = from.map((value, index) => emfRound(value + size[index]));
        }
        return { from, to, size: to.map((value, index) => emfRound(value - from[index])) };
    }
    function emfFaceUv(face) {
        const uv = face && face.uv;
        if (Array.isArray(uv) && uv.length >= 4) return uv.slice(0, 4).map(emfRound);
        if (uv && Array.isArray(uv.start) && Array.isArray(uv.end)) return [uv.start[0], uv.start[1], uv.end[0], uv.end[1]].map(emfRound);
        return null;
    }
    function emfBoxForCube(cube, group) {
        const bounds = emfCubeBounds(cube);
        const pivot = emfGroupOrigin(group);
        const box = {
            coordinates: [
                emfRound(bounds.from[0] - pivot[0]), emfRound(bounds.from[1] - pivot[1]), emfRound(bounds.from[2] - pivot[2]),
                bounds.size[0], bounds.size[1], bounds.size[2]
            ]
        };
        const faceNames = { down: 'uvDown', up: 'uvUp', north: 'uvNorth', south: 'uvSouth', west: 'uvWest', east: 'uvEast' };
        Object.keys(faceNames).forEach(direction => {
            const uv = emfFaceUv(cube.faces && cube.faces[direction]);
            if (uv) box[faceNames[direction]] = uv;
        });
        if (!Object.keys(faceNames).some(direction => box[faceNames[direction]])) box.textureOffset = [0, 0];
        const inflate = Number(cube.inflate);
        if (Number.isFinite(inflate) && Math.abs(inflate) > 0.000001) box.sizeAdd = emfRound(inflate);
        return box;
    }
    function emfFramePoint(frame) {
        const value = Array.isArray(frame && frame.data_points) ? frame.data_points[0] : null;
        if (Array.isArray(value)) return emfArray(value, [0, 0, 0]);
        if (value && typeof value === 'object') return ['x', 'y', 'z'].map(axis => emfRound(value[axis]));
        return [0, 0, 0];
    }
    function emfExpression(frames, axis, animation, valueTransform) {
        if (!frames.length) return null;
        const transform = typeof valueTransform === 'function' ? valueTransform : value => value;
        const values = frames.map(frame => emfRound(transform(emfFramePoint(frame)[axis])));
        if (values.length === 1) return String(values[0]);
        const length = Math.max(Number(animation.length) || 0, Number(frames[frames.length - 1].time) || 0, 0.001);
        const clock = animation.loop === 'loop' ? `(time*0.05%${emfRound(length)})` : `min(time*0.05,${emfRound(length)})`;
        const progress = `(${clock}/${emfRound(length)})*${values.length - 1}`;
        return `keyframe(${progress},${values.join(',')})`;
    }
    function emfAnimationForGroup(animation, group) {
        if (!animation || !group || !animation.animators) return null;
        const animator = Object.values(animation.animators).find(item => item && (item.element === group || item.group === group || item.uuid === group.uuid));
        if (!animator || !Array.isArray(animator.keyframes)) return null;
        const result = {};
        const channels = { position: ['tx', 'ty', 'tz'], rotation: ['rx', 'ry', 'rz'], scale: ['sx', 'sy', 'sz'] };
        Object.keys(channels).forEach(channel => {
            const frames = animator.keyframes
                .filter(frame => frame && frame.channel === channel)
                .sort((a, b) => (Number(a.time) || 0) - (Number(b.time) || 0));
            if (!frames.length) return;
            channels[channel].forEach((name, axis) => {
                // Static CEM rotations use degrees, while animation rx/ry/rz use radians.
                const expression = emfExpression(frames, axis, animation, channel === 'rotation' ? value => value * Math.PI / 180 : null);
                if (expression !== null) result['this.' + name] = expression;
            });
        });
        return Object.keys(result).length ? result : null;
    }
    function nmtmSkeletonRecords(mesh) {
        const skeleton = mesh && mesh.nmtm_skeleton_data && mesh.nmtm_skeleton_data.skeleton;
        return Array.isArray(skeleton) ? skeleton : [];
    }
    function nmtmSkeletonContext(mesh) {
        const records = nmtmSkeletonRecords(mesh).slice();
        if (!records.length) records.push({ name: 'root', parent: 'root', initpos: [0, 0, 0], initquaternion: [0, 0, 0, 1], initscale: [1, 1, 1] });
        const byName = new Map(records.map(record => [String(record.name), record]));
        const worldMatrices = new Map();
        const visiting = new Set();
        const worldMatrix = name => {
            if (worldMatrices.has(name)) return worldMatrices.get(name);
            const record = byName.get(name);
            if (!record || typeof THREE === 'undefined') return null;
            if (visiting.has(name)) throw new Error('Circular NMTM skeleton hierarchy at ' + name);
            visiting.add(name);
            const position = new THREE.Vector3().fromArray(vector(record.initpos || record.pos));
            const rotation = new THREE.Quaternion().fromArray(quaternionArray(record.initquaternion || record.quaternion)).normalize();
            const scale = new THREE.Vector3().fromArray(vector(record.initscale || record.scale, [1, 1, 1]));
            const matrix = new THREE.Matrix4().compose(position, rotation, scale);
            const parentName = record.parent && String(record.parent) !== name ? String(record.parent) : null;
            if (parentName && byName.has(parentName)) {
                const parentMatrix = worldMatrix(parentName);
                if (parentMatrix) matrix.premultiply(parentMatrix);
            }
            visiting.delete(name);
            worldMatrices.set(name, matrix);
            return matrix;
        };
        records.forEach(record => worldMatrix(String(record.name)));
        return { records, byName, worldMatrices, boneObjects: mesh && mesh.nmtm_bones || {} };
    }
    function nmtmFaceNormal(points) {
        if (typeof THREE === 'undefined' || points.length < 3) return null;
        const a = points[0];
        const b = points[1];
        const c = points[2];
        const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
        return normal.lengthSq() > 1e-10 ? normal.normalize() : null;
    }
    function nmtmCuboidBasis(faceNormals) {
        if (typeof THREE === 'undefined') return null;
        const candidates = [];
        faceNormals.forEach(normal => {
            if (!normal || candidates.some(candidate => Math.abs(candidate.dot(normal)) > 0.9999)) return;
            candidates.push(normal.clone());
        });
        if (candidates.length !== 3) return null;
        const globals = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
        const permutations = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        let best = permutations[0];
        let bestScore = -1;
        permutations.forEach(permutation => {
            const score = permutation.reduce((total, candidate, axis) => total + Math.abs(candidates[candidate].dot(globals[axis])), 0);
            if (score > bestScore) { best = permutation; bestScore = score; }
        });
        const axes = best.map((candidate, axis) => {
            const value = candidates[candidate].clone();
            if (value.dot(globals[axis]) < 0) value.negate();
            return value;
        });
        if (Math.abs(axes[0].dot(axes[1])) > 0.001 || Math.abs(axes[0].dot(axes[2])) > 0.001 || Math.abs(axes[1].dot(axes[2])) > 0.001) return null;
        if (new THREE.Vector3().crossVectors(axes[0], axes[1]).dot(axes[2]) < 0) axes[2].negate();
        return axes;
    }
    function nmtmBasisEuler(axes) {
        const matrix = new THREE.Matrix4().makeBasis(axes[0], axes[1], axes[2]);
        const order = typeof Format !== 'undefined' && Format.euler_order ? Format.euler_order : 'ZYX';
        const euler = new THREE.Euler().setFromRotationMatrix(matrix, order);
        return [euler.x, euler.y, euler.z].map(value => emfRound(value * 180 / Math.PI));
    }
    function nmtmCuboidSubmodel(source, textureSize, context, index) {
        const { section, component, bone } = source;
        const record = context.byName.get(bone);
        const bind = context.worldMatrices.get(bone) || new THREE.Matrix4();
        const inverseBind = bind.clone().invert();
        const positions = new Map();
        component.vertexIndices.forEach(vertexIndex => {
            const key = nmtmPositionKey(section.vertices[vertexIndex].pos);
            if (!positions.has(key)) positions.set(key, new THREE.Vector3().fromArray(vector(section.vertices[vertexIndex].pos)).applyMatrix4(inverseBind));
        });
        const faceData = component.faces.map(face => {
            const points = face.map(vertexIndex => positions.get(nmtmPositionKey(section.vertices[vertexIndex].pos)));
            return { face, points, normal: nmtmFaceNormal(points) };
        });
        const axes = nmtmCuboidBasis(faceData.map(item => item.normal));
        if (!axes) throw new Error('NMTM cuboid component ' + index + ' does not have three perpendicular face axes.');
        const projected = [[], [], []];
        positions.forEach(point => axes.forEach((axis, axisIndex) => projected[axisIndex].push(point.dot(axis))));
        const minimum = projected.map(values => Math.min(...values));
        const maximum = projected.map(values => Math.max(...values));
        const size = maximum.map((value, axis) => emfRound(value - minimum[axis]));
        if (size.some(value => value <= 0.00001)) throw new Error('NMTM cuboid component ' + index + ' has a zero-size axis.');
        const center = new THREE.Vector3();
        axes.forEach((axis, axisIndex) => center.addScaledVector(axis, (minimum[axisIndex] + maximum[axisIndex]) / 2));
        const box = { coordinates: size.map(value => emfRound(-value / 2)).concat(size) };
        const uvNames = [
            ['uvEast', 'uvWest'],
            ['uvUp', 'uvDown'],
            ['uvSouth', 'uvNorth']
        ];
        const faceUvs = {};
        faceData.forEach(item => {
            if (!item.normal) return;
            let axis = 0;
            let alignment = 0;
            axes.forEach((candidate, candidateAxis) => {
                const value = Math.abs(item.normal.dot(candidate));
                if (value > alignment) { alignment = value; axis = candidateAxis; }
            });
            const uvName = uvNames[axis][item.normal.dot(axes[axis]) < 0 ? 1 : 0];
            const values = faceUvs[uvName] || (faceUvs[uvName] = []);
            item.face.forEach(vertexIndex => {
                const uv = section.vertices[vertexIndex].uvcoord || [0, 0];
                values.push([Number(uv[0]) * textureSize[0], Number(uv[1]) * textureSize[1]]);
            });
        });
        Object.keys(faceUvs).forEach(name => {
            const values = faceUvs[name];
            box[name] = [
                emfRound(Math.min(...values.map(uv => uv[0]))),
                emfRound(Math.min(...values.map(uv => uv[1]))),
                emfRound(Math.max(...values.map(uv => uv[0]))),
                emfRound(Math.max(...values.map(uv => uv[1])))
            ];
        });
        if (Object.keys(faceUvs).length !== 6) throw new Error('NMTM cuboid component ' + index + ' does not contain six complete textured faces.');
        return {
            id: 'nmtm_box_' + index,
            translate: center.toArray().map(emfRound),
            rotate: nmtmBasisEuler(axes),
            boxes: [box]
        };
    }
    function nmtmFaceTriangles(section) {
        const vertices = Array.isArray(section && section.vertices) ? section.vertices : [];
        const faces = Array.isArray(section && section.indices) ? section.indices : [];
        const triangles = [];
        faces.forEach(face => {
            const valid = Array.isArray(face) ? face.filter(index => Number.isInteger(index) && vertices[index]).slice(0, 4) : [];
            if (valid.length === 3) triangles.push(valid);
            else if (valid.length === 4) {
                triangles.push([valid[0], valid[1], valid[2]], [valid[0], valid[2], valid[3]]);
            }
        });
        return triangles;
    }
    function nmtmDominantBone(section, triangle) {
        const totals = new Map();
        triangle.forEach(index => {
            const weights = Array.isArray(section.vertices[index].weight) ? section.vertices[index].weight : [];
            weights.forEach(pair => totals.set(String(pair[0]), (totals.get(String(pair[0])) || 0) + (Number(pair[1]) || 0)));
        });
        let best = 'root';
        let score = -1;
        totals.forEach((value, name) => { if (value > score) { best = name; score = value; } });
        return best;
    }
    function nmtmClamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }
    function nmtmVoxelLimitError(message, reason) {
        const error = new Error(message);
        error.code = 'NMTM_VOXEL_LIMIT';
        error.reason = reason || 'box_limit';
        return error;
    }
    function nmtmVoxelEmfModelsAtSize(compatibility, targetPart, textureSize, animation) {
        if (typeof THREE === 'undefined') throw new Error('THREE.js is required to voxelize NMTM meshes for EMF.');
        const voxelSize = compatibility.voxelSize || 1;
        const maxVoxels = compatibility.maxVoxels || 2048;
        const contexts = compatibility.meshes.map(nmtmSkeletonContext);
        const cells = new Map();
        let sampleCount = 0;
        const sampleBudget = Math.max(32768, maxVoxels * 512);
        const addSample = (meshIndex, bone, point, uv) => {
            if (++sampleCount > sampleBudget) throw nmtmVoxelLimitError('Voxel approximation exceeded its sampling budget.', 'sample_budget');
            const x = Math.floor(point.x / voxelSize);
            const y = Math.floor(point.y / voxelSize);
            const z = Math.floor(point.z / voxelSize);
            const key = meshIndex + ':' + bone + ':' + x + ':' + y + ':' + z;
            const current = cells.get(key);
            const center = new THREE.Vector3((x + 0.5) * voxelSize, (y + 0.5) * voxelSize, (z + 0.5) * voxelSize);
            const distance = point.distanceToSquared(center);
            if (!current || distance < current.distance) cells.set(key, { meshIndex, bone, x, y, z, uv, distance });
            if (cells.size > maxVoxels) throw nmtmVoxelLimitError('Voxel approximation exceeded the ' + maxVoxels + ' box limit.', 'box_limit');
        };
        compatibility.meshes.forEach((mesh, meshIndex) => {
            const section = mesh.nmtm_source_section;
            const meshContext = contexts[meshIndex];
            const fallbackBone = String(meshContext.records[0] && meshContext.records[0].name || 'root');
            nmtmFaceTriangles(section).forEach(triangle => {
                const sourceBone = nmtmDominantBone(section, triangle);
                const bone = meshContext.byName.has(sourceBone) ? sourceBone : fallbackBone;
                const bind = meshContext.worldMatrices.get(bone) || new THREE.Matrix4();
                const inverseBind = bind.clone().invert();
                const points = triangle.map(index => new THREE.Vector3().fromArray(vector(section.vertices[index].pos)).applyMatrix4(inverseBind));
                const region = compatibility.textureRegions && compatibility.textureRegions[meshIndex]
                    ? compatibility.textureRegions[meshIndex]
                    : { x: 0, y: 0, width: textureSize[0], height: textureSize[1] };
                const uvs = triangle.map(index => {
                    const uv = section.vertices[index].uvcoord || [0, 0];
                    return [
                        region.x + (Number(uv[0]) || 0) * region.width,
                        region.y + (Number(uv[1]) || 0) * region.height
                    ];
                });
                const edgeLengths = [points[0].distanceTo(points[1]), points[1].distanceTo(points[2]), points[2].distanceTo(points[0])];
                const steps = Math.max(1, Math.min(256, Math.ceil(Math.max(...edgeLengths) / (voxelSize * 0.45))));
                for (let i = 0; i <= steps; i++) {
                    for (let j = 0; j <= steps - i; j++) {
                        const b = i / steps;
                        const c = j / steps;
                        const a = 1 - b - c;
                        const point = points[0].clone().multiplyScalar(a).addScaledVector(points[1], b).addScaledVector(points[2], c);
                        const uv = [uvs[0][0] * a + uvs[1][0] * b + uvs[2][0] * c, uvs[0][1] * a + uvs[1][1] * b + uvs[2][1] * c];
                        addSample(meshIndex, bone, point, uv);
                    }
                }
            });
        });
        const byMeshBone = contexts.map(() => new Map());
        cells.forEach(cell => {
            const byBone = byMeshBone[cell.meshIndex];
            if (!byBone.has(cell.bone)) byBone.set(cell.bone, []);
            const u = nmtmClamp(Math.floor(cell.uv[0]), 0, Math.max(0, textureSize[0] - 1));
            const v = nmtmClamp(Math.floor(cell.uv[1]), 0, Math.max(0, textureSize[1] - 1));
            const box = { coordinates: [emfRound(cell.x * voxelSize), emfRound(cell.y * voxelSize), emfRound(cell.z * voxelSize), emfRound(voxelSize), emfRound(voxelSize), emfRound(voxelSize)] };
            const uv = [u, v, Math.min(textureSize[0], u + 1), Math.min(textureSize[1], v + 1)];
            const neighbor = (x, y, z) => cells.has(cell.meshIndex + ':' + cell.bone + ':' + x + ':' + y + ':' + z);
            if (!neighbor(cell.x, cell.y - 1, cell.z)) box.uvDown = uv;
            if (!neighbor(cell.x, cell.y + 1, cell.z)) box.uvUp = uv;
            if (!neighbor(cell.x, cell.y, cell.z - 1)) box.uvNorth = uv;
            if (!neighbor(cell.x, cell.y, cell.z + 1)) box.uvSouth = uv;
            if (!neighbor(cell.x - 1, cell.y, cell.z)) box.uvWest = uv;
            if (!neighbor(cell.x + 1, cell.y, cell.z)) box.uvEast = uv;
            byBone.get(cell.bone).push(box);
        });
        compatibility.voxelCount = cells.size;
        const branches = [];
        contexts.forEach((context, meshIndex) => {
            const byBone = byMeshBone[meshIndex];
            if (!byBone.size) return;
            const needed = new Set(byBone.keys());
            [...needed].forEach(name => {
                let record = context.byName.get(name);
                let guard = 0;
                while (record && record.parent && String(record.parent) !== String(record.name) && guard++ < 256) {
                    const parent = String(record.parent);
                    needed.add(parent);
                    record = context.byName.get(parent);
                }
            });
            const mesh = compatibility.meshes[meshIndex];
            const prefix = safeFileName(mesh.nmtm_model_name || mesh.name || 'mesh_' + meshIndex, 'mesh_' + meshIndex) + '_' + meshIndex;
            const buildBone = record => {
                const name = String(record.name);
                const children = context.records.filter(candidate => needed.has(String(candidate.name)) && String(candidate.parent) === name && String(candidate.name) !== name);
                const model = {
                    id: prefix + '_' + safeFileName(name, 'part'),
                    translate: emfArray(record.initpos || record.pos, [0, 0, 0]),
                    rotate: quaternionEuler(record.initquaternion || record.quaternion),
                    boxes: byBone.get(name) || []
                };
                const scale = vector(record.initscale || record.scale, [1, 1, 1]);
                if (Math.abs(scale[0] - 1) > 0.0001) model.scale = emfRound(scale[0]);
                const submodels = children.map(buildBone);
                if (submodels.length) model.submodels = submodels;
                const animationData = emfAnimationForGroup(animation, context.boneObjects[name]);
                if (animationData) model.animations = [animationData];
                return model;
            };
            const roots = context.records.filter(record => needed.has(String(record.name)) && (!record.parent || String(record.parent) === String(record.name) || !needed.has(String(record.parent))));
            if (roots.length === 1) branches.push(buildBone(roots[0]));
            else if (roots.length > 1) branches.push({ id: prefix, boxes: [], submodels: roots.map(buildBone) });
        });
        return [{ part: emfPartName(targetPart, 'body'), id: 'nmtm_root', attach: false, boxes: [], submodels: branches }];
    }
    function nmtmVoxelEmfModels(compatibility, targetPart, textureSize, animation) {
        const requestedSize = Math.max(0.125, Number(compatibility.voxelSize) || 1);
        const autoFit = compatibility.autoVoxelFit !== false;
        const maximumSize = Math.max(requestedSize, Number(compatibility.maxAutoVoxelSize) || 8);
        let actualSize = requestedSize;
        let lastError = null;
        let attempts = 0;
        while (true) {
            attempts++;
            const trial = Object.assign({}, compatibility, { voxelSize: actualSize });
            try {
                const models = nmtmVoxelEmfModelsAtSize(trial, targetPart, textureSize, animation);
                compatibility.actualVoxelSize = emfRound(actualSize);
                compatibility.voxelCount = Number(trial.voxelCount) || 0;
                compatibility.voxelWasAdapted = actualSize > requestedSize + 0.000001;
                return models;
            } catch (error) {
                lastError = error;
                if (!autoFit || !error || error.code !== 'NMTM_VOXEL_LIMIT') throw error;
                if (actualSize >= maximumSize - 0.000001) break;
                const nextSize = Math.min(maximumSize, Math.max(actualSize + 0.125, actualSize * 1.25));
                if (!(nextSize > actualSize + 0.000001)) break;
                actualSize = nextSize;
                // This is only a defensive guard against a future numeric change;
                // the configured maximum normally ends the loop much earlier.
                if (attempts > 256) break;
            }
        }
        throw new Error(
            'Automatic voxel fitting could not stay under the ' + (compatibility.maxVoxels || 2048)
            + ' box limit after increasing voxel size from ' + requestedSize + ' to the configured maximum ' + emfRound(maximumSize)
            + '. Raise the box limit or maximum automatic voxel size, or export fewer selected mesh sections. '
            + (lastError && lastError.message ? lastError.message : '')
        );
    }
    function nmtmEmfModels(compatibility, targetPart, textureSize, animation) {
        if (typeof THREE === 'undefined') throw new Error('THREE.js is required to convert NMTM cuboid meshes to EMF.');
        const firstMesh = compatibility.meshes[0];
        const context = nmtmSkeletonContext(firstMesh);
        const byBone = new Map();
        compatibility.meshComponents.forEach((component, index) => {
            if (!byBone.has(component.bone)) byBone.set(component.bone, []);
            byBone.get(component.bone).push(nmtmCuboidSubmodel(component, textureSize, context, index));
        });
        const needed = new Set(byBone.keys());
        [...needed].forEach(name => {
            let record = context.byName.get(name);
            let guard = 0;
            while (record && record.parent && String(record.parent) !== String(record.name) && guard++ < 256) {
                const parent = String(record.parent);
                needed.add(parent);
                record = context.byName.get(parent);
            }
        });
        const buildBone = record => {
            const name = String(record.name);
            const children = context.records.filter(candidate => needed.has(String(candidate.name)) && String(candidate.parent) === name && String(candidate.name) !== name);
            const submodels = (byBone.get(name) || []).concat(children.map(buildBone));
            const model = {
                id: safeFileName(name, 'part'),
                translate: emfArray(record.initpos || record.pos, [0, 0, 0]),
                rotate: quaternionEuler(record.initquaternion || record.quaternion),
                boxes: []
            };
            const scale = vector(record.initscale || record.scale, [1, 1, 1]);
            if (Math.abs(scale[0] - 1) > 0.0001) model.scale = emfRound(scale[0]);
            if (submodels.length) model.submodels = submodels;
            const animationData = emfAnimationForGroup(animation, context.boneObjects[name]);
            if (animationData) model.animations = [animationData];
            return model;
        };
        const roots = context.records.filter(record => needed.has(String(record.name)) && (!record.parent || String(record.parent) === String(record.name) || !needed.has(String(record.parent))));
        return [{
            part: emfPartName(targetPart, 'body'),
            id: 'nmtm_root',
            attach: false,
            boxes: [],
            submodels: roots.map(buildBone)
        }];
    }
    function emfGroupModel(group, parentGroup, cubes, groups, animation, fallbackPart, topLevel) {
        const children = [...groups].filter(candidate => emfParent(candidate) === group);
        const groupCubes = cubes.filter(cube => emfParent(cube) === group);
        const scale = emfGroupScale(group);
        const model = {
            id: emfPartName(group.name, 'part'),
            attach: false,
            translate: emfRelativeOrigin(group, parentGroup),
            rotate: emfGroupRotation(group),
            boxes: groupCubes.map(cube => emfBoxForCube(cube, group))
        };
        if (Math.abs(scale[0] - 1) > 0.0001) model.scale = emfRound(scale[0]);
        if (group.mirror_uv) model.mirrorTexture = 'u';
        const animationData = emfAnimationForGroup(animation, group);
        if (animationData) model.animations = [animationData];
        if (children.length) model.submodels = children.map(child => emfGroupModel(child, group, cubes, groups, animation, fallbackPart, false));
        if (topLevel) model.part = emfPartName(group.name, fallbackPart);
        return model;
    }
    function emfJemData(textureReference, textureSize, compatibility, targetPart, animation) {
        if (compatibility.mode === 'nmtm_voxels') {
            return { texture: textureReference, textureSize: textureSize.map(Number), models: nmtmVoxelEmfModels(compatibility, targetPart, textureSize, animation) };
        }
        if (compatibility.mode === 'nmtm_cuboids') {
            return { texture: textureReference, textureSize: textureSize.map(Number), models: nmtmEmfModels(compatibility, targetPart, textureSize, animation) };
        }
        const groups = compatibility.groups;
        const roots = [...groups].filter(group => {
            const parent = emfParent(group);
            return !parent || !groups.has(parent);
        });
        const models = roots.length
            ? roots.map(group => emfGroupModel(group, null, compatibility.cubes, groups, animation, targetPart, true))
            : [{ part: emfPartName(targetPart, 'body'), id: 'nmtm_root', boxes: compatibility.cubes.map(cube => emfBoxForCube(cube, null)) }];
        return { texture: textureReference, textureSize: textureSize.map(Number), models };
    }
    function emfModelRelative(namespace, entity) {
        const folder = String(namespace).toLowerCase() === 'minecraft' ? 'optifine/cem' : 'emf/cem';
        return 'assets/' + namespace + '/' + folder + '/' + entity + '.jem';
    }
    function exportEmfEntityPack(outputRoot, catalog, availability) {
        const strictCompatibility = availability && availability.strict || emfCompatibility();
        const voxelCompatibility = availability && availability.voxel || emfCompatibility({ geometryMode: 'voxel' });
        const initialCompatibility = strictCompatibility.compatible ? strictCompatibility : voxelCompatibility;
        if (!initialCompatibility.compatible) { fail('Cannot export this project as EMF/CEM.', new Error(initialCompatibility.problems.join(', '))); return; }
        const texture = initialCompatibility.textures[0] || selectedTexture();
        if (!texture) { fail('No texture was found for the EMF/CEM entity pack.'); return; }
        const dimensions = texture.nmtm_size || pngSize(texture.nmtm_source_path) || { width: Project.texture_width || 64, height: Project.texture_height || 64 };
        const options = versionOptions(catalog);
        const defaultVersion = options[catalog.latest && catalog.latest.release] ? catalog.latest.release : Object.keys(options)[0];
        const defaultEntity = safeFileName(Project.name || 'nmtm_entity');
        const defaultPart = initialCompatibility.groups && initialCompatibility.groups.size ? emfPartName([...initialCompatibility.groups][0].name, 'body') : 'body';
        const animationOptions = { '': 'No animation export' };
        (typeof Animation !== 'undefined' && Array.isArray(Animation.all) ? Animation.all : []).forEach((animation, index) => {
            animationOptions[String(index)] = String(animation.name || 'animation_' + index);
        });
        const geometryOptions = {};
        if (strictCompatibility.compatible) geometryOptions.strict = 'Strict cuboid conversion';
        if (voxelCompatibility.compatible) geometryOptions.voxel = 'Voxel approximation (curves, irregular meshes, and multiple imported parts)';
        new Dialog({
            id: 'nmtm_emf_entity_pack',
             title: 'NMTM: Export EMF/CEM entity pack (entities only)',
            width: 760,
            form: {
                version: { type: 'select', label: 'Minecraft version', options, value: defaultVersion },
                pack: { type: 'text', label: 'Resource pack folder', value: safeFileName(defaultEntity + '_emf_pack') },
                description: { type: 'text', label: 'Pack description', value: 'NMTM entity model for EMF' },
                namespace: { type: 'text', label: 'Resource namespace', value: 'minecraft' },
                entity: { type: 'text', label: 'Target entity model id', value: defaultEntity },
                target_part: { type: 'text', label: 'Fallback root part', value: defaultPart },
                model_name: { type: 'text', label: 'Model name', value: defaultEntity },
                geometry_mode: { type: 'select', label: 'Geometry adapter', options: geometryOptions, value: strictCompatibility.compatible ? 'strict' : 'voxel' },
                voxel_size: { type: 'number', label: 'Minimum voxel size', value: 1, min: 0.125, max: 8, step: 0.125, condition: form => form.geometry_mode === 'voxel' },
                max_voxels: { type: 'number', label: 'Maximum voxel boxes', value: 2048, min: 64, max: 8192, step: 64, condition: form => form.geometry_mode === 'voxel' },
                auto_voxel_fit: { type: 'checkbox', label: 'Automatically coarsen to fit box limit', value: true, condition: form => form.geometry_mode === 'voxel' },
                max_auto_voxel_size: { type: 'number', label: 'Maximum automatic voxel size', value: 8, min: 0.125, max: 64, step: 0.125, condition: form => form.geometry_mode === 'voxel' && form.auto_voxel_fit },
                animation: { type: 'select', label: 'Animation clip to bake', options: animationOptions, value: '' },
                pack_icon: { type: 'checkbox', label: 'Use square texture as pack icon', value: true }
            },
            onConfirm(result) {
                try {
                    const version = catalog.versions.find(item => item.id === result.version);
                    if (!version) throw new Error('The selected Minecraft version is missing from the version catalog.');
                    const namespace = safeNamespace(result.namespace || 'minecraft');
                    const entity = safeFileName(result.entity, defaultEntity);
                    const modelName = safeFileName(result.model_name, entity);
                    const targetPart = emfPartName(result.target_part, defaultPart);
                    const geometryMode = result.geometry_mode === 'voxel' ? 'voxel' : 'strict';
                    const compatibility = geometryMode === 'voxel'
                        ? emfCompatibility({ geometryMode: 'voxel', voxelSize: result.voxel_size, maxVoxels: result.max_voxels, autoVoxelFit: result.auto_voxel_fit !== false, maxAutoVoxelSize: result.max_auto_voxel_size })
                        : emfCompatibility();
                    if (!compatibility.compatible) throw new Error(compatibility.problems.join(', '));
                    const exportTexture = compatibility.textures[0] || selectedTexture();
                    if (!exportTexture) throw new Error('No texture was found for the selected geometry adapter.');
                    const atlas = geometryMode === 'voxel' && compatibility.meshes && compatibility.meshes.length
                        ? buildEmfTextureAtlas(compatibility.meshes, exportTexture)
                        : null;
                    if (atlas) {
                        compatibility.textureRegions = atlas.meshRegions;
                        compatibility.atlasSourceCount = atlas.sourceCount;
                    }
                    const exportDimensions = atlas
                        ? { width: atlas.width, height: atlas.height }
                        : (exportTexture.nmtm_size || pngSize(exportTexture.nmtm_source_path) || dimensions);
                    const animationIndex = result.animation === '' ? -1 : Number(result.animation);
                    const animation = animationIndex >= 0 && typeof Animation !== 'undefined' && Animation.all[animationIndex] ? Animation.all[animationIndex] : null;
                    const texturePathName = 'nmtm/' + modelName;
                    const textureReference = namespace + ':' + texturePathName;
                    const packRoot = join(outputRoot, safeFileName(result.pack, entity + '_emf_pack'));
                    const jemRelative = emfModelRelative(namespace, entity);
                    const textureRelative = 'assets/' + namespace + '/textures/' + texturePathName + '.png';
                    const textureData = atlas ? atlas.buffer : textureBuffer(exportTexture);
                    if (!textureData) throw new Error('The selected texture could not be read as PNG data.');
                    const jemData = emfJemData(textureReference, [exportDimensions.width, exportDimensions.height], compatibility, targetPart, animation);
                    writeJsonSync(join(packRoot, 'pack.mcmeta'), packMetadata(version, String(result.description || 'NMTM entity model for EMF')));
                    writeJsonSync(join(packRoot, ...jemRelative.split('/')), jemData);
                    const textureFile = join(packRoot, ...textureRelative.split('/'));
                    fs.mkdirSync(path.dirname(textureFile), { recursive: true });
                    fs.writeFileSync(textureFile, textureData);
                    writeJsonSync(join(packRoot, 'nmtm_emf_export.json'), {
                        generator: 'Netease Mesh To Modle', generator_version: PLUGIN_VERSION, adapter: 'EMF/CEM',
                        minecraft_version: version.id, resource_pack_format: packFormatValue(version), namespace,
                        entity, target_part: targetPart, model_name: modelName, animation: animation ? String(animation.name || '') : null,
                        geometry: geometryMode === 'voxel' ? 'voxel_approximation' : (compatibility.mode === 'nmtm_cuboids' ? 'reconstructed_cuboids' : 'cuboids_only'),
                        source_models: geometryMode === 'voxel' ? compatibility.sourceModelCount || 1 : 1,
                        voxel_size_requested: geometryMode === 'voxel' ? compatibility.voxelSize : null,
                        voxel_size: geometryMode === 'voxel' ? (compatibility.actualVoxelSize || compatibility.voxelSize) : null,
                        voxel_size_auto_adjusted: geometryMode === 'voxel' ? !!compatibility.voxelWasAdapted : false,
                        voxel_auto_fit: geometryMode === 'voxel' ? compatibility.autoVoxelFit !== false : false,
                        voxel_auto_fit_maximum_size: geometryMode === 'voxel' ? compatibility.maxAutoVoxelSize : null,
                        voxel_boxes: geometryMode === 'voxel' ? compatibility.voxelCount : null,
                        max_voxels: geometryMode === 'voxel' ? compatibility.maxVoxels : null,
                         source_textures: atlas
                             ? compatibility.textures.map(texture => texture.nmtm_source_path || texture.name || null)
                             : [exportTexture.nmtm_source_path || null],
                         texture_atlas: !!atlas,
                         texture_atlas_sources: atlas ? atlas.sourceCount : 1
                    });
                    writeTextSync(join(packRoot, 'NMTM-EMF-README.txt'), [
                        'Netease Mesh To Modle - EMF/CEM Entity Pack', '',
                        'Target Minecraft: ' + version.id,
                        'Target entity: ' + namespace + ':' + entity,
                        'Required client mods: Entity Model Features (EMF) and Entity Texture Features (ETF).',
                        'Do not install dorianpb CEM together with EMF.',
                        'Install this folder in .minecraft/resourcepacks and enable it.',
                        'Model file: ' + jemRelative,
                        'Texture file: ' + textureRelative,
                         geometryMode === 'voxel'
                             ? 'Geometry: voxel approximation with ' + compatibility.voxelCount + ' boxes. Requested size ' + compatibility.voxelSize + ', actual size ' + (compatibility.actualVoxelSize || compatibility.voxelSize) + (compatibility.voxelWasAdapted ? ' (automatically increased to fit the box limit).' : '.') + (atlas && atlas.sourceCount > 1 ? ' Multiple source textures were packed into one generated EMF atlas.' : '') + ' Curves and irregular meshes are approximate; blended weights use the dominant source bone.'
                            : 'Geometry: strict cuboids only; arbitrary triangle meshes and blended vertex skinning are not representable by CEM.',
                        animation ? 'Animation: ' + String(animation.name || 'animation') + ' (baked with EMF keyframe expressions; time uses Minecraft ticks).' : 'Animation: none exported.',
                        '', 'If the entity uses different vanilla part names, edit the model `part` values in the .jem file.'
                    ].join('\r\n'));
                    const icon = pngBufferSize(textureData);
                    if (result.pack_icon && icon && icon.width === icon.height) fs.writeFileSync(join(packRoot, 'pack.png'), textureData);
                    validatePackFiles(packRoot, ['pack.mcmeta', jemRelative, textureRelative, 'nmtm_emf_export.json']);
                    notify('EMF/CEM entity pack exported: ' + packRoot + (compatibility.voxelWasAdapted ? ' (voxel size auto-adjusted to ' + compatibility.actualVoxelSize + ')' : ''));
                } catch (error) { fail('Could not export the EMF/CEM entity pack.', error); return false; }
            }
        }).show();
    }
    async function exportEmfEntityPackPrompt() {
        const strict = emfCompatibility();
        const voxel = emfCompatibility({ geometryMode: 'voxel' });
        if (!strict.compatible && !voxel.compatible) {
            const reasons = voxel.problems.length ? voxel.problems : strict.problems;
            const shown = reasons.slice(0, 6);
            if (reasons.length > shown.length) shown.push('and ' + (reasons.length - shown.length) + ' more issue(s)');
            fail('This project cannot be exported to EMF/CEM voxel mode.', new Error(shown.join(', ')));
            return;
        }
        const catalog = await getVersionCatalog(true);
        const target = chooseFolder(projectStartPath(), 'nmtm_emf_entity_pack', 'NMTM: Select EMF/CEM resource-pack output folder');
        if (!target) return;
        exportEmfEntityPack(target, catalog, { strict, voxel });
    }
    async function compileRigGlb() {
        const gltf = typeof Codecs !== 'undefined' ? Codecs.gltf : null;
        if (!gltf || typeof gltf.compile !== 'function') throw new Error('Blockbench GLB codec is not available.');
        const allRigs = typeof Armature !== 'undefined' ? Armature.all : [];
        const rigs = allRigs.filter(armature => {
            // The native exporter prunes disabled parent groups. Our rigs are
            // flattened into a new scene, so preserve that ancestor exclusion.
            for (let node = armature; node && node !== 'root'; node = node.parent) {
                if (node.export === false) return false;
            }
            return true;
        });
        // Even when every NMTM rig is excluded, do not fall back to a native
        // path that may resurrect them or derive different inverse binds.
        if (!allRigs.some(a => a.getAllBones().some(b => b.nmtm_binding && b.nmtm_binding.enabled))) {
            return gltf.compile({ encoding: 'binary', scale: 16, embed_textures: true, armature: true, animations: true });
        }
        const buildSkin = gltf.buildSkinnedMesh || (typeof buildSkinnedMesh === 'function' ? buildSkinnedMesh : null);
        if (!buildSkin || typeof gltf.buildAnimationTracks !== 'function') throw new Error('This Blockbench build is missing the armature GLB exporter API.');
        const scene = new THREE.Scene();
        const disposable = [];
        const time = Timeline.time;
        const frames = Texture.all.map(texture => [texture, texture.currentFrame]);
        try {
            Canvas.updateAllBones();
            Animator.showDefaultPose(true);
            Texture.all.forEach(texture => { texture.currentFrame = 0; });
            if (typeof TextureAnimator !== 'undefined') TextureAnimator.update(Texture.all.filter(t => t.frameCount > 1));
            // The editor displays deformed vertices. Export the editable bind
            // geometry; applying offmtx here again would double-deform the mesh.
            Mesh.all.forEach(mesh => Mesh.preview_controller.updateGeometry(mesh));
            Project.model_3d.updateMatrixWorld(true);
            for (const armature of rigs) {
                const sourceBones = armature.getAllBones();
                const skin = buildSkin(armature, 16);
                disposable.push(skin.geometry);
                skin.name = armature.name;
                sourceBones.forEach((bone, index) => {
                    skin.skeleton.bones[index].scale.fromArray(bone.nmtm_rest_scale || [1, 1, 1]);
                });
                skin.updateMatrixWorld(true);
                skin.skeleton.boneInverses = sourceBones.map((bone, index) =>
                    sourceInverseBind(bone.nmtm_binding) || skin.skeleton.bones[index].matrixWorld.clone().invert());
                const matrix = Project.model_3d.matrixWorld.clone().invert().multiply(armature.scene_object.matrixWorld);
                matrix.decompose(skin.position, skin.quaternion, skin.scale);
                scene.add(skin);
            }
            // Keep non-rig geometry in mixed projects as well.
            const copyPlain = node => {
                if (node instanceof Armature || node instanceof ArmatureBone || node.export === false) return null;
                const object = node.scene_object;
                if (!object || object.no_export) return null;
                const copy = object.clone(false);
                copy.uuid = object.uuid;
                for (const child of node.children || []) { const c = copyPlain(child); if (c) copy.add(c); }
                return copy;
            };
            for (const node of Outliner.root) { const copy = copyPlain(node); if (copy) scene.add(copy); }
            const clips = gltf.buildAnimationTracks(16).filter(clip => {
                // The shipped GLTFExporter drops an entire clip if any track
                // targets a node absent from the exported scene. Excluded rigs
                // must not erase the remaining, included rig's animation.
                clip.tracks = clip.tracks.filter(track => {
                    const target = THREE.PropertyBinding.parseTrackName(track.name).nodeName;
                    return !!THREE.PropertyBinding.findNode(scene, target);
                });
                return clip.tracks.length > 0;
            });
            const byUuid = new Map(ArmatureBone.all.map(b => [b.uuid, b]));
            for (const clip of clips) for (const track of clip.tracks) {
                const bone = byUuid.get(track.group_uuid);
                if (bone && bone.nmtm_binding && bone.nmtm_binding.enabled && track.channel === 'scale') {
                    for (let i = 0; i < track.values.length; i++) track.values[i] *= bone.nmtm_rest_scale[i % 3];
                }
            }
            return await new Promise((resolve, reject) => {
                try {
                    new THREE.GLTFExporter().parse(scene, resolve, {animations: clips, onlyVisible: false, trs: true,
                        binary: true, truncateDrawRange: false, forcePowerOfTwoTextures: true, scale_factor: 1 / 16,
                        embedImages: true, exportFaceColors: false});
                } catch (error) { reject(error); }
            });
        } finally {
            Timeline.time = time;
            frames.forEach(([texture, frame]) => { texture.currentFrame = frame; });
            if (typeof TextureAnimator !== 'undefined') TextureAnimator.update(Texture.all.filter(t => t.frameCount > 1));
            disposable.forEach(geometry => geometry.dispose());
            if (Modes.animate) Animator.preview(); else { Canvas.updateAllBones(); Animator.showDefaultPose(); }
        }
    }
    function blenderConvert(inputPath, outputPath, kind, done) {
        let directory;
        const cleanup = () => {
            if (directory) {
                try { fs.unlinkSync(join(directory, 'convert.py')); } catch (_) {}
                try { fs.rmdirSync(directory); } catch (_) { /* retain unexpected diagnostics */ }
            }
            if (path && typeof inputPath === 'string' && typeof outputPath === 'string' && path.resolve(inputPath) === path.resolve(outputPath + '.nmtm.glb')) {
                try { fs.unlinkSync(inputPath); } catch (_) { /* owned temporary GLB only */ }
            }
        };
        return new Promise(resolve => {
            try {
                if (!childProcess || !fileExists(runtime.blenderPath)) throw new Error('Blender 4.2 was not found at ' + runtime.blenderPath + '.');
                if (!['blend', 'fbx'].includes(kind)) throw new Error('Unsupported Blender export type: ' + kind);
                if (!BLENDER_BRIDGE_BASE64) throw new Error('The bundled Blender conversion script is missing.');
                directory = fs.mkdtempSync(join(path.dirname(outputPath), '.nmtm-export-'));
                const script = join(directory, 'convert.py');
                fs.writeFileSync(script, NodeBuffer.from(BLENDER_BRIDGE_BASE64, 'base64'));
                const env = Object.assign({}, process.env, {TEMP: directory, TMP: directory, PYTHONDONTWRITEBYTECODE: '1'});
                const options = {windowsHide: true, cwd: directory, env, timeout: 15 * 60 * 1000, maxBuffer: 16 * 1024 * 1024};
                childProcess.execFile(runtime.blenderPath, ['--factory-startup', '--background', '--threads', '2', '--python-exit-code', '1', '--python', script, '--', path.resolve(inputPath), path.resolve(outputPath), kind], options, (error, stdout, stderr) => {
                    try {
                        const succeeded = !error && String(stdout).includes('NMTM_CONVERT_OK ' + kind + ' ') && fileExists(outputPath) && fs.statSync(outputPath).size > 0;
                        if (!succeeded) {
                            const detail = String(stderr || stdout || (error && error.message) || 'No successful conversion result was returned.').slice(-4000);
                            fail('Blender could not create the .' + kind + ' file.', new Error(detail));
                            resolve(null);
                            return;
                        }
                        notify((kind === 'fbx' ? 'Binary FBX' : 'Blender 4.2 file') + ' created: ' + outputPath);
                        // Settle conversion independently of a caller's follow-up.
                        // Electron invokes this callback asynchronously, outside
                        // the launch try/catch. A throwing callback must not leave
                        // the export pending or strand its temporary files.
                        resolve(outputPath);
                        if (typeof done === 'function') {
                            try { done(outputPath); }
                            catch (callbackError) { fail('The file was exported, but its post-export callback failed.', callbackError); }
                        }
                    } catch (verificationError) {
                        fail('Could not verify the Blender export result.', verificationError);
                        resolve(null);
                    } finally { cleanup(); }
                });
            } catch (error) { cleanup(); fail('Could not start the Blender export.', error); resolve(null); }
        });
    }
    async function exportFbx(done) {
        if (!fileExists(runtime.blenderPath)) { fail('Blender 4.2 was not found at ' + runtime.blenderPath + '.'); return; }
        try {
            const content = await compileRigGlb();
            Blockbench.export({ resource_id: 'nmtm_fbx', type: 'Binary FBX with textures, armature, and animations', extensions: ['fbx'], name: Project.name || 'model', startpath: Project.export_path, content, savetype: 'binary', custom_writer(data, fbxPath) {
                const tempGlb = fbxPath + '.nmtm.glb';
                Blockbench.writeFile(tempGlb, { content: data, savetype: 'binary' }, () => blenderConvert(tempGlb, fbxPath, 'fbx', done));
            } }, () => {});
        } catch (error) { fail('Could not build the GLB used for FBX export.', error); }
    }
    function runBlenderImport(inputPath, blendPath) {
        blenderConvert(inputPath, blendPath, 'blend');
    }
    async function exportBlend() {
        if (!fileExists(runtime.blenderPath)) { fail('Blender 4.2 was not found at ' + runtime.blenderPath + '.'); return; }
        try {
            // GLB is used as the interchange layer because Blender 4.2 rejects ASCII FBX
            // and the Blockbench binary FBX writer is still experimental.
            const content = await compileRigGlb();
            Blockbench.export({
                resource_id: 'nmtm_blend',
                type: 'Blender 4.2 File',
                extensions: ['blend'],
                name: Project.name || 'model',
                startpath: Project.export_path,
                content,
                savetype: 'binary',
                custom_writer(data, blendPath) {
                    const tempGlb = blendPath + '.nmtm.glb';
                    Blockbench.writeFile(tempGlb, { content: data, savetype: 'binary' }, () => runBlenderImport(tempGlb, blendPath));
                }
            }, () => {});
        } catch (error) {
            fail('Could not build the GLB used for Blender export.', error);
        }
    }
    function setBlenderPath() {
        if (!Blockbench.textPrompt) return;
        Blockbench.textPrompt('Blender 4.2 executable path', runtime.blenderPath).then(value => { if (value) { runtime.blenderPath = value; notify('NMTM Blender path updated.'); } });
    }

    // A small opt-in hook keeps pure registration/format tests independent of
    // the Blockbench UI. It is never populated during a normal plugin load.
    if (typeof globalThis !== 'undefined' && globalThis.__NMTM_TEST__) {
        globalThis.__NMTM_TEST__.api = {
            importCustom, createRig, addAnimation, compileRigGlb, blenderConvert,
            fallbackPackFormat,
            buildVersionCatalog,
            packFormatValue,
            packMetadata,
            itemModelEra,
            textureFolderForVersion,
            blockTextureFolderForVersion,
            blockStateData,
            blockItemMapping,
            safeResourcePath,
            resourceLocation,
            fitJavaBlockModel,
            nmtmBlockVoxelModel,
            nmtmAdaptiveBlockVoxelModel,
            exportJavaBlockPack,
            decodePngRgba,
            encodePngRgba,
            buildEmfTextureAtlas,
            safeFileName,
            safeNamespace,
            emfCompatibility,
            emfBoxForCube,
            emfJemData,
            emfExpression,
            emfAnimationForGroup,
            emfModelRelative,
            nmtmSectionComponents,
            nmtmMeshCuboidAnalysis,
            nmtmStrictCuboidReason,
            nmtmVoxelEmfModels
        };
    }

    const NMTM_CODEC = new Codec('nmtm_json', { name: PLUGIN_TITLE, extension: 'json', remember: true, load_filter: { type: 'json', extensions: ['json'] }, parse(data, sourceFile) { return parseModel(data, sourceFile); } });
    const NMTM_FORMAT = new ModelFormat('nmtm', { id: 'nmtm', name: PLUGIN_TITLE, description: 'NetEase mesh, armature, texture, and animation workflow', icon: 'view_in_ar', category: 'minecraft', target: 'NetEase Minecraft', box_uv: true, optional_box_uv: true, single_texture_default: true, per_texture_uv_size: true, bone_rig: true, armature_rig: true, meshes: true, centered_grid: true, texture_folder: true, animation_mode: true, animation_files: true, quaternion_interpolation: true, euler_order: 'ZYX', codec: NMTM_CODEC });
    NMTM_CODEC.format = NMTM_FORMAT;
    const ACTIONS = [];
    function addActions() {
        const add = (id, name, icon, menu, click, condition) => { const action = new Action(id, { name, icon, category: 'file', condition, click }); MenuBar.addAction(action, menu); ACTIONS.push(action); };
        add('nmtm_import_json', 'NMTM: Import JSON', 'file_open', 'file.import', () => openJson(false));
        add('nmtm_import_index', 'NMTM: Choose model variant', 'list', 'file.import', () => openJson(true));
        add('nmtm_import_bin', 'NMTM: Import BIN companion', 'file_open', 'file.import', openBin);
        add('nmtm_export_fbx', 'NMTM: Export FBX with textures and armature', 'icon-fbx', 'file.export', () => exportFbx(), () => !!Project);
        add('nmtm_export_blend', 'NMTM: Export Blender 4.2 .blend', 'view_in_ar', 'file.export', exportBlend, () => !!Project);
        add('nmtm_export_java_rp', 'NMTM: Export complete Java resource pack', 'folder', 'file.export', exportJavaResourcePackPrompt, () => !!Project);
        add('nmtm_export_java_block_rp', 'NMTM: Export Java block replacement pack', 'view_in_ar', 'file.export', exportJavaBlockPackPrompt, () => !!Project);
        add('nmtm_export_emf', 'NMTM: Export EMF/CEM entity pack (entities only)', 'account_tree', 'file.export', exportEmfEntityPackPrompt, () => !!Project);
        add('nmtm_refresh_mc_versions', 'NMTM: Refresh Minecraft version list', 'refresh', 'file.5', refreshMinecraftVersions);
        add('nmtm_version_cache_path', 'NMTM: Set Minecraft version cache folder', 'folder', 'file.5', setVersionCacheFolder);
        add('nmtm_blender_path', 'NMTM: Set Blender 4.2 path', 'settings', 'file.5', setBlenderPath);
    }
    // Keep compatibility with the first local install, which used an uppercase basename.
    const registrationId = typeof Plugins !== 'undefined' && Plugins.registered
        ? (Object.keys(Plugins.registered).find(id => id.toLowerCase() === 'nmtm') || PLUGIN_ID)
        : PLUGIN_ID;
    Plugin.register(registrationId, {
        title: PLUGIN_TITLE,
        author: 'NMTM',
        description: 'Import NetEase meshes, skeletons, textures, and animations; export FBX, Blender 4.2 files, vanilla Java item/block packs, or EMF/CEM entity packs.',
        about: [
            '# Netease Mesh To Modle (NMTM)',
            '',
            'NMTM imports NetEase Minecraft model data into Blockbench, including meshes, skeletons, textures, and animation tracks.',
            '',
            'Use the **File > Import** menu for NetEase JSON, model variants, or BIN companion files. Use **File > Export** for FBX, Blender 4.2, vanilla Java item/block resource packs, or EMF/CEM entity packs.',
            '',
            'EMF/CEM export targets existing Minecraft entities. Strict mode reconstructs rigid cuboid meshes; voxel mode approximates curves and irregular triangles with a bounded number of small CEM boxes. FBX and Blender remain the lossless routes for arbitrary meshes and blended skinning.'
        ].join('\n'),
        version: PLUGIN_VERSION,
        variant: 'desktop',
        icon: 'view_in_ar',
        min_version: '5.0.0',
        onload() { runtime.textures.clear(); installRigSupport(); addActions(); },
        onunload() {
            RIG_LISTENERS.splice(0).forEach(remove => remove());
            RIG_PROPERTIES.splice(0).forEach(property => property.delete());
            if (rigRotationWrapper && ArmatureBone.animator.prototype.displayRotation === rigRotationWrapper) ArmatureBone.animator.prototype.displayRotation = rigRotationOriginal;
            ACTIONS.forEach(action => action.delete());
            ACTIONS.length = 0;
            if (NMTM_CODEC.delete) NMTM_CODEC.delete();
            if (Formats.nmtm) delete Formats.nmtm;
        }
    });
})();
