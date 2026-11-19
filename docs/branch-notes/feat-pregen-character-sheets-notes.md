# Branch Notes: feat/pregen-character-sheets

> **Status:** committed locally · **Next:** push and open a PR · **Updated:** 2026-11-19

## 1. Discoveries & Deviations
- Add full character sheets to the four Dungeon World pregens: damage die, armor, alignment, gear, bonds and class moves.
- Add an optional `player_intro` (tagline, premise, stakes, how to play) to the Ruined Watchtower pack.
- Change the Last Breath 7-9 outcome so the character always takes Death's bargain, which the table can resolve without a choice prompt.
- Make `validate-content.mjs` require the new pregen fields and check `player_intro` when present.

## 2. Blockers & Risks (4a)
- None. The wrapper reads every new field as optional, so older wrapper builds keep working.

## 3. Quick Wins (4b)
- None.

## 4. Deferred Items (4c)
- None.
