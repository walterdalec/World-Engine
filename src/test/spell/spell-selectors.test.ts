/**
 * Spell Selector Tests
 * Tests spell targeting, range validation, and area-of-effect calculations
 */

import { describe, it, expect } from 'vitest';

type HexCoord = { q: number; r: number };

// Spell types for testing
type SpellShape = 'single' | 'blast' | 'cone' | 'line';

interface Spell {
  id: string;
  name: string;
  range: number;
  shape: SpellShape;
  aoeSize?: number;
}

// Helper: Calculate hex distance (cube distance)
function hexDistance(a: HexCoord, b: HexCoord): number {
  const aq = a.q;
  const ar = a.r;
  const as = -a.q - a.r;

  const bq = b.q;
  const br = b.r;
  const bs = -b.q - b.r;

  return Math.max(
    Math.abs(aq - bq),
    Math.abs(ar - br),
    Math.abs(as - bs)
  );
}

// Spell selector: Check if target is valid
function isValidTarget(spell: Spell, caster: HexCoord, target: HexCoord): boolean {
  const distance = hexDistance(caster, target);
  return distance <= spell.range && distance > 0; // Can't target self
}

// AOE selector: Get all hexes affected by spell
function getAffectedHexes(
  spell: Spell,
  caster: HexCoord,
  target: HexCoord
): HexCoord[] {
  if (!isValidTarget(spell, caster, target)) {
    return [];
  }

  const affected: HexCoord[] = [target];

  if (spell.shape === 'blast' && spell.aoeSize) {
    // Add hexes within blast radius
    const radius = spell.aoeSize;
    for (let q = target.q - radius; q <= target.q + radius; q++) {
      for (let r = target.r - radius; r <= target.r + radius; r++) {
        const hex = { q, r };
        if (hexDistance(target, hex) <= radius && (hex.q !== target.q || hex.r !== target.r)) {
          affected.push(hex);
        }
      }
    }
  }

  return affected;
}

describe('Spell Selectors', () => {
  const caster: HexCoord = { q: 0, r: 0 };

  describe('Single Target Spell', () => {
    const fireball: Spell = {
      id: 'fireball',
      name: 'Fireball',
      range: 5,
      shape: 'single'
    };

    it('accepts target within range', () => {
      const target = { q: 3, r: 0 }; // Distance 3
      expect(isValidTarget(fireball, caster, target)).toBe(true);
    });

    it('rejects target beyond range', () => {
      const target = { q: 6, r: 0 }; // Distance 6 > range 5
      expect(isValidTarget(fireball, caster, target)).toBe(false);
    });

    it('rejects self as target', () => {
      expect(isValidTarget(fireball, caster, caster)).toBe(false);
    });

    it('affects only the target hex', () => {
      const target = { q: 2, r: 1 };
      const affected = getAffectedHexes(fireball, caster, target);
      expect(affected).toHaveLength(1);
      expect(affected[0]).toEqual(target);
    });
  });

  describe('Blast AOE Spell', () => {
    const meteor: Spell = {
      id: 'meteor',
      name: 'Meteor Strike',
      range: 6,
      shape: 'blast',
      aoeSize: 2
    };

    it('affects target and surrounding hexes', () => {
      const target = { q: 3, r: 0 };
      const affected = getAffectedHexes(meteor, caster, target);

      // Should include center + hexes within radius 2
      expect(affected.length).toBeGreaterThan(1);
      expect(affected).toContainEqual(target);
    });

    it('respects range limits for AOE center', () => {
      const target = { q: 7, r: 0 }; // Beyond range 6
      const affected = getAffectedHexes(meteor, caster, target);
      expect(affected).toHaveLength(0);
    });

    it('all affected hexes are within AOE radius', () => {
      const target = { q: 4, r: 0 };
      const affected = getAffectedHexes(meteor, caster, target);

      affected.forEach(hex => {
        expect(hexDistance(target, hex)).toBeLessThanOrEqual(meteor.aoeSize!);
      });
    });
  });

  describe('Range Edge Cases', () => {
    const spell: Spell = {
      id: 'test',
      name: 'Test Spell',
      range: 3,
      shape: 'single'
    };

    it('accepts target exactly at max range', () => {
      const target = { q: 3, r: 0 }; // Distance exactly 3
      expect(isValidTarget(spell, caster, target)).toBe(true);
    });

    it('accepts target at range 1 (adjacent)', () => {
      const target = { q: 1, r: 0 };
      expect(isValidTarget(spell, caster, target)).toBe(true);
    });

    it('works with negative coordinates', () => {
      const target = { q: -2, r: 1 }; // Distance 2
      expect(isValidTarget(spell, caster, target)).toBe(true);
    });
  });
});

describe('Spell Gating (MP Cost)', () => {
  interface Unit {
    mp: number;
    maxMp: number;
  }

  interface CastableSpell extends Spell {
    mpCost: number;
  }

  function canCastSpell(caster: Unit, spell: CastableSpell): boolean {
    return caster.mp >= spell.mpCost;
  }

  function castSpell(caster: Unit, spell: CastableSpell, _target: HexCoord): boolean {
    if (!canCastSpell(caster, spell)) {
      return false;
    }

    caster.mp -= spell.mpCost;
    return true;
  }

  it('allows casting with sufficient MP', () => {
    const unit: Unit = { mp: 10, maxMp: 10 };
    const spell: CastableSpell = {
      id: 'heal',
      name: 'Heal',
      range: 5,
      shape: 'single',
      mpCost: 5
    };

    expect(canCastSpell(unit, spell)).toBe(true);
  });

  it('prevents casting with insufficient MP', () => {
    const unit: Unit = { mp: 3, maxMp: 10 };
    const spell: CastableSpell = {
      id: 'meteor',
      name: 'Meteor',
      range: 6,
      shape: 'blast',
      mpCost: 10,
      aoeSize: 2
    };

    expect(canCastSpell(unit, spell)).toBe(false);
  });

  it('deducts MP when cast successfully', () => {
    const unit: Unit = { mp: 10, maxMp: 10 };
    const spell: CastableSpell = {
      id: 'fireball',
      name: 'Fireball',
      range: 5,
      shape: 'single',
      mpCost: 4
    };

    const success = castSpell(unit, spell, { q: 2, r: 0 });

    expect(success).toBe(true);
    expect(unit.mp).toBe(6);
  });

  it('does not deduct MP when cast fails', () => {
    const unit: Unit = { mp: 2, maxMp: 10 };
    const spell: CastableSpell = {
      id: 'meteor',
      name: 'Meteor',
      range: 6,
      shape: 'blast',
      mpCost: 10,
      aoeSize: 2
    };

    const initialMp = unit.mp;
    const success = castSpell(unit, spell, { q: 3, r: 0 });

    expect(success).toBe(false);
    expect(unit.mp).toBe(initialMp); // MP unchanged
  });
});
