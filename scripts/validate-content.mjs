// Validates schemas and campaign packs listed in schemas/index.json and campaigns/index.json.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATS = new Set(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'varies', 'none']);
const errors = [];
const fail = (file, id, msg) => errors.push(`${file}${id ? ` [${id}]` : ''}: ${msg}`);

function load(file) {
  try {
    return JSON.parse(readFileSync(join(root, file), 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    fail(file, null, `cannot read/parse: ${e.message}`);
    return null;
  }
}

function requireKeys(obj, keys, file, id) {
  for (const k of keys) if (obj[k] === undefined || obj[k] === null) fail(file, id, `missing key "${k}"`);
}

function uniqueIds(list, file, what) {
  const seen = new Set();
  for (const item of list ?? []) {
    if (seen.has(item?.id)) fail(file, item?.id, `duplicate ${what} id`);
    seen.add(item?.id);
  }
}

const nonEmpty = (s) => typeof s === 'string' && s.trim() !== '';

function checkDungeonWorld(s, file) {
  requireKeys(s, ['id', 'title', 'version', 'license', 'attribution', 'moves', 'gm_moves', 'damage', 'pregens'], file, s.id);
  uniqueIds(s.moves, file, 'move');
  uniqueIds(s.gm_moves, file, 'gm_move');
  uniqueIds(s.pregens, file, 'pregen');
  for (const m of s.moves ?? []) {
    requireKeys(m, ['id', 'name', 'description', 'stat', 'outcomes'], file, m.id);
    if (!STATS.has(m.stat)) fail(file, m.id, `invalid stat "${m.stat}"`);
    for (const t of ['strong', 'weak', 'miss']) if (!nonEmpty(m.outcomes?.[t])) fail(file, m.id, `empty outcome "${t}"`);
  }
  for (const g of s.gm_moves ?? []) requireKeys(g, ['id', 'name', 'description'], file, g.id);
  for (const k of ['minor', 'normal', 'severe']) if (!nonEmpty(s.damage?.[k])) fail(file, 'damage', `missing "${k}"`);
  for (const p of s.pregens ?? []) {
    requireKeys(p, ['id', 'class_name', 'name', 'stats', 'max_hp', 'look'], file, p.id);
    for (const st of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'])
      if (!Number.isInteger(p.stats?.[st])) fail(file, p.id, `stat "${st}" is not an integer`);
  }
}

function checkPack(p, file, schemaIds) {
  requireKeys(p, ['id', 'title', 'system_id', 'license', 'opening_scene', 'locations', 'npcs', 'threats', 'gm_notes'], file, p.id);
  if (!schemaIds.has(p.system_id)) fail(file, p.id, `system_id "${p.system_id}" is not an indexed schema`);
  const known = new Set([...(p.locations ?? []), ...(p.npcs ?? []), ...(p.threats ?? [])].map((x) => x.id));
  const locs = new Set((p.locations ?? []).map((x) => x.id));
  const os = p.opening_scene ?? {};
  requireKeys(os, ['location_id', 'title', 'summary', 'entity_ids'], file, 'opening_scene');
  if (!locs.has(os.location_id)) fail(file, 'opening_scene', `unknown location_id "${os.location_id}"`);
  for (const e of os.entity_ids ?? []) if (!known.has(e)) fail(file, 'opening_scene', `unknown entity_id "${e}"`);
  for (const l of p.locations ?? []) requireKeys(l, ['id', 'name', 'description'], file, l.id);
  for (const n of p.npcs ?? []) requireKeys(n, ['id', 'name', 'description', 'wants'], file, n.id);
  for (const t of p.threats ?? []) requireKeys(t, ['id', 'text'], file, t.id);
}

const schemaIndex = load('schemas/index.json');
const campIndex = load('campaigns/index.json');
const schemaIds = new Set();
let schemaCount = 0;
let campCount = 0;

for (const entry of schemaIndex?.schemas ?? []) {
  schemaIds.add(entry.id);
  const file = entry.schema_file;
  if (!file) { fail('schemas/index.json', entry.id, 'missing schema_file'); continue; }
  const s = load(file);
  if (!s) continue;
  schemaCount++;
  if (s.id !== entry.id) fail(file, entry.id, `id mismatch "${s.id}"`);
  if (entry.id === 'dungeon_world_v1') checkDungeonWorld(s, file);
}

for (const entry of campIndex?.campaigns ?? []) {
  const p = load(entry.pack_file);
  if (!p) continue;
  campCount++;
  if (p.id !== entry.id) fail(entry.pack_file, entry.id, `id mismatch "${p.id}"`);
  if (p.system_id !== entry.system_id) fail(entry.pack_file, entry.id, 'system_id differs from campaigns/index.json');
  checkPack(p, entry.pack_file, schemaIds);
}

if (errors.length) {
  console.error(errors.map((e) => `FAIL ${e}`).join('\n'));
  process.exit(1);
}
console.log(`OK: ${schemaCount} schemas, ${campCount} campaign${campCount === 1 ? '' : 's'}`);
