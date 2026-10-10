# ROADMAP — Bitspring

Rules: pick the FIRST unchecked `- [ ]` item. One task per shift (~25 min). Verify + commit + push + tick + log. Never renumber existing task IDs. New/split tasks: append at the END of their phase. **Engine: stay on Three.js — do not port or rewrite from scratch; improve the existing codebase incrementally.**

## Phase 0 — Bootstrap ✅

- [x] P0 — Repo `~/games/bitspring`, GitHub `tripleA93/bitspring` + Pages, mission docs, `tools/syntax-check.mjs`, prototype in `index.html`. (Main session, 2026-10-10 ~01:30.)

## Phase 1 — Core (target: overnight)

- [x] P1.1a — **Extract code (verbatim).** Move the inline `<script type="module">` JS from `index.html` into new `src/main.js` — byte-for-byte identical logic, NO reformatting yet. Move the `<style>` CSS into `styles.css` (loaded via `<link>`; keep the Google Fonts `@import` as its first line). `index.html` keeps: importmap, canvas + HUD markup, `<script type="module" src="src/main.js?v=1">`. Behavior must be identical. `tools/syntax-check.mjs` already auto-detects `src/main.js`.
- [x] P1.1b — **De-minify `src/main.js`.** Reformat to readable multi-line code (spacing, indentation, short clarifying names where 100% safe). ZERO behavior changes. Verify.
- [x] P1.2 — **Models & look upgrade (USER PRIORITY — explicitly requested: "nice models").** Nicer character + robot models and rendering: layered-primitive characters (helmet/visor/armor layering, expressive robot shapes per frame) using the `three-js-game` skill's character-model patterns; palette-consistent lighting; contact/blob shadows; accent emissives; optional subtle outline pass. Keep the GBA-pixel aesthetic (ortho camera, Lambert materials, nearest-filter textures). Covers: player, PIP companion, Wren + NPCs, robot frames, battle enemies, key props.
- [x] P1.3 — **Music & audio upgrade (USER PRIORITY — explicitly requested: "I want music").** Richer procedural WebAudio soundtrack with GBA flavor: layered evolving town theme, distinct battle theme with intensity layers, victory jingle, zone variations; master volume (persisted, mutable); full SFX pass (UI, hits, pickups, robot sounds). Music must start only after a user gesture (browser autoplay policy — the start screen already provides one). Default = procedural WebAudio; the `three-js-game` skill's `references/mp3-background-music.md` documents an asset-music pattern as a possible bonus.
- [x] P1.4 — **Save v2 + title flow.** Versioned save schema (new key, e.g. `bitspring.save.v2`) with migration from the old key; title screen (Continue / New Game / music toggle); settings persisted. Never lose a player's save.
- [ ] P1.5 — **Battle v2 (Battle-Network-style).** Turn-based grid battle: player 3×3 zone vs enemy zone; chip deck; hand of ~5; play up to 3 chips/turn (attack / heal / guard / dash); enemy intent telegraphed; HP bar; win → data reward + part drop; lose → friendly retry. Integrate with the Battle Gate + rogue signal flow.
- [ ] P1.6 — **Workbench v2 (Robopon depth).** Robot = frame + head/arm/leg + battery + core + AI chip. Hatchery becomes a workbench: slots, derived stat preview, equip/unequip. 6 Ghostlight AI templates (see DESIGN.md) with battle behavior mods + flavor lines. Model reflects parts. Builds stay plain serializable objects.
- [ ] P1.7 — **Day/Mission system + Day 1.** "Day 1 — First Contact": objective chain (meet Wren → build robot → win Gate battle). TWEWY-style day-card intro, mission tracker HUD, completion → Day 2 teaser. Day stored in save.
- [ ] P1.8 — **Scan & thoughts.** Hold [S] near NPCs → thought bubbles (2–4 lines, ≥8 NPCs). One imprint puzzle (deliver an "idea" to unblock something). TWEWY flavor.
- [ ] P1.9 — **World expansion.** One new zone ("Dock Row" — market/lantern district): 3+ interactables, connecting path from town, transition, own NPC thoughts.
- [ ] P1.10 — **Juice pass.** Scene transitions (fade/glitch), battle feel (hit-pause, shake), extra particles; polish pass on feedback/status moments.
- [ ] P1.11 — **Release prep.** Vendor `three.module.js` locally (`vendor/`, importmap → local; works offline); README final; `tools/pack.sh` → `dist/bitspring.zip` for itch.io; save 2–3 screenshots to `screenshots/` via the browser tool.
- [ ] P1.12 — **QA sweep.** Full Day-1 play-through bug bash; fix all console errors; edge cases (resize, mute, fast clicking, save/load cycles); performance pass (60fps).

## Phase 2 — Signal (stretch / after the first night)

- [ ] P2.1 — **Day 2: "Signal Hunt".** Scan-driven mission; new enemy types (Static, Echo, Glitch); second boss (Echo of PIP?).
- [ ] P2.2 — **Trading depth.** Swap Meet v2: repeatable trades, rare parts, seeded daily rotation, robot nicknames/paint.
- [ ] P2.3 — **Ghost Battles v0 (async multiplayer).** Export a robot as a share-code (URL/string); import a friend's and duel its AI. No server. (First step toward playing with other people.)
- [ ] P2.4 — **Dual-layer visuals.** Realground vs the Signal as a visual mode + objects that exist in only one layer (DESIGN.md).

## Phase 3 — Convergence (later wishlist)

- [ ] P3.1 — **Live multiplayer.** WebSocket lobby (small Node server or WebRTC p2p): duels + co-op Static raids; friend codes; spectate.
- [ ] P3.2 — **Days 3–7.** Complete the first-week arc; day-gated zones; finale vs the Arbiter.
- [ ] P3.3 — **Packaging.** itch.io/Steam prep; controller + mobile touch support.
- [ ] P3.4 — **Community.** Build-sharing site, weekly seeds, leaderboards.
