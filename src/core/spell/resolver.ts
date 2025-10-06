// packages/core/src/spell/resolver.ts
import type { Axial } from '../action/types';
import type { WorldState } from '../action/types';
import type { Spell } from './types';
import type { DeltaBatch } from '../action/deltas';
import { computeDamage } from '../unit/damage';
import { modsFor } from '../morale/apply';

function defenseBonusAtFactory(world: WorldState) {
    return (_: Axial) => 0;
}

function entityAt(world: WorldState, hex: Axial) {
    const units = Array.from(world.units.values());
    for (const u of units) {
        if (u.pos.q === hex.q && u.pos.r === hex.r) return u;
    }
    return null;
} function moraleStateOf(world: WorldState, id: string) {
    return (world.units.get(id) as any)?.meta?.morale?.state || 'steady';
}

// Debuff scaling for Mind/Fear spells — deterministic, no dice
function scaledDebuffTurns(spell: Spell, targetMorale: 'steady' | 'shaken' | 'wavering' | 'routing', base: number) {
    const isPsy = !!(spell.tags?.includes('mind') || spell.tags?.includes('fear'));
    if (!isPsy) return base;
    switch (targetMorale) {
        case 'steady': return base;
        case 'shaken': return base + 1;
        case 'wavering': return base + 1;
        case 'routing': return base + 2;
    }
}

export function applySpell(world: WorldState, casterId: string, spell: Spell, targetHexes: Axial[]): DeltaBatch {
    const caster = world.units.get(casterId)!;
    const deltas: any[] = [];
    const logs: string[] = [];
    const defBonus = defenseBonusAtFactory(world);

    // Morale → accuracy/crit for damage spells
    const mstate = moraleStateOf(world, casterId);
    const mmods = modsFor(mstate as any);

    for (const eff of spell.effects) {
        for (const hex of targetHexes) {
            const target = entityAt(world, hex);
            if (!target && eff.kind !== 'terrain') continue;

            switch (eff.kind) {
                case 'heal': {
                    if (!target) break;
                    deltas.push({ kind: 'hp', id: target.id, delta: +eff.amount });
                    logs.push(JSON.stringify({ k: 'heal', spell: spell.id, tgt: target.id, amt: eff.amount }));
                    break;
                }
                case 'buff': {
                    if (!target) break;
                    deltas.push({ kind: 'status-add', id: target.id, name: eff.name, turns: eff.turns });
                    logs.push(JSON.stringify({ k: 'buff', spell: spell.id, tgt: target.id, name: eff.name, turns: eff.turns }));
                    break;
                }
                case 'debuff': {
                    if (!target) break;
                    const tm = moraleStateOf(world, target.id) as any;
                    const turns = scaledDebuffTurns(spell, tm, eff.turns);
                    deltas.push({ kind: 'status-add', id: target.id, name: eff.name, turns });
                    logs.push(JSON.stringify({ k: 'debuff', spell: spell.id, tgt: target.id, name: eff.name, turns, morale: tm }));
                    break;
                }
                case 'dot': {
                    if (!target) break;
                    const tm = moraleStateOf(world, target.id) as any;
                    const turns = scaledDebuffTurns(spell, tm, eff.turns);
                    deltas.push({ kind: 'status-add', id: target.id, name: eff.name, turns, amount: eff.amount });
                    logs.push(JSON.stringify({ k: 'dot', spell: spell.id, tgt: target.id, name: eff.name, turns, amt: eff.amount, morale: tm }));
                    break;
                }
                case 'hot': {
                    if (!target) break;
                    deltas.push({ kind: 'status-add', id: target.id, name: eff.name, turns: eff.turns, amount: eff.amount });
                    logs.push(JSON.stringify({ k: 'hot', spell: spell.id, tgt: target.id, name: eff.name, turns: eff.turns, amt: eff.amount }));
                    break;
                }
                case 'terrain': {
                    deltas.push({ kind: 'terrain', at: hex, change: eff.change });
                    logs.push(JSON.stringify({ k: 'terrain', spell: spell.id, change: eff.change, q: hex.q, r: hex.r }));
                    break;
                }
                case 'damage': {
                    if (!target) break;
                    const out = computeDamage(
                        caster as any,
                        target as any,
                        {
                            power: eff.power,
                            multiplier: eff.multiplier,
                            canCrit: !!eff.canCrit,
                            resistPen: eff.resistPen || 0,
                            armorPen: eff.armorPen || 0
                        },
                        {
                            rng: world.rng,
                            defenseBonusAt: defBonus,
                            damageKind: eff.damageKind,
                            damageSchool: eff.school
                        }
                    );
                    if (out.hit) {
                        deltas.push({ kind: 'hp', id: target.id, delta: -out.final });
                        logs.push(JSON.stringify({
                            k: 'spell_dmg',
                            spell: spell.id,
                            tgt: target.id,
                            amt: out.final,
                            crit: !!out.crit,
                            morale: mstate,
                            acc: mmods.accMult,
                            cshift: mmods.critPermille
                        }));
                    } else {
                        logs.push(JSON.stringify({
                            k: 'spell_miss',
                            spell: spell.id,
                            tgt: target.id,
                            morale: mstate,
                            acc: mmods.accMult
                        }));
                    }
                    break;
                }
            }
        }
    }

    deltas.push({ kind: 'mp', id: casterId, delta: -spell.manaCost });
    deltas.push({ kind: 'ap', id: casterId, delta: -spell.apCost });

    return {
        byActor: casterId,
        deltas,
        log: [JSON.stringify({ k: 'cast', id: spell.id, caster: casterId }), ...logs]
    };
}