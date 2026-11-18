# Branch Notes: feat/table-poc

> **Status:** in-progress (Task 1 committed, not pushed) · **Next:** engine and wrapper read these files · **Updated:** 2026-11-17

Open content for the GM-less Dungeon World table POC: the `dungeon_world_v1` system and the original `ruined-watchtower` one-shot.

## 1. Discoveries & Deviations
- `schemas/index.json` and the other schema files are CRLF in the working copy. The new index entry keeps CRLF, so the diff has no mixed endings.
- `stats` hold modifiers (-1..+2), not 3-18 scores. `max_hp` = class base + typical CON score (Fighter 25, Thief 18, Cleric 21, Wizard 16).
- Dungeon World text is summarised in original wording with attribution (CC BY 3.0). The one-shot is original (CC BY 4.0).
- `scripts/validate-content.mjs` checks every indexed schema and pack: `node scripts/validate-content.mjs`.

## 2. Blockers & Risks (4a)
- None.

## 3. Quick Wins (4b)
- None.

## 4. Deferred Items (4c)
- The site (`app.js`) does not yet render `campaigns/index.json`.
- CI does not yet run the validator.
