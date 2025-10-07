# BattleSampleV1 Schema

| Field | Type | Notes |
|-------|------|-------|
| `turn` | number | Battle turn when the sample was created |
| `seed` | number | Battle seed (for replay determinism) |
| `commander` | 'A' \'B' | Commander issuing the orders |
| `opId` | string | Active operation id (optional) |
| `stage` | string | Operation stage (optional) |
| `orders` | string[] | Commander orders serialized as JSON strings |
| `deception` | object | `{ used, kind, detected }` flags |
| `deltas` | object | `{ hpA, hpB, moraleA, moraleB }` per-turn deltas |
| `outcome` | 'win' 'loss' 'draw' | Optional turn-level outcome |

File header:

```
interface FileHeader {
  schema: 'BattleSampleV1';
  gameVersion: string;
  map: string;
  ts: number;
}
```
