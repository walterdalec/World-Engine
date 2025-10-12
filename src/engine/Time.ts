/**
 * Fixed-Step Time Loop
 * Canvas 01 - Deterministic simulation loop with accumulator
 */

import { TickContext } from './types';

export class FixedStepper {
    private accumulator = 0;
    private last = performance.now();

    constructor(
        private readonly _dtFixed: number,
        private readonly _tick: (_ctx: TickContext) => void
    ) { }

    start(ctx: Omit<TickContext, 'frameDt' | 'time'> & { time?: number }): () => void {
        let running = true;
        let simTime = ctx.time ?? 0;

        const loop = () => {
            if (!running) return;

            const now = performance.now();
            const frameDt = (now - this.last) / 1000;
            this.last = now;
            this.accumulator += frameDt;

            while (this.accumulator >= this._dtFixed) {
                simTime += this._dtFixed;
                this._tick({
                    ...ctx,
                    dtFixed: this._dtFixed,
                    frameDt,
                    time: simTime
                });
                this.accumulator -= this._dtFixed;
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
        return () => { running = false; };
    }
}
