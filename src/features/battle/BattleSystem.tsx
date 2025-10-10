import React, { useState, useEffect, useCallback } from 'react';
import { rng } from "../../core/services/random";
import { storage } from "../../core/services/storage";

// Import character and spell types
interface Character {
  name: string;
  class: string;
  baseStats: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  finalStats: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  hitPoints: number;
  level: number;
  knownSpells?: string[];
  knownCantrips?: string[];
}

interface GeneratedSpell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  color: string;
}

interface Enemy {
  name: string;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  attack: number;
  damage: string;
  abilities: string[];
  description: string;
}

interface BattleParticipant {
  id: string;
  name: string;
  type: 'player' | 'enemy';
  character?: Character;
  enemy?: Enemy;
  currentHP: number;
  maxHP: number;
  armorClass: number;
  initiative: number;
  statusEffects: Array<{
    name: string;
    duration: number;
    effect: string;
    color: string;
  }>;
  concentrationSpell?: {
    name: string;
    duration: number;
    effect: string;
  };
}

interface BattleAction {
  type: 'attack' | 'cast-spell' | 'cast-cantrip' | 'defend' | 'move' | 'item';
  name: string;
  description: string;
  target?: 'self' | 'ally' | 'enemy' | 'all-enemies' | 'all-allies';
}

interface BattleSystemProps {
  playerCharacters: Character[];
  encounter: {
    name: string;
    description: string;
    enemies: Enemy[];
    terrain: string;
  };
  onBattleEnd: (_result: 'victory' | 'defeat' | 'flee', _rewards?: any) => void;
  onBack?: () => void;
}

export default function BattleSystem({
  playerCharacters,
  encounter,
  onBattleEnd,
  onBack
}: BattleSystemProps) {
  const [battleState, setBattleState] = useState<'setup' | 'active' | 'victory' | 'defeat'>('setup');
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<BattleAction | null>(null);
  const [_selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [availableSpells, setAvailableSpells] = useState<GeneratedSpell[]>([]);

  // Load saved spells from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(storage.local.getItem('world-engine-saved-spells') || '[]');
      setAvailableSpells(saved);
    } catch (error) {
      console.error('Error loading saved spells:', error);
    }
  }, []);

  // Helper functions for battle calculations
  const getModifier = (stat: number): number => {
    return Math.floor((stat - 10) / 2);
  };

  const rollInitiative = useCallback((dexterity: number): number => {
    return Math.floor(rng.next() * 20) + 1 + getModifier(dexterity);
  }, []);

  // Initialize battle participants
  useEffect(() => {
    const players: BattleParticipant[] = playerCharacters.map((char, index) => ({
      id: `player-${index}`,
      name: char.name,
      type: 'player',
      character: char,
      currentHP: char.hitPoints,
      maxHP: char.hitPoints,
      armorClass: 10 + getModifier(char.finalStats.dexterity),
      initiative: rollInitiative(char.finalStats.dexterity),
      statusEffects: [],
    }));

    const enemies: BattleParticipant[] = encounter.enemies.map((enemy, index) => ({
      id: `enemy-${index}`,
      name: enemy.name,
      type: 'enemy',
      enemy,
      currentHP: enemy.hitPoints,
      maxHP: enemy.hitPoints,
      armorClass: enemy.armorClass,
      initiative: rollInitiative(12), // Default dex of 12 for enemies
      statusEffects: [],
    }));

    const allParticipants = [...players, ...enemies];

    // Sort by initiative (highest first)
    const sorted = allParticipants.sort((a, b) => b.initiative - a.initiative);
    const order = sorted.map(p => p.id);

    setParticipants(allParticipants);
    setTurnOrder(order);
    setBattleState('active');

    addToBattleLog(`⚔️ Battle begins! ${encounter.name}`);
    addToBattleLog(`Terrain: ${encounter.terrain}`);
    addToBattleLog('Initiative order: ' + sorted.map(p => `${p.name} (${p.initiative})`).join(', '));
  }, [playerCharacters, encounter, rollInitiative]);

  const rollD20 = (): number => {
    return Math.floor(rng.next() * 20) + 1;
  };

  const rollDamage = (diceString: string): number => {
    // Parse dice strings like "1d8+2", "2d6", etc.
    const match = diceString.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!match) return 1;

    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const bonus = parseInt(match[3] || '0');

    let total = bonus;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(rng.next() * dieSize) + 1;
    }
    return total;
  };

  const addToBattleLog = (message: string) => {
    setBattleLog(prev => [...prev, message]);
  };

  const getCurrentParticipant = useCallback((): BattleParticipant | null => {
    if (turnOrder.length === 0) return null;
    const currentId = turnOrder[currentTurn];
    return participants.find(p => p.id === currentId) || null;
  }, [turnOrder, currentTurn, participants]);

  const getAvailableActions = (participant: BattleParticipant): BattleAction[] => {
    const actions: BattleAction[] = [
      {
        type: 'attack',
        name: 'Attack',
        description: 'Make a basic weapon or unarmed attack',
        target: 'enemy'
      },
      {
        type: 'defend',
        name: 'Defend',
        description: 'Gain +2 AC until your next turn',
        target: 'self'
      },
      {
        type: 'move',
        name: 'Move',
        description: 'Change position or take cover',
        target: 'self'
      }
    ];

    // Add spell actions for player characters
    if (participant.character) {
      const char = participant.character;

      // Add cantrips
      if (char.knownCantrips && char.knownCantrips.length > 0) {
        char.knownCantrips.forEach(cantripName => {
          const spell = availableSpells.find(s => s.name === cantripName && s.level === 0);
          if (spell) {
            actions.push({
              type: 'cast-cantrip',
              name: `Cast ${spell.name}`,
              description: spell.description,
              target: getSpellTargetType(spell)
            });
          }
        });
      }

      // Add spells
      if (char.knownSpells && char.knownSpells.length > 0) {
        char.knownSpells.forEach(spellName => {
          const spell = availableSpells.find(s => s.name === spellName && s.level > 0);
          if (spell) {
            actions.push({
              type: 'cast-spell',
              name: `Cast ${spell.name}`,
              description: spell.description,
              target: getSpellTargetType(spell)
            });
          }
        });
      }
    }

    return actions;
  };

  const getSpellTargetType = (spell: GeneratedSpell): BattleAction['target'] => {
    const desc = spell.description.toLowerCase();
    const range = spell.range.toLowerCase();

    if (range === 'self') return 'self';
    if (desc.includes('heal') || desc.includes('restore') || desc.includes('protect')) return 'ally';
    if (desc.includes('damage') || desc.includes('attack') || desc.includes('harm')) return 'enemy';

    // Default based on school
    const school = spell.school.toLowerCase();
    if (['evocation', 'necromancy', 'enchantment'].includes(school)) return 'enemy';
    if (['abjuration', 'divination'].includes(school)) return 'ally';

    return 'enemy'; // Default to offensive
  };

  const getValidTargets = (participant: BattleParticipant, action: BattleAction): BattleParticipant[] => {
    switch (action.target) {
      case 'self':
        return [participant];
      case 'ally':
        return participants.filter(p =>
          p.type === participant.type && p.currentHP > 0
        );
      case 'enemy':
        return participants.filter(p =>
          p.type !== participant.type && p.currentHP > 0
        );
      case 'all-enemies':
        return participants.filter(p =>
          p.type !== participant.type && p.currentHP > 0
        );
      case 'all-allies':
        return participants.filter(p =>
          p.type === participant.type && p.currentHP > 0
        );
      default:
        return [];
    }
  };

  const executeAttack = useCallback((attacker: BattleParticipant, target: BattleParticipant) => {
    const attackRoll = rollD20();
    const attackBonus = attacker.character
      ? getModifier(attacker.character.finalStats.strength)
      : (attacker.enemy?.attack || 0);

    const totalAttack = attackRoll + attackBonus;

    addToBattleLog(`${attacker.name} attacks ${target.name}! (${attackRoll} + ${attackBonus} = ${totalAttack} vs AC ${target.armorClass})`);

    if (totalAttack >= target.armorClass) {
      const damageRoll = attacker.character
        ? rollDamage('1d6') + getModifier(attacker.character.finalStats.strength)
        : rollDamage(attacker.enemy?.damage || '1d6');

      const actualDamage = Math.max(1, damageRoll);

      setParticipants(prev =>
        prev.map(p =>
          p.id === target.id
            ? { ...p, currentHP: Math.max(0, p.currentHP - actualDamage) }
            : p
        )
      );

      addToBattleLog(`🎯 Hit! ${target.name} takes ${actualDamage} damage.`);

      if (target.currentHP - actualDamage <= 0) {
        addToBattleLog(`💀 ${target.name} is defeated!`);
      }
    } else {
      addToBattleLog(`❌ Miss!`);
    }
  }, [rollD20, getModifier, rollDamage, addToBattleLog, setParticipants]);

  const applySpellEffect = useCallback((_caster: BattleParticipant, target: BattleParticipant, spell: GeneratedSpell) => {
    const desc = spell.description.toLowerCase();
    const school = spell.school.toLowerCase();
    const spellLevel = spell.level;

    // Determine spell effect type and magnitude
    let effectType = 'damage';
    let magnitude = spellLevel === 0 ? 4 : Math.max(4, spellLevel * 3);

    if (desc.includes('heal') || desc.includes('restore')) {
      effectType = 'heal';
      magnitude = spellLevel === 0 ? 3 : Math.max(3, spellLevel * 2);
    } else if (desc.includes('protect') || desc.includes('barrier') || desc.includes('shield')) {
      effectType = 'protection';
      magnitude = 2 + spellLevel;
    } else if (desc.includes('damage') || desc.includes('harm') || school === 'evocation') {
      effectType = 'damage';
      magnitude = spellLevel === 0 ? 4 : Math.max(4, spellLevel * 3);
    }

    // Apply the effect
    switch (effectType) {
      case 'heal':
        const healAmount = rollDamage(`1d${magnitude + 2}`) + (spellLevel > 0 ? spellLevel : 1);
        setParticipants(prev =>
          prev.map(p =>
            p.id === target.id
              ? { ...p, currentHP: Math.min(p.maxHP, p.currentHP + healAmount) }
              : p
          )
        );
        addToBattleLog(`💚 ${target.name} heals ${healAmount} HP!`);
        break;

      case 'damage':
        const damageAmount = rollDamage(`1d${magnitude}`) + (spellLevel > 0 ? spellLevel : 0);
        setParticipants(prev =>
          prev.map(p =>
            p.id === target.id
              ? { ...p, currentHP: Math.max(0, p.currentHP - damageAmount) }
              : p
          )
        );
        addToBattleLog(`💥 ${target.name} takes ${damageAmount} magical damage!`);

        if (target.currentHP - damageAmount <= 0) {
          addToBattleLog(`💀 ${target.name} is defeated by magic!`);
        }
        break;

      case 'protection':
        const protectionDuration = Math.max(1, Math.floor(magnitude / 2));
        setParticipants(prev =>
          prev.map(p => {
            if (p.id === target.id) {
              return {
                ...p,
                statusEffects: [
                  ...p.statusEffects,
                  {
                    name: `${spell.name} Protection`,
                    duration: protectionDuration,
                    effect: `+${magnitude} AC`,
                    color: spell.color
                  }
                ]
              };
            }
            return p;
          })
        );
        addToBattleLog(`🛡️ ${target.name} gains magical protection (+${magnitude} AC for ${protectionDuration} rounds)!`);
        break;
    }
  }, [rollDamage]);

  const executeDefend = useCallback((participant: BattleParticipant) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participant.id
          ? {
            ...p,
            statusEffects: [
              ...p.statusEffects,
              {
                name: 'Defending',
                duration: 1,
                effect: '+2 AC',
                color: '#10b981'
              }
            ]
          }
          : p
      )
    );
    addToBattleLog(`🛡️ ${participant.name} takes a defensive stance.`);
  }, []);

  const executeMove = useCallback((participant: BattleParticipant) => {
    addToBattleLog(`🏃 ${participant.name} moves to a better position.`);
  }, []);

  const executeCastSpell = useCallback((caster: BattleParticipant, action: BattleAction, targets: BattleParticipant[]) => {
    const spellName = action.name.replace('Cast ', '');
    const spell = availableSpells.find(s => s.name === spellName);

    if (!spell) {
      addToBattleLog(`❌ ${caster.name} failed to cast ${spellName}!`);
      return;
    }

    addToBattleLog(`✨ ${caster.name} casts ${spell.name}!`);

    // Apply spell effect to each target
    targets.forEach(target => {
      applySpellEffect(caster, target, spell);
    });
  }, [availableSpells, applySpellEffect]);

  const executeAction = useCallback((actor: BattleParticipant, action: BattleAction, targets: BattleParticipant[]) => {
    switch (action.type) {
      case 'attack':
        executeAttack(actor, targets[0]);
        break;
      case 'cast-spell':
      case 'cast-cantrip':
        executeCastSpell(actor, action, targets);
        break;
      case 'defend':
        executeDefend(actor);
        break;
      case 'move':
        executeMove(actor);
        break;
    }
  }, [executeAttack, executeCastSpell, executeDefend, executeMove]);

  const processEnemyTurn = useCallback((enemy: BattleParticipant) => {
    // Simple AI: attack a random player
    const playerTargets = participants.filter(p => p.type === 'player' && p.currentHP > 0);

    if (playerTargets.length === 0) return;

    const target = playerTargets[Math.floor(rng.next() * playerTargets.length)];
    const attackAction: BattleAction = {
      type: 'attack',
      name: 'Attack',
      description: 'Basic attack',
      target: 'enemy'
    };

    executeAction(enemy, attackAction, [target]);
  }, [participants, executeAction]);

  const nextTurn = useCallback(() => {
    // Decay status effects and concentration
    setParticipants(prev =>
      prev.map(p => ({
        ...p,
        statusEffects: p.statusEffects
          .map(effect => ({ ...effect, duration: effect.duration - 1 }))
          .filter(effect => effect.duration > 0),
        concentrationSpell: p.concentrationSpell && p.concentrationSpell.duration > 1
          ? { ...p.concentrationSpell, duration: p.concentrationSpell.duration - 1 }
          : undefined
      }))
    );

    let nextTurnIndex = (currentTurn + 1) % turnOrder.length;

    // If we've gone through all participants, start a new round
    if (nextTurnIndex === 0) {
      setRound(prev => prev + 1);
      addToBattleLog(`\n--- Round ${round + 1} ---`);
    }

    setCurrentTurn(nextTurnIndex);
    setSelectedAction(null);
    setSelectedTarget(null);

    // Check for battle end conditions
    const alivePlayers = participants.filter(p => p.type === 'player' && p.currentHP > 0);
    const aliveEnemies = participants.filter(p => p.type === 'enemy' && p.currentHP > 0);

    if (alivePlayers.length === 0) {
      setBattleState('defeat');
      onBattleEnd('defeat');
    } else if (aliveEnemies.length === 0) {
      setBattleState('victory');
      // Calculate rewards here
      onBattleEnd('victory', {
        experience: encounter.enemies.length * 100,
        gold: Math.floor(rng.next() * 50) + 10
      });
    }
  }, [currentTurn, turnOrder.length, round, participants, encounter.enemies.length, onBattleEnd]);

  const handleActionClick = (action: BattleAction) => {
    setSelectedAction(action);
    setSelectedTarget(null);
  };

  const handleTargetClick = (targetId: string) => {
    if (!selectedAction) return;

    const currentParticipant = getCurrentParticipant();
    if (!currentParticipant) return;

    const target = participants.find(p => p.id === targetId);
    if (!target) return;

    executeAction(currentParticipant, selectedAction, [target]);

    setTimeout(() => {
      nextTurn();
    }, 1500);
  };

  const handleEnemyTurn = useCallback(() => {
    const currentParticipant = getCurrentParticipant();
    if (currentParticipant?.type === 'enemy') {
      processEnemyTurn(currentParticipant);
      setTimeout(() => {
        nextTurn();
      }, 2000);
    }
  }, [getCurrentParticipant, processEnemyTurn, nextTurn]);

  // Auto-process enemy turns
  useEffect(() => {
    const currentParticipant = getCurrentParticipant();
    if (currentParticipant?.type === 'enemy' && battleState === 'active') {
      const timer = setTimeout(() => {
        handleEnemyTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, battleState, getCurrentParticipant, handleEnemyTurn]);

  if (battleState === 'setup') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: '#f1f5f9',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>⚔️ Preparing for Battle...</h2>
          <p>Rolling initiative and setting up the encounter</p>
        </div>
      </div>
    );
  }

  const currentParticipant = getCurrentParticipant();
  const isPlayerTurn = currentParticipant?.type === 'player';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      color: '#f1f5f9',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'rgba(15, 23, 42, 0.8)',
        borderRadius: '8px',
        border: '1px solid #334155'
      }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem' }}>
          ⚔️ {encounter.name}
        </h1>
        <p style={{ margin: 0, color: '#94a3b8' }}>
          Round {round} • {currentParticipant?.name}'s Turn ({currentParticipant?.type})
        </p>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              padding: '0.5rem 1rem',
              background: '#374151',
              color: '#f9fafb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: '1rem', height: 'calc(100vh - 200px)' }}>
        {/* Player Characters */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '8px',
          padding: '1rem',
          border: '2px solid #059669'
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#10b981' }}>👥 Player Characters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {participants.filter(p => p.type === 'player').map(participant => (
              <div
                key={participant.id}
                onClick={() => selectedAction && getValidTargets(currentParticipant!, selectedAction).some(t => t.id === participant.id) && handleTargetClick(participant.id)}
                style={{
                  padding: '0.75rem',
                  background: currentParticipant?.id === participant.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(15, 23, 42, 0.8)',
                  border: currentParticipant?.id === participant.id ? '2px solid #3b82f6' :
                    selectedAction && getValidTargets(currentParticipant!, selectedAction).some(t => t.id === participant.id) ? '2px solid #f59e0b' :
                      '1px solid #334155',
                  borderRadius: '6px',
                  cursor: selectedAction && getValidTargets(currentParticipant!, selectedAction).some(t => t.id === participant.id) ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{participant.name}</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                      ({participant.character?.class})
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: participant.currentHP <= participant.maxHP * 0.3 ? '#ef4444' : '#10b981' }}>
                      HP: {participant.currentHP}/{participant.maxHP}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      AC: {participant.armorClass}
                    </div>
                  </div>
                </div>

                {/* Status Effects */}
                {participant.statusEffects.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {participant.statusEffects.map((effect, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: effect.color,
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '3px'
                        }}
                      >
                        {effect.name} ({effect.duration}r)
                      </span>
                    ))}
                  </div>
                )}

                {/* Concentration Spell */}
                {participant.concentrationSpell && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#a78bfa',
                    fontStyle: 'italic'
                  }}>
                    Concentrating: {participant.concentrationSpell.name} ({participant.concentrationSpell.duration}r)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enemies */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '8px',
          padding: '1rem',
          border: '2px solid #dc2626'
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#ef4444' }}>👹 Enemies</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {participants.filter(p => p.type === 'enemy').map(participant => (
              <div
                key={participant.id}
                onClick={() => selectedAction && getValidTargets(currentParticipant!, selectedAction).some(t => t.id === participant.id) && handleTargetClick(participant.id)}
                style={{
                  padding: '0.75rem',
                  background: currentParticipant?.id === participant.id ? 'rgba(239, 68, 68, 0.3)' : 'rgba(15, 23, 42, 0.8)',
                  border: currentParticipant?.id === participant.id ? '2px solid #ef4444' :
                    selectedAction && getValidTargets(currentParticipant!, selectedAction).some(t => t.id === participant.id) ? '2px solid #f59e0b' :
                      '1px solid #334155',
                  borderRadius: '6px',
                  cursor: selectedAction && getValidTargets(currentParticipant!, selectedAction).some(t => t.id === participant.id) ? 'pointer' : 'default',
                  opacity: participant.currentHP <= 0 ? 0.5 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{participant.name}</strong>
                    {participant.currentHP <= 0 && (
                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>💀 Defeated</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: participant.currentHP <= participant.maxHP * 0.3 ? '#ef4444' : '#10b981' }}>
                      HP: {participant.currentHP}/{participant.maxHP}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      AC: {participant.armorClass}
                    </div>
                  </div>
                </div>

                {participant.enemy && (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    {participant.enemy.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions Panel */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid #334155'
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#f1f5f9' }}>
            {isPlayerTurn ? '🎲 Your Actions' : '⏳ Enemy Turn'}
          </h3>

          {isPlayerTurn ? (
            <div>
              {!selectedAction ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {getAvailableActions(currentParticipant!).map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(action)}
                      style={{
                        padding: '0.75rem',
                        background: '#374151',
                        color: '#f9fafb',
                        border: '1px solid #6b7280',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{action.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                        {action.description}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <h4 style={{ color: '#3b82f6' }}>Selected: {selectedAction.name}</h4>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.5rem 0' }}>
                    {selectedAction.description}
                  </p>

                  {selectedAction.target !== 'self' ? (
                    <p style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                      Click a target to continue...
                    </p>
                  ) : (
                    <button
                      onClick={() => handleTargetClick(currentParticipant!.id)}
                      style={{
                        padding: '0.75rem',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Execute Action
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedAction(null)}
                    style={{
                      padding: '0.5rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                      marginTop: '0.5rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <p>Enemy is deciding their action...</p>
            </div>
          )}

          {/* Battle Log */}
          <div style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '0.8rem',
            border: '1px solid #334155'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#94a3b8' }}>Battle Log</h4>
            {battleLog.slice(-8).map((entry, idx) => (
              <div key={idx} style={{ marginBottom: '0.25rem', color: '#d1d5db' }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}