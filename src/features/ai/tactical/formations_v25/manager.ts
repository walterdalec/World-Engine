
import type { Formation } from '../commander_v24/formations';
import { formationPositions } from '../commander_v24/formations';

export type Archetype = 'Infantry' | 'Shield' | 'Skirmisher' | 'Archer' | 'Cavalry' | 'Mage' | 'Siege';

export interface SlotAssignment {
  unitId: string;
  pos: { q: number; r: number };
  role: Archetype;
}

export function assignSlots(formation: Formation, units: { id: string; role: Archetype }[]): SlotAssignment[] {
  const positions = formationPositions(formation);
  const frontRoles: Archetype[] = ['Shield', 'Infantry'];
  const midRoles: Archetype[] = ['Skirmisher', 'Mage'];
  const rearRoles: Archetype[] = ['Archer', 'Siege'];

  const ordered: { id: string; role: Archetype }[] = [
    ...frontRoles.flatMap((role) => units.filter((u) => u.role === role)),
    ...midRoles.flatMap((role) => units.filter((u) => u.role === role)),
    ...rearRoles.flatMap((role) => units.filter((u) => u.role === role)),
    ...units.filter((u) => ![...frontRoles, ...midRoles, ...rearRoles].includes(u.role)),
  ];

  const assignments: SlotAssignment[] = [];
  for (let i = 0; i < ordered.length && i < positions.length; i += 1) {
    assignments.push({ unitId: ordered[i].id, pos: positions[i], role: ordered[i].role });
  }
  return assignments;
}

export function findReplacements(unassigned: string[], reserve: { id: string; role: Archetype }[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const pool = [...reserve];
  for (const id of unassigned) {
    const replacement = pool.pop();
    if (replacement) mapping[id] = replacement.id;
  }
  return mapping;
}
