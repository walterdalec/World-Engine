// packages/core/test/unit/serialize_roundtrip.test.ts
import { saveUnit, loadUnit } from '../../unit/serialize';

describe('serialize', () => {
    it('round-trips', () => {
        const u: any = {
            id: 'u',
            name: 'U',
            team: 'T',
            level: 3,
            pos: { q: 0, r: 0 },
            base: { str: 5, dex: 5, con: 5, int: 5, wis: 5, cha: 5, spd: 5, lck: 5 },
            equips: {},
            resist: {},
            hp: 40,
            mp: 20,
            ap: 10,
            statuses: []
        };
        const s = saveUnit(u);
        const u2 = loadUnit(s);
        expect(u2.name).toBe('U');
    });
});