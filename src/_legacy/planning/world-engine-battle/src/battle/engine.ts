import { ABILITIES } from "./abilities";
import type {
  BattleState, Unit, Grid, Tile, Ability
} from "./types";

export function tileAt(grid: Grid, x:number, y:number): Tile | undefined {
  if (x<0 || y<0 || x>=grid.width || y>=grid.height) return undefined;
  return grid.tiles[y*grid.width + x];
}

export function manhattan(a:{x:number;y:number}, b:{x:number;y:number}){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }

export function lineOfSight(grid: Grid, a:{x:number;y:number}, b:{x:number;y:number}): boolean {
  // Bresenham LOS ignoring elevation for now
  let x0=a.x, y0=a.y, x1=b.x, y1=b.y;
  const dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0);
  const sx = x0<x1?1:-1, sy = y0<y1?1:-1;
  let err = dx+dy;
  while(true){
    if (grid.tiles[y0*grid.width+x0].blocked) return false;
    if (x0===x1 && y0===y1) break;
    const e2 = 2*err;
    if (e2 >= dy){ err += dy; x0 += sx; }
    if (e2 <= dx){ err += dx; y0 += sy; }
  }
  return true;
}

export function buildInitiative(state: BattleState): string[] {
  const units = state.units.filter(u => !u.isDead && u.pos);
  // Higher SPD acts earlier; stable sort by spd desc, name
  return units.sort((a,b)=> (b.stats.spd - a.stats.spd) || a.name.localeCompare(b.name)).map(u=>u.id);
}

export function startBattle(state: BattleState) {
  state.turn = 1;
  state.phase = "HeroTurn";
  state.initiative = buildInitiative(state);
  state.log.push("Battle started.");
}

export function nextPhase(state: BattleState){
  if (state.phase === "HeroTurn") state.phase = "UnitsTurn";
  else if (state.phase === "UnitsTurn") state.phase = "EnemyTurn";
  else if (state.phase === "EnemyTurn"){
    state.turn += 1;
    state.initiative = buildInitiative(state);
    state.phase = "HeroTurn";
  }
}

export function activeUnits(state: BattleState, faction: "Player" | "Enemy"){
  return state.units.filter(u => u.faction === faction && !u.isDead && u.pos);
}

// --- Movement / A* (simple) ---
export function neighbors(grid: Grid, x:number, y:number){
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const out:{x:number;y:number}[] = [];
  for (const [dx,dy] of dirs){
    const t = tileAt(grid, x+dx, y+dy);
    if (!t || t.blocked) continue;
    out.push({ x:x+dx, y:y+dy });
  }
  return out;
}

export function findPath(grid: Grid, start:{x:number;y:number}, goal:{x:number;y:number}){
  const open = new Map<string, number>(); // key-> f
  const g = new Map<string, number>();    // key-> g
  const came = new Map<string, string>(); // child->parent
  const key = (p:{x:number;y:number}) => `${p.x},${p.y}`;
  const startK = key(start), goalK = key(goal);
  g.set(startK, 0);
  open.set(startK, manhattan(start, goal));
  while(open.size){
    // get lowest f
    let curK = ""; let curF = Infinity;
    for (const [k,f] of open){ if (f<curF){ curF=f; curK=k; } }
    const [cx, cy] = curK.split(",").map(Number);
    const cur = { x:cx, y:cy };
    if (curK === goalK){
      // reconstruct path
      const path = [cur];
      let k = curK;
      while(came.has(k)){
        k = came.get(k)!;
        const [px, py] = k.split(",").map(Number);
        path.push({ x:px, y:py });
      }
      return path.reverse();
    }
    open.delete(curK);
    for (const nb of neighbors(grid, cur.x, cur.y)){
      const nbK = key(nb);
      const t = tileAt(grid, nb.x, nb.y)!;
      const tentative = (g.get(curK) ?? Infinity) + t.movementCost;
      if (tentative < (g.get(nbK) ?? Infinity)){
        came.set(nbK, curK);
        g.set(nbK, tentative);
        const f = tentative + manhattan(nb, goal);
        open.set(nbK, f);
      }
    }
  }
  return null;
}

// --- Ability execution (simplified) ---
export function canUseAbility(state: BattleState, user: Unit, ability: Ability, targetPos:{x:number;y:number}): boolean {
  if (ability.commanderOnly && !user.isCommander) return false;
  if (!user.pos) return false;
  const dist = manhattan(user.pos, targetPos);
  if (dist > ability.range) return false;
  if (ability.requiresLOS && !lineOfSight(state.grid, user.pos, targetPos)) return false;
  return true;
}

export function applyDamage(target: Unit, amount: number){
  target.stats.hp = Math.max(0, target.stats.hp - amount);
  if (target.stats.hp === 0) target.isDead = true;
}

export function applyHealing(target: Unit, amount: number){
  target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + amount);
}

export function execAbility(state: BattleState, user: Unit, abilityId: string, targetPos:{x:number;y:number}){
  const ability = ABILITIES[abilityId];
  if (!ability) throw new Error("Unknown ability: " + abilityId);
  if (!canUseAbility(state, user, ability, targetPos)) return false;

  // Gather targets by shape (simplified — expand later)
  const targets: Unit[] = [];
  for (const u of state.units){
    if (!u.pos || u.isDead) continue;
    const d = manhattan(u.pos, targetPos);
    const isEnemy = u.faction !== user.faction;
    if (ability.shape === "enemy" && isEnemy && d===0) targets.push(u);
    if (ability.shape === "ally" && !isEnemy && d===0) targets.push(u);
    if (ability.shape.startsWith("blast") && d <= (ability.aoeRadius ?? 1)) targets.push(u);
  }

  // Damage / healing
  for (const t of targets){
    if (ability.damage && (ability.friendlyFire || t.faction !== user.faction)){
      const raw = ability.damage.amount + (ability.type==="spell" ? user.stats.mag : user.stats.atk) * 0.25;
      const mitigated = Math.max(0, raw - (ability.type==="spell" ? t.stats.res : t.stats.def));
      applyDamage(t, Math.round(mitigated));
    }
    if (ability.healing && t.faction === user.faction){
      applyHealing(t, ability.healing + Math.round(user.stats.mag * 0.3));
    }
    if (ability.statusApply){
      for (const s of ability.statusApply){
        t.statuses.push({ ...s });
      }
    }
  }

  state.log.push(`${user.name} used ${ability.name}.`);
  return true;
}

// --- Commander aura ---
export function applyCommanderAura(state: BattleState){
  const cmdUnit = state.units.find(u=>u.isCommander);
  if (!state.commander.aura || !cmdUnit) return;
  for (const u of state.units){
    if (u.faction !== "Player" || u.isDead) continue;
    for (const [k,v] of Object.entries(state.commander.aura.stats)){
      // lightweight buff — not stacking
      (u.stats as any)[k] = (u.stats as any)[k] + (v as number);
    }
  }
}

// --- Victory/Defeat check ---
export function checkEnd(state: BattleState){
  const playerAlive = state.units.some(u=>u.faction==="Player" && !u.isDead && u.pos);
  const enemyAlive = state.units.some(u=>u.faction==="Enemy" && !u.isDead && u.pos);
  if (!playerAlive){ state.phase="Defeat"; state.log.push("Defeat!"); }
  if (!enemyAlive){ state.phase="Victory"; state.log.push("Victory!"); }
}
