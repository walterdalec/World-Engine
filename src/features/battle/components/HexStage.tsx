/**
 * Professional Canvas Wrapper for Maps
 * Blocks page scrolling, implements drag-to-pan, wheel zoom
 * Based on best practices for canvas interaction
 */

import { useEffect, useRef } from "react";

type Props = {
    init?: (_ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) => void;
    onRender?: (_ctx: CanvasRenderingContext2D, _t: number) => void;
    pan?: (_dx: number, _dy: number) => void;                      // drag-pan hook
    zoom?: (_delta: number, _cx: number, _cy: number) => void;      // wheel-zoom hook
    onClick?: (_x: number, _y: number) => void;                    // click handler
    onHover?: (_x: number, _y: number) => void;                    // hover handler
    onHoverEnd?: () => void;                                     // hover end handler
};

export default function HexStage({
    init,
    onRender,
    pan,
    zoom,
    onClick,
    onHover,
    onHoverEnd
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        // Fit canvas to CSS size with device pixel ratio
        const resize = () => {
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            const w = Math.floor(canvas.clientWidth * dpr);
            const h = Math.floor(canvas.clientHeight * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                // Scale context to match device pixel ratio
                ctx.scale(dpr, dpr);
            }
        };

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        init?.(ctx, canvas);

        const loop = (t: number) => {
            onRender?.(ctx, t);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        // --- Input handling ---
        let dragging = false;
        let lastX = 0, lastY = 0;

        const onPointerDown = (e: PointerEvent) => {
            // Prevent text selection + middle-click autoscroll
            e.preventDefault();
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.setPointerCapture(e.pointerId); // keep receiving moves on drag

            // Update cursor
            canvas.style.cursor = 'grabbing';
        };

        const onPointerMove = (e: PointerEvent) => {
            if (dragging) {
                // ONLY pan while dragging
                const _dx = e.clientX - lastX;
                const _dy = e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                pan?.(_dx, _dy);
            } else if (onHover) {
                // Handle hover when not dragging
                const rect = canvas.getBoundingClientRect();
                const _x = e.clientX - rect.left;
                const _y = e.clientY - rect.top;
                onHover(_x, _y);
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            if (dragging) {
                dragging = false;
                canvas.style.cursor = 'grab';
                try {
                    canvas.releasePointerCapture(e.pointerId);
                } catch { }
            } else if (onClick) {
                // Handle click when not dragging
                const rect = canvas.getBoundingClientRect();
                const _x = e.clientX - rect.left;
                const _y = e.clientY - rect.top;
                onClick(_x, _y);
            }
        };

        const onPointerLeave = () => {
            if (!dragging) {
                onHoverEnd?.();
            }
        };

        const onWheel = (e: WheelEvent) => {
            // Cancel page scroll; use wheel for map zoom
            e.preventDefault();                     // requires non-passive listener
            const rect = canvas.getBoundingClientRect();
            const _cx = e.clientX - rect.left;
            const _cy = e.clientY - rect.top;
            zoom?.(-e.deltaY, _cx, _cy);
        };

        // Prevent middle-click autoscroll explicitly
        const onAux = (e: MouseEvent) => e.preventDefault();
        const onContext = (e: MouseEvent) => e.preventDefault();

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerleave", onPointerLeave);
        window.addEventListener("pointerup", onPointerUp);

        canvas.addEventListener("wheel", onWheel, { passive: false });  // important
        canvas.addEventListener("auxclick", onAux);                      // middle-click
        canvas.addEventListener("contextmenu", onContext);
        canvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

        return () => {
            ro.disconnect();
            cancelAnimationFrame(rafRef.current!);
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerleave", onPointerLeave);
            window.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("wheel", onWheel as any);
            canvas.removeEventListener("auxclick", onAux);
            canvas.removeEventListener("contextmenu", onContext);
        };
    }, [init, onRender, pan, zoom, onClick, onHover, onHoverEnd]);

    return (
        <div className="map-root">
            <canvas ref={canvasRef} className="map-canvas" />
        </div>
    );
}