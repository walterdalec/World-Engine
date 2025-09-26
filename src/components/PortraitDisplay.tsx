import React, { useMemo } from 'react';

// Re-import the core portrait generation functions
class SeededRandom {
  private seed: number;
  constructor(seed: string) { this.seed = SeededRandom.hash(seed); }
  static hash(str: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  next() { let x = this.seed + 0x9e3779b9; x^=x<<13; x^=x>>>17; x^=x<<5; this.seed = x>>>0; return (this.seed>>>0)/0x100000000; }
  int(min: number, max: number) { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(arr: readonly T[]) { return arr[this.int(0, arr.length - 1)]; }
}

interface Palette { primary: string; secondary: string; metal: string; leather: string; cloth: string; accent: string; }

const Palettes: Record<string, Palette> = {
  Rootspeakers: { primary: "#84cc16", secondary: "#16a34a", metal: "#8b8b8b", leather: "#6b4f29", cloth: "#e2e8f0", accent: "#22c55e" },
  Thornweave:   { primary: "#14532d", secondary: "#4d7c0f", metal: "#9ca3af", leather: "#5b4322", cloth: "#0f172a", accent: "#84cc16" },
  Valebright:   { primary: "#f59e0b", secondary: "#fef3c7", metal: "#cbd5e1", leather: "#7c3e00", cloth: "#fafaf9", accent: "#eab308" },
  Skyvault:     { primary: "#38bdf8", secondary: "#0ea5e9", metal: "#94a3b8", leather: "#334155", cloth: "#e2f2ff", accent: "#7dd3fc" },
  Ashenreach:   { primary: "#9ca3af", secondary: "#374151", metal: "#d1d5db", leather: "#4b5563", cloth: "#111827", accent: "#f87171" },
};

type Race = "Human" | "Draken" | "Elf" | "Dwarf" | "Halfling" | "Automaton" | "Fae";
type Archetype = "Mage" | "Warrior" | "Ranger" | "Rogue" | "Cleric" | "Paladin" | "Bard" | "Necromancer" | "Elementalist" | "Alchemist" | "Greenwarden" | "Thorn Knight" | "Sapling Adept" | "Bloomcaller" | "Stormsinger" | "Shadowblade" | "Skyspear";
type BodyType = "slim" | "standard" | "heavy";

const BodyMetrics: Record<Race, Record<BodyType, { scale: number; shoulder: number; waist: number }>> = {
  Human:     { slim:{scale:0.95, shoulder:36, waist:24}, standard:{scale:1.0, shoulder:40, waist:28}, heavy:{scale:1.05, shoulder:46, waist:36} },
  Draken:    { slim:{scale:1.00, shoulder:42, waist:26}, standard:{scale:1.06, shoulder:48, waist:32}, heavy:{scale:1.12, shoulder:56, waist:40} },
  Elf:       { slim:{scale:0.96, shoulder:38, waist:22}, standard:{scale:1.0, shoulder:40, waist:26},  heavy:{scale:1.04, shoulder:44, waist:30} },
  Dwarf:     { slim:{scale:0.9, shoulder:46, waist:34},  standard:{scale:0.95, shoulder:50, waist:38}, heavy:{scale:1.0, shoulder:56, waist:44} },
  Halfling:  { slim:{scale:0.8, shoulder:30, waist:22},  standard:{scale:0.85, shoulder:32, waist:24}, heavy:{scale:0.9, shoulder:36, waist:30} },
  Automaton: { slim:{scale:1.0, shoulder:44, waist:26},  standard:{scale:1.04, shoulder:48, waist:30}, heavy:{scale:1.08, shoulder:54, waist:36} },
  Fae:       { slim:{scale:0.9, shoulder:32, waist:20},  standard:{scale:0.94, shoulder:34, waist:22}, heavy:{scale:0.98, shoulder:36, waist:24} },
};

const clamp = (v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

// Simplified portrait components (core shapes)
function headCircle(cx:number, cy:number, r:number, fill:string, stroke?:string, sw=2){ return <circle key={`head-${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw}/> }
function torsoPath(cx:number, cy:number, shoulder:number, waist:number, height:number, fill:string, stroke:string){
  const halfS=shoulder/2, halfW=waist/2; const neckY=cy-height/2+36; const hipY=cy+height/2-20;
  const d=`M ${cx-halfS} ${neckY} Q ${cx} ${neckY-14} ${cx+halfS} ${neckY} L ${cx+halfW} ${hipY} Q ${cx} ${hipY+10} ${cx-halfW} ${hipY} Z`;
  return <path key={`torso-${cx}-${cy}`} d={d} fill={fill} stroke={stroke} strokeWidth={2}/>
}

function elfEars(cx:number, cy:number, r:number, color:string){
  return <g key={`elf-ears-${cx}-${cy}`}>
    <path d={`M ${cx-r-6} ${cy-6} L ${cx-r-28} ${cy-12} L ${cx-r-6} ${cy+4} Z`} fill={color}/>
    <path d={`M ${cx+r+6} ${cy-6} L ${cx+r+28} ${cy-12} L ${cx+r+6} ${cy+4} Z`} fill={color}/>
  </g>
}

function dwarfBeard(rng:SeededRandom, cx:number, cy:number, r:number, color:string){
  const beads = rng.int(2,4);
  const base = <path d={`M ${cx-r/2} ${cy+8} Q ${cx} ${cy+28} ${cx+r/2} ${cy+8} L ${cx+r/3} ${cy+42} Q ${cx} ${cy+54} ${cx-r/3} ${cy+42} Z`} fill={color}/>;
  const beadsEls = Array.from({length:beads},(_,i)=>(<circle key={i} cx={cx - (beads-1)*6/2 + i*6} cy={cy+36} r={2} fill="#fbd38d"/>));
  return <g key={`dwarf-beard-${cx}-${cy}`}>{base}{beadsEls}</g>
}

function orcTusks(cx:number, cy:number, color:string){
  return <g key={`orc-tusks-${cx}-${cy}`}>
    <path d={`M ${cx-8} ${cy+8} q -6 8 0 12`} stroke={color} strokeWidth={4} fill="none"/>
    <path d={`M ${cx+8} ${cy+8} q 6 8 0 12`} stroke={color} strokeWidth={4} fill="none"/>
  </g>
}

function drakenHorns(rng:SeededRandom, cx:number, cy:number, color:string){
  const v = rng.pick(["swept","spiral","short","crown"] as const);
  const key = `draken-horns-${cx}-${cy}`;
  if(v==="swept") return <g key={key}>
    <path d={`M ${cx-22} ${cy-30} C ${cx-36} ${cy-54}, ${cx-54} ${cy-46}, ${cx-60} ${cy-28}`} fill="none" stroke={color} strokeWidth={5}/>
    <path d={`M ${cx+22} ${cy-30} C ${cx+36} ${cy-54}, ${cx+54} ${cy-46}, ${cx+60} ${cy-28}`} fill="none" stroke={color} strokeWidth={5}/>
  </g>;
  if(v==="spiral") return <g key={key}>
    <path d={`M ${cx-18} ${cy-34} q -22 -18 -26 0 q 6 16 18 10`} fill="none" stroke={color} strokeWidth={5}/>
    <path d={`M ${cx+18} ${cy-34} q 22 -18 26 0 q -6 16 -18 10`} fill="none" stroke={color} strokeWidth={5}/>
  </g>;
  if(v==="crown") return <g key={key}>
    <path d={`M ${cx-24} ${cy-36} L ${cx-8} ${cy-44}`} stroke={color} strokeWidth={6}/>
    <path d={`M ${cx+24} ${cy-36} L ${cx+8} ${cy-44}`} stroke={color} strokeWidth={6}/>
  </g>;
  return <g key={key}>
    <path d={`M ${cx-18} ${cy-28} L ${cx-28} ${cy-18}`} stroke={color} strokeWidth={6}/>
    <path d={`M ${cx+18} ${cy-28} L ${cx+28} ${cy-18}`} stroke={color} strokeWidth={6}/>
  </g>;
}

interface PortraitDisplayProps {
  portraitData: string;
  size?: number;
  style?: React.CSSProperties;
}

export default function PortraitDisplay({ portraitData, size = 120, style = {} }: PortraitDisplayProps) {
  const portraitElements = useMemo(() => {
    // Parse the portrait data: "portrait:seed:race:archetype:body:faction:variant"
    if (!portraitData || !portraitData.startsWith('portrait:')) {
      return null;
    }

    const parts = portraitData.split(':');
    if (parts.length !== 7) return null;

    const [, seed, race, archetype, body, faction, variant] = parts;
    const rng = new SeededRandom(`${seed}:${race}:${archetype}:${body}:${variant}`);
    
    const palette = Palettes[faction] || Palettes.Rootspeakers;
    
    const W = 300, H = 380;
    const cx = W/2, cy = H/2 + 10;
    
    const metrics = BodyMetrics[race as Race]?.[body as BodyType] || BodyMetrics.Human.standard;
    const bodyH = 180 * metrics.scale;
    const headR = clamp(26 * metrics.scale, 22, 34);
    const shoulder = metrics.shoulder;
    const waist = metrics.waist;
    
    const headCy = cy - bodyH/2 + 24;
    
    // Simplified race features
    const skinHumanList = ["#f1d3b8","#e6b999","#cfa07b","#a7775a","#7a4f34"] as const;
    const skinDrakeList = ["#7cc4a3","#7fb6d9","#a09bd6","#cfa07b"] as const;
    const skin = race==="Human" ? rng.pick(skinHumanList) : race==="Draken" ? rng.pick(skinDrakeList) : race==="Dwarf" ? rng.pick(["#e5c29f","#c9986c","#8e5b3c"] as const) : rng.pick(skinHumanList);
    const hair = rng.pick(["#0f172a","#1f2937","#b45309","#6b21a8","#a16207","#9ca3af"] as const);
    const horn = rng.pick(["#4b5563","#1f2937","#6b7280"] as const);

    const elements: React.ReactElement[] = [];
    
    // Background
    const bg = `radial-gradient(circle at 50% 30%, ${palette.secondary}22, transparent 60%)`;
    
    // Torso
    elements.push(torsoPath(cx, cy, shoulder, waist, bodyH, "#e5e7eb", "#1f2937"));
    
    // Head
    elements.push(headCircle(cx, headCy, headR, skin, "#111827", 2));
    
    // Race features
    if(race==="Elf") elements.push(elfEars(cx, headCy, headR, skin));
    if(race==="Dwarf") elements.push(dwarfBeard(rng, cx, headCy, headR, hair));
    if(race==="Orc") elements.push(orcTusks(cx, headCy, "#e5e7eb"));
    if(race==="Draken") elements.push(drakenHorns(rng, cx, headCy, horn));
    
    // Simple gear indicator
    const gearColor = palette.primary;
    if (archetype.includes('Mage') || archetype.includes('Element')) {
      elements.push(<circle key="gear" cx={cx+shoulder/2+11} cy={cy-46} r={8} fill={gearColor} opacity={0.7}/>);
    } else if (archetype.includes('Warrior') || archetype.includes('Knight')) {
      elements.push(<rect key="gear" x={cx-4} y={cy-16} width={8} height={30} fill={gearColor} opacity={0.7}/>);
    }
    
    return {
      elements,
      bg,
      viewBox: `0 0 ${W} ${H}`,
      race,
      archetype
    };
  }, [portraitData]);

  if (!portraitElements) {
    return (
      <div style={{
        width: size,
        height: size,
        background: '#374151',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '24px',
        ...style
      }}>
        👤
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, ...style }}>
      <svg
        width="100%"
        height="100%"
        viewBox={portraitElements.viewBox}
        style={{
          background: portraitElements.bg,
          borderRadius: '8px',
          border: '2px solid #374151'
        }}
      >
        {portraitElements.elements}
      </svg>
    </div>
  );
}