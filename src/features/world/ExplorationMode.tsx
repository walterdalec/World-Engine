import React, { useState, useEffect } from 'react';
import { rng } from "../../core/services/random";
import { BattleSystem } from '../battle';

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

interface Encounter {
  type: 'creature' | 'treasure' | 'event' | 'faction' | 'mystery' | 'quest';
  name: string;
  description: string;
  emoji: string;
  danger: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  quest?: any;
  treasure?: any;
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

interface ExplorationModeProps {
  encounter: Encounter;
  playerCharacters: Character[];
  onEncounterEnd: (result: 'completed' | 'fled' | 'failed', rewards?: any) => void;
  onBack?: () => void;
}

export default function ExplorationMode({
  encounter,
  playerCharacters,
  onEncounterEnd,
  onBack
}: ExplorationModeProps) {
  const [encounterState, setEncounterState] = useState<'approaching' | 'investigating' | 'combat' | 'resolved'>('approaching');
  const [battleEncounter, setBattleEncounter] = useState<any>(null);
  const [investigationResult, setInvestigationResult] = useState<string>('');
  const [rewards, setRewards] = useState<any>(null);
  const [playerChoice, setPlayerChoice] = useState<string>('');

  // Generate enemies based on encounter
  const generateEnemiesFromEncounter = (enc: Encounter): Enemy[] => {
    const dangerMultiplier = {
      'safe': 0,
      'low': 1,
      'medium': 2,
      'high': 3,
      'extreme': 4
    };

    const baseEnemies: Record<string, Enemy> = {
      'Wild Beasts': {
        name: 'Wild Wolf',
        hitPoints: 11,
        maxHitPoints: 11,
        armorClass: 13,
        attack: 4,
        damage: '2d4+2',
        abilities: ['Pack Tactics'],
        description: 'A fierce predator with sharp fangs'
      },
      'Bandits': {
        name: 'Bandit',
        hitPoints: 15,
        maxHitPoints: 15,
        armorClass: 12,
        attack: 3,
        damage: '1d6+1',
        abilities: ['Sneak Attack'],
        description: 'A desperate criminal looking for easy targets'
      },
      'Ancient Guardian': {
        name: 'Stone Guardian',
        hitPoints: 35,
        maxHitPoints: 35,
        armorClass: 17,
        attack: 6,
        damage: '2d8+4',
        abilities: ['Magic Resistance', 'Slam'],
        description: 'An ancient construct awakened to defend sacred grounds'
      },
      'Lost Spirits': {
        name: 'Wandering Spirit',
        hitPoints: 22,
        maxHitPoints: 22,
        armorClass: 14,
        attack: 5,
        damage: '2d6+3',
        abilities: ['Ethereal', 'Life Drain'],
        description: 'A tormented soul seeking peace or revenge'
      },
      'Corrupted Dryad': {
        name: 'Twisted Dryad',
        hitPoints: 30,
        maxHitPoints: 30,
        armorClass: 15,
        attack: 7,
        damage: '1d8+4',
        abilities: ['Nature Magic', 'Entangle', 'Barkskin'],
        description: 'Once a protector of nature, now corrupted by dark magic'
      },
      'Thornbeast Pack': {
        name: 'Thornbeast',
        hitPoints: 18,
        maxHitPoints: 18,
        armorClass: 14,
        attack: 5,
        damage: '1d8+3',
        abilities: ['Thorned Hide', 'Pounce'],
        description: 'A predator with living vines as armor'
      }
    };

    if (enc.type !== 'creature' || enc.danger === 'safe') {
      return []; // No combat for safe encounters or non-creature types
    }

    // Try to match encounter name to enemy type
    const enemyTemplate = baseEnemies[enc.name] || baseEnemies['Wild Beasts'];
    const multiplier = dangerMultiplier[enc.danger];

    // Create enemies with scaled stats based on danger level
    const enemies: Enemy[] = [];
    const numEnemies = Math.max(1, multiplier);

    for (let i = 0; i < numEnemies; i++) {
      enemies.push({
        ...enemyTemplate,
        name: numEnemies > 1 ? `${enemyTemplate.name} ${i + 1}` : enemyTemplate.name,
        hitPoints: enemyTemplate.hitPoints + (multiplier * 5),
        maxHitPoints: enemyTemplate.maxHitPoints + (multiplier * 5),
        attack: enemyTemplate.attack + Math.floor(multiplier / 2),
        armorClass: enemyTemplate.armorClass + Math.floor(multiplier / 3)
      });
    }

    return enemies;
  };

  const generateTerrain = (): string => {
    const terrains = [
      'Dense Forest',
      'Rocky Outcrop',
      'Misty Clearing',
      'Ancient Ruins',
      'Thorny Undergrowth',
      'Crystal Cave',
      'Moonlit Grove',
      'Shadow-touched Hollow'
    ];
    return terrains[Math.floor(rng.next() * terrains.length)];
  };

  const handleApproach = (choice: 'investigate' | 'combat' | 'flee') => {
    setPlayerChoice(choice);

    switch (choice) {
      case 'investigate':
        handleInvestigation();
        break;
      case 'combat':
        initiateCombat();
        break;
      case 'flee':
        onEncounterEnd('fled');
        break;
    }
  };

  const handleInvestigation = () => {
    setEncounterState('investigating');

    // Generate investigation results based on encounter type
    let _result = '';
    let foundRewards: any = null;

    switch (encounter.type) {
      case 'mystery':
        if (encounter.danger === 'safe' || encounter.danger === 'low') {
          result = "Your careful investigation reveals hidden secrets. You successfully solve the mystery without danger!";
          foundRewards = {
            experience: 150,
            gold: Math.floor(rng.next() * 30) + 10,
            special: "Ancient Knowledge: +1 to your next spell attack roll"
          };
        } else {
          result = "As you investigate, you trigger ancient defenses! The mystery guardians awaken...";
          setTimeout(() => initiateCombat(), 2000);
          return;
        }
        break;

      case 'treasure':
        result = "You carefully examine the area and discover valuable treasures hidden from plain sight!";
        foundRewards = {
          gold: Math.floor(rng.next() * 100) + 50,
          items: ["Magical Component Pouch", "Healing Potion"],
          experience: 100
        };
        break;

      case 'event':
        result = "You take time to properly assess the situation. Your wisdom grants you insight and safe passage.";
        foundRewards = {
          experience: 75,
          buff: "Well-Rested: +2 to all rolls for the next encounter"
        };
        break;

      case 'quest':
        result = "You gather information and clues about this quest. Your investigation reveals the best course of action.";
        foundRewards = {
          experience: 125,
          questProgress: "Gained valuable quest information"
        };
        break;

      default:
        if (encounter.danger === 'safe') {
          result = "Your cautious approach pays off. You handle the situation peacefully.";
          foundRewards = { experience: 50 };
        } else {
          result = "Your investigation alerts the hostile creatures! Prepare for battle!";
          setTimeout(() => initiateCombat(), 2000);
          return;
        }
        break;
    }

    setInvestigationResult(_result);
    setRewards(foundRewards);

    setTimeout(() => {
      setEncounterState('resolved');
      onEncounterEnd('completed', foundRewards);
    }, 3000);
  };

  const initiateCombat = () => {
    const enemies = generateEnemiesFromEncounter(encounter);

    if (enemies.length === 0) {
      // No combat possible, treat as automatic success
      setInvestigationResult("There are no hostile creatures here. You approach safely.");
      setRewards({ experience: 25 });
      setTimeout(() => {
        setEncounterState('resolved');
        onEncounterEnd('completed', { experience: 25 });
      }, 2000);
      return;
    }

    const battleEnc = {
      name: encounter.name,
      description: encounter.description,
      enemies,
      terrain: generateTerrain()
    };

    setBattleEncounter(battleEnc);
    setEncounterState('combat');
  };

  const handleBattleEnd = (result: 'victory' | 'defeat' | 'flee', battleRewards?: any) => {
    if (result === 'victory') {
      onEncounterEnd('completed', battleRewards);
    } else if (result === 'defeat') {
      onEncounterEnd('failed');
    } else {
      onEncounterEnd('fled');
    }
  };

  if (encounterState === 'combat' && battleEncounter) {
    return (
      <BattleSystem
        playerCharacters={playerCharacters}
        encounter={battleEncounter}
        onBattleEnd={handleBattleEnd}
        onBack={onBack}
      />
    );
  }

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
      <div style={{
        maxWidth: '800px',
        background: 'rgba(15, 23, 42, 0.8)',
        borderRadius: '12px',
        padding: '2rem',
        border: `2px solid ${getDangerColor(encounter.danger)}`,
        textAlign: 'center'
      }}>
        {encounterState === 'approaching' && (
          <>
            <h1 style={{
              margin: '0 0 1rem',
              fontSize: '2.5rem',
              color: getDangerColor(encounter.danger)
            }}>
              {encounter.emoji} {encounter.name}
            </h1>

            <div style={{
              margin: '1rem 0',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}>
              {encounter.description}
            </div>

            <div style={{
              margin: '1rem 0',
              padding: '0.75rem',
              background: getDangerColor(encounter.danger) + '20',
              border: `1px solid ${getDangerColor(encounter.danger)}`,
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}>
              Danger Level: {encounter.danger.charAt(0).toUpperCase() + encounter.danger.slice(1)}
            </div>

            <div style={{
              marginTop: '2rem',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => handleApproach('investigate')}
                style={{
                  padding: '1rem 2rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                🔍 Investigate Carefully
              </button>

              <button
                onClick={() => handleApproach('combat')}
                style={{
                  padding: '1rem 2rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                ⚔️ Attack Directly
              </button>

              <button
                onClick={() => handleApproach('flee')}
                style={{
                  padding: '1rem 2rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem'
                }}
              >
                🏃 Avoid and Leave
              </button>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                style={{
                  position: 'absolute',
                  top: '2rem',
                  left: '2rem',
                  padding: '0.75rem 1.5rem',
                  background: '#374151',
                  color: '#f9fafb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ← Back to Map
              </button>
            )}
          </>
        )}

        {encounterState === 'investigating' && (
          <>
            <h2 style={{ color: '#3b82f6' }}>🔍 Investigation in Progress...</h2>
            <div style={{
              margin: '2rem 0',
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              fontSize: '1.1rem'
            }}>
              <p>You carefully examine the {encounter.name.toLowerCase()}...</p>
              <p>Your party moves with caution, using wisdom and experience to navigate the situation.</p>

              <div style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid #3b82f6',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Investigating...</span>
              </div>
            </div>
          </>
        )}

        {encounterState === 'resolved' && (
          <>
            <h2 style={{ color: '#10b981' }}>✅ Encounter Resolved</h2>
            <div style={{
              margin: '2rem 0',
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}>
              {investigationResult}
            </div>

            {rewards && (
              <div style={{
                margin: '1rem 0',
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#10b981', margin: '0 0 1rem' }}>🎁 Rewards Gained</h3>
                {rewards.experience && <p>Experience: +{rewards.experience} XP</p>}
                {rewards.gold && <p>Gold: +{rewards.gold} coins</p>}
                {rewards.items && (
                  <p>Items: {rewards.items.join(', ')}</p>
                )}
                {rewards.special && <p style={{ color: '#a78bfa' }}>Special: {rewards.special}</p>}
                {rewards.buff && <p style={{ color: '#f59e0b' }}>Buff: {rewards.buff}</p>}
                {rewards.questProgress && <p style={{ color: '#3b82f6' }}>{rewards.questProgress}</p>}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function getDangerColor(danger: string): string {
  switch (danger) {
    case 'safe': return '#10b981';
    case 'low': return '#f59e0b';
    case 'medium': return '#f97316';
    case 'high': return '#ef4444';
    case 'extreme': return '#991b1b';
    default: return '#6b7280';
  }
}