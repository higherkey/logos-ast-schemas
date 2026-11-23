# Branch Notes: ci/validate-and-smoke

> **Status:** in review · **Next:** merge · **Updated:** 2026-11-22

## 1. Discoveries & Deviations
- Add PR CI (content validator, PR title and branch-notes checks) and run the same validation before every Pages deploy, followed by a smoke test of the published `schemas/index.json`. Per project-logos CI/CD spec v1.1.
- Extend `validate-content.mjs`: `moves_count` must match each schema's `moves`, and every `schemas/*.json` must be listed in the index. Both checks were tried against broken content and fail as expected.

## 2. Blockers & Risks (4a)
- None.

## 3. Quick Wins (4b)
- None.

## 4. Deferred Items (4c)
- SonarCloud scan of the JS/CSS/HTML once `SONAR_TOKEN` is set.
