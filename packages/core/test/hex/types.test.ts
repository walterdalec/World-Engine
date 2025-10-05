/**
 * Tests for Hex Grid Core Types and Constructors
 */

import { describe, it, expect } from 'vitest';
import { axial, cube, offset } from '../src/hex/types';

describe('Hex Grid Types', () => {
    describe('axial constructor', () => {
        it('creates valid axial coordinates', () => {
            const hex = axial(3, -1);
            expect(hex.q).toBe(3);
            expect(hex.r).toBe(-1);
        });

        it('handles zero coordinates', () => {
            const origin = axial(0, 0);
            expect(origin.q).toBe(0);
            expect(origin.r).toBe(0);
        });

        it('handles negative coordinates', () => {
            const hex = axial(-5, 2);
            expect(hex.q).toBe(-5);
            expect(hex.r).toBe(2);
        });
    });

    describe('cube constructor', () => {
        it('creates valid cube coordinates', () => {
            const hex = cube(1, -2, 1);
            expect(hex.x).toBe(1);
            expect(hex.y).toBe(-2);
            expect(hex.z).toBe(1);
        });

        it('enforces constraint x + y + z = 0', () => {
            expect(() => cube(1, 1, 1)).toThrow('Cube coords must sum to 0');
            expect(() => cube(2, -1, 0)).toThrow('Cube coords must sum to 0');
        });

        it('allows valid constraint combinations', () => {
            expect(() => cube(0, 0, 0)).not.toThrow();
            expect(() => cube(1, -1, 0)).not.toThrow();
            expect(() => cube(-2, 1, 1)).not.toThrow();
        });

        it('handles floating point precision', () => {
            // Should allow tiny rounding errors
            expect(() => cube(0.1, -0.1, 1e-15)).not.toThrow();
        });
    });

    describe('offset constructor', () => {
        it('creates valid offset coordinates', () => {
            const hex = offset(5, 3);
            expect(hex.col).toBe(5);
            expect(hex.row).toBe(3);
        });

        it('handles zero coordinates', () => {
            const origin = offset(0, 0);
            expect(origin.col).toBe(0);
            expect(origin.row).toBe(0);
        });

        it('handles negative coordinates', () => {
            const hex = offset(-2, -4);
            expect(hex.col).toBe(-2);
            expect(hex.row).toBe(-4);
        });
    });
});