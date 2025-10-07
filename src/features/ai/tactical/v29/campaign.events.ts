export interface CampaignEvent {
  id: string;
  kind: 'GloryFestival' | 'Purge' | 'Reform';
  factionId: string;
  turn: number;
  data?: any;
}

export interface CarryoverLedger {
  wins: number;
  losses: number;
  routes: number;
  objSwings: number;
}

function defaultLedger(): CarryoverLedger {
  return { wins: 0, losses: 0, routes: 0, objSwings: 0 };
}

export function ensureLedger(world: any, factionId: string): CarryoverLedger {
  if (!world?.factions?.[factionId]) throw new Error(`Faction ${factionId} not found`);
  const faction = world.factions[factionId];
  faction.ledger = faction.ledger ?? defaultLedger();
  return faction.ledger as CarryoverLedger;
}

export function recordBattle(world: any, summary: any): void {
  if (!summary) return;
  const winner = summary.winnerFactionId;
  const loser = summary.loserFactionId;
  if (!winner || !loser) return;

  const winnerLedger = ensureLedger(world, winner);
  const loserLedger = ensureLedger(world, loser);

  winnerLedger.wins += 1;
  loserLedger.losses += 1;

  if (Array.isArray(summary.routs) && summary.routs.includes(loser)) {
    loserLedger.routes += 1;
  }

  const objectives = summary.objectivesHeldByFaction ?? {};
  const winnerHeld = objectives[winner] ?? 0;
  const loserHeld = objectives[loser] ?? 0;
  const swing = winnerHeld - loserHeld;
  if (Math.abs(swing) >= 2) {
    winnerLedger.objSwings += 1;
    loserLedger.objSwings += 1;
  }
}

export function spawnCampaignEvents(world: any, turn: number): CampaignEvent[] {
  const out: CampaignEvent[] = [];
  const factions: any[] = Object.values(world?.factions ?? {});

  for (const faction of factions) {
    const ledger: CarryoverLedger | undefined = faction?.ledger;
    if (!ledger) continue;

    if (ledger.wins >= 3 && ledger.objSwings >= 2) {
      out.push({
        id: `ev_${faction.id}_${turn}_glory`,
        kind: 'GloryFestival',
        factionId: faction.id,
        turn,
      });
      ledger.wins = 0;
      ledger.objSwings = 0;
    }
    if (ledger.routes >= 2) {
      out.push({
        id: `ev_${faction.id}_${turn}_purge`,
        kind: 'Purge',
        factionId: faction.id,
        turn,
      });
      ledger.routes = 0;
    }
    if (ledger.losses >= 3) {
      out.push({
        id: `ev_${faction.id}_${turn}_reform`,
        kind: 'Reform',
        factionId: faction.id,
        turn,
      });
      ledger.losses = 0;
    }
  }

  if (!world.events) world.events = [];
  world.events.push(...out);
  return out;
}

export function applyEventEffects(world: any, ev: CampaignEvent): void {
  if (!ev) return;
  const faction = world?.factions?.[ev.factionId];
  if (!faction?.personality) return;

  const personality = faction.personality;
  switch (ev.kind) {
    case 'GloryFestival':
      personality.honor = Math.min(100, (personality.honor ?? 0) + 1);
      break;
    case 'Purge':
      personality.honor = Math.max(0, (personality.honor ?? 0) - 1);
      personality.zeal = Math.min(100, (personality.zeal ?? 0) + 1);
      break;
    case 'Reform':
      personality.caution = Math.min(100, (personality.caution ?? 0) + 1);
      break;
  }
}
