/**
 * Input Controller - World Engine Combat UI
 * Handles mouse, touch, and keyboard input for combat interface
 */

import type { InputMap } from './types';
import type { HexPosition } from '../../battle/types';
import { selectionManager } from './Selection';

export interface InputController {
    mount(_element: HTMLElement): void;
    unmount(): void;
    setInputMap(_map: Partial<InputMap>): void;
    onHexClick?: (_pos: HexPosition, _event: PointerEvent) => void;
    onHexHover?: (_pos: HexPosition | null) => void;
    onPan?: (_deltaX: number, _deltaY: number) => void;
    onZoom?: (_delta: number, _centerX: number, _centerY: number) => void;
}

class CombatInputController implements InputController {
    private element?: HTMLElement;
    private inputMap: InputMap;
    private isPointerDown = false;
    private lastPointerPos = { x: 0, y: 0 };
    private panThreshold = 5; // pixels before starting pan
    private panStarted = false;

    // Callbacks
    public onHexClick?: (_pos: HexPosition, _event: PointerEvent) => void;
    public onHexHover?: (_pos: HexPosition | null) => void;
    public onPan?: (_deltaX: number, _deltaY: number) => void;
    public onZoom?: (_delta: number, _centerX: number, _centerY: number) => void;

    constructor(inputMap: InputMap) {
        this.inputMap = { ...inputMap };
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
    }

    mount(element: HTMLElement): void {
        this.element = element;

        // Pointer events (covers mouse and touch)
        element.addEventListener('pointerdown', this.handlePointerDown);
        element.addEventListener('pointermove', this.handlePointerMove);
        element.addEventListener('pointerup', this.handlePointerUp);
        element.addEventListener('pointercancel', this.handlePointerUp);

        // Keyboard events
        element.addEventListener('keydown', this.handleKeyDown);
        element.tabIndex = 0; // Make element focusable for keyboard events

        // Mouse wheel
        element.addEventListener('wheel', this.handleWheel, { passive: false });

        // Prevent context menu
        element.addEventListener('contextmenu', this.handleContextMenu);
    }

    unmount(): void {
        if (!this.element) return;

        this.element.removeEventListener('pointerdown', this.handlePointerDown);
        this.element.removeEventListener('pointermove', this.handlePointerMove);
        this.element.removeEventListener('pointerup', this.handlePointerUp);
        this.element.removeEventListener('pointercancel', this.handlePointerUp);
        this.element.removeEventListener('keydown', this.handleKeyDown);
        this.element.removeEventListener('wheel', this.handleWheel);
        this.element.removeEventListener('contextmenu', this.handleContextMenu);

        this.element = undefined;
    }

    setInputMap(map: Partial<InputMap>): void {
        this.inputMap = { ...this.inputMap, ...map };
    }

    private handlePointerDown(event: PointerEvent): void {
        if (!this.element) return;

        this.element.setPointerCapture(event.pointerId);
        this.isPointerDown = true;
        this.lastPointerPos = { x: event.clientX, y: event.clientY };
        this.panStarted = false;

        event.preventDefault();
    }

    private handlePointerMove(event: PointerEvent): void {
        if (!this.isPointerDown) {
            // Hover handling
            this.throttledHover(event);
            return;
        }

        const deltaX = event.clientX - this.lastPointerPos.x;
        const deltaY = event.clientY - this.lastPointerPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > this.panThreshold && !this.panStarted) {
            this.panStarted = true;
        }

        if (this.panStarted && this.onPan) {
            this.onPan(deltaX, deltaY);
        }

        this.lastPointerPos = { x: event.clientX, y: event.clientY };
    }

    private handlePointerUp(event: PointerEvent): void {
        if (!this.element) return;

        this.element.releasePointerCapture(event.pointerId);

        if (!this.panStarted) {
            // This was a click/tap, not a pan
            const hexPos = this.screenToHex(event.clientX, event.clientY);
            if (hexPos) {
                if (event.button === 0 || event.pointerType === 'touch') {
                    // Primary click/tap
                    this.handlePrimaryClick(hexPos, event);
                } else if (event.button === 2) {
                    // Secondary click (right-click)
                    this.handleSecondaryClick(hexPos, event);
                }
            }
        }

        this.isPointerDown = false;
        this.panStarted = false;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        const mode = this.inputMap.hotkeys[key];

        if (mode) {
            event.preventDefault();

            if (mode === 'idle') {
                selectionManager.reset();
            } else if (mode === 'confirm') {
                if (selectionManager.canConfirm()) {
                    this.executeAction();
                }
            } else {
                selectionManager.setMode(mode);
            }
        }

        // Special keys
        if (event.key === 'Escape') {
            event.preventDefault();
            selectionManager.reset();
        }
    }

    private handleWheel(event: WheelEvent): void {
        event.preventDefault();

        if (this.onZoom) {
            const delta = -event.deltaY / 100; // Normalize wheel delta
            this.onZoom(delta, event.clientX, event.clientY);
        }
    }

    private handleContextMenu(event: Event): void {
        event.preventDefault(); // Prevent browser context menu
    }

    private handlePrimaryClick(hexPos: HexPosition, event: PointerEvent): void {
        const state = selectionManager.get();

        switch (state.mode) {
            case 'idle':
            case 'inspect':
                // Select unit or hex
                this.handleUnitSelection(hexPos);
                break;

            case 'move':
            case 'flee':
                // Set movement target
                this.handleMovementTarget(hexPos);
                break;

            case 'attack':
            case 'cast':
            case 'command':
            case 'rally':
                // Set ability target
                this.handleAbilityTarget(hexPos);
                break;

            case 'confirm':
                // Execute the planned action
                this.executeAction();
                break;
        }

        if (this.onHexClick) {
            this.onHexClick(hexPos, event);
        }
    }

    private handleSecondaryClick(_hexPos: HexPosition, _event: PointerEvent): void {
        // Secondary click always cancels current action
        selectionManager.reset();
    }

    private handleUnitSelection(hexPos: HexPosition): void {
        // This would integrate with the battle system to find units at position
        // For now, just set the position as the actor origin
        selectionManager.setOrigin(hexPos);
        selectionManager.setMode('inspect');
    }

    private handleMovementTarget(hexPos: HexPosition): void {
        // Calculate path to target hex
        const path = this.calculatePath(hexPos);
        selectionManager.setPath(path);
    }

    private handleAbilityTarget(hexPos: HexPosition): void {
        const state = selectionManager.get();

        if (state.ability) {
            // Check if this is an AOE ability
            if (this.isAOEAbility(state.ability.id)) {
                const aoeHexes = this.calculateAOE(hexPos, state.ability);
                selectionManager.setAOE(aoeHexes);
            } else {
                selectionManager.setTarget(hexPos);
            }
        }
    }

    private executeAction(): void {
        const state = selectionManager.get();

        if (!selectionManager.canConfirm()) {
            console.warn('Cannot confirm action in current state');
            return;
        }

        // This would integrate with the action system to execute the planned action
        console.log('Executing action:', {
            actor: state.actor,
            mode: state.mode,
            target: state.targetHex,
            path: state.path,
            ability: state.ability
        });

        // Reset selection after execution
        selectionManager.reset();
    }

    // Utility methods (would integrate with battle system)
    private screenToHex(_screenX: number, _screenY: number): HexPosition | null {
        // Placeholder - would convert screen coordinates to hex coordinates
        // This requires integration with the hex grid renderer
        return { q: 0, r: 0 };
    }

    private calculatePath(_target: HexPosition): HexPosition[] {
        // Placeholder - would calculate movement path using A* or similar
        const state = selectionManager.get();
        if (!state.origin) return [];

        return [state.origin, _target];
    }

    private calculateAOE(_center: HexPosition, _ability: any): HexPosition[] {
        // Placeholder - would calculate AOE pattern based on ability
        return [_center];
    }

    private isAOEAbility(abilityId?: string): boolean {
        // Check if ability affects multiple hexes
        const aoeAbilities = ['natures_wrath', 'battle_hymn', 'divine_shield', 'smoke_bomb'];
        return abilityId ? aoeAbilities.includes(abilityId) : false;
    }

    // Throttled hover to avoid excessive calculations
    private lastHoverTime = 0;
    private hoverThrottle = 33; // ~30 FPS

    private throttledHover(event: PointerEvent): void {
        const now = Date.now();
        if (now - this.lastHoverTime < this.hoverThrottle) return;

        this.lastHoverTime = now;
        const hexPos = this.screenToHex(event.clientX, event.clientY);

        if (this.onHexHover) {
            this.onHexHover(hexPos);
        }
    }
}

// Export factory function
export function createInputController(inputMap: InputMap): InputController {
    return new CombatInputController(inputMap);
}