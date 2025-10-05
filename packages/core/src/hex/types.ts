/**
 * Hex Grid Type Primitives
 * Engine-agnostic hex math foundations with branded types
 */

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type Axial = Brand<{ q: number; r: number }, 'Axial'>;
export type Cube = Brand<{ x: number; y: number; z: number }, 'Cube'>;
export type Offset = Brand<{ col: number; row: number }, 'Offset'>;

export function axial(q: number, r: number): Axial {
    return { q, r } as Axial;
}

export function cube(x: number, y: number, z: number): Cube {
    if (Math.abs(x + y + z) > 1e-10) {
        throw new Error(`Cube coords must sum to 0, got ${x} + ${y} + ${z} = ${x + y + z}`);
    }
    return { x, y, z } as Cube;
}

export function offset(col: number, row: number): Offset {
    return { col, row } as Offset;
}