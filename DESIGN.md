# Vesselwright — design

The game is about preparing for a descent. Most of the game happens at the bench: wiring stones into a socket lattice, reading what the result will do, and testing ideas. Combat exists to prove a build and to feed growth back into the bench.

Inspirations: the FF7 materia system (combinable slotted stones that grow with use) and Vagrant Story (freeze time, target a body part, watch the action resolve, chain, risk).

## Pillars

These are rules. A change that breaks one needs a deliberate decision, not a quiet exception.

1. **Every combination resolves.** No hand-written combos and no "that doesn't work together." Verbs make packets and modifiers transform packets, so any arrangement the player can build has a defined, explainable result. If a new idea needs a special case, find the general rule instead.
2. **Experimentation is the economy.** Insight, the currency that opens sockets and pays for early fusion, comes only from discovering something new. Untested formulations earn double growth. Repeating a known build never earns Insight.
3. **The system explains itself.** The bench shows what every rite will do before you commit, step by step (the trace). The Codex shows what's still unfound, with a hint. Nothing important is hidden in code the player cannot reason about.
4. **Freeze, aim, watch.** Time runs, the player stops it, picks a rite and a part, and watches the result resolve. Timing skill (chains, braces) adds to a build but never replaces one.
5. **Things grow through use.** Stones level up, learn the creature families they fight, and resonate with the stones they work beside. Resonance is what makes fusion cheap.

## The lattice

- A 5×4 grid of sockets. Six start open; the rest cost Insight (10, then +6 each).
- **Filament** links neighbouring sockets. It is a limited resource (start with 5, buy more in the Reliquary).
- Stones have 1–3 **facets**. A stone with any verb facet is a verb stone; otherwise a modifier stone if it has a modifier facet; otherwise an essence stone.
- Bare filament conducts: a verb reaches through empty sockets.

## How a rite compiles

For each verb stone, `compileRite` (js/engine/rites.js):

1. **Reach.** Breadth-first search outward along filament. Non-verb stones join the verb's domain in order of distance (ties by socket index). Another verb stops the search in that direction and becomes a chain link instead.
2. **Packets.** Each verb facet emits one packet `{side, kind, mag, form, tgt, crit, pen, sure, tags, fuse, el}`. A stone with two verbs fires both for 80% of the combined tempo.
3. **Steep.** All essences in reach (own facets plus domain) form one pool. Harm packets gain +8% per essence (max 5). The pool rides on every packet.
4. **Modify.** The stone's own modifier facets apply first, in facet order. Then each modifier in the domain applies, nearest first. Each modifier is a function from packets to packets that may also change tempo, strain and aim.
5. **Cap.** Over 40 packets, the excess turns into strain. Tempo over 100 clamps to 100 and also turns into strain ("overreach").

### Rite forms (kind × side)

| | foe | self |
|---|---|---|
| harm | **Harm**: damage | **Sacrifice**: lose vigor, gain Fury that multiplies your next harm |
| mend | **Blight**: never misses, ignores armor and affinity, ×2 vs wraiths | **Mend**: heal; essences grant boons |
| ward | **Brittle**: the part takes more damage for 10 s | **Ward**: shield; essences lash back at attackers |
| hex | **Hex**: lays each essence's curse; bare, it dazes | **Boon**: essences' blessings; bare, it steadies (strain down, tempo up) |

### Modifiers

| Modifier | Effect on packets | Cost |
|---|---|---|
| Echo | duplicates every packet at 60% | tempo ×1.2 |
| Spread | foe packets hit every part at 55%; self packets swell 25% | tempo ×1.25 |
| Invert | flips side | none |
| Siphon | adds a 35% mirror on the other side, harm and mend swapped | tempo ×1.1 |
| Weight | ×1.5 | tempo ×1.3, strain +6 |
| Quicken | ×0.85 | tempo ×0.55 |
| Keen | +aim, +crit, armor penetration, surer status procs | tempo ×1.05 |
| Fork | copies each foe packet at 70% toward a different part | tempo ×1.15 |
| Fuse | holds packets back at ×1.7; they detonate after your next rite | tempo ×0.9 |

Levels add a little to each modifier's strength. Every modifier adds strain +2. Order matters wherever two modifiers don't commute. Invert then Siphon differs from Siphon then Invert, and the Codex's Concordance grid tracks which orders you've tried.

### Essences

Ember, Rime, Volt, Gloom, Verdance. Each has a **curse** on the foe (burn, chill, shock, hollow, seed) and a **boon** on the Vessel (kindled, glaze, quick, veil, bloom). Two essences make a named compound (Ember + Volt = Plasma; 15 pairs in all). Three or more make a generated name ("Crackling Steam"). Body parts have per-form and per-element multipliers. A negative multiplier means the part drinks that element and heals.

## Growth

- **XP** on use: verb 10, each domain stone 6. Doubled for an untested formulation, halved in the Proving Ground. Levels at 60 / 170 / 340 / 600.
- **Mastery** at level 5 crystallizes a level-1 copy of the stone.
- **Family affinity**: verbs gain affinity with beast, construct or wraith by felling them, worth up to +50% damage against that family.
- **Resonance** between stones that work together (verb with domain stones, consecutive modifiers, chained verbs). Fusion costs 30 Insight at zero resonance and is free at 100. Fused stones keep the higher affinities and average their levels. Three facets is the maximum.

## Discovery (Insight)

| Discovery | Insight |
|---|---|
| A new rite form | 15 |
| A single essence / an essence pair / a 3+ essence blend | 5 / 10 / 12 |
| A new modifier order (Concordance) | 4 |
| A new formulation (exact build signature) | 2 |
| Breaking a part / felling a creature for the first time | 6 / 8 |
| Chain of 2–5, Cascade (8+ packets), Deluge (16+) | 10 / 10 / 15 |
| Mastery | 12 |
| Overreach, an element drunk, first fusion | 6 |

## The descent

- **Tempo** fills over time. Rites cost tempo. Freezing time is free.
- **Strain** builds with each rite and decays. It lowers aim, raises crit chance and increases damage taken. It's the Risk meter.
- The foe **charges** toward a telegraphed move aimed from one of its parts. Breaking that part weakens the move.
- **Parts** have a share of the foe's vigor. Wounding a part past its threshold breaks it: weaken, slow, sunder armor, or expose.
- **Chain**: if a verb in the same mesh is ready, a ring closes after the rite lands. Strike it to fire that verb at the same part with a bonus (more for perfect timing).
- **Brace**: strike as a blow lands to reduce it (35%, or 55% if perfect).
- Depths 1–4 are authored, then generated. The warden at the end of each depth drops a hoard and opens the next one. Falling keeps all growth and shards already taken.

## Ideas not yet built

- Vagrant Story-style weapon assembly: a blade, a grip and gem slots, each carrying growth.
- Modifiers that act on the lattice itself (a stone that extends a neighbour's reach, or mirrors the board).
- Creature parts that react to specific forms (a shell that reflects Blight, a lantern that drinks Ember).
- A purely tactical mode with no real-time pressure.
- Cloud-shared Codex comparisons between players.
