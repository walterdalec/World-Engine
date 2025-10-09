/**
 * Turn Manager Benchmarks - World Engine
 * Tests performance of turn order calculations and management
 */

import { Bench } from 'tinybench';
import { setTestRNG, createSeededRNG } from '../utils/deterministic';

interface Unit {
    id: string;
    speed: number;
    initiative: number;
    actionPoints: number;
    faction: 'Player' | 'Enemy';
}

interface TurnState {
    units: Unit[];
    currentTurn: number;
    phase: 'player' | 'enemy' | 'neutral';
    initiative: string[];
}

class TurnManager {
    private state: TurnState;
    private rng = createSeededRNG(42);

    constructor(units: Unit[]) {
        this.state = {
            units: [...units],
            currentTurn: 0,
            phase: 'player',
            initiative: []
        };
        this.calculateInitiative();
    }

    calculateInitiative(): void {
        // Sort by speed + random initiative roll
        const initiativeRolls = this.state.units.map(unit => ({
            unit,
            roll: unit.speed + this.rng.nextInt(1, 20) // d20 initiative
        }));

        initiativeRolls.sort((a, b) => b.roll - a.roll);
        this.state.initiative = initiativeRolls.map(entry => entry.unit.id);
    }

    nextTurn(): string | null {
        if (this.state.initiative.length === 0) return null;

        const currentIndex = this.state.currentTurn % this.state.initiative.length;
        const unitId = this.state.initiative[currentIndex];

        this.state.currentTurn++;

        // Update phase based on unit faction
        const unit = this.state.units.find(u => u.id === unitId);
        if (unit) {
            this.state.phase = unit.faction === 'Player' ? 'player' : 'enemy';
        }

        return unitId;
    }

    getCurrentUnit(): Unit | null {
        if (this.state.initiative.length === 0) return null;

        const currentIndex = (this.state.currentTurn - 1) % this.state.initiative.length;
        const unitId = this.state.initiative[currentIndex];
        return this.state.units.find(u => u.id === unitId) || null;
    }

    getUpcomingUnits(count: number = 3): Unit[] {
        const upcoming: Unit[] = [];

        for (let i = 0; i < count; i++) {
            const index = (this.state.currentTurn + i) % this.state.initiative.length;
            const unitId = this.state.initiative[index];
            const unit = this.state.units.find(u => u.id === unitId);
            if (unit) upcoming.push(unit);
        }

        return upcoming;
    }

    removeUnit(unitId: string): void {
        this.state.units = this.state.units.filter(u => u.id !== unitId);
        this.state.initiative = this.state.initiative.filter(id => id !== unitId);
    }

    addUnit(unit: Unit): void {
        this.state.units.push(unit);
        this.calculateInitiative(); // Recalculate to insert properly
    }

    reset(): void {
        this.state.currentTurn = 0;
        this.calculateInitiative();
    }

    getState(): TurnState {
        return { ...this.state };
    }
}

// Generate test units
function generateUnits(count: number): Unit[] {
    setTestRNG(789);
    const units: Unit[] = [];

    for (let i = 0; i < count; i++) {
        units.push({
            id: `unit_${i}`,
            speed: Math.floor(Math.random() * 20) + 5, // 5-24 speed
            initiative: 0,
            actionPoints: 3,
            faction: i % 2 === 0 ? 'Player' : 'Enemy'
        });
    }

    return units;
}

// Test scenarios with different unit counts
const unitScenarios = [
    { name: 'TurnManager 4 units', units: generateUnits(4) },
    { name: 'TurnManager 8 units', units: generateUnits(8) },
    { name: 'TurnManager 16 units', units: generateUnits(16) },
    { name: 'TurnManager 32 units', units: generateUnits(32) },
    { name: 'TurnManager 64 units', units: generateUnits(64) }
];

const turnBench = new Bench({ time: 1000, iterations: 1000 });

// Benchmark turn calculation
turnBench.add('TurnManager.next() simple', () => {
    const manager = new TurnManager(generateUnits(8));
    manager.nextTurn();
});

// Benchmark full turn cycle
turnBench.add('TurnManager full round 8 units', () => {
    const manager = new TurnManager(generateUnits(8));
    for (let i = 0; i < 8; i++) {
        manager.nextTurn();
    }
});

// Benchmark initiative calculation
for (const scenario of unitScenarios) {
    turnBench.add(`${scenario.name} initiative calc`, () => {
        const manager = new TurnManager(scenario.units);
        manager.calculateInitiative();
    });
}

// Benchmark unit management operations
turnBench.add('TurnManager add/remove units', () => {
    const manager = new TurnManager(generateUnits(8));

    // Add a unit
    manager.addUnit({
        id: 'temp_unit',
        speed: 15,
        initiative: 0,
        actionPoints: 3,
        faction: 'Player'
    });

    // Remove a unit
    manager.removeUnit('unit_0');
});

// Benchmark state queries
turnBench.add('TurnManager state queries', () => {
    const manager = new TurnManager(generateUnits(16));
    manager.getCurrentUnit();
    manager.getUpcomingUnits(5);
    manager.getState();
});

export default turnBench;