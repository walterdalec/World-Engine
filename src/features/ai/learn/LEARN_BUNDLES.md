# Learn Bundles

* **Bundle**: NDJSON file containing a single header and BattleSampleV1 rows.
* **Versioning**: Schema version is part of the header (`schema: BattleSampleV1`). Never mutate existing fields in place; add V2 when needed.
* **Location**: `saves/learn/<seed>-<ts>.ndjson` (default from exporter).
* **Workflow**:
  1. Attach collector during battle init (`attachCollector(world)`).
  2. Run battles and call `flushCollector(world)` after outcome.
  3. Call `exportLearnAsNDJSON(world)` to save.
  4. Feed exported NDJSON into Codex/bench pipelines using `toCodexRows` when needed.
* **Retention**: Keep at least 100 rows per bundle for useful analysis.
