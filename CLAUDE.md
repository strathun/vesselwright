# CLAUDE.md — Vesselwright

Read automatically by Claude Code at the start of every session. Keep it current.

**DESIGN.md is the source of truth for game systems and its pillars are rules.** The first one, "every combination resolves," means no hand-written combos or special cases. Read it before changing anything in `js/engine/`.

## Overview

A browser game (installable PWA) about building rites in a socket lattice, then testing them in freeze-time combat.
Hosted on GitHub Pages at `https://strathun.github.io/vesselwright/` from the `main` branch root.
Vanilla HTML/CSS/JS with ES modules. No framework, no bundler, no build step. Deploy = `git push origin main`.

Sibling of the hub site (`strathun/strathun.github.io`). It shares the hub's origin and Supabase project, but not its design system.

## Run it

```bash
python3 -m http.server 8080     # ES modules do not load from file://
node tools/check.mjs            # combination tester + project checks; CI runs this on every push
```

The service worker only registers over https, so local runs always load fresh files.

## Structure

```
index.html            markup only; loads version.js, vendor/supabase.min.js, js/main.js
version.js            VW_VERSION, the single version string (page and service worker)
sw.js                 offline cache; SHELL must list every file under js/ (check.mjs enforces)
manifest.webmanifest  PWA manifest; icons/ holds the PNGs
css/game.css          all styles
js/
  main.js             boot: load save, render, wire bus listeners, start cloud sync, register SW
  bus.js              on/emit: how the engine talks to the UI
  data.js             every content table: essences, stones (FX), modifiers, enemies, depths, prices
  util.js             tiny helpers ($, clamp, fmt, keys for links/resonance)
  state.js            S (the save), migrations, save/load, backups, save codes, small queries
  cloud.js            Supabase auth + sync of S
  engine/             DOM-free game logic, importable from Node
    rites.js          packet algebra: MODFN, poolOf, compileRite
    discovery.js      Insight values, Codex names, recordDisc
    growth.js         XP, levels, mastery
  ui/                 bench, fuse, codex, shop (Reliquary), descend, save tabs; app.js routes tabs
  trial/              the descent: combat.js (rules), hud.js (DOM HUD), view.js (canvas), input.js
tools/check.mjs       compiles ~15k rite combinations and fails on anything unresolvable
supabase/schema.sql   the saves table and RLS policies
```

## Architecture rules

- **`js/engine/`, `state.js`, `data.js`, `util.js` and `bus.js` must never touch the DOM** or import from `ui/` or `trial/`. `tools/check.mjs` imports them in Node. The engine reports events with `emit` (`discover`, `levelup`, `mastered`, `saved`, `state-replaced`, `cloud`, `trial-end`), and the UI subscribes.
- `S` (state.js) and `T` (trial/combat.js) are `export let` live bindings. Only their own module may reassign them (`setState`, `startTrial`/`endTrial`). Mutating their properties is fine anywhere.
- `UI` (ui/ui-state.js) is a const object; reset it with `Object.assign`.
- Modules may import each other in cycles, but top-level code may only use `$`/`document` and data. Do the real wiring in functions called from `main.js`.
- Content goes in `data.js`. Behaviour goes in the engine. A new modifier is an entry in `FX` and `MODS` plus a `MODFN` function `(packets, cost, level) => packets`. It must keep magnitudes finite and ≥ 0, and only produce kind:side pairs that exist in `KN`. The Codex and the tester pick it up automatically.

## Saves

- Local storage key `vesselwright.save`. One backup slot, `vesselwright.backup`, is written before anything replaces the save (cloud load, save code, restore, start over).
- **Whenever the shape of `S` changes, bump `SAVE_VERSION` in state.js and add a step to `MIGRATIONS`.** Old saves exist on phones and in the cloud, and must keep loading.
- Cloud sync: after each local save, `cloud.js` waits 4 s, compares `savedAt` with the cloud row, and moves the older side. A pristine (never-played) local save always yields. A newer cloud save never replaces the game mid-descent; it waits for `trial-end`.
- Save codes (`VW2:` + base64 JSON) are the manual backup/transfer path.

## Supabase

Same project as the hub (`https://gfiigncjwtuslwqlyasr.supabase.co`). The anon key is in `js/cloud.js` and is public by design; row-level security protects the data. Sign-in is email + password with the hub account. The session is shared with the hub in Safari, since the origin is the same, but a home-screen install has its own storage and signs in once.

### `vesselwright_saves`
| column | type | notes |
|---|---|---|
| user_id | uuid | primary key, references auth.users, cascade delete |
| data | jsonb | the whole `S` object |
| version | int | `SAVE_VERSION` at write time |
| updated_at | timestamptz | set on every upsert |

RLS is on, with the four standard policies scoped to `auth.uid() = user_id`. SQL is in `supabase/schema.sql`.

## Deploying

1. `node tools/check.mjs` passes.
2. Bump `self.VW_VERSION` in `version.js`. This renames the offline cache, so installed copies drop stale files.
3. Any new file under `js/` is added to `SHELL` in `sw.js`.
4. Commit and `git push origin main`. Pages deploys in about a minute. The service worker is network-first, so the next open on a phone gets the new build.

## Look and feel

The game has its own identity, separate from the hub's terminal aesthetic: a dark artificer's workbench. The display face is IM Fell English SC, body text is Alegreya Sans and numbers are IBM Plex Mono. Colors are CSS variables at the top of `css/game.css`: ink, panel, bone, brass, verdigris, plus one hue per element. Keep new UI on those tokens. Tiles are octagons, verbs are bone, modifiers brass and essences their element color. The game is dark-only on purpose.

It must work at phone width (about 390px), with touch input everywhere keyboard input exists.

## Conventions

- Commits: present tense, lowercase, descriptive (`add mirror modifier`, `fix fork targeting on single-part foes`).
- Errors reach the player in plain words (toast or inline). Never fail silently.
- Copy is plain and specific. Name things the way the game names them (rite, stone, facet, filament, lattice, Insight, Shards).
