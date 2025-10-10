# Battle Module (Top‑Down, Commander Hero, 3D‑Ready)

This module adds a **Might & Magic‑style** tactical battle screen with:
- Biome/terrain driven battlefield generation
- Deployment (setup) screen for player positioning
- Turn/phase loop with **Hero Commander** phase (off‑field commands)
- Unit actions: move, basic abilities, spells (data‑driven), simple AI
- 2D canvas renderer + **3D renderer stub** (Three.js ready)
- Revival pricing helper (level + gear)

## Files

```
src/battle/
  types.ts          # strong TS types for battle state
  rng.ts            # deterministic RNG
  biomes.ts         # tile palettes & movement/blocked baseline
  generate.ts       # battlefield generator (biome → grid tiles + spawn zones)
  abilities.ts      # data-driven abilities/spells/commands
  engine.ts         # LOS, initiative, A*, execAbility, aura, victory checks
  ai.ts             # minimal enemy AI
  economy.ts        # reviveCost(level, gearScore)
  factory.ts        # buildBattle(ctx, commander, party, enemies)
  renderer3d.ts     # future 3D stub (API sketch)
  components/
    renderer2d.tsx      # BattleCanvas canvas renderer
    BattleSetupScreen.tsx
    BattleScreen.tsx
```

## Quick Integration

1) Copy `src/battle/` into your project.  
2) Build a battle from your world context + party/enemies:

```tsx
import { buildBattle } from "./battle/factory";
import { BattleSetupScreen } from "./battle/components/BattleSetupScreen";
import { BattleScreen } from "./battle/components/BattleScreen";

// Build from world context + party/enemies:
const state = buildBattle(
  { seed: worldSeed, biome: "Forest", site: "wilds" },
  heroCommander,
  partyMembers,  // mercs (DTOs with name/race/archetype/level)
  enemies        // array of enemy DTOs
);

// 1) Deployment
<BattleSetupScreen initial={state} onReady={(s)=> setCurrent(<BattleScreen initial={s} onExit={...} />)} />
```

3) Commander rules: the hero is `isCommander=true` and **off‑field**. During **HeroTurn** add a commander UI to trigger `command` abilities (e.g., Rally, Meteor Strike).

4) Abilities: add new abilities in `abilities.ts` and assign ids to units via `skills`.

5) Revival/Casualties: after `Victory`/`Defeat`, scan `units` for `isDead`. Use `reviveCost(level, gearScore)` when the player visits a shrine.
