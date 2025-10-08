# TODO — Strategy Layer → OSRI (Full Spec Pack for Canvases #12–#18)
**Project**: Hybrid Strategy RPG (M&M6–7 × Brigandine × Mount & Blade)  
**Build Target**: Browser/PWA first; desktop/mobile via installable PWA  
**License Posture**: OSRI defaults (MIT/Apache-2.0 preferred; MPL-2.0/LGPL via isolation; avoid GPL/AGPL unless explicitly approved)  
**Generated**: 2025-10-07 09:55:14

This document consolidates the complete specifications, types, code stubs, and configs for **canvases #12–#18**.  
Where original canvases (#12–#15) are not present in this thread, they are **faithfully reconstructed** and reconciled with later specs (#16–#18, #19 PWA save hooks, #20 formations) to maintain consistency.

---

## Index
- [#12 — Strategic Layer (Economy, Supply, Conquest Loop)](#12--strategic-layer-economy-supply-conquest-loop)
- [#13 — Combat UI/HUD & Input](#13--combat-uihud--input)
- [#14 — Save/Load & Replays (Schema v3, Hashing, Migration)](#14--saveload--replays-schema-v3-hashing-migration)
- [#15 — Tests, Benchmarks & CI (Vitest, tinybench, Actions)](#15--tests-benchmarks--ci-vitest-tinybench-actions)
- [#16 — Character Creator Integration (Deep Spec v2)](#16--character-creator-integration-deep-spec-v2)
- [#17 — Voice Asset Registry & AI TTS Integration (PWA-only)](#17--voice-asset-registry--ai-tts-integration-pwa-only)
- [#18 — Named Recruit Registry & Tavern/Quest Surfacing](#18--named-recruit-registry--tavernquest-surfacing)

---

## #12 — Strategic Layer (Economy, Supply, Conquest Loop)

**Goal**: Seasonal strategy layer that powers faction growth, territorial control, and logistics. Integrates with overworld travel (#11), tactical transitions, morale (#03/#10), and the save system (#14). Deterministic and AI-parity.

### 12.1 World Model
- **Regions/Provinces**: ownable by factions; each provides slots: `settlements`, `resourceNodes`, `roads`, `forts`.
- **Seasonal Clock**: `spring/summer/autumn/winter` — modifies harvests, movement costs, attrition.
- **Supply Lines**: path over controlled roads/riverways from **source (granary/market)** to **consumers (armies, garrisons)**.

```ts
export type RegionId = string;
export type Resource = 'grain'|'wood'|'iron'|'horses'|'coin'|'mana';
export interface Region {
  id:RegionId; name:string; owner:string; season:'spring'|'summer'|'autumn'|'winter';
  stability:number; // -5..+5 (unrest)
  settlements:string[]; forts:string[]; nodes:{ type:Resource; prod:number }[];
  roads:Array<{ from:RegionId; to:RegionId; quality:0|1|2 }>;
}
export interface ArmySupply { grain:number; coin:number; horses:number; mana:number; }
export interface FactionEconomy { gold:number; stockpiles:Partial<Record<Resource,number>>; upkeep:number; }
```

### 12.2 Conquest Loop
1) **Campaign Orders** (per week): move armies, besiege, raid caravans, build/repair forts.  
2) **Economy Tick** (weekly): collect taxes, process production, pay upkeep, update stockpiles.  
3) **Supply Resolution**: push resources along lines; shortages → morale loss, desertion tests.  
4) **Strategic Events**: rebellions, festivals, famines, diplomatic offers.

### 12.3 Upkeep & Attrition
- **Army Upkeep** = wages + ration cost per head (+horses for cav).  
- **Attrition** when out of supply or in harsh weather/terrain.  
- **Morale Impact**: unpaid → −1 loyalty per week (ties into #18 recruits).

```ts
export interface StrategicTickResult { changes:any[]; events:any[]; }
export function economyTick(world:any, factions:any[]):StrategicTickResult { /* deterministic */ }
export function routeSupply(world:any, factionId:string){ /* push/pull along controlled paths */ }
```

### 12.4 AI Parity
- AI uses identical budgets and pathing; chooses targets by **threat**, **value**, **distance**, and **doctrine** tags.

### 12.5 Overworld↔Battle
- Starting a battle consumes **AP/supplies**; outcomes write back casualties, captured forts, and **stability** shifts.

---

## #13 — Combat UI/HUD & Input

**Goal**: Provide the interactive layer for tactical control: selection, context actions, overlays, and logs. Hooks to #01–#06 and #20–#21.

### 13.1 Systems
- **Selection**: box + click; multi-squad tabs.  
- **ActionBuilder**: context menu producing structured actions (`Move`, `Attack`, `Form`, `Charge`, `Fallback`, `Guard`, `Skirmish`).  
- **Overlays**: LOS (line-of-sight), range rings, ZoC, formation footprints, aura rings, charge lanes.  
- **HUD**: squad cards with [AP], [Cohesion], [Morale], [Aura], [Status].  
- **Logs**: structured resolver log (#04) with filters and replay scrubber (#14).

### 13.2 Input State
```ts
export type UiMode = 'select'|'command'|'inspect';
export interface HudState { selected:string[]; hoverTile?:{q:number;r:number}; overlays:string[]; }
```

### 13.3 Events
- `ui:select`, `ui:order`, `ui:overlayToggle`, `ui:replaySeek` — all forwarded to event bus (#09).

---

## #14 — Save/Load & Replays (Schema v3, Hashing, Migration)

**Goal**: Versioned, hash-verified saves with deterministic replays and migrations.

### 14.1 Schema v3
```json
{
  "schema": 3,
  "meta": { "slotId": "slotA", "createdAt": 1738880000000, "updatedAt": 1738882222222, "engineVersion": "0.3.8" },
  "world": { "seed": "seed:...", "regions": [], "clock": { "week": 1, "season": "spring" } },
  "party": { "id":"party:hero", "members": ["char:hero"], "gold": 50 },
  "hero": { "...": "see #16" },
  "recruits": { "...": "see #18" },
  "replays": { "events": [], "checkpoints": [] },
  "rng": { "state": "..." }
}
```

### 14.2 Hashing
- Canonical stable JSON (sorted keys), `SHA-256` → stored as sidecar `.sha256` (see #19 OPFS).

### 14.3 Migration
- v2 → v3: ensure `hero.spells.heroOnly=true`, `passives.maxPassive=2`, compute missing `derived` (#16).

### 14.4 Replay
- Event log from #04/#09 with seeds; optional checkpoints every N ticks for scrubber. Deterministic transformations only.

---

## #15 — Tests, Benchmarks & CI (Vitest, tinybench, Actions)

**Goal**: Reproducible quality gates and performance budgets.

### 15.1 Unit & Property Tests
- **Validation**: creator slot limits, hero-only spells (#16); recruit surfacing determinism (#18).  
- **Resolver**: damage pipeline (#06) with terrain/defense modifiers.  
- **Formations/Auras**: rotation math, ZoC extension (#20).

### 15.2 tinybench Targets
- `derive()` (#16) < **0.05ms** avg.  
- Recruit surfacing (#18) < **0.2ms** for pool 1k.  
- Formation compiler (#20) ≥ **1500 ops/ms** desktop.

### 15.3 GitHub Actions (sample)
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --run
  bench:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run bench
```

---

## #16 — Character Creator Integration (Deep Spec v2)

**Project**: Hybrid Strategy RPG (M&M6–7 × Brigandine × Mount & Blade)

**Goal**: Integrate a single-hero character creation flow with tactical combat, overworld systems, and save/replay infrastructure. Only the **hero** is created via this flow; companions are **named recruits** found/hired in-world.

**Anchors**: Aligns with #01–#15: AP/Initiative, Path/LOS, Turn Manager, Action Resolver, Terrain, Damage Pipeline, Spell System (hero-only), AI Scaffold, Animation/Events, Morale, Overworld↔Battle transitions, Strategic Layer, Combat UI/HUD, Save/Replay, Tests/CI.

---

### 16.0 Scope & Constraints
- **Hero-only creator**: party members are pre-authored recruits (see §16.7).  
- **Strict mode-ready**: 1 **Title** active; **2 active abilities** at Novice; **2 passives max**; soft-cap stats; burnout hooks available.  
- **Spell gating**: Hero-only spells per #07A; teleport rules honored.  
- **Determinism**: All derived rolls seeded; loadout & portrait choices reproducible via `char_seed`.  
- **Serialization**: Backward-compatible schema delta from #14; stable IDs; hashed save blocks; replay parity.

### 16.1 Player Flow (UI/UX)
1) **Identity** → name, gender (male/female), portrait, color tint, voice pack (stub).  
2) **Origin** → realm/faction + upbringing (rural/urban/noble/outcast). Sets tags for recruitment & shop tables.  
3) **Archetype** → class cluster (Blade, Ranger, Mystic, Trickster, Vowkeeper). Each defines slot templates & growth biases.  
4) **Title (choose 1)** → mechanical boon + drawback (e.g., *Oathbound*, *Grave Scholar*, *Wander-king*).  
5) **Abilities (2 active)** → from archetype lists; warn on over-pick; burnout meter visible.  
6) **Passives (≤2)** → class/origin pools; extra picks go dormant.  
7) **Stats** → allocate within soft caps; live preview of Derived (AP, Init, Move, Load, Sight, Resist).  
8) **Spell Access** → pick school licenses (Fire/Water/Air/Earth/Mind/Body/Spirit/Light/Dark) as allowed by Title/Archetype; hero-only flag.  
9) **Loadout** → kit-by-origin & class; weight vs AP warning.  
10) **Summary** → deterministic seed, exportable sheet, confirm → spawn rules.

UX rules: always show [Slot Limits], [Burnout Risk], [Morale Impact], [AP/Init]. Mobile-first (single column), desktop (two-pane).

### 16.2 Data Model (TypeScript)
```ts
// ids
export type CharacterId = string & { readonly brand: unique symbol };
export type TitleId = string; export type TraitId = string; export type AbilityId = string;
export type PassiveId = string; export type SpellId = string; export type ClassId = string;
export type OriginId = string; export type FactionId = string; export type PortraitId = string;

export type Gender = 'male' | 'female';

export interface CoreStats { STR:number; DEX:number; CON:number; INT:number; WIS:number; CHA:number; }
export interface DerivedStats { ap:number; init:number; move:number; sight:number; carry:number; crit:number; resist:{[k:string]:number}; morale:number; }

export interface AbilitySlots { active: AbilityId[]; maxActive:number; }
export interface PassiveSlots { passive: PassiveId[]; maxPassive:2; }

export interface Title { id:TitleId; name:string; boon:Partial<DerivedStats> & {tags?:string[]}; drawback:Partial<DerivedStats> & {tags?:string[]}; flags?:{heroOnly?:boolean}; }

export interface Archetype { id:ClassId; name:string; slotTemplate:{active:number; passive:2}; statBias:Partial<CoreStats>; abilityPool:AbilityId[]; passivePool:PassiveId[]; spellLicenses?:SpellId[]; }

export interface Origin { id:OriginId; faction:FactionId; upbringing:'rural'|'urban'|'noble'|'outcast'; tags:string[]; shopMods:{[k:string]:number}; recruitMods:{[k:string]:number}; }

export interface SpellAccess { schools:SpellId[]; heroOnly:true; teleportAllowed?:boolean; }

export interface Equipment { id:string; weight:number; tags:string[]; mods:Partial<DerivedStats>; }

export interface Loadout { items:string[]; weight:number; }

export interface Hero {
  id:CharacterId; name:string; gender:Gender; portrait:PortraitId; seed:string;
  origin:OriginId; faction:FactionId; archetype:ClassId; title:TitleId;
  core:CoreStats; derived:DerivedStats; abilities:AbilitySlots; passives:PassiveSlots; spells:SpellAccess; loadout:Loadout;
  flags:{ novice:true; corruption?:number };
}
```

**Validation**: Zod or custom guards enforce slot limits, soft caps, hero-only spells, and single-title constraint.

### 16.3 Derived Stat Calculator
- AP = f(CON, DEX, loadout weight).  
- Initiative = g(DEX, WIS, Title.boosts, fatigue).  
- Move = base by class + terrain shoes + encumbrance.  
- Sight = base ± traits + terrain (#05).  
- Carry = h(STR, class coef).  
- Crit = curve on DEX + Title.  
- Resistances = vector by passives & gear → used by #06 pipeline.  
- Morale = baseline by WIS+CHA + Title deltas + origin tags → used by #03.#10.

```ts
export function derive(core:CoreStats, title:Title, passives:PassiveId[], loadout:Loadout):DerivedStats { /* ... */ }
```

### 16.4 Title & Trait Tables (examples)
- **Oathbound**: +morale, +resist vs Fear; **drawback**: cannot initiate Retreat unless ally is down.  
- **Grave Scholar**: +INT/WIS based crit to Mind/Spirit spells; **drawback**: −CHA (shop prices worsen).  
- **Wander-king**: +Sight, +Move on roads; **drawback**: −Morale in forts.

### 16.5 Spell Access & Teleport Rules
- Creator sets initial *licenses*; spells remain **hero-only** (#07A).  
- Teleport: disabled in dungeons, forts; allowed on roads with cooldown; validated at cast time by resolver hooks.

### 16.6 Loadout Generator
- Per (Origin × Archetype × Title).  
- Ensures weight warning before confirm; shows AP/Init deltas live.

### 16.7 Named Recruits (Integration Stub)
- No creation flow; recruits are authored entries with class, stats, kit, traits, **level growth**, **permadeath**, and rare revival per #12.  
- Unlock rules depend on hero `origin.tags`, `title`, or quest flags.

```ts
export interface RecruitEntry { id:string; name:string; level:number; class:ClassId; core:CoreStats; passives:PassiveId[]; abilities:AbilityId[]; title?:TitleId; locationTag:string; hireCost:number; respawn:false; }
```

### 16.8 Overworld & Battle Handshake
- **Spawn**: After confirm, create `partyId` with hero only; place at start tile (seeded).  
- **Battle blueprint**: `Hero → Unit` transform: copies derived, title tags, slots, spell licenses; equips #06 resist vector.  
- **Morale state**: initial morale piped to #03 Turn Manager.

### 16.9 Events & Logs (ties to #09/#04)
- `creator:opened`, `creator:changed`, `creator:invalid`, `creator:confirmed`  
- `party:created`, `unit:spawnedFromHero`, `recruit:unlocked`, `recruit:hired`  
- All events include `seed`, `schemaVersion`, and `commitHash?` for replay parity.

### 16.10 Serialization (Save/Load) — Schema Delta v3
- **Version**: `save.schema = 3` (from #14).  
- **Blocks**: `{ meta, world, party, hero, recruits, replays, rng }`.  
- **IDs**: stable strings; no index reliance.  
- **Hash**: SHA-256 over canonicalized JSON; include `rng.state`.  
- **Migration**: v2 → v3 map: fill `hero.spells.heroOnly=true`, set `passives.maxPassive=2` if absent, compute `derived` via §16.3.

**JSON Sketch**
```json
{
  "schema": 3,
  "hero": {"id":"char:...","name":"...","gender":"male","portrait":"p:001","seed":"...","origin":"o:valebright","faction":"f:vale","archetype":"class:blade","title":"title:oathbound","core":{"STR":10,"DEX":9,"CON":10,"INT":7,"WIS":8,"CHA":9},"derived":{"ap":6,"init":11,"move":4,"sight":6,"carry":38,"crit":0.07,"resist":{"fire":0,"mind":0},"morale":5},"abilities":{"active":["ab:slash","ab:guard"],"maxActive":2},"passives":{"passive":["ps:roadrunner"],"maxPassive":2},"spells":{"schools":["sp:light"],"heroOnly":true},"loadout":{"items":["itm:sword","itm:leather"],"weight":19},"flags":{"novice":true}
  }
}
```

### 16.11 Backends for Save/Sync (PWA Hooks)
```ts
export interface SaveBackend {
  load(slot:string):Promise<object|null>;
  save(slot:string, data:object):Promise<void>;
  list():Promise<string[]>;
}
```
- `LocalStorageBackend` — quick saves.  
- `OPFSBackend` (PWA/browser) — JSON in the **Origin Private File System** with a hash sidecar.  
- `WebDAVBackend` or `S3Backend` (optional) — creds UI later; conflict = newest-hash-wins with replay merge attempt.

### 16.12 Error States & Guards
- Slot overflow, illegal teleport license, over-encumbrance → block confirm.  
- Title conflicts (mutually exclusive) → UI explainers.  
- Migration failure → fallback to read-only view + export.

### 16.13 Tests & Benchmarks (ties #15)
- **Unit**: validator, derive(), transform Hero→Unit.  
- **Property**: determinism with same `seed` and choices.  
- **Snapshot**: save block stable across runs; hash equality.  
- **Perf**: derive() < 0.05ms avg on tinybench; creator render < 16ms frame budget.

### 16.14 Implementation Order
1) Types & IDs → 2) `derive()` → 3) Tables → 4) Validator → 5) Spell gates → 6) Loadout gen → 7) Hero→Unit → 8) Events → 9) Schema v3 + migration → 10) Backends → 11) UI scaffolding → 12) Overworld spawn → 13) Recruit unlock → 14) Vitest/bench.

### 16.15 Example Stubs
```ts
export function makeHero(input:Partial<Hero>):Hero { /* merges tables, validates, derives */ }
export function heroToUnit(h:Hero){ /* blueprint for battle sim */ }
export const CreatorEvents = {
  opened:(seed:string)=>({t:'creator:opened',seed}),
  changed:(delta:any)=>({t:'creator:changed',delta}),
  invalid:(errs:string[])=>({t:'creator:invalid',errs}),
  confirmed:(heroId:CharacterId)=>({t:'creator:confirmed',heroId})
};
```

### 16.16 Asset Hooks (Portrait/Voice)
- Portraits by `PortraitId` with palette tint.  
- Voice packs as string keys; later mapping to audio.  
- Both live in asset registry; no binary in saves.

### 16.17 Notes for Future Canvases
- **#17**: Portrait/Voice Asset Registry & Loader.  
- **#18**: Named Recruit Registry & Tavern/Quest surfacing.  
- **#19**: PWA save adapters, cloud UI, conflict resolution.

---

## #17 — Voice Asset Registry & AI TTS Integration (PWA-only)

**Goal**: Provide **AI‑generated voices** without human actors by integrating open‑source, license‑safe TTS engines. **Local‑first**, browser/PWA only (no Electron). Voices are **assets** (deterministic, cacheable) and selectable in Character Creator (#16).

### 17.0 Principles
- **Local‑first**; no mandatory cloud at runtime.  
- **Licensing**: Prefer MIT/Apache‑2.0; avoid non‑commercial models for shipped builds; track licenses in SBOM.  
- **Deterministic**: Same text + seed → same audio where engine allows; serialize engine+model+params.  
- **Performance tiering**: Lightweight real‑time for barks; expressive prebaked for narration.  
- **Accessibility**: Subtitles/captions; timings for lip‑sync when available.

### 17.1 Engine Strategy (Two‑Tier)
**Tier A – Real‑time/Dynamic**: **Piper (WASM)** for combat barks, UI prompts, system narration.  
**Tier B – Expressive/Pre‑baked**: **Bark (small/standard)** rendered at build time; ship OPUS/WAV assets only.

### 17.2 Voice Asset Registry
```ts
export type VoiceEngineId = 'piper' | 'bark' | 'service:custom';

export interface VoicePackIdBrand { readonly brand: unique symbol }
export type VoicePackId = string & VoicePackIdBrand;

export interface VoicePackMeta {
  id: VoicePackId;
  label: string;
  engine: VoiceEngineId;
  modelKey?: string;
  sampleRate: number;
  seedable?: boolean;
  genderHint?: 'male'|'female'|'neuter';
  locale?: string;
  styleTags?: string[];
  license: { id:string; url:string; allowCommercial:boolean };
  delivery: 'runtime'|'prebaked';
}

export interface VoiceRegistry { list(): VoicePackMeta[]; get(id:VoicePackId): VoicePackMeta|undefined }
```

### 17.3 TTS Adapter Interface
```ts
export interface SynthesisRequest {
  text: string; seed?: number; speed?: number; pitch?: number; emotion?: string; ssml?: string; targetSampleRate?: number;
}
export interface WordTiming { word:string; start:number; end:number }
export interface VisemeTiming { viseme:string; start:number; end:number }
export interface TtsAdapter {
  id: VoiceEngineId;
  init(): Promise<void>;
  supportsTimings: boolean;
  synth(meta:VoicePackMeta, req:SynthesisRequest): Promise<{ audio:Float32Array; sampleRate:number; words?:WordTiming[]; visemes?:VisemeTiming[] }>;
}
```

Adapters run in **Web Workers**. Audio returns as `Float32Array` → `AudioBuffer` via Web Audio API.

### 17.4 Piper Adapter (Tier A)
- WASM module in browser; per-locale models.  
- Optional phoneme/word durations; otherwise estimate timings heuristically.  
- Latency target: < 200ms for short lines on desktop; < 500ms mid-mobile.

### 17.5 Bark Adapter (Tier B)
- Executed at **build time** in Node to bake long lines → OPUS/WAV.  
- Game streams prebaked assets; no runtime model load.

### 17.6 Text Pipeline & Caching
1) **Normalization**: numbers → words, punctuation, profanity filter (toggle).  
2) **Chunking**: on punctuation/length; preserve breaths.  
3) **Cache key**: SHA‑256 of `{engine, modelKey, voiceId, text, speed, pitch, emotion, seed}`.  
4) **Cache**: IndexedDB or **OPFS** (`opfs://tts-cache/`).  
5) **Audio sprites**: for common short barks.

### 17.7 Creator (#16) Hooks
- **Voice selector** and **Preview** in Identity step; persist `VoicePackId` and params.

### 17.8 Subtitles & Lip‑Sync
- Always provide subtitles; generate `.vtt`.  
- Use timings if present; else estimate from phoneme durations. Map phonemes→visemes to animate mouths.

### 17.9 SBOM & Attribution
- Registry entries record license + URL.  
- Build emits `CREDITS.md`, `THIRD-PARTY-LICENSES.txt`, and CycloneDX SBOM including model hashes.

### 17.10 Implementation Order
1) Registry + types → 2) Adapter interface → 3) Piper (WASM) → 4) Text normalization + cache → 5) Creator UI glue → 6) Bark prebake CLI & loader → 7) Subtitles/lip‑sync → 8) SBOM emitters.

### 17.11 Example Stubs
```ts
export const TTS: Record<VoiceEngineId, TtsAdapter> = {
  piper: new PiperAdapter(),
  bark: new BarkAdapter(),
  'service:custom': new ServiceAdapter('custom')
};

export async function speak(pack:VoicePackMeta, req:SynthesisRequest){
  const key = makeCacheKey(pack, req);
  const cached = await cache.get(key);
  if (cached) return play(cached);
  const { audio, sampleRate, words, visemes } = await TTS[pack.engine].synth(pack, req);
  const buf = await toAudioBuffer(audio, sampleRate);
  await cache.put(key, buf, { words, visemes });
  return play(buf);
}
```

### 17.12 QA & Benchmarks
- Latency: synth short line < 200ms desktop, < 500ms mid‑mobile.  
- Memory: browser peak < 300MB when using Piper WASM.  
- Determinism: identical cache key → identical waveform bytes (when seedable).

---

## #18 — Named Recruit Registry & Tavern/Quest Surfacing (Deep Spec v1)

**Goal**: Deterministic, loreful system for **named recruits** discovered and hired via taverns, guilds, roadside events, and quests. Enforces Strict‑Mode (permadeath, slot caps, burnout, loyalty, wages/supply, world reactivity).

**Anchors**: #01–#16, #12 Strategic Layer (economy/supply), #03/#10 Morale & Psychology, #11 Overworld ↔ Battle, #14 Save/Replay v3.

### 18.0 Scope & Constraints
- **Hero-only creator** remains (see #16). Recruits are pre-authored **Named Units** with fixed identities.  
- **Permadeath**: default `respawn:false`. Rare **Revival** requires relic + ritual + cost (#12).  
- **Slots & Burnout**: 2 active abilities, 2 passives max; overuse triggers burnout/mutations (flags persisted).  
- **Deterministic surfacing**: recruit availability seeded by `world.seed + week + region + hero.tags`.  
- **AI parity**: Factions recruit from the same pools by control markers (towns/forts), budgets, and ideology tags.

### 18.1 Core Concepts
- **Archetypes**: Guard, Ranger, Mystic, Trickster, Vowkeeper, Healer, Siege, Skirmisher, Standard‑Bearer.  
- **Rarity**: Common (taverns), Uncommon (guild halls), Rare (quest‑gated), Legendary (storyline).  
- **Affinities**: faction, terrain, weather, cause (`free folk`, `old faith`, etc.).  
- **Loyalty**: −5…+5 via pay, food, rest, wins/losses, choices, rivalries. Affects rally/flee/desertion.  
- **Wages & Upkeep**: weekly wages + daily ration; failure → morale hit → loyalty drop → desertion.

### 18.2 Data Model (TypeScript)
```ts
export type RecruitId = string & { readonly brand: unique symbol };
export type Rarity = 'common'|'uncommon'|'rare'|'legendary';

export interface LoyaltyState { score:number; lastPaidDay:number; strikes:number; }
export interface Wage { gold:number; ration:number; }

export interface RecruitEntry {
  id:RecruitId; name:string; portrait:PortraitId; gender:Gender;
  classId:ClassId; title?:TitleId; origin?:OriginId; factionAffinity?:FactionId;
  level:number; core:CoreStats; passives:PassiveId[]; abilities:AbilityId[];
  rarity:Rarity; tags:string[];
  locationTags:string[]; // 'town:oakfen','biome:forest','road:waystone'
  availability:{ seasons?:('spring'|'summer'|'autumn'|'winter')[]; weekdays?:number[]; weather?:string[] };
  unlock:{ questFlags?:string[]; heroTitle?:TitleId[]; heroOriginTags?:string[]; repMin?:number };
  hireCost:{ gold:number; favor?:number; itemIds?:string[] };
  wage:Wage; loyalty:LoyaltyState; respawn:false;
  notes?:string;
}

export interface HireRecord { recruitId:RecruitId; hiredAtDay:number; wage:Wage; }
export interface DesertionRecord { recruitId:RecruitId; day:number; reason:'unpaid'|'lowLoyalty'|'rivalry'|'fear'; }

export interface RecruitLedger {
  pool: RecruitEntry[];
  surfacing: Record<string, RecruitId[]>; // (region+week) → ids
  hired: HireRecord[];
  fallen: RecruitId[];
  deserted: DesertionRecord[];
}
```

### 18.3 Surfacing Algorithm (Deterministic)
Inputs: `seed, calendar.week, regionTag, hero.tags, worldState (town control, war, weather)`.  
Steps: filter by unlock/availability → score by rarity, control bonus, synergies, distance → sample seeded (Tavern Board 3–7, Guild 0–3) → guarantee quest unlocks → emit rumors for off‑site recruits.

### 18.4 UI Touchpoints
- **Tavern Board**: portrait, archetype, wage, one‑liner, **[Hire]**, **[Hear Rumor]**, **[Negotiate]**.  
- **Guild Hall**: rarer candidates, higher wages, rep gate.  
- **Road Encounters**: map pins with dialog; CHA/WIS checks for discount/refusal.  
- **Roster**: loyalty thermometer, wages due, burnout warnings, scars.

System tags: `[Wages Due: 3d]` `[Loyalty: +1 (well‑fed)]` `[Risk: Desertion if unpaid]`

### 18.5 Economy & Morale Hooks
- Daily ration consumption; shortages → −morale (stacking).  
- Weekly wage check; partial pay → small loyalty hit; missed pay → **strike**.  
- Victories grant loyalty; deaths of friends trigger loyalty tests.  
- **Rivalries**: tag pairs tick down morale if in same party.

Formulas (sketch):  
`loyaltyDelta = +1 victory major | +0 small win | −1 defeat | −1 unpaid | −1 hungry | +1 well‑rested` (cap ±5).  
Desertion test at dawn if `loyalty ≤ −3` or `strikes ≥ 2`: roll vs CHA aura; failure → `desertion` event.

### 18.6 AI Faction Parity
- Controlled towns/forts grant AI **recruit slots per week**; they hire by doctrine & budget. Deaths persist; rumors propagate.

### 18.7 Revival (Rare, Costly)
- Requires **relic + ritual site + officiant + price** (gold/favor + a scar).  
- On success: recruit returns with **scar**; loyalty reset to 0. Failure possible; log cause & consumed items.

### 18.8 Events & Logs
- `recruit:surfaced`, `recruit:rumor`, `recruit:hired`, `recruit:refused`, `recruit:paid`, `recruit:unpaid`, `recruit:deserted`, `recruit:fell`, `recruit:revivalAttempt`, `recruit:revived|failed`.

### 18.9 Save/Replay (Schema v3 additions)
- `save.recruits.ledger` as in interfaces; defaults if absent.

### 18.10 Implementation Order
1) Types & ledger storage → 2) Surfacing generator → 3) Tavern Board UI → 4) Economy tie‑ins → 5) Loyalty/desertion → 6) AI parity hiring → 7) Revival ritual → 8) Tests/benchmarks.

### 18.11 Example Stubs
```ts
export function surfaceRecruits(ctx:{seed:string; week:number; region:string; heroTags:string[]; world:any}, pool:RecruitEntry[]):RecruitId[]{ /* ... */ }
export function hireRecruit(ledger:RecruitLedger, id:RecruitId, day:number){ /* ... */ }
export function payWages(ledger:RecruitLedger, gold:number, day:number){ /* ... */ }
export function dailyUpkeep(ledger:RecruitLedger, rations:number, day:number){ /* ... */ }
export function dawnDesertionChecks(ledger:RecruitLedger, day:number, heroCha:number){ /* ... */ }
```

### 18.12 Balancing Dials & QA
- Board size, AI slots per town, wage multipliers, loyalty thresholds, grace period, desertion freq.  
- Ensure **no duplicate surfacing** of already‑hired/fallen.  
- Asset references robust offline.  
- All rolls deterministic in replays.

---

## OSRI Notes (applies across #12–#18)
- Prefer **MIT/Apache‑2.0** libs; for MPL‑2.0/LGPL isolate via adapters/workers; avoid GPL/AGPL unless explicitly approved.  
- **Attribution**: add `CREDITS.md`, `THIRD‑PARTY‑LICENSES.txt`, and Apache `NOTICE` where required.  
- **SBOM**: generate CycloneDX for releases; include TTS model hashes (#17).  
- **Integration**: wrap third‑party code, pin versions, add tests before/after, document rollback.
