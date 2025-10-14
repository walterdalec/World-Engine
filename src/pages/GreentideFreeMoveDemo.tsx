import React from "react";
import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import type { Engine } from "../battle/greentidePlayable";
import { startGreentidePlayable } from "../battle/greentidePlayable";

interface GreentideFreeMoveDemoProps {
  onBack?: () => void;
  debug?: boolean;
}

export function GreentideFreeMoveDemo({ onBack, debug }: GreentideFreeMoveDemoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<{ app: PIXI.Application; engine: Engine; dispose?: () => void } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 720;

    startGreentidePlayable(container, { width, height })
      .then(engine => {
        if (cancelled) {
          engine.dispose?.();
          engine.app.destroy(true);
          return;
        }
        engineRef.current = engine;
      })
      .catch(err => {
        console.error("Failed to start Greentide demo:", err);
      });

    return () => {
      cancelled = true;
      if (engineRef.current) {
        engineRef.current.dispose?.();
        engineRef.current.app.destroy(true);
        engineRef.current = null;
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [debug]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#111" }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 1000,
            background: "#374151",
            color: "#f8fafc",
            border: "none",
            borderRadius: "8px",
            padding: "10px 15px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold"
          }}
        >
          ← Back to Menu
        </button>
      )}
      <div
        style={{
          position: "absolute",
          top: onBack ? "72px" : "20px",
          left: "20px",
          zIndex: 500,
          background: "rgba(17, 24, 39, 0.78)",
          color: "#e2e8f0",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "13px",
          lineHeight: 1.5,
          maxWidth: "280px",
          pointerEvents: "none",
          fontFamily: "Inter, sans-serif"
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "6px", pointerEvents: "auto" }}>Greentide Controls</div>
        <div>- Left click: select squad</div>
        <div>- Drag left mouse: box select</div>
        <div>- Right click: move order</div>
        <div>- Shift + Right click: charge order</div>
        <div>- H: hold ground</div>
        <div>- 1-4: quick select squads</div>
        <div>- Middle drag: pan • Wheel: zoom</div>
      </div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onContextMenu={event => event.preventDefault()}
      />
    </div>
  );
}
