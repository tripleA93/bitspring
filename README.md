# Bitspring: Home Signal

*A robot-partner RPG for the browser — Mega Man Battle Network × Robopon × The World Ends With You × Pokémon, set in a quiet modern cyber-town that doesn't know it's being watched.*

**▶ Play (live):** https://triplea93.github.io/bitspring/ · **Repo:** https://github.com/tripleA93/bitspring

## Run locally

```sh
cd bitspring
python3 -m http.server 8000
# open http://localhost:8000
```

Needs internet while Three.js is loaded from CDN (a later task vendors it locally for offline play).

## Controls (current prototype — evolving nightly)

| Key | Action |
|---|---|
| WASD / arrows | Move |
| E | Interact (Wren, the Hatchery, the Swap Meet, the Battle Gate) |
| Enter | Start / confirm |
| ♫ button | Music on/off |

## The pitch

Explore Bitspring, assemble your robot from frames and parts, install a Ghostlight AI, trade at Moss's Swap Meet, and descend into **the Signal** — the underlayer where the town's rules live. Scan a stranger's thoughts. Imprint an idea. Win the week.

## Status

Under active construction by an agent night-shift. `ROADMAP.md` = what's next; `PROGRESS.md` = what just happened; `DESIGN.md` = the vision.

Prototype origin: a single-file Three.js game first drafted in a Codex session (2026-10-09); kept at `prototype/bitspring.codex-prototype.html` for reference.

## Dev

- `node tools/syntax-check.mjs` — parse-check the game JS (must PASS before any commit)
- No build step, no framework. Procedural assets only (WebAudio + canvas textures).

*Pre-release — all rights reserved.*
