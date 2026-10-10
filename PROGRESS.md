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

## 2026-10-10 04:38 — P1.3 Music & audio upgrade

- Refactored the audio section: split `initAudio()` (idempotent, always returns the context) from `startMusic()`, so SFX and music share one master gain bus and the init-return-undefined pitfall is gone.
- Richer music: town theme now has a shimmering arpeggio layer + an evolving counter-line on the back half of each 32-step phrase; battle theme gains three intensity layers (doubled lead → driving hats/bass → full 8th-note pulse) driven by a `battleIntensity` value that ramps up as rounds progress.
- Added a victory jingle (rising square arp + held chord) and defeat jingle (falling phrase), fired from `finishBattle`.
- Master volume: new `bitspring-settings-v1` localStorage (musicOn + volume persisted), a `VOL` slider under the music toggle, `M` key toggles music, controls hint updated. Volume applies to music + SFX together.
- Full SFX pass wired in: dialogue blips, panel open/tab/frame/AI select, confirm on buy/sell/install/set-partner, robot-build chirp, battle hit/heavy-hit/guard/heal/enemy-hit.
- Verified: `node tools/syntax-check.mjs` PASS (50,293 chars); live browser on `localhost:8123` — canvas 640×360, start → HUD flex, music-toggle ON→OFF toggles, volume slider 32→55 updates, zero console errors.
- Commit `de9f92d`, pushed to `main`. Zone-variation theme swap (distinct per-zone melody) deferred until more zones exist (Dock Row is P1.9); current town/battle split already varies by theme.
- NEXT: P1.4 — Save v2 + title flow.

## 2026-10-10 05:31 — P1.4 Save v2 + title flow

- Save schema versioned: new key `bitspring.save.v2` with `version: 2`; `load()` migrates a legacy `bitspring-save-v1` save up to v2 automatically and keeps the v1 key as a backup. No save is ever lost on migration.
- Title screen rebuilt: `CONTINUE` (only when a save exists; shows robot name + AI, else "RESUME DAY 01") alongside `NEW GAME`. A confirmed erase (double-click "ERASE SAVE?") clears both keys so a stale v1 backup can't resurrect an old save.
- Music toggle + volume slider now also visible on the title screen (shown at boot), so music is controllable before starting. Enter = Continue; `#start-button` = New Game.
- Verified live on `localhost:8123`: fresh boot → no CONTINUE, NEW GAME starts + intro dialogue + v2 written; reload → CONTINUE appears and resumes; seeded v1 migrates to v2 (`SPROCKET • SPARK`); erase flow wipes clean (chips→8, v1 removed). `node tools/syntax-check.mjs` PASS (52,384 chars).
- Commit pending (this shift). NEXT: P1.5 — Battle v2 (Battle-Network-style grid battles).

## 2026-10-10 06:20 — P1.5 Battle v2 (Battle-Network-style grid)

- Rebuilt battle as a chip-deck grid duel: 16-card deck (PING/BOOM/AI DRIVE/GUARD/PATCH/DASH), hand of 5 redrawn each turn, queue up to 3 chips then EXECUTE. AI DRIVE damage stays Ghostlight-dependent (SPARK/ORACLE/BASTION), +3 dmg when lined up in the enemy's column.
- Added two 3×3 grid zones (hero/rogue) with click-to-move panels; enemy intent is telegraphed each turn (HEAVY STRIKE / SPLIT SHOT / RECHARGE / OVERRUN, targeting a column) — move out of the aimed column or DASH to dodge.
- Win now drops a part (PRISM PLATING / PHASE COIL, or +2 scrap if the kit is full) alongside 4 chips + 2 scrap; lose keeps the friendly Wren retry.
- Fixed a latent win-crash: `startBattle` replaces `#hud-right` (removing `#hud-chips`), so `refreshHud()` threw during battle; now guarded.
- Added inert `window.__bitspringDebug` handle for headless QA.
- Verified live on `localhost:8123`: full win path (finish flex, SIGNAL SECURED, PHASE COIL drop, returnTown restores hud-chips) and lose path (PARTNER DOWN) both clean; queue caps at 3; syntax PASS (58,308 chars).
- Commit `3c5adbb`, pushed. NEXT: P1.6 — Workbench v2 (Robopon part depth).
