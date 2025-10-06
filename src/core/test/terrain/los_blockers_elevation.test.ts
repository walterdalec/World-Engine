// packages/core/test/terrain/los_blockers_elevation.test.ts
import { axial } from '../../action/hex';
import { TerrainMap } from '../../terrain/map';
import { makeLOSFn, losWithElevation } from '../../terrain/los.blockers';

describe('LOS blockers', () => {
    it('forest blocks; elevation step blocks', () => {
        const t = new TerrainMap();
        const a = axial(0, 0), b = axial(3, 0);
        t.set(axial(1, 0), { t: 'forest' });

        const base = makeLOSFn(t);
        expect(base(axial(1, 0))).toBe(true);

        const r1 = losWithElevation(a, b, t, base, 2);
        expect(r1.visible).toBe(false);
        expect(r1.occluder).toEqual(axial(1, 0));

        // Now test elevation-based block
        const t2 = new TerrainMap();
        t2.set(axial(1, 0), { t: 'grass', elev: 3 }); // rise > 2

        const r2 = losWithElevation(a, b, t2, makeLOSFn(t2), 2);
        expect(r2.visible).toBe(false);
        expect(r2.occluder).toEqual(axial(1, 0));
    });

    it('clear line with low elevation changes is visible', () => {
        const t = new TerrainMap();
        const a = axial(0, 0), b = axial(3, 0);

        // Set up terrain with small elevation changes
        t.set(axial(1, 0), { t: 'grass', elev: 1 });
        t.set(axial(2, 0), { t: 'grass', elev: 2 });

        const base = makeLOSFn(t);
        const result = losWithElevation(a, b, t, base, 2);

        expect(result.visible).toBe(true);
    });

    it('different terrain types block correctly', () => {
        const t = new TerrainMap();
        const base = makeLOSFn(t);

        // Test different blocking terrains
        expect(base(axial(0, 0))).toBe(false); // grass doesn't block

        t.set(axial(1, 0), { t: 'forest' });
        expect(base(axial(1, 0))).toBe(true); // forest blocks

        t.set(axial(2, 0), { t: 'hill' });
        expect(base(axial(2, 0))).toBe(true); // hill blocks

        t.set(axial(3, 0), { t: 'fortress' });
        expect(base(axial(3, 0))).toBe(true); // fortress blocks

        t.set(axial(4, 0), { t: 'water' });
        expect(base(axial(4, 0))).toBe(false); // water doesn't block LOS
    });
});