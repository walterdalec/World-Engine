import type { Container } from 'pixi.js';

export type DimetricParams = {
    /** squash Y axis (0.45–0.65 looks good; 0.5 is classic) */
    scaleY: number;
    /** shear factor along X per 1px of Y (0.35–0.60). We store as a factor, convert to radians. */
    shearX: number;
};

export const DIMETRIC_DEFAULT: DimetricParams = { scaleY: 0.5, shearX: 0.5 };

/** Apply dimetric transform to a container (and its children). */
export function applyDimetric(container: Container, p: DimetricParams = DIMETRIC_DEFAULT) {
    container.scale.y = p.scaleY;
    // PIXI's skew.x is radians, representing tan(theta) as the shear factor.
    container.skew.set(Math.atan(p.shearX), 0);
}

/** Undo picking: screen->local already handled by worldTransform; local (dimetric) -> world */
export function dimetricToWorld(xd: number, yd: number, p: DimetricParams = DIMETRIC_DEFAULT) {
    const y = yd / p.scaleY;
    const x = xd - (y * p.scaleY) * p.shearX; // since xd = x + (y*scaleY)*shearX
    return { x, y };
}
