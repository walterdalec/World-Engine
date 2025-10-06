// packages/core/test/terrain/tiled_parse_smoke.test.ts
import { tilesetIndex, parseTiledToTerrain } from '../../terrain/tiled';
import type { TiledMap } from '../../terrain/tiled';

describe('Tiled parser smoke test', () => {
    it('parses tileset index correctly', () => {
        const tilesets = [
            {
                firstgid: 1,
                tiles: [
                    { id: 0, properties: [{ name: 'terrainKind', value: 'grass' }] },
                    { id: 1, properties: [{ name: 'terrainKind', value: 'forest' }] },
                    { id: 2, properties: [{ name: 'terrainKind', value: 'mountain' }] }
                ]
            }
        ];

        const index = tilesetIndex(tilesets);

        expect(index[1]).toBe('grass');   // firstgid + tile.id
        expect(index[2]).toBe('forest');
        expect(index[3]).toBe('mountain');
    });

    it('handles missing terrain properties with default', () => {
        const tilesets = [
            {
                firstgid: 10,
                tiles: [
                    { id: 0 }, // no properties
                    { id: 1, properties: [] }, // empty properties
                    { id: 2, properties: [{ name: 'other', value: 'something' }] } // wrong property
                ]
            }
        ];

        const index = tilesetIndex(tilesets);

        expect(index[10]).toBe('grass'); // default
        expect(index[11]).toBe('grass'); // default
        expect(index[12]).toBe('grass'); // default
    });

    it('parses basic tiled map structure', () => {
        const tiledMap: TiledMap = {
            width: 3,
            height: 2,
            tilesets: [
                {
                    firstgid: 1,
                    tiles: [
                        { id: 0, properties: [{ name: 'terrainKind', value: 'grass' }] },
                        { id: 1, properties: [{ name: 'terrainKind', value: 'forest' }] }
                    ]
                }
            ],
            layers: [
                {
                    name: 'terrain',
                    type: 'tilelayer',
                    data: [1, 2, 1, 2, 1, 2] // 3x2 grid
                }
            ]
        };

        const terrainMap = parseTiledToTerrain(tiledMap);

        // Check some parsed terrain
        expect(terrainMap.kind({ q: 0, r: 0 })).toBe('grass');
        expect(terrainMap.kind({ q: 1, r: 0 })).toBe('forest');
    });

    it('throws error for missing terrain layer', () => {
        const invalidMap: TiledMap = {
            width: 2,
            height: 2,
            tilesets: [],
            layers: [
                { name: 'background', type: 'tilelayer', data: [1, 1, 1, 1] }
            ]
        };

        expect(() => parseTiledToTerrain(invalidMap)).toThrow('Missing tile layer "terrain"');
    });

    it('handles elevation layer when present', () => {
        const tiledMap: TiledMap = {
            width: 2,
            height: 1,
            tilesets: [
                {
                    firstgid: 1,
                    tiles: [{ id: 0, properties: [{ name: 'terrainKind', value: 'grass' }] }]
                }
            ],
            layers: [
                {
                    name: 'terrain',
                    type: 'tilelayer',
                    data: [1, 1]
                },
                {
                    name: 'elevation',
                    type: 'tilelayer',
                    data: [0, 3] // 0 = no elevation, 3 = elevation 2 (3-1)
                }
            ]
        };

        const terrainMap = parseTiledToTerrain(tiledMap);

        expect(terrainMap.elevation({ q: 0, r: 0 })).toBe(0); // no elevation set
        expect(terrainMap.elevation({ q: 1, r: 0 })).toBe(2); // elevation 3-1 = 2
    });
});