import React, { useState } from "react";
import type { BattleState, Unit } from "../types";
import { BattleCanvas } from "./renderer2d";

function clone<T>(o:T):T{ return JSON.parse(JSON.stringify(o)); }

export function BattleSetupScreen({ initial, onReady }:{ initial: BattleState; onReady:(state:BattleState)=>void }){
  const [state, setState] = useState<BattleState>(clone(initial));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const friendlies = state.units.filter(u=>u.faction==="Player" && !u.isDead && !u.isCommander);
  const deployTiles = new Set(state.friendlyDeployment.tiles.map(t=>`${t.x},${t.y}`));

  function tryPlace(u: Unit, x:number, y:number){
    if (!deployTiles.has(`${x},${y}`)) return;
    // prevent overlap
    if (state.units.some(o=>o.pos && o.pos.x===x && o.pos.y===y)) return;
    u.pos = { x, y };
    setState({ ...state });
  }

  return (
    <div className="p-4 grid grid-cols-4 gap-4 text-slate-100">
      <div className="col-span-3">
        <BattleCanvas state={state} onTileClick={(x,y)=>{
          if (!selectedId) return;
          const u = state.units.find(u=>u.id===selectedId)!;
          tryPlace(u, x, y);
        }}/>
      </div>
      <div className="col-span-1 space-y-3">
        <h3 className="font-semibold">Deployment</h3>
        {friendlies.map(u=>(
          <div key={u.id} className={`p-2 rounded cursor-pointer ${selectedId===u.id?'bg-emerald-700':'bg-slate-700'}`} onClick={()=>setSelectedId(u.id)}>
            <div className="text-sm">{u.name} (Lv {u.level})</div>
            <div className="text-xs opacity-70">{u.archetype}</div>
            <div className="text-xs opacity-70">HP {u.stats.hp}/{u.stats.maxHp} • SPD {u.stats.spd}</div>
          </div>
        ))}
        <button className="w-full bg-emerald-600 hover:bg-emerald-500 rounded px-3 py-2"
          onClick={()=> onReady(state)}>Begin Battle</button>
      </div>
    </div>
  );
}
