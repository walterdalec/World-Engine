import { HexCoord, hexDistance, hexKey, hexRange } from "./hex";
import { GameState, Unit, Bounds } from "./simple-types";

export class GameEngine {
    state: GameState;
    size = 24; // hex pixel radius for drawing

    constructor(initialUnits: Unit[], bounds: Bounds = { qMin: -8, qMax: 8, rMin: -8, rMax: 8 }) {
        const units: Record<string, Unit> = {};
        for (const u of initialUnits) units[u.id] = { ...u, alive: u.alive ?? true };
        const order = initialUnits.map(u => u.id);

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

    get current(): Unit { return this.state.units[this.state.selectedUnitId]; }

    // ---- Turn control ---------------------------------------------------------
    private advanceToNextLiving() {
        const st = this.state;
        let tries = 0;
        do {
            st.turnIndex = (st.turnIndex + 1) % st.order.length;
            if (st.turnIndex === 0) st.round++;
            st.selectedUnitId = st.order[st.turnIndex];
            tries++;
            if (tries > st.order.length) break;
        } while (!this.state.units[st.selectedUnitId].alive);
    }

    endTurn() {
        console.log(`🔄 ${this.current.name} ending turn...`);
        // reset flags on current (next unit will be selected)
        this.advanceToNextLiving();
        const u = this.current;
        console.log(`➡️ Next turn: ${u.name} (${u.team})`);
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