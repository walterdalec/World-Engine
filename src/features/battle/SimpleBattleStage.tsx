"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { HexCoord, hexKey } from "./hex";
import { GameEngine } from "./simple-engine";

// Simple hex-to-pixel conversion for rendering (pointy-top orientation)
function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
    const SQRT3 = Math.sqrt(3);
    return {
        x: size * (SQRT3 * hex.q + (SQRT3 / 2) * hex.r),
        y: size * (1.5 * hex.r),
    };
}

// Simple pixel-to-hex conversion for mouse clicks
function pixelToHex(x: number, y: number, size: number): HexCoord {
    const SQRT3 = Math.sqrt(3);
    const qf = (x * SQRT3 / 3 - y / 3) / size;
    const rf = (2 / 3 * y) / size;

    // Round to nearest hex
    const xf = qf;
    const zf = rf;
    const yf = -xf - zf;
    let rx = Math.round(xf), ry = Math.round(yf), rz = Math.round(zf);
    const dx = Math.abs(rx - xf), dy = Math.abs(ry - yf), dz = Math.abs(rz - zf);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;

    return { q: rx, r: rz };
}

export default function SimpleBattleStage({ engine, onMove }: {
    engine: GameEngine;
    onMove?: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const camera = useRef({ x: 0, y: 0, scale: 1 });
    const [, forceUpdate] = useState(0);

    // Trigger re-render
    const triggerUpdate = useCallback(() => {
        forceUpdate(prev => prev + 1);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        // Fit canvas to element size with DPR
        const resize = () => {
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            const w = Math.floor(canvas.clientWidth * dpr);
            const h = Math.floor(canvas.clientHeight * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w; canvas.height = h;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        // Input handling: drag-pan + wheel zoom; clicks choose tiles
        let dragging = false, lastX = 0, lastY = 0;

        const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            dragging = true; lastX = e.clientX; lastY = e.clientY;
            canvas.setPointerCapture(e.pointerId);
        };
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return;
            camera.current.x += e.clientX - lastX;
            camera.current.y += e.clientY - lastY;
            lastX = e.clientX; lastY = e.clientY;
        };
        const onPointerUp = () => { dragging = false; };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = Math.exp(-e.deltaY * 0.001);
            const { x: cx, y: cy, scale } = camera.current;
            const sx = (e.clientX - cx) / scale;
            const sy = (e.clientY - cy) / scale;
            camera.current.scale *= factor;
            camera.current.x = e.clientX - sx * camera.current.scale;
            camera.current.y = e.clientY - sy * camera.current.scale;
        };

        const onClick = (e: MouseEvent) => {
            const cam = camera.current;
            const worldX = (e.clientX - cam.x) / cam.scale;
            const worldY = (e.clientY - cam.y) / cam.scale;
            const hex = pixelToHex(worldX, worldY, engine.size);

            if (engine.state.phase === "moveSelect") {
                const success = engine.moveTo(hex);
                if (success && onMove) {
                    onMove();
                    triggerUpdate();
                }
            } else {
                // Optional: if you want click-selection of enemies for Fight, extend here.
            }
        };        // non-passive for preventDefault
        canvas.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("wheel", onWheel, { passive: false });
        canvas.addEventListener("click", onClick);
        canvas.addEventListener("contextmenu", e => e.preventDefault());

        // Draw
        const drawHex = (q: number, r: number, stroke = "#4a4a4a", fill?: string) => {
            const size = engine.size;
            const { x, y } = hexToPixel({ q, r }, size);
            const angle0 = Math.PI / 6; // pointy-top
            const corners = 6;
            const path = new Path2D();
            for (let i = 0; i < corners; i++) {
                const ang = angle0 + i * Math.PI / 3;
                const px = x + size * Math.cos(ang);
                const py = y + size * Math.sin(ang);
                if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
            }
            path.closePath();
            if (fill) { ctx.fillStyle = fill; ctx.fill(path); }
            ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(path);
        };

        const render = () => {
            ctx.save();
            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
            ctx.translate(camera.current.x, camera.current.y);
            ctx.scale(camera.current.scale, camera.current.scale);

            const b = engine.state.worldBounds;
            // Grid + reachable highlight
            for (let r = b.rMin; r <= b.rMax; r++) {
                for (let q = b.qMin; q <= b.qMax; q++) {
                    const k = hexKey({ q, r });
                    const highlight = engine.state.phase === "moveSelect" && engine.state.reachable.has(k)
                        ? "rgba(130,200,255,0.35)" : undefined;
                    drawHex(q, r, "#404040", highlight);
                }
            }            // Units
            for (const u of Object.values(engine.state.units)) {
                if (!u.alive) continue;
                const { x, y } = hexToPixel({ q: u.q, r: u.r }, engine.size);
                const isSel = u.id === engine.state.selectedUnitId;

                // Unit circle
                ctx.fillStyle = isSel ? "#ffffff" : (u.team === "player" ? "#4CAF50" : "#F44336");
                ctx.beginPath();
                ctx.arc(x, y, engine.size * 0.6, 0, Math.PI * 2);
                ctx.fill();

                // Unit border
                ctx.strokeStyle = isSel ? "#FFD700" : "#000";
                ctx.lineWidth = isSel ? 3 : 1;
                ctx.stroke();

                // Unit name
                ctx.fillStyle = "#000";
                ctx.font = "12px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(u.name, x, y + 4);

                // Defended indicator
                if (u.defended) {
                    ctx.fillStyle = "#FFD700";
                    ctx.fillRect(x - 8, y - engine.size, 16, 4);
                }

                // HP bar
                const barWidth = 32;
                const barHeight = 4;
                const barY = y + engine.size * 0.75;

                // Background
                ctx.fillStyle = "#333";
                ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);

                // Health
                const healthPct = u.hp / u.maxHp;
                ctx.fillStyle = healthPct > 0.6 ? "#4CAF50" : healthPct > 0.3 ? "#FF9800" : "#F44336";
                ctx.fillRect(x - barWidth / 2, barY, barWidth * healthPct, barHeight);

                // HP text
                ctx.fillStyle = "#fff";
                ctx.font = "10px sans-serif";
                ctx.fillText(`${u.hp}/${u.maxHp}`, x, barY + 14);
            }

            ctx.restore();
            rafRef.current = requestAnimationFrame(render);
        };
        rafRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(rafRef.current!);
            ro.disconnect();
            canvas.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("wheel", onWheel);
            canvas.removeEventListener("click", onClick);
        };
    }, [engine, onMove, triggerUpdate]);

    // Inline styles to prevent page scroll + gestures (no CSS file needed)
    return (
        <div style={{ position: "fixed", inset: 0, overscrollBehavior: "none" }}>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "grab" }}
                onMouseDown={(e) => (e.currentTarget.style.cursor = "grabbing")}
                onMouseUp={(e) => (e.currentTarget.style.cursor = "grab")}
            />

            {/* Phase indicator */}
            <div style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                backgroundColor: "rgba(0,0,0,0.8)",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                border: "1px solid #444",
                pointerEvents: "none"
            }}>
                Phase: {engine.state.phase} | Round: {engine.state.round}
            </div>

            {/* Instructions */}
            <div style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                backgroundColor: "rgba(0,0,0,0.8)",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                border: "1px solid #444",
                pointerEvents: "none",
                maxWidth: "200px"
            }}>
                {engine.state.phase === "moveSelect"
                    ? "🎯 Click a blue hex to move"
                    : "Use HUD buttons to take actions"
                }
            </div>
        </div>
    );
}