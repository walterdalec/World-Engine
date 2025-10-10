import React, { useEffect, useRef } from "react";
import type { BattleState, Tile, Unit } from "../types";

function drawGrid(ctx:CanvasRenderingContext2D, tileSize:number, tiles:Tile[], w:number, h:number){
  for (const t of tiles){
    const x = t.x*tileSize, y = t.y*tileSize;
    let fill = "#2b3448";
    if (t.kind==="road") fill="#4b5563";
    if (t.kind==="forest") fill="#1b4d2b";
    if (t.kind==="rough") fill="#4a3b2b";
    if (t.kind==="sand") fill="#d1b38a";
    if (t.kind==="swamp") fill="#2f3f2f";
    if (t.kind==="snow") fill="#cfe7ff";
    if (t.kind==="cover") fill="#38506b";
    if (t.kind==="hazard") fill="#7a1d1d";
    if (t.kind==="wall") fill="#2a2a2a";
    if (t.kind==="spawn_friendly") fill="#233b52";
    if (t.kind==="spawn_enemy") fill="#522323";
    ctx.fillStyle = fill;
    ctx.fillRect(x,y,tileSize,tileSize);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.strokeRect(x,y,tileSize,tileSize);
  }
}

function drawUnits(ctx:CanvasRenderingContext2D, tileSize:number, units:Unit[]){
  for (const u of units){
    if (!u.pos || u.isDead) continue;
    const x = u.pos.x*tileSize, y = u.pos.y*tileSize;
    ctx.fillStyle = u.faction==="Player" ? "#7dd3fc" : "#fca5a5";
    ctx.beginPath(); ctx.arc(x+tileSize/2, y+tileSize/2, tileSize*0.35, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#0b1220";
    ctx.font = "10px sans-serif";
    ctx.fillText(u.name.slice(0,6), x+4, y+12);
  }
}

export function BattleCanvas({ state, onTileClick }:{ state:BattleState; onTileClick?:(x:number,y:number)=>void }){
  const ref = useRef<HTMLCanvasElement|null>(null);
  const tileSize = 36;
  const width = state.grid.width*tileSize;
  const height = state.grid.height*tileSize;

  useEffect(()=>{
    if (!ref.current) return;
    const ctx = ref.current.getContext("2d"); if(!ctx) return;
    ref.current.width = width; ref.current.height = height;
    ctx.clearRect(0,0,width,height);
    drawGrid(ctx, tileSize, state.grid.tiles, state.grid.width, state.grid.height);
    drawUnits(ctx, tileSize, state.units);
  }, [state]);

  return <canvas
    ref={ref}
    width={width} height={height}
    style={{ background:"#0b1220", borderRadius:12, boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}
    onClick={(e)=>{
      if (!ref.current || !onTileClick) return;
      const rect = ref.current.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const x = Math.floor(px / tileSize), y = Math.floor(py / tileSize);
      onTileClick(x,y);
    }}
  />;
}
