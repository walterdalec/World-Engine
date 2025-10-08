/**
 * Classic Character Creator
 * Might & Magic 1-2 inspired interface with modern functionality
 */

import React, { useState, useMemo } from 'react';
import type { CreatorInput, SpeciesId, BackgroundId, ArchetypeId, StatAllocation, MasteryPick } from '../../../core/creator/types';
import { buildCharacter, validateInput, CharacterCreator } from '../../../core/creator';
import { StatBudgetByLevel, StatPointCost, MaxPerStat, MinPerStat } from '../../../core/creator/rules';
import { SimplePortraitPreview, SimpleUtils } from '../../portraits';
import { storage } from "../../../core/services/storage";
import './ClassicCharacterCreator.css';

interface ClassicCharacterCreatorProps {
    onCharacterCreated?: (character: any) => void;
    onCancel?: () => void;
}

type CreationStep = 'identity' | 'stats' | 'traits' | 'magic' | 'spells' | 'review';

// Enhanced character state to match the old system
interface EnhancedCharacter extends CreatorInput {
    gender: 'male' | 'female';
    traits: string[];
    knownSpells: string[];
    knownCantrips: string[];
}

const SPECIES_DATA = {
    human: { name: 'Human', bonus: 'Adaptable and versatile' },
    sylvanborn: { name: 'Sylvanborn', bonus: 'Nature magic affinity' },
    nightborn: { name: 'Nightborn', bonus: 'Shadow magic mastery' },
    stormcaller: { name: 'Stormcaller', bonus: 'Lightning and storm magic' },
    crystalborn: { name: 'Crystalborn', bonus: 'Earth magic and durability' },
    draketh: { name: 'Draketh', bonus: 'Fire magic and strength' },
    alloy: { name: 'Alloy', bonus: 'Construct resilience' },
    voidkin: { name: 'Voidkin', bonus: 'Void magic mastery' }
};

const BACKGROUND_DATA = {
    commoner: { name: 'Commoner', benefit: 'Hardy constitution' },
    noble: { name: 'Noble', benefit: 'Leadership training' },
    outcast: { name: 'Outcast', benefit: 'Self-reliance' },
    acolyte: { name: 'Acolyte', benefit: 'Divine knowledge' },
    ranger: { name: 'Ranger', benefit: 'Nature skills' },
    scholar: { name: 'Scholar', benefit: 'Arcane lore' },
    mercenary: { name: 'Mercenary', benefit: 'Combat experience' },
    wanderer: { name: 'Wanderer', benefit: 'Survival instincts' }
};

const ARCHETYPE_DATA = {
    knight: { name: 'Knight', role: 'Heavy Combat', gender: 'male' },
    ranger: { name: 'Ranger', role: 'Ranged Combat', gender: 'male' },
    chanter: { name: 'Chanter', role: 'Divine Magic', gender: 'male' },
    mystic: { name: 'Mystic', role: 'Arcane Magic', gender: 'female' },
    guardian: { name: 'Guardian', role: 'Nature Magic', gender: 'female' },
    corsair: { name: 'Corsair', role: 'Stealth & Speed', gender: 'female' }
};

const MAGIC_SCHOOLS = [
    'Fire', 'Air', 'Water', 'Earth', 'Spirit', 'Shadow', 'Nature', 'Arcane', 'Divine'
] as const;

// Trait System from the old character creator
const TRAIT_DEFINITIONS = {
    "Brave": { name: "Brave", description: "Resistant to fear and intimidation effects", bonus: "courage +2" },
    "Clever": { name: "Clever", description: "Quick thinking in complex situations", bonus: "investigation +2" },
    "Cunning": { name: "Cunning", description: "Skilled at deception and misdirection", bonus: "stealth +2" },
    "Empathic": { name: "Empathic", description: "Deeply understands others' emotions", bonus: "persuasion +2" },
    "Stoic": { name: "Stoic", description: "Unshaken by pain or hardship", bonus: "endurance +2" },
    "Lucky": { name: "Lucky", description: "Fortune favors you", bonus: "reroll once per encounter" },
    "Observant": { name: "Observant", description: "Notice details others miss", bonus: "perception +2" },
    "Silver Tongue": { name: "Silver Tongue", description: "Naturally persuasive speaker", bonus: "social +2" },
    "Iron Will": { name: "Iron Will", description: "Mental fortitude against magical effects", bonus: "mental defense +2" },
    "Swift": { name: "Swift", description: "Faster movement and reflexes", bonus: "speed +2" },
    "Nature's Friend": { name: "Nature's Friend", description: "Animals and plants respond favorably", bonus: "nature +2" },
    "Keen Senses": { name: "Keen Senses", description: "Enhanced sensory perception", bonus: "detection +2" },
    "Patient": { name: "Patient", description: "Calm and methodical approach", bonus: "concentration +2" },
    "Resilient": { name: "Resilient", description: "Exceptionally tough constitution", bonus: "+2 HP per level" },
    "Hardy": { name: "Hardy", description: "Natural toughness and endurance", bonus: "+1 HP per level" },
    "Frail": { name: "Frail", description: "Delicate constitution, but often comes with other gifts", bonus: "-2 HP per level" }
};

// Spell calculation functions from old system
function calculateMaxCantrips(level: number, intScore: number, wisScore: number): number {
    const baseCantrips = Math.floor(level / 2) + 1;
    const abilityBonus = Math.floor((Math.max(intScore, wisScore) - 10) / 2);
    return Math.max(1, baseCantrips + Math.max(0, abilityBonus));
}

function calculateMaxSpells(level: number, intScore: number, wisScore: number): number {
    if (level < 2) return 0;
    const baseSpells = Math.max(0, level - 1);
    const abilityBonus = Math.floor((Math.max(intScore, wisScore) - 12) / 2);
    return Math.max(0, baseSpells + Math.max(0, abilityBonus));
}

function calculateMaxSpellLevel(level: number): number {
    if (level < 2) return 0;
    return Math.min(9, Math.floor((level + 1) / 2));
}

export const ClassicCharacterCreator: React.FC<ClassicCharacterCreatorProps> = ({
    onCharacterCreated,
    onCancel
}) => {
    const [step, setStep] = useState<CreationStep>('identity');
    const [character, setCharacter] = useState<EnhancedCharacter>({
        name: '',
        gender: 'male',
        team: 'Player',
        species: 'human',
        background: 'commoner',
        archetype: 'knight',
        level: 1,
        stats: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8, spd: 8, lck: 8 },
        masteries: [],
        traits: [],
        knownSpells: [],
        knownCantrips: [],
        formation: { row: 'front', slot: 0, facing: 0 }
    });

    // Handle gender-locked archetype selection
    const handleArchetypeChange = (newArchetype: string) => {
        const archetypeData = ARCHETYPE_DATA[newArchetype as keyof typeof ARCHETYPE_DATA];
        if (archetypeData) {
            setCharacter(prev => ({
                ...prev,
                archetype: newArchetype as ArchetypeId,
                gender: archetypeData.gender as 'male' | 'female'
            }));
        }
    };

    const validation = useMemo(() => validateInput(character), [character]);

    // Use the old system's 27-point budget and stat calculation
    const POINTS_POOL = 27;
    const usedPoints = Object.values(character.stats).reduce((sum, stat) => {
        return sum + calculateOldStatCost(stat);
    }, 0);
    const remainingPoints = POINTS_POOL - usedPoints;

    // Old system's stat cost calculation (much better for gameplay)
    function calculateOldStatCost(value: number): number {
        let cost = 0;
        for (let statValue = 9; statValue <= value; statValue++) {
            if (statValue <= 14) cost += 1;      // Values 9-14: 1 point each
            else if (statValue <= 16) cost += 2; // Values 15-16: 2 points each  
            else cost += 3;                      // Values 17+: 3 points each
        }
        return cost;
    }

    const handleStatChange = (stat: keyof StatAllocation, delta: number) => {
        const newValue = character.stats[stat] + delta;
        const MIN_STAT = 8;
        const MAX_STAT = 20;

        if (newValue < MIN_STAT || newValue > MAX_STAT) return;

        const newStats = { ...character.stats, [stat]: newValue };

        // Calculate if this change is affordable using old system
        const newUsedPoints = Object.values(newStats).reduce((sum, statVal) => {
            return sum + calculateOldStatCost(statVal);
        }, 0);

        if (newUsedPoints <= POINTS_POOL) {
            setCharacter(prev => ({ ...prev, stats: newStats }));
        }
    }; const handleMasteryChange = (school: string, rank: number) => {
        const newMasteries = [...character.masteries];
        const existingIndex = newMasteries.findIndex(m => m.school === school);

        if (existingIndex >= 0) {
            if (rank === 0) {
                newMasteries.splice(existingIndex, 1);
            } else {
                newMasteries[existingIndex].rank = rank as 1 | 2 | 3 | 4;
            }
        } else if (rank > 0) {
            newMasteries.push({ school: school as any, rank: rank as 1 | 2 | 3 | 4 });
        }

        setCharacter(prev => ({ ...prev, masteries: newMasteries }));
    };

    const handleRandomize = () => {
        const randomChar = CharacterCreator.createRandomCharacter(character.level, character.archetype);
        setCharacter(prev => ({ ...prev, ...randomChar, name: prev.name || randomChar.name }));
    };

    const handleCreateCharacter = () => {
        if (validation.ok) {
            const builtCharacter = buildCharacter(character);
            onCharacterCreated?.(builtCharacter);
        }
    };

    const renderIdentityStep = () => (
        <div className="creation-step">
            <h2>CHARACTER IDENTITY</h2>

            <div className="identity-layout">
                <div className="identity-left">
                    <div className="field-row">
                        <label>Name:</label>
                        <input
                            type="text"
                            value={character.name}
                            onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter character name"
                            className="text-input"
                        />
                    </div>

                    <div className="field-row">
                        <label>Gender:</label>
                        <select
                            value={character.gender}
                            onChange={(e) => setCharacter(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                            className="dropdown"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    <div className="field-row">
                        <label>Level:</label>
                        <select
                            value={character.level}
                            onChange={(e) => setCharacter(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                            className="dropdown"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                                <option key={level} value={level}>Level {level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="identity-right">
                    <div className="portrait-preview">
                        <h3>PORTRAIT</h3>
                        {character.name && character.species && character.archetype && (
                            <SimplePortraitPreview
                                gender={character.gender}
                                species={character.species.toLowerCase()}
                                archetype={character.archetype.toLowerCase()}
                                size="large"
                                showDebug={false}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="selection-grid">
                <div className="selection-column">
                    <h3>RACE</h3>
                    {Object.entries(SPECIES_DATA).map(([id, data]) => (
                        <div
                            key={id}
                            className={`selection-item ${character.species === id ? 'selected' : ''}`}
                            onClick={() => setCharacter(prev => ({ ...prev, species: id as SpeciesId }))}
                        >
                            <div className="item-name">{data.name}</div>
                            <div className="item-bonus">{data.bonus}</div>
                        </div>
                    ))}
                </div>

                <div className="selection-column">
                    <h3>BACKGROUND</h3>
                    {Object.entries(BACKGROUND_DATA).map(([id, data]) => (
                        <div
                            key={id}
                            className={`selection-item ${character.background === id ? 'selected' : ''}`}
                            onClick={() => setCharacter(prev => ({ ...prev, background: id as BackgroundId }))}
                        >
                            <div className="item-name">{data.name}</div>
                            <div className="item-benefit">{data.benefit}</div>
                        </div>
                    ))}
                </div>

                <div className="selection-column">
                    <h3>CLASS</h3>
                    {Object.entries(ARCHETYPE_DATA).map(([id, data]) => (
                        <div
                            key={id}
                            className={`selection-item ${character.archetype === id ? 'selected' : ''}`}
                            onClick={() => handleArchetypeChange(id)}
                        >
                            <div className="item-name">{data.name}</div>
                            <div className="item-role">{data.role}</div>
                            <div className="item-gender">({data.gender})</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStatsStep = () => (
        <div className="creation-step">
            <h2>ATTRIBUTES</h2>

            <div className="points-display">
                Points Remaining: <span className="points-value">{remainingPoints}</span> / {POINTS_POOL}
            </div>            <div className="stats-grid">
                {Object.entries(character.stats).map(([stat, value]) => (
                    <div key={stat} className="stat-row">
                        <label className="stat-label">{stat.toUpperCase()}:</label>
                        <button
                            className="stat-button"
                            onClick={() => handleStatChange(stat as keyof StatAllocation, -1)}
                            disabled={value <= 8}
                        >
                            -
                        </button>
                        <span className="stat-value">{value}</span>
                        <button
                            className="stat-button"
                            onClick={() => handleStatChange(stat as keyof StatAllocation, 1)}
                            disabled={value >= 20 || calculateOldStatCost(value + 1) > remainingPoints}
                        >
                            +
                        </button>
                        <span className="stat-cost">
                            (Cost: {value < 20 ? calculateOldStatCost(value + 1) - calculateOldStatCost(value) : 'MAX'})
                        </span>
                    </div>
                ))}
            </div>

            <button className="randomize-button" onClick={handleRandomize}>
                RANDOMIZE STATS
            </button>
        </div>
    );

    const renderTraitsStep = () => (
        <div className="creation-step">
            <h2>CHARACTER TRAITS</h2>

            <div className="traits-info">
                Choose up to 3 personality traits that define your character.
                These provide both roleplay guidance and mechanical benefits.
            </div>

            <div className="traits-grid">
                {Object.entries(TRAIT_DEFINITIONS).map(([traitId, trait]) => {
                    const isSelected = character.traits.includes(traitId);
                    const isDisabled = !isSelected && character.traits.length >= 3;

                    return (
                        <div
                            key={traitId}
                            className={`trait-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => {
                                if (isSelected) {
                                    setCharacter(prev => ({
                                        ...prev,
                                        traits: prev.traits.filter(t => t !== traitId)
                                    }));
                                } else if (!isDisabled) {
                                    setCharacter(prev => ({
                                        ...prev,
                                        traits: [...prev.traits, traitId]
                                    }));
                                }
                            }}
                        >
                            <div className="trait-name">{trait.name}</div>
                            <div className="trait-description">{trait.description}</div>
                            <div className="trait-bonus">{trait.bonus}</div>
                        </div>
                    );
                })}
            </div>

            <div className="traits-selected">
                Selected: {character.traits.length} / 3
            </div>
        </div>
    );

    const renderMagicStep = () => (
        <div className="creation-step">
            <h2>MAGIC SCHOOLS</h2>

            <div className="magic-info">
                Select mastery levels in magic schools (if applicable to your class).
                Higher levels unlock more powerful spells.
            </div>

            <div className="magic-grid">
                {MAGIC_SCHOOLS.map(school => {
                    const currentMastery = character.masteries.find(m => m.school === school);
                    const rank = currentMastery?.rank || 0;

                    return (
                        <div key={school} className="magic-school">
                            <div className="school-name">{school}</div>
                            <div className="mastery-buttons">
                                {[0, 1, 2, 3, 4].map(level => (
                                    <button
                                        key={level}
                                        className={`mastery-button ${rank === level ? 'selected' : ''}`}
                                        onClick={() => handleMasteryChange(school, level)}
                                    >
                                        {level === 0 ? 'None' : level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderSpellsStep = () => {
        const maxCantrips = calculateMaxCantrips(character.level, character.stats.int, character.stats.wis);
        const maxSpells = calculateMaxSpells(character.level, character.stats.int, character.stats.wis);
        const maxSpellLevel = calculateMaxSpellLevel(character.level);

        return (
            <div className="creation-step">
                <h2>SPELLS & CANTRIPS</h2>

                <div className="spells-info">
                    <div>Cantrips: {character.knownCantrips.length} / {maxCantrips}</div>
                    <div>Spells: {character.knownSpells.length} / {maxSpells}</div>
                    <div>Max Spell Level: {maxSpellLevel}</div>
                </div>

                <div className="spells-note">
                    Spell selection is simplified for this demo.
                    In the full game, you'll choose from your class's spell list.
                    For now, this shows your spellcasting capacity.
                </div>

                <div className="spells-actions">
                    <button
                        className="spell-button"
                        onClick={() => {
                            if (character.knownCantrips.length < maxCantrips) {
                                setCharacter(prev => ({
                                    ...prev,
                                    knownCantrips: [...prev.knownCantrips, `Cantrip ${prev.knownCantrips.length + 1}`]
                                }));
                            }
                        }}
                        disabled={character.knownCantrips.length >= maxCantrips}
                    >
                        Add Cantrip ({character.knownCantrips.length}/{maxCantrips})
                    </button>

                    <button
                        className="spell-button"
                        onClick={() => {
                            if (character.knownSpells.length < maxSpells && character.level >= 2) {
                                setCharacter(prev => ({
                                    ...prev,
                                    knownSpells: [...prev.knownSpells, `Spell ${prev.knownSpells.length + 1}`]
                                }));
                            }
                        }}
                        disabled={character.knownSpells.length >= maxSpells || character.level < 2}
                    >
                        Add Spell ({character.knownSpells.length}/{maxSpells})
                    </button>
                </div>

                <div className="known-spells">
                    {character.knownCantrips.length > 0 && (
                        <div className="spell-list">
                            <h4>Cantrips:</h4>
                            {character.knownCantrips.map((cantrip, index) => (
                                <div key={index} className="spell-item">
                                    {cantrip}
                                    <button
                                        onClick={() => {
                                            setCharacter(prev => ({
                                                ...prev,
                                                knownCantrips: prev.knownCantrips.filter((_, i) => i !== index)
                                            }));
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {character.knownSpells.length > 0 && (
                        <div className="spell-list">
                            <h4>Spells:</h4>
                            {character.knownSpells.map((spell, index) => (
                                <div key={index} className="spell-item">
                                    {spell}
                                    <button
                                        onClick={() => {
                                            setCharacter(prev => ({
                                                ...prev,
                                                knownSpells: prev.knownSpells.filter((_, i) => i !== index)
                                            }));
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderReviewStep = () => (
        <div className="creation-step">
            <h2>CHARACTER SUMMARY</h2>

            <div className="character-summary">
                <div className="summary-section">
                    <h3>Identity</h3>
                    <div>Name: {character.name || 'Unnamed'}</div>
                    <div>Gender: {character.gender}</div>
                    <div>Race: {SPECIES_DATA[character.species as keyof typeof SPECIES_DATA]?.name || character.species}</div>
                    <div>Background: {BACKGROUND_DATA[character.background]?.name || character.background}</div>
                    <div>Class: {ARCHETYPE_DATA[character.archetype as keyof typeof ARCHETYPE_DATA]?.name || character.archetype}</div>
                    <div>Level: {character.level}</div>
                </div>

                <div className="summary-section">
                    <h3>Attributes</h3>
                    {Object.entries(character.stats).map(([stat, value]) => (
                        <div key={stat}>{stat.toUpperCase()}: {value}</div>
                    ))}
                </div>

                <div className="summary-section">
                    <h3>Traits</h3>
                    {character.traits.length > 0 ? (
                        character.traits.map(traitId => (
                            <div key={traitId}>{TRAIT_DEFINITIONS[traitId as keyof typeof TRAIT_DEFINITIONS].name}</div>
                        ))
                    ) : (
                        <div>No traits selected</div>
                    )}
                </div>

                <div className="summary-section">
                    <h3>Magic Schools</h3>
                    {character.masteries.length > 0 ? (
                        character.masteries.map(mastery => (
                            <div key={mastery.school}>
                                {mastery.school}: Level {mastery.rank}
                            </div>
                        ))
                    ) : (
                        <div>No magic training</div>
                    )}
                </div>

                <div className="summary-section">
                    <h3>Spells</h3>
                    <div>Cantrips: {character.knownCantrips.length}</div>
                    <div>Spells: {character.knownSpells.length}</div>
                </div>
            </div>

            {!validation.ok && (
                <div className="validation-errors">
                    <h3>Errors:</h3>
                    {validation.reasons.map((error: string, index: number) => (
                        <div key={index} className="error-message">{error}</div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="classic-character-creator">
            <div className="creator-header">
                <h1>CREATE CHARACTER</h1>
                <div className="step-indicator">
                    Step {
                        step === 'identity' ? 1 :
                            step === 'stats' ? 2 :
                                step === 'traits' ? 3 :
                                    step === 'magic' ? 4 :
                                        step === 'spells' ? 5 : 6
                    } of 6
                </div>
            </div>

            <div className="creator-content">
                {step === 'identity' && renderIdentityStep()}
                {step === 'stats' && renderStatsStep()}
                {step === 'traits' && renderTraitsStep()}
                {step === 'magic' && renderMagicStep()}
                {step === 'spells' && renderSpellsStep()}
                {step === 'review' && renderReviewStep()}
            </div>

            <div className="creator-footer">
                <button
                    className="nav-button"
                    onClick={onCancel}
                >
                    CANCEL
                </button>

                {step !== 'identity' && (
                    <button
                        className="nav-button"
                        onClick={() => {
                            const steps: CreationStep[] = ['identity', 'stats', 'traits', 'magic', 'spells', 'review'];
                            const currentIndex = steps.indexOf(step);
                            setStep(steps[currentIndex - 1]);
                        }}
                    >
                        BACK
                    </button>
                )}

                {step !== 'review' ? (
                    <button
                        className="nav-button primary"
                        onClick={() => {
                            const steps: CreationStep[] = ['identity', 'stats', 'traits', 'magic', 'spells', 'review'];
                            const currentIndex = steps.indexOf(step);
                            setStep(steps[currentIndex + 1]);
                        }}
                    >
                        NEXT
                    </button>
                ) : (
                    <button
                        className="nav-button primary"
                        onClick={handleCreateCharacter}
                        disabled={!validation.ok}
                    >
                        CREATE CHARACTER
                    </button>
                )}
            </div>
        </div>
    );
};