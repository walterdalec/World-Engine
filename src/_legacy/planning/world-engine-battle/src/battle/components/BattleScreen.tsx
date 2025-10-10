import React, { useMemo, useState } from "react";
import type { BattleState } from "../types";
import { BattleCanvas } from "./renderer2d";
import { execAbility, nextPhase, startBattle, checkEnd } from "../engine";
import { ABILITIES } from "../abilities";

function clone<T>(o:T):T{ return JSON.parse(JSON.stringify(o)); }

export function BattleScreen({ initial, onExit }:{ initial: BattleState; onExit:(outcome: "Victory"|"Defeat"|"Retreat", state:BattleState)=>void }){
  const [state, setState] = useState<BattleState>(clone(initial));
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);

  useMemo(()=>{ startBattle(state); setState({ ...state }); }, []);

  const friendlies = state.units.filter(u=>u.faction==="Player" && !u.isDead && !u.isCommander);
  const abilities = selected ? state.units.find(u=>u.id===selected)?.skills ?? [] : [];

  function clickTile(x:number,y:number){
    if (!selected || !selectedAbility) return;
    const user = state.units.find(u=>u.id===selected)!;
    const ok = execAbility(state, user, selectedAbility, { x, y });
    if (ok){
      setState({ ...state });
      checkEnd(state);
      if (state.phase==="Victory" || state.phase==="Defeat"){
        onExit(state.phase as any, state);
      }
    }
  }

  return (
    <div className="p-4 grid grid-cols-4 gap-4 text-slate-100">
      <div className="col-span-3">
        <BattleCanvas state={state} onTileClick={clickTile}/>
      </div>
      <div className="col-span-1 space-y-3">
        <div className="bg-slate-800 rounded p-2">
          <div className="text-xs opacity-70">Turn {state.turn} • Phase {state.phase}</div>
          <div className="text-xs">Log:</div>
          <div className="h-32 overflow-auto text-xs">{state.log.slice(-6).map((l,i)=>(<div key={i}>{l}</div>))}</div>
        </div>
        <div className="bg-slate-800 rounded p-2 space-y-2">
          <div className="font-semibold">Units</div>
          {friendlies.map(u=>(
            <div key={u.id} className={`p-2 rounded cursor-pointer ${selected===u.id?'bg-emerald-700':'bg-slate-700'}`} onClick={()=>{setSelected(u.id); setSelectedAbility(null);}}>
              <div className="text-sm">{u.name} (Lv {u.level})</div>
              <div className="text-xs opacity-70">{u.archetype} • HP {u.stats.hp}/{u.stats.maxHp}</div>
            </div>
          ))}
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="font-semibold mb-1">Abilities</div>
          {(abilities.length===0) && <div className="text-xs opacity-70">Select a unit</div>}
          {abilities.map(id=>{
            const a = ABILITIES[id];
            return (
              <button key={id}
                className={`w-full text-left text-xs mb-1 px-2 py-1 rounded ${selectedAbility===id?'bg-emerald-600':'bg-slate-700'}`}
                onClick={()=>setSelectedAbility(id)}>
                {a?.name || id}
              </button>
            );
          })}
        </div>
        <button className="w-full bg-slate-600 hover:bg-slate-500 rounded px-3 py-2" onClick={()=>{ nextPhase(state); setState({ ...state }); }}>End Phase</button>
        <button className="w-full bg-slate-700 hover:bg-slate-600 rounded px-3 py-2" onClick={()=> onExit("Retreat", state)}>Retreat</button>
      </div>
    </div>
  );
}
