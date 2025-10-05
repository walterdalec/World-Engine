
import { rngBool } from './rng';
import { AIContext, Faction, ID, TradeTreaty, WorldState } from './types';

export function considerTradeTreaties(ctx: AIContext, faction: Faction) {
  const { world, rand } = ctx;
  if (!world.tradeTreaties) world.tradeTreaties = [];

  for (const other of Object.values(world.factions)) {
    if (other.id === faction.id) continue;
    if (other.wars[faction.id]) continue;
    const relation = faction.relations[other.id] ?? 0;
    if (relation < 25) continue;

    if (hasTreaty(world, faction.id, other.id)) continue;
    const chance = (faction.ai.diplomacy + 20) / 200;
    if (rngBool(rand, chance)) {
      const treaty: TradeTreaty = {
        a: faction.id,
        b: other.id,
        bonus: 0.15,
        startTurn: world.turn,
      };
      world.tradeTreaties.push(treaty);
    }
  }
}

export function hasTreaty(world: WorldState, a: ID, b: ID) {
  return Boolean(
    world.tradeTreaties?.some(
      (treaty) =>
        (treaty.a === a && treaty.b === b) || (treaty.a === b && treaty.b === a)
    )
  );
}

export function applyTreatyBonuses(world: WorldState) {
  if (!world.tradeRoutes || !world.tradeTreaties) return;
  for (const route of Object.values(world.tradeRoutes)) {
    if (route.baseWealthFlow === undefined) {
      route.baseWealthFlow = route.wealthFlow;
    } else {
      route.wealthFlow = route.baseWealthFlow;
    }
  }

  for (const treaty of world.tradeTreaties) {
    for (const route of Object.values(world.tradeRoutes)) {
      const fromOwner = world.regions[route.from]?.ownerId;
      const toOwner = world.regions[route.to]?.ownerId;
      const involvesA = fromOwner === treaty.a || toOwner === treaty.a;
      const involvesB = fromOwner === treaty.b || toOwner === treaty.b;
      if (involvesA && involvesB) {
        route.wealthFlow = Math.round(route.wealthFlow * (1 + treaty.bonus));
      }
    }
  }
}
