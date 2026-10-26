'use strict';

// Read the installed source map directly from ASAR. Nothing is extracted or
// written, and the helper needs no Electron runtime or npm dependencies.
const fs = require('node:fs');
const path = require('node:path');

function resolveAsarPath() {
  if (process.env.NMTM_BLOCKBENCH_ASAR) return path.resolve(process.env.NMTM_BLOCKBENCH_ASAR);
  const executable = process.env.BLOCKBENCH_EXE || 'D:/Apps/Blockbench/Blockbench.exe';
  return path.resolve(path.dirname(executable), 'resources/app.asar');
}

function readExact(fd, size, offset) {
  const data = Buffer.alloc(size);
  let read = 0;
  while (read < size) {
    const count = fs.readSync(fd, data, read, size - read, offset + read);
    if (!count) throw new Error('Unexpected end of Blockbench ASAR archive');
    read += count;
  }
  return data;
}

function readBlockbenchSources() {
  const archive = resolveAsarPath();
  let fd;
  try {
    fd = fs.openSync(archive, 'r');
    const size = fs.fstatSync(fd).size;
    if (size < 16) throw new Error('Invalid ASAR header');
    const prefix = readExact(fd, 16, 0);
    const headerSize = prefix.readUInt32LE(4);
    const jsonSize = prefix.readUInt32LE(12);
    if (prefix.readUInt32LE(0) !== 4 || jsonSize > headerSize - 8 || headerSize > size - 8) {
      throw new Error('Invalid ASAR header size');
    }
    const header = JSON.parse(readExact(fd, jsonSize, 16).toString('utf8'));
    const entry = header.files?.dist?.files?.['bundle.js.map'];
    if (!entry || entry.unpacked || !Number.isSafeInteger(entry.size) || entry.size < 0) {
      throw new Error('Installed ASAR does not contain dist/bundle.js.map');
    }
    const offset = 8 + headerSize + Number(entry.offset);
    if (!Number.isSafeInteger(offset) || offset < 8 + headerSize || entry.size > size - offset) {
      throw new Error('Invalid source-map entry range');
    }
    const map = JSON.parse(readExact(fd, entry.size, offset).toString('utf8'));
    if (!Array.isArray(map.sources) || !Array.isArray(map.sourcesContent) || map.sources.length !== map.sourcesContent.length) {
      throw new Error('Installed bundle source map has no matching sourcesContent');
    }
    return map;
  } catch (error) {
    throw new Error(`Cannot read installed Blockbench sources at ${archive}. Set BLOCKBENCH_EXE or NMTM_BLOCKBENCH_ASAR to your installation. ${error.message}`, {cause:error});
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

module.exports = readBlockbenchSources;
module.exports.resolveAsarPath = resolveAsarPath;

if (require.main === module) {
  const map = readBlockbenchSources();
  console.log(JSON.stringify({archive:resolveAsarPath(), sources:map.sources.length, readOnly:true}, null, 2));
}
