/**
 * Classic Character Creator
 * Might & Magic 1-2 inspired interface
 */

import React, { useState, useMemo } from 'react';
import type { CreatorInput, SpeciesId, BackgroundId, ArchetypeId, StatAllocation, MasteryPick } from '../../../core/creator/types';
import { buildCharacter, validateInput, CharacterCreator } from '../../../core/creator';
import { StatBudgetByLevel, StatPointCost, MaxPerStat, MinPerStat } from '../../../core/creator/rules';
import './ClassicCharacterCreator.css';

interface ClassicCharacterCreatorProps {
    onCharacterCreated?: (character: any) => void;
    onCancel?: () => void;
}

type CreationStep = 'identity' | 'stats' | 'magic' | 'review';

const SPECIES_DATA = {
    human: { name: 'Human', bonus: '+1 to all stats' },
    sylvanborn: { name: 'Elf', bonus: '+2 DEX, +1 WIS, -1 CON' },
    nightborn: { name: 'Dark Elf', bonus: '+2 INT, +1 DEX, -1 CON' },
    stormcaller: { name: 'Storm Giant', bonus: '+3 STR, +1 CON, -2 INT' },
    crystalborn: { name: 'Crystal Dwarf', bonus: '+2 CON, +1 WIS, -1 DEX' },
    draketh: { name: 'Dragonkin', bonus: '+2 STR, +1 CHA, -1 WIS' },
    alloy: { name: 'Construct', bonus: '+2 CON, +1 STR, -1 CHA' },
    voidkin: { name: 'Void Walker', bonus: '+2 INT, +1 LCK, -1 STR' }
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
    warrior: { name: 'Fighter', role: 'Melee Combat' },
    ranger: { name: 'Ranger', role: 'Ranged Combat' },
    mage: { name: 'Sorcerer', role: 'Arcane Magic' },
    priest: { name: 'Cleric', role: 'Divine Magic' },
    commander: { name: 'Paladin', role: 'Leadership' },
    knight: { name: 'Knight', role: 'Heavy Combat' },
    mystic: { name: 'Druid', role: 'Nature Magic' },
    guardian: { name: 'Barbarian', role: 'Berserker' },
    chanter: { name: 'Bard', role: 'Support Magic' },
    corsair: { name: 'Thief', role: 'Stealth & Speed' }
};

const MAGIC_SCHOOLS = [
    'Fire', 'Air', 'Water', 'Earth', 'Spirit', 'Shadow', 'Nature', 'Arcane', 'Divine'
] as const;

export const ClassicCharacterCreator: React.FC<ClassicCharacterCreatorProps> = ({
    onCharacterCreated,
    onCancel
}) => {
    const [step, setStep] = useState<CreationStep>('identity');
    const [character, setCharacter] = useState<CreatorInput>({
        name: '',
        team: 'Player',
        species: 'human',
        background: 'commoner',
        archetype: 'warrior',
        level: 1,
        stats: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8, spd: 8, lck: 8 },
        masteries: [],
        formation: { row: 'front', slot: 0, facing: 0 }
    });

    const validation = useMemo(() => validateInput(character), [character]);
    const statBudget = StatBudgetByLevel(character.level);
    const usedPoints = Object.values(character.stats).reduce((sum, stat) => {
        let cost = 0;
        for (let i = 8; i < stat; i++) {
            cost += StatPointCost(i + 1);
        }
        return sum + cost;
    }, 0);
    const remainingPoints = statBudget - usedPoints;

    const handleStatChange = (stat: keyof StatAllocation, delta: number) => {
        const newValue = character.stats[stat] + delta;
        if (newValue < MinPerStat || newValue > MaxPerStat) return;

        const newStats = { ...character.stats, [stat]: newValue };

        // Calculate if this change is affordable
        const newUsedPoints = Object.values(newStats).reduce((sum, statVal) => {
            let cost = 0;
            for (let i = 8; i < statVal; i++) {
                cost += StatPointCost(i + 1);
            }
            return sum + cost;
        }, 0);

        if (newUsedPoints <= statBudget) {
            setCharacter(prev => ({ ...prev, stats: newStats }));
        }
    };

    const handleMasteryChange = (school: string, rank: number) => {
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
                            onClick={() => setCharacter(prev => ({ ...prev, archetype: id as ArchetypeId }))}
                        >
                            <div className="item-name">{data.name}</div>
                            <div className="item-role">{data.role}</div>
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
                Points Remaining: <span className="points-value">{remainingPoints}</span>
            </div>

            <div className="stats-grid">
                {Object.entries(character.stats).map(([stat, value]) => (
                    <div key={stat} className="stat-row">
                        <label className="stat-label">{stat.toUpperCase()}:</label>
                        <button
                            className="stat-button"
                            onClick={() => handleStatChange(stat as keyof StatAllocation, -1)}
                            disabled={value <= MinPerStat}
                        >
                            -
                        </button>
                        <span className="stat-value">{value}</span>
                        <button
                            className="stat-button"
                            onClick={() => handleStatChange(stat as keyof StatAllocation, 1)}
                            disabled={value >= MaxPerStat || StatPointCost(value + 1) > remainingPoints}
                        >
                            +
                        </button>
                        <span className="stat-cost">
                            (Cost: {value < MaxPerStat ? StatPointCost(value + 1) : 'MAX'})
                        </span>
                    </div>
                ))}
            </div>

            <button className="randomize-button" onClick={handleRandomize}>
                RANDOMIZE STATS
            </button>
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

    const renderReviewStep = () => (
        <div className="creation-step">
            <h2>CHARACTER SUMMARY</h2>

            <div className="character-summary">
                <div className="summary-section">
                    <h3>Identity</h3>
                    <div>Name: {character.name || 'Unnamed'}</div>
                    <div>Race: {SPECIES_DATA[character.species].name}</div>
                    <div>Background: {BACKGROUND_DATA[character.background].name}</div>
                    <div>Class: {ARCHETYPE_DATA[character.archetype].name}</div>
                    <div>Level: {character.level}</div>
                </div>

                <div className="summary-section">
                    <h3>Attributes</h3>
                    {Object.entries(character.stats).map(([stat, value]) => (
                        <div key={stat}>{stat.toUpperCase()}: {value}</div>
                    ))}
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
                    Step {step === 'identity' ? 1 : step === 'stats' ? 2 : step === 'magic' ? 3 : 4} of 4
                </div>
            </div>

            <div className="creator-content">
                {step === 'identity' && renderIdentityStep()}
                {step === 'stats' && renderStatsStep()}
                {step === 'magic' && renderMagicStep()}
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
                            const steps: CreationStep[] = ['identity', 'stats', 'magic', 'review'];
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
                            const steps: CreationStep[] = ['identity', 'stats', 'magic', 'review'];
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