
import type { BattleSampleV1, FileHeader } from './schema.v1';

type LearnRuntime = {
  header: FileHeader | null;
  rows: BattleSampleV1[];
  scratch: Record<string, BattleSampleV1>;
  detach?: () => void;
  recordEvent?: (event: any) => void;
};

type EventHandler = (event: any) => void;

function defaultHeader(world: any): FileHeader {
  return {
    schema: 'BattleSampleV1',
    gameVersion: world.version ?? 'unknown',
    map: world.mapId ?? 'unknown',
    ts: Date.now(),
  };
}

function ensureRuntime(world: any): LearnRuntime {
  world.learn = world.learn ?? {};
  const learn = world.learn as LearnRuntime;
  learn.header = learn.header ?? defaultHeader(world);
  learn.rows = learn.rows ?? [];
  learn.scratch = learn.scratch ?? {};
  return learn;
}

function sampleKey(commander: string, turn: number) {
  return `${commander}:${turn}`;
}

function ensureSample(world: any, commander: 'A' | 'B', turn: number): BattleSampleV1 {
  const learn = ensureRuntime(world);
  const key = sampleKey(commander, turn);
  const seed = world.seed ?? 0;
  if (!learn.scratch[key]) {
    learn.scratch[key] = {
      turn,
      seed,
      commander,
      orders: [],
      deception: { used: false },
      deltas: { hpA: 0, hpB: 0, moraleA: 0, moraleB: 0 },
    };
  }
  return learn.scratch[key];
}

function finalizeSample(world: any, commander: 'A' | 'B', turn: number) {
  const learn = ensureRuntime(world);
  const key = sampleKey(commander, turn);
  const sample = learn.scratch[key];
  if (sample) {
    learn.rows.push({ ...sample });
    delete learn.scratch[key];
  }
}

function resolveCommander(event: any): 'A' | 'B' {
  const side = event?.side ?? event?.commander ?? 'A';
  return side === 'B' ? 'B' : 'A';
}

function resolveTurn(world: any, event: any): number {
  return event?.turn ?? world.turn ?? 0;
}

function recordOrder(sample: BattleSampleV1, order: any) {
  try {
    sample.orders.push(JSON.stringify(order));
  } catch (err) {
    sample.orders.push(String(order));
  }
}

function handleEvent(world: any, event: any) {
  if (!event || typeof event !== 'object') return;
  const commander = resolveCommander(event);
  const turn = resolveTurn(world, event);
  const sample = ensureSample(world, commander, turn);

  switch (event.kind) {
    case 'CommanderOrder': {
      recordOrder(sample, event.payload ?? event.order ?? event);
      break;
    }
    case 'Operation':
    case 'OperationStage': {
      sample.opId = event.opId ?? sample.opId;
      sample.stage = event.stage ?? sample.stage;
      break;
    }
    case 'Deception':
    case 'DeceptionUsed': {
      sample.deception.used = true;
      if (event.strategy) sample.deception.kind = event.strategy;
      if (event.kindId) sample.deception.kind = event.kindId;
      if (typeof event.detected === 'boolean') sample.deception.detected = event.detected;
      break;
    }
    case 'DeceptionDetected': {
      sample.deception.used = true;
      sample.deception.detected = true;
      break;
    }
    case 'BattleDelta':
    case 'TurnDelta': {
      const d = event.deltas ?? {};
      sample.deltas.hpA = d.hpA ?? sample.deltas.hpA;
      sample.deltas.hpB = d.hpB ?? sample.deltas.hpB;
      sample.deltas.moraleA = d.moraleA ?? sample.deltas.moraleA;
      sample.deltas.moraleB = d.moraleB ?? sample.deltas.moraleB;
      break;
    }
    case 'Outcome':
    case 'BattleOutcome': {
      sample.outcome = (event.result ?? event.outcome ?? '').toLowerCase();
      finalizeSample(world, commander, turn);
      break;
    }
    case 'TurnEnd':
    case 'TurnComplete': {
      finalizeSample(world, commander, turn);
      break;
    }
    default:
      break;
  }
}

export function attachCollector(world: any) {
  const learn = ensureRuntime(world);
  const handler: EventHandler = (event) => handleEvent(world, event);

  if (typeof world.onEvent === 'function') {
    const detach = world.onEvent(handler);
    if (typeof detach === 'function') learn.detach = detach;
  } else {
    world.exec = world.exec ?? {};
    world.exec.emitEvent = (event: any) => handler(event);
  }

  learn.recordEvent = handler;
}

export function flushCollector(world: any) {
  const learn = ensureRuntime(world);
  for (const key of Object.keys(learn.scratch)) {
    const [commander, turnStr] = key.split(':');
    finalizeSample(world, commander === 'B' ? 'B' : 'A', Number(turnStr));
  }
}
