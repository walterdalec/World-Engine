"use client";
import React from "react";
import { GameEngine } from "./simple-engine";
import { Unit } from "./simple-types";

export function SimpleBattleHUD({ engine, onAction }: {
    engine: GameEngine;
    onAction: (_action: "Move" | "Fight" | "Spells" | "Defend" | "Wait" | "EndTurn") => void;
}) {
    const st = engine.state;
    const u: Unit = engine.current;
    const yourTurn = u.team === "player";

    const Btn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
        <button {...props}
            className={"px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 " + (props.className ?? "")}
            style={{
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: props.disabled ? '#333' : '#1a1a1a',
                color: props.disabled ? '#666' : '#fff',
                border: '1px solid #444',
                cursor: props.disabled ? 'default' : 'pointer',
                fontSize: '14px',
                ...props.style
            }}
        />;

    return (
        <div
            style={{
                position: "fixed", left: "50%", bottom: 12, transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.85)", color: "#fff", borderRadius: 12,
                padding: "12px 16px", display: "flex", gap: 12, alignItems: "center",
                pointerEvents: "auto", boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                border: "1px solid #444"
            }}
        >
            <div style={{ marginRight: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{u.name} ({u.team})</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                    HP {u.hp}/{u.maxHp} • Move {u.move} • Round {st.round}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                    Phase: {st.phase} | ATK {u.atk} | DEF {u.def}
                </div>
            </div>

            <Btn onClick={() => onAction("Move")} disabled={!yourTurn || st.phase === "moveSelect"}>
                {st.phase === "moveSelect" ? "🎯 Click Hex" : "🚶 Move"}
            </Btn>
            <Btn onClick={() => onAction("Fight")} disabled={!yourTurn}>🗡️ Fight</Btn>
            <Btn onClick={() => onAction("Spells")} disabled={!yourTurn}>✨ Spells</Btn>
            <Btn onClick={() => onAction("Defend")} disabled={!yourTurn}>🛡️ Defend</Btn>
            <Btn onClick={() => onAction("Wait")} disabled={!yourTurn}>⏸️ Wait</Btn>
            <Btn
                onClick={() => onAction("EndTurn")}
                disabled={!yourTurn}
                style={{ backgroundColor: yourTurn ? '#4CAF50' : '#333' }}
            >
                ⏭️ End Turn
            </Btn>
        </div>
    );
}