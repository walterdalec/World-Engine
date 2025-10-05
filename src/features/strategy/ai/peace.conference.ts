
import { getModifiedRelation } from './memory';
import { PeaceConference, PeaceDeal, WorldState, ID } from './types';

export function maybeStartPeaceConference(world: WorldState) {
  const clusters = detectWarClusters(world);
  if (!clusters.length) return;
  world.conferences ??= {};
  const existingKeys = new Set(
    Object.values(world.conferences)
      .filter((conference) => !conference.resolved)
      .map((conference) => keyForFactions(conference.factions))
  );

  for (const cluster of clusters) {
    const key = keyForFactions(cluster);
    if (existingKeys.has(key)) continue;
    const id = `conf_${world.turn}_${cluster.join('_')}`;
    world.conferences[id] = {
      id,
      factions: [...cluster],
      proposals: [],
      hostId: cluster[0],
      turnStart: world.turn,
    } as PeaceConference;
  }
}

export function runPeaceConferences(world: WorldState) {
  if (!world.conferences) return;
  for (const conference of Object.values(world.conferences)) {
    if (conference.resolved) continue;
    const proposals: PeaceDeal[] = [];
    for (const factionId of conference.factions) {
      const faction = world.factions[factionId];
      if (!faction) continue;
      for (const otherId of conference.factions) {
        if (otherId === factionId) continue;
        const relation = getModifiedRelation(faction, otherId);
        if (relation > 40) {
          proposals.push({ kind: 'Truce' });
        }
      }
    }
    if (proposals.length > 0) {
      finalizeConference(world, conference, proposals);
    }
  }

  for (const [id, conference] of Object.entries(world.conferences)) {
    if (conference.resolved) {
      delete world.conferences[id];
    }
  }
}

function finalizeConference(world: WorldState, conference: PeaceConference, proposals: PeaceDeal[]) {
  for (const proposal of proposals) {
    if (proposal.kind !== 'Truce') continue;
    for (const a of conference.factions) {
      for (const b of conference.factions) {
        if (a === b) continue;
        delete world.factions[a].wars[b];
        delete world.factions[b].wars[a];
      }
    }
  }
  conference.proposals = proposals;
  conference.resolved = true;
}

function detectWarClusters(world: WorldState): ID[][] {
  const clusters: ID[][] = [];
  const visited = new Set<ID>();

  for (const faction of Object.values(world.factions)) {
    if (visited.has(faction.id)) continue;
    const cluster: ID[] = [];
    const queue: ID[] = [faction.id];
    while (queue.length) {
      const current = queue.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      cluster.push(current);
      const wars = Object.keys(world.factions[current].wars ?? {});
      for (const enemyId of wars) {
        if (!visited.has(enemyId)) {
          queue.push(enemyId);
        }
      }
    }
    if (cluster.length > 1) {
      clusters.push(cluster.sort());
    }
  }

  return clusters;
}

function keyForFactions(factions: ID[]) {
  return [...factions].sort().join('|');
}
