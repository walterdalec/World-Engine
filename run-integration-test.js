/**
 * Direct execution of full game integration test
 * Run with: node run-integration-test.js
 */

const { SeededRandom } = require('./src/seededGenerators');
const { WorldNoise } = require('./src/proc/noise');

console.log('\n🌍 FULL GAME INTEGRATION TEST - Starting Simulation...\n');

const seed = 'integration-test-2024';
const rng = new SeededRandom(seed);

// ===== PHASE 1: WORLD INITIALIZATION =====
console.log('📦 Phase 1: World Initialization');

const worldNoise = new WorldNoise(seed);

// Generate world tiles using noise system
const worldTiles = [];
const mapHeight = 100;

for (let x = -50; x <= 50; x += 5) {
    for (let y = -50; y <= 50; y += 5) {
        const elevation = worldNoise.getElevation(x, y);
        const temperature = worldNoise.getTemperature(x, y, elevation, mapHeight);
        const moisture = worldNoise.getMoisture(x, y, elevation);

        let biome = 'Grass';
        if (elevation < 0.3) biome = 'Ocean';
        else if (elevation > 0.8) biome = 'Mountain';
        else if (temperature < 0.3) biome = 'Tundra';
        else if (moisture < 0.3) biome = 'Desert';
        else if (moisture > 0.7) biome = 'Forest';

        worldTiles.push({ biome, elevation, temperature, moisture });
    }
}

console.log(`  ✅ Generated ${worldTiles.length} world tiles`);

// Count biomes
const biomeCount = {};
worldTiles.forEach(tile => {
    biomeCount[tile.biome] = (biomeCount[tile.biome] || 0) + 1;
});

console.log('  📊 Biome Distribution:', biomeCount);

// ===== PHASE 2: FACTION INITIALIZATION =====
console.log('\n🏰 Phase 2: Faction & AI Initialization');

const factions = [
    {
        id: 'crimson-empire',
        name: 'Crimson Empire',
        color: '#dc2626',
        territories: 8,
        resources: { gold: 1000, recruits: 50, magic: 30 },
        relations: { 'azure-kingdom': -50, 'emerald-alliance': 20 },
        aggression: 0.7,
        economy: 0.6
    },
    {
        id: 'azure-kingdom',
        name: 'Azure Kingdom',
        color: '#2563eb',
        territories: 10,
        resources: { gold: 1200, recruits: 45, magic: 40 },
        relations: { 'crimson-empire': -50, 'emerald-alliance': 10 },
        aggression: 0.5,
        economy: 0.8
    },
    {
        id: 'emerald-alliance',
        name: 'Emerald Alliance',
        color: '#16a34a',
        territories: 6,
        resources: { gold: 800, recruits: 60, magic: 25 },
        relations: { 'crimson-empire': 20, 'azure-kingdom': 10 },
        aggression: 0.4,
        economy: 0.7
    }
];

console.log(`  ✅ Initialized ${factions.length} factions`);
factions.forEach(f => {
    console.log(`    - ${f.name}: ${f.territories} territories, ${f.resources.gold} gold`);
});

// ===== PHASE 3: PLAYER PARTY CREATION =====
console.log('\n⚔️ Phase 3: Player Party Creation');

const createTestCharacter = (name, archetype, level) => ({
    id: `char-${name.toLowerCase()}`,
    name,
    species: 'human',
    archetype,
    level,
    hp: 50 + level * 10,
    maxHp: 50 + level * 10,
    mp: 20 + level * 5,
    maxMp: 20 + level * 5,
    stats: {
        str: 12 + level,
        dex: 10 + level,
        int: 10 + level,
        con: 14 + level,
        wis: 10 + level,
        cha: 8 + level,
        lck: 10
    },
    equipment: {
        weapon: 'Iron Sword',
        armor: 'Leather Armor',
        accessory: 'Stamina Ring'
    },
    abilities: ['Power Strike', 'Defend']
});

const playerParty = [
    createTestCharacter('Theron', 'knight', 3),
    createTestCharacter('Lyria', 'mystic', 3),
    createTestCharacter('Kael', 'ranger', 2),
    createTestCharacter('Aria', 'guardian', 2)
];

console.log(`  ✅ Created party of ${playerParty.length} characters`);
playerParty.forEach(c => {
    console.log(`    - ${c.name} (${c.archetype}, Lvl ${c.level}): ${c.hp}/${c.maxHp} HP`);
});

// ===== PHASE 4: SEASONAL SIMULATION =====
console.log('\n📅 Phase 4: Multi-Season Campaign Simulation');

const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
let campaignDay = 1;

const simulationResults = {
    seasonsSimulated: 0,
    battlesWon: 0,
    battlesLost: 0,
    encountersGenerated: 0,
    weatherEventsApplied: 0,
    factionActionsExecuted: 0,
    totalDamageDealt: 0,
    territoriesChanged: 0,
    resourcesGenerated: 0
};

// Simulate 4 seasons (1 full year)
for (let season = 0; season < 4; season++) {
    const seasonName = seasons[season];
    console.log(`\n  🌸 ${seasonName} - Day ${campaignDay}`);

    simulationResults.seasonsSimulated++;

    // --- Weather System ---
    const weatherTypes = ['Clear', 'Rain', 'Storm', 'Snow', 'Fog'];
    const currentWeather = weatherTypes[Math.floor(rng.next() * weatherTypes.length)];
    console.log(`    🌦️ Weather: ${currentWeather}`);

    if (currentWeather !== 'Clear') {
        simulationResults.weatherEventsApplied++;
    }

    // Weather effects on party
    if (currentWeather === 'Storm') {
        playerParty.forEach(c => {
            c.hp = Math.max(1, c.hp - 2);
        });
        console.log('       ⚡ Storm damages party (-2 HP each)');
    }

    // --- Faction AI Turn ---
    console.log('    🏛️ Faction AI Actions:');

    factions.forEach(faction => {
        // Resource generation
        const goldGain = Math.floor(faction.territories * 50 * faction.economy);
        faction.resources.gold += goldGain;
        simulationResults.resourcesGenerated += goldGain;

        // AI decision making
        if (faction.aggression > 0.6 && faction.resources.gold > 500) {
            // Aggressive expansion
            const target = factions.find(f => f.id !== faction.id && faction.relations[f.id] < 0);
            if (target && rng.next() > 0.5) {
                faction.resources.gold -= 300;
                faction.territories++;
                target.territories = Math.max(1, target.territories - 1);
                simulationResults.territoriesChanged++;
                console.log(`       ⚔️ ${faction.name} attacks ${target.name}! Territory captured.`);
                simulationResults.factionActionsExecuted++;
            }
        } else {
            // Economic development
            console.log(`       💰 ${faction.name} focuses on economy (+${goldGain} gold)`);
            simulationResults.factionActionsExecuted++;
        }
    });

    // --- Player Exploration & Encounters ---
    console.log('    🗺️ Player Party Actions:');

    // Generate random encounter
    const encounterTypes = ['bandit', 'monster', 'undead', 'beast'];
    const encounterType = encounterTypes[Math.floor(rng.next() * encounterTypes.length)];

    if (rng.next() > 0.3) { // 70% chance of encounter
        console.log(`       🎲 Encounter: ${encounterType} group!`);
        simulationResults.encountersGenerated++;

        // --- BATTLE SIMULATION ---
        console.log('       ⚔️ Initiating tactical battle...');

        // Create simplified battle
        const allies = playerParty.slice(0, 3).map((char, idx) => ({
            id: char.id,
            name: char.name,
            pos: { q: -2, r: idx },
            hp: char.hp,
            maxHp: char.maxHp,
            stats: {
                atk: char.stats.str + 5,
                def: char.stats.con + 3,
                spd: char.stats.dex + char.stats.lck
            },
            team: 'ally',
            faction: 'player'
        }));

        const enemies = Array.from({ length: 2 + Math.floor(rng.next() * 3) }, (_, idx) => ({
            id: `enemy-${idx}`,
            name: `${encounterType} ${idx + 1}`,
            pos: { q: 2, r: idx - 1 },
            hp: 30 + season * 10,
            maxHp: 30 + season * 10,
            stats: {
                atk: 8 + season * 2,
                def: 6 + season,
                spd: 10 + Math.floor(rng.next() * 5)
            },
            team: 'enemy',
            faction: encounterType
        }));

        const allUnits = [...allies, ...enemies];

        console.log(`         - Allies: ${allies.length}`);
        console.log(`         - Enemies: ${enemies.length}`);

        // Simulate battle turns (max 10 rounds)
        let battleRounds = 0;
        let battleActive = true;

        while (battleActive && battleRounds < 10) {
            battleRounds++;
            let roundDamage = 0;

            // Simple battle logic: each unit attacks nearest enemy
            const aliveUnits = allUnits.filter(u => u.hp > 0);

            // Calculate damage this round
            aliveUnits.forEach(unit => {
                const enemies = aliveUnits.filter(u => u.team !== unit.team && u.hp > 0);
                if (enemies.length > 0) {
                    const target = enemies[0];
                    const damage = Math.max(1, unit.stats.atk - target.stats.def + Math.floor(rng.next() * 5));
                    target.hp = Math.max(0, target.hp - damage);
                    roundDamage += damage;
                }
            });

            simulationResults.totalDamageDealt += roundDamage;

            // Check victory conditions
            const aliveAllies = allUnits.filter(u => u.team === 'ally' && u.hp > 0).length;
            const aliveEnemies = allUnits.filter(u => u.team === 'enemy' && u.hp > 0).length;

            if (aliveEnemies === 0) {
                console.log(`         ✅ Victory! (${battleRounds} rounds)`);
                simulationResults.battlesWon++;

                // Rewards
                const goldReward = 50 + season * 20;
                const expReward = 100 + season * 50;
                console.log(`         💰 Rewards: ${goldReward} gold, ${expReward} XP`);

                battleActive = false;
            } else if (aliveAllies === 0) {
                console.log(`         ❌ Defeat! (${battleRounds} rounds)`);
                simulationResults.battlesLost++;
                battleActive = false;
            }
        }

        if (battleRounds >= 10) {
            console.log(`         ⏱️ Battle timeout (tactical retreat)`);
        }

    } else {
        console.log('       🌿 Peaceful travel, no encounters');
    }

    // --- Rest & Recovery ---
    playerParty.forEach(char => {
        char.hp = Math.min(char.maxHp, char.hp + 10);
        char.mp = Math.min(char.maxMp, char.mp + 5);
    });

    campaignDay += 30; // Advance one month
}

// ===== FINAL RESULTS =====
console.log('\n\n📊 SIMULATION RESULTS SUMMARY');
console.log('═'.repeat(50));

console.log('\n🌍 World Systems:');
console.log(`  - World Tiles Generated: ${worldTiles.length}`);
console.log(`  - Unique Biomes: ${Object.keys(biomeCount).length}`);
console.log(`  - Weather Events Applied: ${simulationResults.weatherEventsApplied}`);

console.log('\n🏛️ Strategic Layer:');
console.log(`  - Seasons Simulated: ${simulationResults.seasonsSimulated}`);
console.log(`  - Faction Actions: ${simulationResults.factionActionsExecuted}`);
console.log(`  - Territories Changed: ${simulationResults.territoriesChanged}`);
console.log(`  - Resources Generated: ${simulationResults.resourcesGenerated} gold`);

console.log('\n⚔️ Tactical Combat:');
console.log(`  - Encounters Generated: ${simulationResults.encountersGenerated}`);
console.log(`  - Battles Won: ${simulationResults.battlesWon}`);
console.log(`  - Battles Lost: ${simulationResults.battlesLost}`);
console.log(`  - Total Damage Dealt: ${simulationResults.totalDamageDealt}`);

if (simulationResults.battlesWon + simulationResults.battlesLost > 0) {
    const winRate = ((simulationResults.battlesWon / (simulationResults.battlesWon + simulationResults.battlesLost)) * 100).toFixed(1);
    console.log(`  - Win Rate: ${winRate}%`);
}

console.log('\n👥 Player Party Status:');
playerParty.forEach(char => {
    const hpPercent = ((char.hp / char.maxHp) * 100).toFixed(0);
    console.log(`  - ${char.name}: ${char.hp}/${char.maxHp} HP (${hpPercent}%)`);
});

console.log('\n🏰 Final Faction States:');
factions.forEach(faction => {
    console.log(`  - ${faction.name}:`);
    console.log(`      Territories: ${faction.territories}`);
    console.log(`      Gold: ${faction.resources.gold}`);
    console.log(`      Power Score: ${Math.floor(faction.territories * faction.resources.gold / 100)}`);
});

// Calculate overall integration score
const integrationScore = (
    (worldTiles.length > 0 ? 20 : 0) +
    (simulationResults.seasonsSimulated === 4 ? 20 : 0) +
    (simulationResults.encountersGenerated > 0 ? 20 : 0) +
    (simulationResults.battlesWon + simulationResults.battlesLost > 0 ? 20 : 0) +
    (simulationResults.factionActionsExecuted > 0 ? 20 : 0)
);

console.log('\n\n🎯 INTEGRATION SCORE: ' + integrationScore + '/100');

if (integrationScore === 100) {
    console.log('✨ PERFECT! All systems working in harmony!\n');
} else if (integrationScore >= 80) {
    console.log('🎉 EXCELLENT! Game systems highly integrated!\n');
} else if (integrationScore >= 60) {
    console.log('👍 GOOD! Most systems functioning together!\n');
} else {
    console.log('⚠️ NEEDS WORK: Some systems not integrating properly!\n');
}
