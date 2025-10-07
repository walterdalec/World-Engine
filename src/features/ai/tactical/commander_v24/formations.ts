export type FormationKind = 'Line' | 'Wedge' | 'Column';

export interface Formation {
  kind: FormationKind;
  anchor: { q: number; r: number };
  facing: 0 | 1 | 2 | 3 | 4 | 5;
  layout: { dq: number; dr: number }[];
}

export function createFormation(kind: FormationKind, anchor: { q: number; r: number }, facing: Formation['facing']): Formation {
  const baseOffsets = getBaseOffsets(kind);
  const layout = baseOffsets.map((offset) => rotateAxial(offset, facing));
  return {
    kind,
    anchor,
    facing,
    layout,
  };
}

export function formationPositions(formation: Formation) {
  return formation.layout.map((offset) => ({ q: formation.anchor.q + offset.dq, r: formation.anchor.r + offset.dr }));
}

function getBaseOffsets(kind: FormationKind) {
  switch (kind) {
    case 'Line':
      return [
        { dq: 0, dr: 0 },
        { dq: 1, dr: 0 },
        { dq: -1, dr: 0 },
        { dq: 2, dr: 0 },
        { dq: -2, dr: 0 },
      ];
    case 'Wedge':
      return [
        { dq: 0, dr: 0 },
        { dq: 1, dr: 0 },
        { dq: 1, dr: -1 },
        { dq: 2, dr: -1 },
        { dq: 2, dr: -2 },
      ];
    case 'Column':
      return [
        { dq: 0, dr: 0 },
        { dq: 0, dr: -1 },
        { dq: 0, dr: -2 },
        { dq: 0, dr: -3 },
        { dq: 0, dr: -4 },
      ];
    default:
      return [{ dq: 0, dr: 0 }];
  }
}

function rotateAxial(offset: { dq: number; dr: number }, rotations: Formation['facing']) {
  let x = offset.dq;
  let z = offset.dr;
  let y = -x - z;
  for (let i = 0; i < rotations; i += 1) {
    const tmp = x;
    x = -y;
    y = -z;
    z = -tmp;
  }
  return { dq: x, dr: z };
}
