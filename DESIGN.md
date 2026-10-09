# DESIGN — Bitspring: Home Signal

> The pitch: **Mega Man Battle Network × Robopon × The World Ends With You × Pokémon** — set in a quiet modern cyber-town that doesn't know it's being watched.

You're a kid in the town of **Bitspring**, home of companion robots. Robots here run on **Ghostlight AIs** — small personalities you install like a soul. One week, the town's network pulls you into **the Signal**: a seven-day test broadcast that watches what you do behind the wallpaper of ordinary life.

## Pillars

1. **A town that feels alive** — tiny, dense, readable. Every NPC has thoughts (scan them) and a little arc. Warm, wry, TWEWY-edge dialogue.
2. **Build your partner** — robots are assembled from frames, heads, arms, legs, batteries, cores — then given an AI. Your build IS your playstyle (Robopon depth, modern readability).
3. **Battles as scenes** — chip-driven grid duels (Battle Network DNA): draw chips, plan a turn, read enemy intent, land it with style.
4. **The double life** — the same town exists twice: the **Realground** (everyday streets) and **the Signal** (the underlayer: static, neon ghosts, the game's rules). Scan and imprint are your windows between the layers.

## Story sketch (TWEWY-inspired, fully original — no copyrighted names)

- **Seven days.** The Signal runs a week; each day has a mission. Fail a day and the town forgets you a little — your partner PIP loses a memory shard. The stakes are memory, identity, connection.
- **You** — the newest kid in Bitspring. You find a cracked robot (PIP) in the signal-shadow of the fountain. PIP speaks in fragments at first; recovering PIP's memory is the emotional through-line. Partner banter = the engine.
- **The Arbiter** — the Signal's game-master voice: polite, playful, all-seeing. **Static** — feral signal-noise that infects robots. Adults can't see the Signal; they think the wifi is weird.
- **End of week (Phase 2+)** — the reveal: the Signal was a test of whether the town could *connect* (or was it a sale?). Keep it ambiguous, warm, a little sad.

## Systems → lineage map

| Bitspring system | Lineage | Implementation notes |
|---|---|---|
| Chip deck battles, 3×3 grid | Battle Network | Chips = moves; draw ~5/turn, play up to 3; enemy intent telegraphed; HP + busting |
| Robot parts, batteries, AI chips | Robopon | Builds derive stats; battery gates energy; AI = behavior mods + voice/flavor |
| Town, days, collect & bond | Pokémon | Day-1 zone density like Pallet Town; NPCs, trades, secrets, sidequests |
| Scan thoughts + imprint ideas | The World Ends With You | Hold S near an NPC → thought bubbles; imprint = plant a word-idea to change behavior (real puzzle hooks) |
| Realground vs the Signal | TWEWY dual-layer | Visual mode; some objects/entities exist in only one layer |
| Ghostlight AI personalities | original | 6 templates: KINDLE (aggressive), TIDE (support), VOLT (fast/risky), MOSS (guard), ECHO (deception), HOLLOW (wildcard) |

## Rules of the world (for writers of the night)

- Protagonist age ~13. Tone: warm, wry, anime-GBA. No gore, no romance.
- Robots are friends, not tools — dialogue treats them as people with quirks.
- "Modern world" texture: phones, feeds, deliveries, ads, group chats. Contemporary-retro-tech — CRT terminals next to phone screens.
- Never use real brands, or any names/characters/text from the source games. "The Signal", "the Arbiter", "the Underpass" — in. Everything borrowed — out.

## Art & audio direction

- Pixel-GBA 3D: `OrthographicCamera`, `MeshLambert` materials, nearest-filter canvas textures, chunky proportions. Match the existing code.
- Palette: ink `#07121d`, panel `#0b1d2d`, cyan `#5ff6e7`, lime `#c9fa68`, pink `#ff70ae`, paper `#e7f6ff`.
- Audio: procedural WebAudio only — town loop, battle theme, SFX. Music must always be mutable.

## Multiplayer trajectory (Phase 2–3 — do not rush it in Phase 1)

1. **v0 Ghost Battles (async, no server):** a robot build exports a share-code (string/URL); a friend imports it and duels an AI-driven version. Trading via share-codes too. → *Phase-1 implementation note: keep every robot build a serializable plain object from day one.*
2. **v1 Live lobby (WebSockets):** a small realtime server for duels + co-op Static raids; friend codes; spectate.
3. Keep ALL netcode out of Phase 1. Only the data structures anticipate it.

## Where things live

`ROADMAP.md` = the task truth. `PROGRESS.md` = the story of the night. The shift process lives in the night-shift cron job prompt.
