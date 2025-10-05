/**
 * Living World Faction AI System
 * Mount & Blade-style dynamic faction warfare that runs independently
 */

export interface Faction {
    id: string;
    name: string;
    color: string;
    territories: string[];
    strength: {
        military: number;    // Army size and quality
        economic: number;    // Gold and production
        diplomatic: number;  // Influence and alliances
    };
    ai: {
        aggression: number;      // 0-100: How likely to start wars
        expansionism: number;    // 0-100: Desire for territory
        diplomacy: number;       // 0-100: Preference for alliances
        pragmatism: number;      // 0-100: Willingness to retreat/surrender
    };
    relationships: Record<string, number>; // -100 to +100 with other factions
    currentActions: FactionAction[];
}

export interface FactionAction {
    type: 'war' | 'siege' | 'raid' | 'trade' | 'alliance' | 'recruitment';
    target: string; // territory or faction ID
    progress: number; // 0-100
    duration: number; // turns remaining
    strength: number; // forces committed
}

export interface WorldState {
    factions: Record<string, Faction>;
    territories: Record<string, Territory>;
    currentSeason: 'Spring' | 'Summer' | 'Fall' | 'Winter';
    turn: number;
    globalEvents: WorldEvent[];
}

export interface Territory {
    id: string;
    name: string;
    owner: string; // faction ID
    type: 'settlement' | 'fortress' | 'resource' | 'strategic';
    defenseValue: number;
    economicValue: number;
    neighbors: string[]; // connected territory IDs
    garrison: number; // defensive strength
    isContested: boolean;
}

export interface WorldEvent {
    type: 'war_declared' | 'territory_captured' | 'alliance_formed' | 'trade_disrupted';
    participants: string[];
    description: string;
    turn: number;
    consequences: any;
}

/**
 * Main faction AI simulation - runs each turn
 */
export class FactionAI {

    /**
     * Simulate one turn of faction actions
     */
    static simulateTurn(worldState: WorldState): WorldEvent[] {
        const events: WorldEvent[] = [];

        Object.values(worldState.factions).forEach(faction => {
            // Update ongoing actions
            this.updateFactionActions(faction, worldState, events);

            // Plan new actions based on AI personality and situation
            this.planNewActions(faction, worldState, events);

            // Economic and military updates
            this.updateFactionStrength(faction, worldState);
        });

        // Update relationships based on actions
        this.updateDiplomacy(worldState, events);

        return events;
    }

    /**
     * Update faction's ongoing military and diplomatic actions
     */
    private static updateFactionActions(
        faction: Faction,
        worldState: WorldState,
        events: WorldEvent[]
    ) {
        faction.currentActions.forEach(action => {
            action.progress += this.calculateActionProgress(action, faction, worldState);

            if (action.progress >= 100) {
                this.resolveAction(action, faction, worldState, events);
            }
        });

        // Remove completed actions
        faction.currentActions = faction.currentActions.filter(a => a.progress < 100);
    }

    /**
     * AI decision making for new faction actions
     */
    private static planNewActions(
        faction: Faction,
        worldState: WorldState,
        events: WorldEvent[]
    ) {
        // Don't overcommit - limit concurrent actions
        if (faction.currentActions.length >= 3) return;

        const opportunities = this.evaluateOpportunities(faction, worldState);
        const bestOpportunity = opportunities
            .sort((a, b) => b.priority - a.priority)[0];

        if (bestOpportunity && bestOpportunity.priority > 50) {
            faction.currentActions.push(this.createAction(bestOpportunity, faction));
        }
    }

    /**
     * Evaluate expansion and conflict opportunities
     */
    private static evaluateOpportunities(
        faction: Faction,
        worldState: WorldState
    ): Array<{ type: string; target: string; priority: number }> {
        const opportunities = [];

        // Evaluate each neighboring territory for conquest
        faction.territories.forEach(territoryId => {
            const territory = worldState.territories[territoryId];

            territory.neighbors.forEach(neighborId => {
                const neighbor = worldState.territories[neighborId];

                if (neighbor.owner !== faction.id) {
                    const priority = this.calculateConquestPriority(
                        faction, neighbor, worldState.factions[neighbor.owner], worldState
                    );

                    opportunities.push({
                        type: 'siege',
                        target: neighborId,
                        priority
                    });
                }
            });
        });

        // Evaluate diplomatic opportunities
        Object.values(worldState.factions)
            .filter(f => f.id !== faction.id)
            .forEach(otherFaction => {
                const relationship = faction.relationships[otherFaction.id] || 0;

                // Alliance opportunity
                if (relationship > 20 && faction.ai.diplomacy > 60) {
                    opportunities.push({
                        type: 'alliance',
                        target: otherFaction.id,
                        priority: faction.ai.diplomacy + relationship * 0.5
                    });
                }

                // War opportunity
                if (relationship < -30 && faction.ai.aggression > 40) {
                    opportunities.push({
                        type: 'war',
                        target: otherFaction.id,
                        priority: faction.ai.aggression - relationship * 0.3
                    });
                }
            });

        return opportunities;
    }

    /**
     * Calculate priority for conquering a territory
     */
    private static calculateConquestPriority(
        attacker: Faction,
        territory: Territory,
        defender: Faction,
        worldState: WorldState
    ): number {
        let priority = 0;

        // Economic value
        priority += territory.economicValue * 2;

        // Strategic value (connectivity)
        priority += territory.neighbors.length * 5;

        // Weakness of defender
        const strengthRatio = attacker.strength.military / defender.strength.military;
        priority += (strengthRatio - 1) * 30;

        // Relationship hostility
        const relationship = attacker.relationships[defender.id] || 0;
        priority += (-relationship) * 0.5;

        // AI personality factors
        priority *= (attacker.ai.expansionism / 100);
        priority *= (attacker.ai.aggression / 100);

        // Seasonal modifiers
        if (worldState.currentSeason === 'Winter') {
            priority *= 0.7; // Reduced winter campaigning
        }

        return Math.max(0, priority);
    }

    /**
     * Create action from opportunity
     */
    private static createAction(
        opportunity: { type: string; target: string; priority: number },
        faction: Faction
    ): FactionAction {
        return {
            type: opportunity.type as any,
            target: opportunity.target,
            progress: 0,
            duration: this.calculateActionDuration(opportunity.type),
            strength: Math.floor(faction.strength.military * 0.3) // Commit 30% of forces
        };
    }

    /**
     * Calculate how long an action takes
     */
    private static calculateActionDuration(actionType: string): number {
        switch (actionType) {
            case 'siege': return 4; // 4 turns to siege
            case 'raid': return 1;  // Quick raids
            case 'war': return 8;   // Long war declarations
            case 'alliance': return 2; // Diplomatic negotiations
            default: return 3;
        }
    }

    /**
     * Calculate action progress per turn
     */
    private static calculateActionProgress(
        action: FactionAction,
        faction: Faction,
        worldState: WorldState
    ): number {
        const baseProgress = 100 / action.duration;

        // Modify based on faction strength and conditions
        let modifier = 1.0;

        if (action.type === 'siege') {
            const territory = worldState.territories[action.target];
            const strengthRatio = action.strength / territory.garrison;
            modifier = Math.min(2.0, Math.max(0.5, strengthRatio));
        }

        return baseProgress * modifier;
    }

    /**
     * Resolve completed action
     */
    private static resolveAction(
        action: FactionAction,
        faction: Faction,
        worldState: WorldState,
        events: WorldEvent[]
    ) {
        switch (action.type) {
            case 'siege':
                this.resolveSiege(action, faction, worldState, events);
                break;
            case 'war':
                this.resolveWarDeclaration(action, faction, worldState, events);
                break;
            case 'alliance':
                this.resolveAlliance(action, faction, worldState, events);
                break;
        }
    }

    /**
     * Resolve siege attempt
     */
    private static resolveSiege(
        action: FactionAction,
        attacker: Faction,
        worldState: WorldState,
        events: WorldEvent[]
    ) {
        const territory = worldState.territories[action.target];
        const defender = worldState.factions[territory.owner];

        const attackerStrength = action.strength;
        const defenderStrength = territory.garrison +
            (defender.strength.military * 0.2); // 20% of faction military helps defend

        if (attackerStrength > defenderStrength) {
            // Siege successful
            territory.owner = attacker.id;
            territory.garrison = Math.floor(attackerStrength * 0.5); // Garrison with remaining forces

            attacker.territories.push(territory.id);
            defender.territories = defender.territories.filter(t => t !== territory.id);

            events.push({
                type: 'territory_captured',
                participants: [attacker.id, defender.id],
                description: `${attacker.name} has captured ${territory.name} from ${defender.name}`,
                turn: worldState.turn,
                consequences: { territoryChange: territory.id }
            });

            // Relationship consequences
            attacker.relationships[defender.id] = (attacker.relationships[defender.id] || 0) - 20;
            defender.relationships[attacker.id] = (defender.relationships[attacker.id] || 0) - 20;
        } else {
            // Siege failed
            events.push({
                type: 'war_declared', // Failed siege continues as ongoing war
                participants: [attacker.id, defender.id],
                description: `${attacker.name}'s siege of ${territory.name} has failed`,
                turn: worldState.turn,
                consequences: { siegeFailed: true }
            });
        }
    }

    /**
     * Update faction economic and military strength
     */
    private static updateFactionStrength(faction: Faction, worldState: WorldState) {
        // Economic growth from territories
        const economicBase = faction.territories.reduce((sum, territoryId) => {
            return sum + worldState.territories[territoryId].economicValue;
        }, 0);

        faction.strength.economic = Math.max(1, economicBase);

        // Military recruitment (based on economy)
        faction.strength.military += Math.floor(faction.strength.economic * 0.1);

        // Seasonal modifiers
        if (worldState.currentSeason === 'Spring') {
            faction.strength.economic *= 1.1; // Spring growth bonus
        } else if (worldState.currentSeason === 'Winter') {
            faction.strength.military *= 0.9; // Winter attrition
        }
    }

    /**
     * Update diplomatic relationships
     */
    private static updateDiplomacy(worldState: WorldState, events: WorldEvent[]) {
        // Relationship decay over time
        Object.values(worldState.factions).forEach(faction => {
            Object.keys(faction.relationships).forEach(otherId => {
                const current = faction.relationships[otherId];
                // Relationships slowly drift toward neutral (0)
                if (current > 0) {
                    faction.relationships[otherId] = Math.max(0, current - 1);
                } else if (current < 0) {
                    faction.relationships[otherId] = Math.min(0, current + 1);
                }
            });
        });
    }

    /**
     * Get player opportunities based on current world state
     */
    static getPlayerOpportunities(
        worldState: WorldState,
        playerReputation: Record<string, number>
    ): Array<{
        type: 'mercenary' | 'diplomatic' | 'economic';
        faction: string;
        description: string;
        reward: any;
        requirements?: any;
    }> {
        const opportunities = [];

        Object.values(worldState.factions).forEach(faction => {
            const rep = playerReputation[faction.id] || 0;

            // Mercenary contracts for factions at war
            const atWarWith = faction.currentActions
                .filter(a => a.type === 'war' || a.type === 'siege')
                .map(a => a.target);

            if (atWarWith.length > 0 && rep > -20) {
                opportunities.push({
                    type: 'mercenary',
                    faction: faction.id,
                    description: `${faction.name} seeks mercenaries for their campaign against ${atWarWith.join(', ')}`,
                    reward: { gold: faction.strength.economic * 10, reputation: 15 }
                });
            }

            // Diplomatic missions
            if (rep > 20 && faction.ai.diplomacy > 50) {
                opportunities.push({
                    type: 'diplomatic',
                    faction: faction.id,
                    description: `${faction.name} needs an envoy for delicate negotiations`,
                    reward: { gold: faction.strength.economic * 5, reputation: 10 }
                });
            }
        });

        return opportunities;
    }

    // Additional helper methods for war declarations, alliances, etc.
    private static resolveWarDeclaration(action: FactionAction, faction: Faction, worldState: WorldState, events: WorldEvent[]) {
        // Implementation for war declaration resolution
    }

    private static resolveAlliance(action: FactionAction, faction: Faction, worldState: WorldState, events: WorldEvent[]) {
        // Implementation for alliance formation
    }
}