
import { captureRegion } from './military';
import { ID, PeaceDeal, ReparationPayment as _ReparationPayment, WorldState } from './types';

export function proposePeaceDeal(
  world: WorldState,
  loserId: ID,
  winnerId: ID,
  warScore: number
): PeaceDeal[] {
  const deals: PeaceDeal[] = [];

  if (warScore < -35) {
    deals.push({ kind: 'Truce' });
  }

  if (warScore < -45) {
    const cede = pickLowestWealthBorder(world, loserId, winnerId, 1);
    if (cede.length) {
      deals.push({ kind: 'Cede', cedeRegions: cede });
    }
  }

  if (warScore < -55) {
    deals.push({
      kind: 'Reparations',
      reparations: {
        payer: loserId,
        receiver: winnerId,
        perSeason: 30,
        seasons: 8,
        remaining: 8,
      },
    });
  }

  if (warScore < -65) {
    const dmz = sampleDMZ(world, loserId, winnerId);
    if (dmz.length) {
      deals.push({
        kind: 'DemilitarizedZone',
        dmz: { regionIds: dmz, untilTurn: world.turn + 36 },
      });
    }
  }

  return deals;
}

export function acceptPeace(world: WorldState, aId: ID, bId: ID, deal: PeaceDeal) {
  switch (deal.kind) {
    case 'Cede':
      for (const regionId of deal.cedeRegions ?? []) {
        captureRegion(world, regionId, bId);
      }
      break;
    case 'Reparations':
      if (!world.activeReparations) world.activeReparations = [];
      if (deal.reparations) {
        world.activeReparations.push({ ...deal.reparations });
      }
      break;
    case 'DemilitarizedZone':
      for (const regionId of deal.dmz?.regionIds ?? []) {
        const region = world.regions[regionId];
        if (!region) continue;
        region.fort = Math.max(0, region.fort - 1);
      }
      break;
    case 'Truce':
    default:
      break;
  }

  concludeWar(world, aId, bId);
}

function concludeWar(world: WorldState, aId: ID, bId: ID) {
  const factionA = world.factions[aId];
  const factionB = world.factions[bId];
  if (!factionA || !factionB) return;
  delete factionA.wars[bId];
  delete factionB.wars[aId];
  factionA.relations[bId] = Math.min(0, (factionA.relations[bId] ?? -20) + 15);
  factionB.relations[aId] = Math.min(0, (factionB.relations[aId] ?? -20) + 15);
}


export function tickReparations(world: WorldState) {
  if (!world.activeReparations) return;

  for (const payment of world.activeReparations) {
    if (!payment.remaining || payment.remaining <= 0) continue;
    const payer = world.factions[payment.payer];
    const receiver = world.factions[payment.receiver];
    if (!payer || !receiver) continue;

    const amount = Math.min(payment.perSeason, Math.max(0, payer.treasury));
    payer.treasury -= amount;
    receiver.treasury += amount;
    payment.remaining -= 1;
  }

  world.activeReparations = world.activeReparations.filter(
    (payment) => (payment.remaining ?? 0) > 0
  );
}

function pickLowestWealthBorder(
  world: WorldState,
  factionId: ID,
  enemyId: ID,
  count: number
) {
  const borderRegions: { id: ID; wealth: number }[] = [];

  for (const regionId of world.factions[factionId].regions) {
    const region = world.regions[regionId];
    if (!region) continue;
    const touchesEnemy = region.neighbors.some(
      (neighborId) => world.regions[neighborId]?.ownerId === enemyId
    );
    if (touchesEnemy) {
      borderRegions.push({ id: region.id, wealth: region.wealth });
    }
  }

  borderRegions.sort((a, b) => a.wealth - b.wealth);
  return borderRegions.slice(0, count).map((entry) => entry.id);
}

function sampleDMZ(world: WorldState, aId: ID, bId: ID) {
  const belt: ID[] = [];
  for (const region of Object.values(world.regions)) {
    if (region.ownerId !== aId) continue;
    if (region.neighbors.some((neighborId) => world.regions[neighborId]?.ownerId === bId)) {
      belt.push(region.id);
    }
  }
  return belt.slice(0, Math.min(3, belt.length));
}
