/**
 * Dither + LUT Filter for Retro Aesthetic
 * 
 * Placeholder for future implementation.
 * Pixi v8 Filter API requires proper shader setup which we'll add later.
 */

import * as PIXI from "pixi.js";

export interface DitherLUTOptions {
  strength: number;
  lut: PIXI.Texture;
}

/**
 * Placeholder filter - will be implemented properly once core renderer is working.
 * For now, acts as a transparent container that can hold uniforms.
 */
export class DitherLUTFilter {
  public uniforms: Record<string, unknown>;

  constructor(opts: DitherLUTOptions) {
    this.uniforms = {
      uStrength: opts.strength,
      uLUT: opts.lut,
    };
  }
}
