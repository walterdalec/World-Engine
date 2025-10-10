import type { BattleState } from "./types";
import { execAbility, manhattan, findPath } from "./engine";
import { ABILITIES } from "./abilities";

/** Minimal enemy AI — approach nearest player and use first viable ability */
export function enemyTurn(state: BattleState){
  const enemies = state.units.filter(u=>u.faction==="Enemy" && !u.isDead && u.pos);
  for (const e of enemies){
    // find nearest player
    const players = state.units.filter(u=>u.faction==="Player" && !u.isDead && u.pos);
    if (!players.length) return;
    let target = players[0]; let best = 1e9;
    for (const p of players){
      const d = manhattan(e.pos!, p.pos!);
      if (d < best){ best=d; target=p; }
    }
    // If in range of any ability, use it; else move closer
    let used = false;
    for (const abId of e.skills){
      const ab = ABILITIES[abId];
      if (!ab) continue;
      if (best <= ab.range){
        used = execAbility(state, e, abId, target.pos!);
        if (used) break;
      }
    }
    if (!used){
      // step along path towards target
      const path = findPath(state.grid, e.pos!, target.pos!);
      if (path && path.length>1){
        const step = path[1];
        // ensure not occupied
        const occupied = state.units.some(u=>!u.isDead && u.pos && u.pos.x===step.x && u.pos.y===step.y);
        if (!occupied) e.pos = step as any;
      }
    }
  }
}
