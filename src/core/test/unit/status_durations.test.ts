// packages/core/test/unit/status_durations.test.ts
import { tickStatuses } from '../../unit/status';

describe('status durations', () => {
    it('decrements and removes at 0', () => {
        const u: any = {
            statuses: [
                { name: 'burn', turns: 2 },
                { name: 'stunned', turns: 1 }
            ]
        };
        tickStatuses(u);
        expect(u.statuses.length).toBe(1);
        tickStatuses(u);
        expect(u.statuses.length).toBe(0);
    });
});