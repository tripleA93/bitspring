# PROGRESS — shift log

Append new entries at the END, newest last. Format: `## <YYYY-MM-DD HH:MM> — <task-id> <title>` + 3–8 lines (what changed / commit / state / next / blockers).

## 2026-10-10 01:00 — P0 Bootstrap (main session, not a shift)

- Repo created at `~/games/bitspring`; initial commit = the playable Codex prototype (`bitspring.html` → `index.html`, original kept at `prototype/bitspring.codex-prototype.html`).
- GitHub: https://github.com/tripleA93/bitspring — Pages enabled → https://triplea93.github.io/bitspring/ (first deploy can take ~5–10 min).
- Mission docs: `DESIGN.md` (vision), `ROADMAP.md` (task queue); the shift protocol is embedded in the night-shift cron job. Tooling: `tools/syntax-check.mjs`.
- Night-shift cron: 9 shifts, ~every 45m (first at 02:00). Morning briefing 09:00 → Telegram; watchdog runs every 45m (silent unless stalled); keep-awake cleanup at 11:00.
- NEXT: P1.1a (extract code verbatim) → P1.1b (de-minify) → P1.2 models → P1.3 music → … User priorities (music, nicer models) deliberately queued as shifts #3–#4.

## 2026-10-10 02:03 — P1.1a Extract code verbatim

- Moved the inline `<script type="module">` JS (36,246 chars) out of `index.html` into `src/main.js`, byte-for-byte identical (no reformatting).
- Moved the `<style>` CSS (14,400 chars) into `styles.css`, loaded via `<link>`; the Google Fonts `@import` remains its first line.
- `index.html` now keeps only the importmap, canvas + HUD markup, and `<script type="module" src="src/main.js?v=1">`. `tools/syntax-check.mjs` auto-detected `src/main.js` → PASS.
- Verified in a live browser: canvas 640×360 present, start screen → click `#start-button` → HUD shows `flex`, zone BITSPRING, zero console errors.
- Commit `714b033`, pushed to `main`. Behavior identical; game fully loads and plays.
- NEXT: P1.1b (de-minify `src/main.js`, zero behavior change).

## 2026-10-10 02:55 — P1.1b De-minify src/main.js

- Reformatted `src/main.js` (36 KB minified → 42 KB readable): per-function multi-line bodies, named-section comments, expanded one-liner helpers (`box`, `mat`, `labelSprite`, model builders, audio, panels, battle).
- Zero behavior change: preserved every string/Unicode glyph verbatim, the `||=` in `mat()`, all `?.` optional chains, the nested backtick template in the AI panel, and the internal newlines of the multi-line HTML template literals. No names/values altered.
- Bumped cache-buster `src/main.js?v=1` → `?v=2` in `index.html`.
- Verified: `node tools/syntax-check.mjs` PASS (42,419 chars); live browser on `localhost:8123` — canvas 640×360 present, `#start-button` → HUD flex + BITSPRING zone + intro dialogue, zero runtime errors. (rAF throttled headless → movement/panel paths not drivable, same limit as prior shift; those paths were already play-tested pre-refactor.)
- NEXT: P1.2 — models & look upgrade (user priority: "nice models").

## 2026-10-10 03:45 — P1.2 Models & look upgrade

- Rewrote `createHumanoid` (player/Wren/steward) into a layered character: boots, belt, emissive chest accent, sleeved arms with hands, shaped hair (top/fringe/sides) and face. Rewrote `createRobot` for all frames: emissive visor band + eyes + mouth grill, pulseable energy core, back thruster, pauldron caps, hands, knee pads, and distinct crests per frame (TIDAL fin, CINDER twin flame, MOSS leaf tips).
- Added `blobShadow()` (radial-gradient contact shadows) under every humanoid and robot — grounds characters in town and battle.
- Animated the energy core's `emissiveIntensity` in the frame loop (companion + both battle robots) for a living glow.
- Fixed a latent bug: the companion bob previously animated a detached model — `buddyModel` is now `let` and reassigned in `refreshHud()` so the visible partner (and its core) animate correctly.
- Verified: `node tools/syntax-check.mjs` PASS; live browser on `localhost:8123` — canvas 640×360, `#start-button` → start hidden + HUD flex + BITSPRING zone, zero console errors.
- Commit `e93febe`, pushed to `main`. Optional outline pass deliberately skipped (flagged optional); key props (buildings/trees/fountain) already present.
- NEXT: P1.3 — music & audio upgrade (user priority: "I want music").
