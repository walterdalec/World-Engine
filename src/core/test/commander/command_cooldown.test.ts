// packages/core/src/test/commander/command_cooldown.test.ts
import { describe, it, expect } from '@jest/globals';
import { getCooldown, setCooldown, tickCooldowns } from '../../commander/cooldowns';

describe('command ability cooldowns', () => {
    it('decrement per commander turn', () => {
        const w: any = { units: new Map() };
        setCooldown(w, 'K', 'rally', 3);
        expect(getCooldown(w, 'K', 'rally')).toBe(3);
        tickCooldowns(w, 'K');
        expect(getCooldown(w, 'K', 'rally')).toBe(2);
    });
});