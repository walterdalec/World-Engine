import { HexCoord, hexDistance, hexKey, hexRange } from "./hex";
import { GameState, Unit, Bounds } from "./simple-types";

export class GameEngine {
    state: GameState;
    size = 24; // hex pixel radius for drawing

    constructor(initialUnits: Unit[], bounds: Bounds = { qMin: -8, qMax: 8, rMin: -8, rMax: 8 }) {
        const units: Record<string, Unit> = {};
        for (const u of initialUnits) units[u.id] = { ...u, alive: u.alive ?? true };

        // Build proper initiative order based on speed (like the main battle engine)
        const order = this.buildInitiativeOrder(Object.values(units));
        console.log(`🎯 Initial initiative order: ${order.map(id => {
            const unit = units[id];
            return `${unit.name}(SPD:${unit.spd})`;
        }).join(' → ')}`);

        this.state = {
            units,
            order,
            turnIndex: 0,
            round: 1,
            selectedUnitId: order[0],
            phase: "awaitAction",
            reachable: new Set(),
            pathPreview: {},
            worldBounds: bounds,
        };
    }

    // Speed-based initiative system (borrowed from main battle engine)
    private buildInitiativeOrder(units: Unit[]): string[] {
        const livingUnits = units.filter(u => u.alive);
        // Higher SPD acts earlier; stable sort by spd desc, then name
        return livingUnits
            .sort((a, b) => (b.spd - a.spd) || a.name.localeCompare(b.name))
            .map(u => u.id);
    }

    get current(): Unit { return this.state.units[this.state.selectedUnitId]; }

    // ---- Turn control ---------------------------------------------------------
    private advanceToNextLiving() {
        const st = this.state;
        let tries = 0;
        const maxTries = st.order.length * 2; // Safety limit to prevent infinite loops

        do {
            st.turnIndex = (st.turnIndex + 1) % st.order.length;
            st.selectedUnitId = st.order[st.turnIndex];
            tries++;

            // Safety check: if we've tried too many times, rebuild initiative
            if (tries >= maxTries) {
                console.log(`⚠️ Turn advancement stuck, rebuilding initiative order`);
                st.order = this.buildInitiativeOrder(Object.values(st.units));
                st.turnIndex = 0;
                st.selectedUnitId = st.order[0];
                break;
            }
        } while (!this.state.units[st.selectedUnitId]?.alive && st.order.length > 0);

        // If no living units found, something is wrong
        if (!this.state.units[st.selectedUnitId]?.alive) {
            console.log(`❌ No living units found! Current order:`, st.order);
        }
    }

    endTurn() {
        console.log(`🔄 ${this.current.name} ending turn...`);

        // Store current index before advancing
        const prevIndex = this.state.turnIndex;

        // Move to next unit in initiative order
        this.advanceToNextLiving();

        // Check if we've completed a full round (wrapped around to start)
        if (this.state.turnIndex <= prevIndex || this.state.turnIndex === 0) {
            this.state.round++;
            console.log(`🔄 New round ${this.state.round}: rebuilding initiative order`);

            // Rebuild initiative order to handle dead units
            const newOrder = this.buildInitiativeOrder(Object.values(this.state.units));

            if (newOrder.length === 0) {
                console.log(`🏁 No living units, battle should end`);
                return;
            }

            this.state.order = newOrder;
            this.state.turnIndex = 0;
            this.state.selectedUnitId = this.state.order[0];
        }

        const u = this.current;
        if (!u) {
            console.log(`❌ No current unit found!`);
            return;
        }

        console.log(`➡️ Next turn: ${u.name} (${u.team}) - Turn ${this.state.turnIndex + 1}/${this.state.order.length}`);

        // Reset unit state for new turn
        u.defended = false;
        this.state.phase = "awaitAction";
        this.state.reachable.clear();
        this.state.pathPreview = {};
    }

    wait() {
        const st = this.state;
        const id = st.selectedUnitId;
        st.order = st.order.filter(x => x !== id);
        st.order.push(id);
        st.turnIndex = st.order.indexOf(id);
        this.endTurn();
    }

    defend() {
        this.current.defended = true;
        this.endTurn();
    }

    // ---- Movement -------------------------------------------------------------
    beginMove() {
        const u = this.current;
        const occupied = new Set(Object.values(this.state.units)
            .filter(v => v.alive && v.id !== u.id)
            .map(v => hexKey({ q: v.q, r: v.r })));

        // Simple implementation - just get all hexes within movement range
        const validHexes = hexRange({ q: u.q, r: u.r }, u.move);
        const reachable = new Set<string>();
        const pathPreview: Record<string, { q: number; r: number }[]> = {};

        for (const hex of validHexes) {
            const b = this.state.worldBounds;
            if (hex.q < b.qMin || hex.q > b.qMax || hex.r < b.rMin || hex.r > b.rMax) continue;
            if (occupied.has(hexKey(hex))) continue;

            const k = hexKey(hex);
            reachable.add(k);
            // Simple path - direct line (you can improve this with actual pathfinding later)
            pathPreview[k] = [{ q: u.q, r: u.r }, hex];
        }

        this.state.phase = "moveSelect";
        this.state.reachable = reachable;
        this.state.pathPreview = pathPreview;
    }

    moveTo(target: HexCoord): boolean {
        if (this.state.phase !== "moveSelect") return false;
        const tk = hexKey(target);
        if (!this.state.reachable.has(tk)) return false;
        // snap to target
        this.current.q = target.q;
        this.current.r = target.r;
        this.state.phase = "awaitAction";
        this.state.reachable.clear();
        this.state.pathPreview = {};
        return true;
    }    // ---- Combat (adjacent melee) ---------------------------------------------
    canMelee(targetId: string) {
        const a = this.current, b = this.state.units[targetId];
        if (!b || !b.alive || a.team === b.team) return false;
        return hexDistance({ q: a.q, r: a.r }, { q: b.q, r: b.r }) === 1;
    }

    fight(targetId: string) {
        if (!this.canMelee(targetId)) return false;
        const a = this.current, b = this.state.units[targetId];
        const attack = a.atk;
        const defense = b.def + (b.defended ? 2 : 0);
        const dmg = Math.max(1, attack - defense);
        b.hp -= dmg;
        if (b.hp <= 0) { b.hp = 0; b.alive = false; }
        this.endTurn();
        return true;
    }

    // Utility
    unitAt(q: number, r: number): Unit | undefined {
        return Object.values(this.state.units).find(u => u.alive && u.q === q && u.r === r);
    }

    // ---- AI for enemy turns ---------------------------------------------------
    doEnemyTurn() {
        const currentUnit = this.current;
        console.log(`🤖 doEnemyTurn called for ${currentUnit.name} (${currentUnit.team})`);

        if (currentUnit.team !== "enemy") {
            console.log(`❌ Not an enemy unit, skipping AI`);
            return; // Not an enemy turn
        }

        // Simple AI: Try to attack adjacent players, otherwise move closer to nearest player
        const playerUnits = Object.values(this.state.units).filter(u => u.alive && u.team === "player");
        console.log(`🎯 Found ${playerUnits.length} living players`);

        if (playerUnits.length === 0) {
            console.log(`🏆 No players left, ending turn`);
            this.endTurn();
            return;
        }

        // Check if we can attack any adjacent player
        for (const player of playerUnits) {
            if (this.canMelee(player.id)) {
                console.log(`⚔️ ${currentUnit.name} attacking ${player.name}!`);
                this.fight(player.id);
                return;
            }
        }

        console.log(`🚶 No adjacent targets, moving toward nearest player`);

        // If no adjacent targets, try to move closer to the nearest player
        const nearestPlayer = playerUnits.reduce((closest, player) => {
            const distToCurrent = hexDistance({ q: currentUnit.q, r: currentUnit.r }, { q: player.q, r: player.r });
            const distToClosest = hexDistance({ q: currentUnit.q, r: currentUnit.r }, { q: closest.q, r: closest.r });
            return distToCurrent < distToClosest ? player : closest;
        });

        console.log(`🎯 Target: ${nearestPlayer.name} at (${nearestPlayer.q}, ${nearestPlayer.r})`);

        // Try to move toward the nearest player
        this.beginMove();

        // Find the best reachable hex that gets us closer to the target
        let bestHex: HexCoord | null = null;
        let bestDistance = Infinity;

        console.log(`📍 Checking ${this.state.reachable.size} reachable hexes`);

        for (const hexKey of Array.from(this.state.reachable)) {
            const [q, r] = hexKey.split(",").map(Number);
            const hex = { q, r };
            const distance = hexDistance(hex, { q: nearestPlayer.q, r: nearestPlayer.r });

            if (distance < bestDistance) {
                bestDistance = distance;
                bestHex = hex;
            }
        }

        if (bestHex) {
            console.log(`✅ Moving to (${bestHex.q}, ${bestHex.r}), distance: ${bestDistance}`);
            this.moveTo(bestHex);
            this.endTurn(); // End turn after moving
        } else {
            console.log(`❌ No valid move found, ending turn`);
            // Can't move, just end turn
            this.state.phase = "awaitAction";
            this.state.reachable.clear();
            this.state.pathPreview = {};
            this.endTurn();
        }
    }

    // Check if current unit is an enemy (for automatic AI turns)
    get isCurrentUnitEnemy(): boolean {
        return this.current.team === "enemy";
    }
}