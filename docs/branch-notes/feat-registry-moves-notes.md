# Branch Notes: feat/registry-moves

> **Status:** in-review (PR #3) · **Next:** merge; Pages redeploys and core sees the moves · **Updated:** 2026-11-16

v9 M1 slice S1: registry `moves[]` for the four baseline systems, the decision-model intent candidates (v9 Document 1 §1, Document 2 §2).

## 1. Discoveries & Deviations
- Schema and index files are CRLF in the working copy. Insertions keep each file's own line ending, so the diff contains no mixed endings.
- `d20_srd_v1.json` has no `function_contract` key, unlike the other three. It was left as-is; that's out of scope here.
- Move shape: `{id, name, description (max 200 chars), stat?}`. IDs are snake_case and unique per system. The descriptions are original one-line summaries, not rulebook text.

## 2. Blockers & Risks (4a)
- None. logos-core can't see the moves until this merges and Pages redeploys from `main`. Core slice S2 treats a missing `moves` as an empty list.

## 3. Quick Wins (4b)
- Added `moves_count` to each `index.json` entry, shown as text on the existing sidebar and detail meta lines. No new CSS or markup.

## 4. Deferred Items (4c)
- `styles.css` is 9,082 bytes, over the Sitewright 6,144-byte CSS budget, on `main` and on this branch alike. This predates the branch and needs a separate issue.
- Render the full moves list in the schema detail view.
