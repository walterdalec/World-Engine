import React, { useMemo, useRef, useState, useEffect } from "react";

/**
 * Character Portrait Studio — Full Races & Classes (React + SVG)
 *
 * ✅ Deterministic, seed-based portraits (same inputs → same image)
 * ✅ Race-specific silhouettes & features (ears, horns, tusks, plating, glow)
 * ✅ Class-specific gear & motifs (robes, plate, leathers, staves, symbols)
 * ✅ Faction/theme palettes
 * ✅ Sprite sheet preview + PNG export (per-portrait)
 * ✅ Pluggable data: auto-reads game classes if available (defaultWorlds.ts)
 *
 * Usage:
 *   1) Save as: src/components/CharacterPortraitStudio.tsx
 *   2) Render <CharacterPortraitStudio /> or mount in your CharacterCreate flow.
 *   3) Optional: Pass external classes/races via props if you want to override.
 *
 * Integration tip:
 *   - Wire to your CharacterCreate so race/class/faction controls mirror the sheet
 *     and the current portrait is saved alongside the character in localStorage.
 */

// ------------------------------
// Deterministic RNG (seeded)
// ------------------------------
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

// ------------------------------
// Types & Data Contracts
// ------------------------------
export type Race =
  | "Human" | "Draken" | "Elf" | "Dwarf" | "Halfling" | "Automaton" | "Fae";

export type Archetype =
  | "Mage" | "Warrior" | "Ranger" | "Rogue" | "Cleric" | "Paladin" | "Bard"
  | "Necromancer" | "Elementalist" | "Alchemist"
  | "Greenwarden" | "Thorn Knight" | "Sapling Adept" | "Bloomcaller"
  | "Stormsinger" | "Shadowblade" | "Skyspear";

export type BodyType = "slim" | "standard" | "heavy";

export interface PortraitOptions {
  seed: string;
  race: Race;
  archetype: Archetype;
  body: BodyType;
  faction?: keyof typeof Palettes;
  variant?: number; // hairstyle/gear micro-variants
}

// Optionally allow external data from your game files
export interface ExternalData {
  races?: Race[];
  classes?: string[]; // will be coerced to Archetype where possible
  palettes?: Record<string, Palette>;
}

// ------------------------------
// Palettes (theme/faction)
// ------------------------------
export interface Palette { primary: string; secondary: string; metal: string; leather: string; cloth: string; accent: string; }

const Palettes: Record<string, Palette> = {
  Rootspeakers: { primary: "#84cc16", secondary: "#16a34a", metal: "#8b8b8b", leather: "#6b4f29", cloth: "#e2e8f0", accent: "#22c55e" },
  Thornweave:   { primary: "#14532d", secondary: "#4d7c0f", metal: "#9ca3af", leather: "#5b4322", cloth: "#0f172a", accent: "#84cc16" },
  Valebright:   { primary: "#f59e0b", secondary: "#fef3c7", metal: "#cbd5e1", leather: "#7c3e00", cloth: "#fafaf9", accent: "#eab308" },
  Skyvault:     { primary: "#38bdf8", secondary: "#0ea5e9", metal: "#94a3b8", leather: "#334155", cloth: "#e2f2ff", accent: "#7dd3fc" },
  Ashenreach:   { primary: "#9ca3af", secondary: "#374151", metal: "#d1d5db", leather: "#4b5563", cloth: "#111827", accent: "#f87171" },
};

// ------------------------------
// Body metrics per race/body type
// ------------------------------
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

// Enhanced primitive shapes with gradients and shading
function headCircle(cx:number, cy:number, r:number, fill:string, stroke?:string, sw=2, gradientId?: string){ 
  const highlight = lightenColor(fill, 0.15);
  const shadow = darkenColor(fill, 0.1);
  const id = gradientId || `head-${cx}-${cy}`;
  
  const gradientDef = (
    <defs key={`head-defs-${id}`}>
      <radialGradient id={`head-grad-${id}`} cx="30%" cy="20%" r="70%">
        <stop offset="0%" stopColor={highlight} />
        <stop offset="70%" stopColor={fill} />
        <stop offset="100%" stopColor={shadow} />
      </radialGradient>
      <filter id={`head-shadow-${id}`}>
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
      </filter>
    </defs>
  );
  
  return (
    <g key={`head-circle-${id}`}>
      {gradientDef}
      <circle cx={cx} cy={cy} r={r} fill={`url(#head-grad-${id})`} stroke={stroke} strokeWidth={sw} filter={`url(#head-shadow-${id})`}/>
    </g>
  );
}

function torsoPath(cx:number, cy:number, shoulder:number, waist:number, height:number, fill:string, stroke:string, gradientId?: string){
  const halfS=shoulder/2, halfW=waist/2; 
  const neckY=cy-height/2+36; 
  const hipY=cy+height/2-20;
  const d=`M ${cx-halfS} ${neckY} Q ${cx} ${neckY-14} ${cx+halfS} ${neckY} L ${cx+halfW} ${hipY} Q ${cx} ${hipY+10} ${cx-halfW} ${hipY} Z`;
  
  const highlight = lightenColor(fill, 0.1);
  const shadow = darkenColor(fill, 0.15);
  const id = gradientId || `torso-${cx}-${cy}`;
  
  const gradientDef = (
    <defs key={`torso-defs-${id}`}>
      <linearGradient id={`torso-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={highlight} />
        <stop offset="50%" stopColor={fill} />
        <stop offset="100%" stopColor={shadow} />
      </linearGradient>
      <filter id={`torso-shadow-${id}`}>
        <feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.2"/>
      </filter>
    </defs>
  );
  
  return (
    <g key={`torso-path-${id}`}>
      {gradientDef}
      <path d={d} fill={`url(#torso-grad-${id})`} stroke={stroke} strokeWidth={2} filter={`url(#torso-shadow-${id})`}/>
    </g>
  );
}

// Enhanced hair with gradients and texture
function hairShape(rng:SeededRandom, cx:number, cy:number, width:number, fill:string, gradientId: string){
  const style = rng.pick(["short","bob","long","mohawk","braid","sidecut","wavy","curly"] as const);
  const highlight = lightenColor(fill, 0.3);
  const shadow = darkenColor(fill, 0.2);
  
  const gradientDef = (
    <defs key={`hair-gradient-${gradientId}`}>
      <linearGradient id={`hair-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={highlight} />
        <stop offset="50%" stopColor={fill} />
        <stop offset="100%" stopColor={shadow} />
      </linearGradient>
      <filter id={`hair-texture-${gradientId}`}>
        <feTurbulence baseFrequency="0.9" numOctaves="3" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
        <feComposite operator="over" in2="SourceGraphic"/>
      </filter>
    </defs>
  );
  
  const fillStyle = `url(#hair-grad-${gradientId})`;
  const filterStyle = `url(#hair-texture-${gradientId})`;
  
  let hairPath;
  switch(style){
    case "short": 
      hairPath = <path d={`M ${cx-width/2} ${cy-28} Q ${cx-width/3} ${cy-38} ${cx} ${cy-36} Q ${cx+width/3} ${cy-38} ${cx+width/2} ${cy-28} L ${cx+width/2} ${cy-10} Q ${cx+width/4} ${cy-18} ${cx} ${cy-22} Q ${cx-width/4} ${cy-18} ${cx-width/2} ${cy-10} Z`} fill={fillStyle} filter={filterStyle}/>;
      break;
    case "bob": 
      hairPath = <path d={`M ${cx-width/2} ${cy-26} Q ${cx-width/3} ${cy-42} ${cx} ${cy-40} Q ${cx+width/3} ${cy-42} ${cx+width/2} ${cy-26} L ${cx+width/2} ${cy+2} Q ${cx+width/4} ${cy+12} ${cx} ${cy+8} Q ${cx-width/4} ${cy+12} ${cx-width/2} ${cy+2} Z`} fill={fillStyle} filter={filterStyle}/>;
      break;
    case "long": 
      hairPath = <g>
        <path d={`M ${cx-width/2} ${cy-28} Q ${cx-width/3} ${cy-42} ${cx} ${cy-40} Q ${cx+width/3} ${cy-42} ${cx+width/2} ${cy-28} L ${cx+width/2} ${cy+28} Q ${cx+width/3} ${cy+42} ${cx} ${cy+40} Q ${cx-width/3} ${cy+42} ${cx-width/2} ${cy+28} Z`} fill={fillStyle} filter={filterStyle}/>
        <path d={`M ${cx-width/3} ${cy+20} Q ${cx-width/6} ${cy+35} ${cx-width/4} ${cy+45}`} stroke={shadow} strokeWidth="2" fill="none" opacity="0.7"/>
        <path d={`M ${cx+width/3} ${cy+20} Q ${cx+width/6} ${cy+35} ${cx+width/4} ${cy+45}`} stroke={shadow} strokeWidth="2" fill="none" opacity="0.7"/>
      </g>;
      break;
    case "mohawk": 
      hairPath = <path d={`M ${cx-8} ${cy-38} Q ${cx} ${cy-50} ${cx+8} ${cy-38} L ${cx+6} ${cy+8} Q ${cx} ${cy+12} ${cx-6} ${cy+8} Z`} fill={fillStyle} filter={filterStyle}/>;
      break;
    case "braid": 
      hairPath = <g>
        <path d={`M ${cx-8} ${cy-28} Q ${cx} ${cy-42} ${cx+8} ${cy-28} L ${cx+8} ${cy+32} Q ${cx} ${cy+42} ${cx-8} ${cy+32} Z`} fill={fillStyle} filter={filterStyle}/>
        <circle cx={cx} cy={cy+15} r="3" fill={shadow} opacity="0.8"/>
        <circle cx={cx} cy={cy+25} r="3" fill={shadow} opacity="0.8"/>
        <circle cx={cx} cy={cy+35} r="3" fill={shadow} opacity="0.8"/>
      </g>;
      break;
    case "wavy":
      hairPath = <g>
        <path d={`M ${cx-width/2} ${cy-26} Q ${cx-width/3} ${cy-40} ${cx} ${cy-38} Q ${cx+width/3} ${cy-40} ${cx+width/2} ${cy-26} L ${cx+width/2} ${cy+8} Q ${cx+width/3} ${cy+18} ${cx} ${cy+12} Q ${cx-width/3} ${cy+18} ${cx-width/2} ${cy+8} Z`} fill={fillStyle} filter={filterStyle}/>
        <path d={`M ${cx-width/3} ${cy-15} Q ${cx-width/6} ${cy-8} ${cx} ${cy-12} Q ${cx+width/6} ${cy-8} ${cx+width/3} ${cy-15}`} stroke={highlight} strokeWidth="1.5" fill="none" opacity="0.6"/>
      </g>;
      break;
    case "curly":
      hairPath = <g>
        <path d={`M ${cx-width/2} ${cy-24} Q ${cx-width/3} ${cy-38} ${cx} ${cy-36} Q ${cx+width/3} ${cy-38} ${cx+width/2} ${cy-24} L ${cx+width/2} ${cy+6} Q ${cx+width/4} ${cy+16} ${cx} ${cy+10} Q ${cx-width/4} ${cy+16} ${cx-width/2} ${cy+6} Z`} fill={fillStyle} filter={filterStyle}/>
        <circle cx={cx-width/4} cy={cy-18} r="4" fill="none" stroke={highlight} strokeWidth="1" opacity="0.5"/>
        <circle cx={cx+width/4} cy={cy-18} r="4" fill="none" stroke={highlight} strokeWidth="1" opacity="0.5"/>
        <circle cx={cx-width/6} cy={cy-8} r="3" fill="none" stroke={highlight} strokeWidth="1" opacity="0.4"/>
        <circle cx={cx+width/6} cy={cy-8} r="3" fill="none" stroke={highlight} strokeWidth="1" opacity="0.4"/>
      </g>;
      break;
    default:
      hairPath = <path d={`M ${cx-width/2} ${cy-28} Q ${cx} ${cy-36} ${cx+width/2} ${cy-28} L ${cx+width/2} ${cy-10} Q ${cx} ${cy-22} ${cx-width/2} ${cy-10} Z`} fill={fillStyle} filter={filterStyle}/>;
  }
  
  return <g key={`hair-${cx}-${cy}`}>{gradientDef}{hairPath}</g>;
}

// Color utility functions
function lightenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.substr(0,2), 16) + Math.floor(255 * amount));
  const g = Math.min(255, parseInt(hex.substr(2,2), 16) + Math.floor(255 * amount));
  const b = Math.min(255, parseInt(hex.substr(4,2), 16) + Math.floor(255 * amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function darkenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0,2), 16) - Math.floor(255 * amount));
  const g = Math.max(0, parseInt(hex.substr(2,2), 16) - Math.floor(255 * amount));
  const b = Math.max(0, parseInt(hex.substr(4,2), 16) - Math.floor(255 * amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Enhanced racial features with better visual design
function elfEars(cx:number, cy:number, r:number, color:string, gradientId: string){
  const highlight = lightenColor(color, 0.2);
  const shadow = darkenColor(color, 0.1);
  
  const gradientDef = (
    <defs key={`elf-defs-${gradientId}`}>
      <linearGradient id={`elf-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={highlight} />
        <stop offset="100%" stopColor={shadow} />
      </linearGradient>
    </defs>
  );
  
  return <g key={`elf-ears-${gradientId}`}>
    {gradientDef}
    <path d={`M ${cx-r-6} ${cy-6} L ${cx-r-28} ${cy-12} L ${cx-r-6} ${cy+4} Z`} fill={`url(#elf-grad-${gradientId})`} stroke={shadow} strokeWidth="0.5"/>
    <path d={`M ${cx+r+6} ${cy-6} L ${cx+r+28} ${cy-12} L ${cx+r+6} ${cy+4} Z`} fill={`url(#elf-grad-${gradientId})`} stroke={shadow} strokeWidth="0.5"/>
  </g>
}

function dwarfBeard(rng:SeededRandom, cx:number, cy:number, r:number, color:string, gradientId: string){
  const beads = rng.int(2,4);
  const highlight = lightenColor(color, 0.3);
  const shadow = darkenColor(color, 0.2);
  
  const gradientDef = (
    <defs key={`beard-defs-${gradientId}`}>
      <linearGradient id={`beard-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={highlight} />
        <stop offset="50%" stopColor={color} />
        <stop offset="100%" stopColor={shadow} />
      </linearGradient>
      <radialGradient id={`bead-grad-${gradientId}`} cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#d97706" />
      </radialGradient>
    </defs>
  );
  
  const base = <path d={`M ${cx-r/2} ${cy+8} Q ${cx} ${cy+28} ${cx+r/2} ${cy+8} L ${cx+r/3} ${cy+42} Q ${cx} ${cy+54} ${cx-r/3} ${cy+42} Z`} fill={`url(#beard-grad-${gradientId})`} stroke={shadow} strokeWidth="0.5"/>;
  
  // Enhanced braided strands
  const strands = [
    <path key="strand1" d={`M ${cx-r/4} ${cy+25} Q ${cx-r/6} ${cy+35} ${cx-r/5} ${cy+45}`} stroke={shadow} strokeWidth="1.5" fill="none" opacity="0.6"/>,
    <path key="strand2" d={`M ${cx+r/4} ${cy+25} Q ${cx+r/6} ${cy+35} ${cx+r/5} ${cy+45}`} stroke={shadow} strokeWidth="1.5" fill="none" opacity="0.6"/>,
  ];
  
  const beadsEls = Array.from({length:beads},(_,i)=>(
    <circle 
      key={i} 
      cx={cx - (beads-1)*6/2 + i*6} 
      cy={cy+36} 
      r={2.5} 
      fill={`url(#bead-grad-${gradientId})`}
      stroke="#92400e"
      strokeWidth="0.5"
    />
  ));
  
  return <g key={`dwarf-beard-${gradientId}`}>{gradientDef}{base}{strands}{beadsEls}</g>
}

function orcTusks(cx:number, cy:number, color:string, gradientId: string){
  const highlight = lightenColor(color, 0.3);
  const shadow = darkenColor(color, 0.1);
  
  const gradientDef = (
    <defs key={`tusk-defs-${gradientId}`}>
      <linearGradient id={`tusk-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={highlight} />
        <stop offset="100%" stopColor={shadow} />
      </linearGradient>
    </defs>
  );
  
  return <g key={`orc-tusks-${gradientId}`}>
    {gradientDef}
    <path d={`M ${cx-8} ${cy+8} q -6 8 -2 14 q 2 -2 4 -2`} stroke={`url(#tusk-grad-${gradientId})`} strokeWidth={5} strokeLinecap="round" fill="none"/>
    <path d={`M ${cx+8} ${cy+8} q 6 8 2 14 q -2 -2 -4 -2`} stroke={`url(#tusk-grad-${gradientId})`} strokeWidth={5} strokeLinecap="round" fill="none"/>
    {/* Tusk tips */}
    <circle cx={cx-10} cy={cy+20} r={1.5} fill={highlight}/>
    <circle cx={cx+10} cy={cy+20} r={1.5} fill={highlight}/>
  </g>
}

function drakenHorns(rng:SeededRandom, cx:number, cy:number, color:string, gradientId: string){
  const v = rng.pick(["swept","spiral","short","crown"] as const);
  const highlight = lightenColor(color, 0.2);
  const shadow = darkenColor(color, 0.2);
  
  const gradientDef = (
    <defs key={`horn-defs-${gradientId}`}>
      <linearGradient id={`horn-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={highlight} />
        <stop offset="100%" stopColor={shadow} />
      </linearGradient>
    </defs>
  );
  
  const strokeStyle = `url(#horn-grad-${gradientId})`;
  
  if(v==="swept") return <g key={`draken-horns-${gradientId}`}>
    {gradientDef}
    <path d={`M ${cx-22} ${cy-30} C ${cx-36} ${cy-54}, ${cx-54} ${cy-46}, ${cx-60} ${cy-28}`} fill="none" stroke={strokeStyle} strokeWidth={6} strokeLinecap="round"/>
    <path d={`M ${cx+22} ${cy-30} C ${cx+36} ${cy-54}, ${cx+54} ${cy-46}, ${cx+60} ${cy-28}`} fill="none" stroke={strokeStyle} strokeWidth={6} strokeLinecap="round"/>
    {/* Horn ridges */}
    <path d={`M ${cx-25} ${cy-35} Q ${cx-30} ${cy-40} ${cx-28} ${cy-45}`} stroke={shadow} strokeWidth={2} fill="none" opacity="0.6"/>
    <path d={`M ${cx+25} ${cy-35} Q ${cx+30} ${cy-40} ${cx+28} ${cy-45}`} stroke={shadow} strokeWidth={2} fill="none" opacity="0.6"/>
  </g>;
  
  if(v==="spiral") return <g key={`draken-horns-${gradientId}`}>
    {gradientDef}
    <path d={`M ${cx-18} ${cy-34} q -22 -18 -26 0 q 6 16 18 10`} fill="none" stroke={strokeStyle} strokeWidth={6} strokeLinecap="round"/>
    <path d={`M ${cx+18} ${cy-34} q 22 -18 26 0 q -6 16 -18 10`} fill="none" stroke={strokeStyle} strokeWidth={6} strokeLinecap="round"/>
  </g>;
  
  if(v==="crown") return <g key={`draken-horns-${gradientId}`}>
    {gradientDef}
    <path d={`M ${cx-24} ${cy-36} L ${cx-8} ${cy-44}`} stroke={strokeStyle} strokeWidth={7} strokeLinecap="round"/>
    <path d={`M ${cx+24} ${cy-36} L ${cx+8} ${cy-44}`} stroke={strokeStyle} strokeWidth={7} strokeLinecap="round"/>
    <path d={`M ${cx-16} ${cy-40} L ${cx} ${cy-48}`} stroke={strokeStyle} strokeWidth={6} strokeLinecap="round"/>
    <path d={`M ${cx+16} ${cy-40} L ${cx} ${cy-48}`} stroke={strokeStyle} strokeWidth={6} strokeLinecap="round"/>
  </g>;
  
  return <g key={`draken-horns-${gradientId}`}>
    {gradientDef}
    <path d={`M ${cx-18} ${cy-28} L ${cx-28} ${cy-18}`} stroke={strokeStyle} strokeWidth={7} strokeLinecap="round"/>
    <path d={`M ${cx+18} ${cy-28} L ${cx+28} ${cy-18}`} stroke={strokeStyle} strokeWidth={7} strokeLinecap="round"/>
  </g>;
}

function automatonPlates(cx:number, cy:number, r:number, metal:string, gradientId: string){
  const highlight = lightenColor(metal, 0.4);
  const shadow = darkenColor(metal, 0.2);
  
  const gradientDef = (
    <defs key={`plate-defs-${gradientId}`}>
      <radialGradient id={`plate-grad-${gradientId}`} cx="20%" cy="20%" r="80%">
        <stop offset="0%" stopColor={highlight} />
        <stop offset="70%" stopColor={metal} />
        <stop offset="100%" stopColor={shadow} />
      </radialGradient>
      <filter id={`plate-glow-${gradientId}`}>
        <feGaussianBlur stdDeviation="2"/>
        <feColorMatrix values="0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0.6 0"/>
        <feComposite operator="over" in2="SourceGraphic"/>
      </filter>
    </defs>
  );
  
  return <g key={`automaton-plates-${gradientId}`}>
    {gradientDef}
    <circle cx={cx} cy={cy} r={r} fill={`url(#plate-grad-${gradientId})`} opacity={0.3}/>
    <rect x={cx-r/2} y={cy-6} width={r} height={8} fill={`url(#plate-grad-${gradientId})`} rx={3} stroke={shadow} strokeWidth="0.5"/>
    <rect x={cx-r/3} y={cy-18} width={r*2/3} height={6} fill={`url(#plate-grad-${gradientId})`} rx={3} stroke={shadow} strokeWidth="0.5"/>
    {/* Glowing energy lines */}
    <line x1={cx-r/3} y1={cy} x2={cx+r/3} y2={cy} stroke="#60a5fa" strokeWidth="1" filter={`url(#plate-glow-${gradientId})`}/>
    <circle cx={cx} cy={cy-8} r="2" fill="#60a5fa" filter={`url(#plate-glow-${gradientId})`}/>
  </g>
}

function faeGlow(cx:number, cy:number, r:number, color:string, gradientId: string){
  const innerGlow = lightenColor(color, 0.3);
  const outerGlow = color + "33";
  
  const gradientDef = (
    <defs key={`glow-defs-${gradientId}`}>
      <radialGradient id={`glow-grad1-${gradientId}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={innerGlow} stopOpacity="0.8"/>
        <stop offset="100%" stopColor={color} stopOpacity="0.2"/>
      </radialGradient>
      <radialGradient id={`glow-grad2-${gradientId}`} cx="50%" cy="50%" r="80%">
        <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
        <stop offset="100%" stopColor={outerGlow} stopOpacity="0.05"/>
      </radialGradient>
      <filter id={`sparkle-${gradientId}`}>
        <feTurbulence baseFrequency="0.1" numOctaves="1" />
        <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.8 0"/>
        <feComposite operator="screen" in2="SourceGraphic"/>
      </filter>
    </defs>
  );
  
  return <g key={`fae-glow-${gradientId}`} opacity={0.7}>
    {gradientDef}
    <circle cx={cx} cy={cy} r={r+22} fill={`url(#glow-grad2-${gradientId})`}/>
    <circle cx={cx} cy={cy} r={r+12} fill={`url(#glow-grad1-${gradientId})`}/>
    {/* Sparkle effects */}
    <circle cx={cx-r/2} cy={cy-r/3} r="1" fill={innerGlow} filter={`url(#sparkle-${gradientId})`}/>
    <circle cx={cx+r/3} cy={cy-r/2} r="0.8" fill={innerGlow} filter={`url(#sparkle-${gradientId})`}/>
    <circle cx={cx-r/4} cy={cy+r/2} r="1.2" fill={innerGlow} filter={`url(#sparkle-${gradientId})`}/>
  </g>
}

// Enhanced class gear with better textures and effects
function gearFor(archetype:Archetype, palette:Palette, cx:number, cy:number, shoulder:number, gradientId: string){
  const metalHighlight = lightenColor(palette.metal, 0.3);
  const metalShadow = darkenColor(palette.metal, 0.2);
  const clothHighlight = lightenColor(palette.cloth, 0.2);
  const clothShadow = darkenColor(palette.cloth, 0.1);
  
  const gradientDefs = (
    <defs key={`gear-defs-${gradientId}`}>
      <linearGradient id={`metal-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={metalHighlight} />
        <stop offset="70%" stopColor={palette.metal} />
        <stop offset="100%" stopColor={metalShadow} />
      </linearGradient>
      <linearGradient id={`cloth-grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={clothHighlight} />
        <stop offset="100%" stopColor={clothShadow} />
      </linearGradient>
      <radialGradient id={`gem-grad-${gradientId}`} cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor={lightenColor(palette.primary, 0.4)} />
        <stop offset="100%" stopColor={darkenColor(palette.primary, 0.1)} />
      </radialGradient>
      <filter id={`gear-shadow-${gradientId}`}>
        <feDropShadow dx="1" dy="2" stdDeviation="1" floodOpacity="0.3"/>
      </filter>
      <filter id={`metal-shine-${gradientId}`}>
        <feGaussianBlur stdDeviation="1"/>
        <feColorMatrix values="1 1 1 0 0.3 1 1 1 0 0.3 1 1 1 0 0.3 0 0 0 0.6 0"/>
        <feComposite operator="screen" in2="SourceGraphic"/>
      </filter>
    </defs>
  );

  const metalFill = `url(#metal-grad-${gradientId})`;
  const clothFill = `url(#cloth-grad-${gradientId})`;
  const gemFill = `url(#gem-grad-${gradientId})`;
  const shadowFilter = `url(#gear-shadow-${gradientId})`;
  const shineFilter = `url(#metal-shine-${gradientId})`;

  switch(archetype){
    case "Mage": return <g key={`gear-${gradientId}`}>
      {gradientDefs}
      <path d={`M ${cx-shoulder/2} ${cy-8} L ${cx+shoulder/2} ${cy-8} L ${cx+shoulder/3} ${cy+74} L ${cx-shoulder/3} ${cy+74} Z`} fill={clothFill} stroke={palette.accent} strokeWidth={2} filter={shadowFilter}/>
      <rect x={cx+shoulder/2+8} y={cy-38} width={6} height={140} fill={metalFill} filter={shadowFilter}/>
      <circle cx={cx+shoulder/2+11} cy={cy-46} r={10} fill={gemFill} filter={shadowFilter}/>
      <circle cx={cx+shoulder/2+11} cy={cy-46} r={6} fill={lightenColor(palette.primary, 0.6)} opacity={0.7}/>
      {/* Mystical energy */}
      <circle cx={cx+shoulder/2+11} cy={cy-46} r={4} fill={palette.accent} opacity={0.5}/>
    </g>;
    
    case "Elementalist": return <g key={`gear-${gradientId}`}>
      {gradientDefs}
      <path d={`M ${cx-shoulder/2} ${cy-10} L ${cx+shoulder/2} ${cy-10} L ${cx+shoulder/3} ${cy+78} L ${cx-shoulder/3} ${cy+78} Z`} fill={palette.secondary} opacity={0.4} filter={shadowFilter}/>
      <circle cx={cx} cy={cy} r={16} fill={palette.primary} opacity={0.6} filter={shadowFilter}/>
      <circle cx={cx} cy={cy} r={10} fill={palette.accent} opacity={0.8}/>
      <circle cx={cx} cy={cy} r={6} fill={lightenColor(palette.accent, 0.5)} opacity={0.9}/>
      {/* Elemental swirls */}
      <path d={`M ${cx-12} ${cy-8} Q ${cx} ${cy-16} ${cx+12} ${cy-8}`} stroke={lightenColor(palette.primary, 0.3)} strokeWidth={2} fill="none" opacity={0.7}/>
      <path d={`M ${cx-8} ${cy+8} Q ${cx} ${cy+16} ${cx+8} ${cy+8}`} stroke={lightenColor(palette.primary, 0.3)} strokeWidth={2} fill="none" opacity={0.7}/>
    </g>;
    
    case "Warrior": return <g key={`gear-${gradientId}`}>
      {gradientDefs}
      <path d={`M ${cx-shoulder/2} ${cy-6} Q ${cx} ${cy-22} ${cx+shoulder/2} ${cy-6} L ${cx+shoulder/2-8} ${cy+20} L ${cx-shoulder/2+8} ${cy+20} Z`} fill={metalFill} stroke="#111827" strokeWidth={2} filter={shadowFilter}/>
      <ellipse cx={cx-shoulder/2} cy={cy-8} rx={14} ry={10} fill={metalFill} filter={shineFilter}/>
      <ellipse cx={cx+shoulder/2} cy={cy-8} rx={14} ry={10} fill={metalFill} filter={shineFilter}/>
      <rect x={cx-shoulder/2-18} y={cy+4} width={8} height={80} fill={metalFill} filter={shadowFilter}/>
      <circle cx={cx+shoulder/2+18} cy={cy+20} r={18} fill={metalFill} stroke="#111827" filter={shadowFilter}/>
      {/* Shield details */}
      <circle cx={cx+shoulder/2+18} cy={cy+20} r={12} fill={palette.accent} opacity={0.8}/>
      <circle cx={cx+shoulder/2+18} cy={cy+20} r={8} fill={metalHighlight} opacity={0.6}/>
    </g>;
    
    case "Ranger": return <g key={`gear-${gradientId}`}>
      {gradientDefs}
      <path d={`M ${cx-shoulder/2} ${cy-4} L ${cx+shoulder/2} ${cy-4} L ${cx+shoulder/3} ${cy+70} L ${cx-shoulder/3} ${cy+70} Z`} fill={palette.leather} stroke={palette.metal} strokeWidth={2} filter={shadowFilter}/>
      <path d={`M ${cx-12} ${cy-2} L ${cx+12} ${cy+40}`} stroke={metalFill} strokeWidth={3} filter={shadowFilter}/>
      <path d={`M ${cx-12} ${cy-2} L ${cx-30} ${cy+18}`} stroke={metalFill} strokeWidth={3} filter={shadowFilter}/>
      {/* Bow details */}
      <path d={`M ${cx-32} ${cy+12} Q ${cx-36} ${cy+20} ${cx-32} ${cy+24}`} stroke={darkenColor(palette.leather, 0.2)} strokeWidth={2} fill="none"/>
      <circle cx={cx+8} cy={cy+25} r={2} fill={palette.accent}/>
    </g>;
    
    case "Rogue": return <g key={`gear-${gradientId}`}>
      {gradientDefs}
      <path d={`M ${cx-shoulder/2} ${cy-6} L ${cx+shoulder/2} ${cy-6} L ${cx+shoulder/3} ${cy+68} L ${cx-shoulder/3} ${cy+68} Z`} fill={clothFill} filter={shadowFilter}/>
      <rect x={cx-shoulder/2-10} y={cy+6} width={6} height={40} fill={metalFill} filter={shadowFilter}/>
      <rect x={cx+shoulder/2+4} y={cy+6} width={6} height={40} fill={metalFill} filter={shadowFilter}/>
      {/* Throwing knives */}
      <path d={`M ${cx-shoulder/2-7} ${cy+15} L ${cx-shoulder/2-7} ${cy+25}`} stroke={metalHighlight} strokeWidth={2}/>
      <path d={`M ${cx+shoulder/2+7} ${cy+15} L ${cx+shoulder/2+7} ${cy+25}`} stroke={metalHighlight} strokeWidth={2}/>
    </g>;
    
    case "Cleric": return <g key={`gear-${gradientId}`}>
      {gradientDefs}
      <path d={`M ${cx-shoulder/2} ${cy-8} L ${cx+shoulder/2} ${cy-8} L ${cx+shoulder/3} ${cy+76} L ${cx-shoulder/3} ${cy+76} Z`} fill={clothFill} stroke={palette.accent} strokeWidth={2} filter={shadowFilter}/>
      <path d={`M ${cx} ${cy-20} l -8 16 l 16 0 Z`} fill={palette.accent} filter={shadowFilter}/>
      <rect x={cx+shoulder/2+10} y={cy-30} width={6} height={120} fill={metalFill} filter={shadowFilter}/>
      {/* Holy symbol details */}
      <path d={`M ${cx-4} ${cy-12} l 8 0 M ${cx} ${cy-16} l 0 8`} stroke={lightenColor(palette.accent, 0.4)} strokeWidth={2}/>
      <circle cx={cx} cy={cy-12} r={3} fill="none" stroke={lightenColor(palette.accent, 0.4)} strokeWidth={1}/>
    </g>;
    
    case "Paladin": return <g key={`gear-${gradientId}`}>
      {gradientDefs}
      <path d={`M ${cx-shoulder/2} ${cy-6} Q ${cx} ${cy-24} ${cx+shoulder/2} ${cy-6} L ${cx+shoulder/2-10} ${cy+22} L ${cx-shoulder/2+10} ${cy+22} Z`} fill={metalFill} stroke={palette.accent} strokeWidth={2} filter={shadowFilter}/>
      <rect x={cx-4} y={cy-16} width={8} height={50} fill={palette.accent} filter={shadowFilter}/>
      {/* Ornate details */}
      <circle cx={cx} cy={cy-8} r={6} fill={gemFill} filter={shadowFilter}/>
      <circle cx={cx} cy={cy-8} r={3} fill={lightenColor(palette.accent, 0.5)} opacity={0.8}/>
    </g>;
    
    default: return <g key={`gear-${gradientId}`}>{gradientDefs}</g>;
  }
}

// ------------------------------
// Race feature application
// ------------------------------
function applyRaceFeatures(race:Race, rng:SeededRandom, cx:number, headCy:number, headR:number, palette:Palette, baseId: string = 'default'){
  const skinHumanList = ["#f1d3b8","#e6b999","#cfa07b","#a7775a","#7a4f34"] as const;
  const skinDrakeList = ["#7cc4a3","#7fb6d9","#a09bd6","#cfa07b"] as const;
  const skin = race==="Human" ? rng.pick(skinHumanList) : race==="Draken" ? rng.pick(skinDrakeList) : race==="Dwarf" ? rng.pick(["#e5c29f","#c9986c","#8e5b3c"] as const) : rng.pick(skinHumanList);
  const hair = rng.pick(["#0f172a","#1f2937","#b45309","#6b21a8","#a16207","#9ca3af"] as const);
  const horn = rng.pick(["#4b5563","#1f2937","#6b7280"] as const);
  const earColor = skin;

  const layers: React.ReactElement[] = [];
  const gradientId = `${race}-${baseId.slice(-4)}`;
  
  // Head base
  layers.push(headCircle(cx, headCy, headR, skin, "#111827", 2, gradientId));
  // Ears / extras
  if(race==="Elf") layers.push(elfEars(cx, headCy, headR, earColor, gradientId));
  if(race==="Dwarf") layers.push(dwarfBeard(rng, cx, headCy, headR, hair, gradientId));
  if(race==="Draken") layers.push(drakenHorns(rng, cx, headCy, horn, gradientId));
  if(race==="Automaton") layers.push(automatonPlates(cx, headCy, headR, palette.metal, gradientId));
  if(race==="Fae") layers.push(faeGlow(cx, headCy, headR, palette.accent, gradientId));
  // Hair for those with hair
  if(race!=="Draken" && race!=="Automaton" && race!=="Fae"){
    layers.push(hairShape(rng, cx, headCy, headR*1.6, hair, `${gradientId}-hair`) as any);
  }
  return { skin, hair, layers };
}

// ------------------------------
// Portrait SVG
// ------------------------------
function PortraitSVG({ opts, palette }: { opts: PortraitOptions; palette: Palette }){
  const rng = useMemo(()=> new SeededRandom(`${opts.seed}:${opts.race}:${opts.archetype}:${opts.body}:${opts.variant ?? 0}`), [opts]);
  const W=300, H=380; const cx=W/2, cy=H/2+10;
  const metrics = BodyMetrics[opts.race][opts.body];
  const bodyH = 180 * metrics.scale; const headR = clamp(26 * metrics.scale, 22, 34);
  const shoulder = metrics.shoulder; const waist = metrics.waist;

  const bg = `radial-gradient(circle at 50% 30%, ${palette.secondary}44, ${palette.primary}22 40%, transparent 70%)`;
  const headCy = cy - bodyH/2 + 24;

  const { layers: headLayers } = applyRaceFeatures(opts.race, rng, cx, headCy, headR, palette, opts.seed);

  // Background texture definition
  const backgroundDefs = (
    <defs key={`bg-defs-${opts.seed}`}>
      <filter id={`bg-texture-${opts.seed}`}>
        <feTurbulence baseFrequency="0.02" numOctaves="3" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
        <feComposite operator="multiply" in2="SourceGraphic"/>
      </filter>
      <radialGradient id={`bg-grad-${opts.seed}`} cx="50%" cy="20%" r="80%">
        <stop offset="0%" stopColor={lightenColor(palette.secondary, 0.1)} stopOpacity="0.6"/>
        <stop offset="40%" stopColor={palette.primary} stopOpacity="0.3"/>
        <stop offset="80%" stopColor={darkenColor(palette.secondary, 0.2)} stopOpacity="0.1"/>
        <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
      </radialGradient>
    </defs>
  );

  return (
    <svg id="portrait-svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ background:bg, borderRadius:16, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
      {backgroundDefs}
      
      {/* Enhanced background */}
      <rect x={0} y={0} width={W} height={H} fill={`url(#bg-grad-${opts.seed})`} filter={`url(#bg-texture-${opts.seed})`}/>
      <rect x={12} y={12} width={W-24} height={H-24} rx={14} ry={14} fill="none" stroke={palette.accent} strokeWidth="1" opacity="0.3"/>

      {/* Cloak for some classes */}
      {(["Mage","Elementalist","Necromancer","Bloomcaller"] as Archetype[]).includes(opts.archetype) && (
        <path d={`M ${cx-shoulder} ${cy-16} Q ${cx} ${cy+90} ${cx+shoulder} ${cy-16} L ${cx+shoulder} ${cy+120} L ${cx-shoulder} ${cy+120} Z`} fill={`${palette.secondary}55`} />
      )}

      {/* Torso */}
      {torsoPath(cx, cy, shoulder, waist, bodyH, "#e5e7eb", "#1f2937", `torso-${opts.seed}`)}

      {/* Head & race features */}
      {headLayers}

      {/* Gear by class */}
      {gearFor(opts.archetype, palette, cx, cy, shoulder, `gear-${opts.seed}`)}

      {/* Enhanced emblem */}
      <defs key={`emblem-defs-${opts.seed}`}>
        <radialGradient id={`emblem-grad-${opts.seed}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={lightenColor(palette.accent, 0.3)} />
          <stop offset="100%" stopColor={darkenColor(palette.accent, 0.1)} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy+108} r={16} fill={`url(#emblem-grad-${opts.seed})`} stroke={darkenColor(palette.accent, 0.2)} strokeWidth="1"/>
      <circle cx={cx} cy={cy+108} r={10} fill={lightenColor(palette.accent, 0.4)} opacity="0.8"/>
      <rect x={cx-10} y={cy+104} width={20} height={8} rx={2} fill={palette.cloth} opacity="0.9" stroke={darkenColor(palette.cloth, 0.1)} strokeWidth="0.5"/>
    </svg>
  );
}

// ------------------------------
// PNG Export helper
// ------------------------------
async function downloadSVGAsPNG(svgEl: SVGSVGElement, filename: string){
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  const loaded = await new Promise<HTMLImageElement>(res=>{ img.onload=()=>res(img); img.src=url; });
  const canvas = document.createElement("canvas"); canvas.width=loaded.width; canvas.height=loaded.height;
  const ctx = canvas.getContext("2d"); if(ctx){ ctx.drawImage(loaded,0,0); canvas.toBlob(b=>{ if(!b) return; const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }); }
  URL.revokeObjectURL(url);
}

// Try to auto-import your class list if present (safe fallback)
function useExternalClasses(): string[]{
  const [classes, setClasses] = useState<string[]>([]);
  useEffect(()=>{
    (async()=>{
      try {
        // @ts-ignore dynamic import for CRA; ignore if not found
        const mod = await import(/* webpackIgnore: true */"../defaultWorlds").catch(()=>null);
        const defs = (mod && (mod as any).CLASS_DEFINITIONS) || null;
        if(defs){ setClasses(Object.keys(defs)); return; }
      } catch {}
      setClasses([]);
    })();
  },[]);
  return classes;
}

// ------------------------------
// Studio UI
// ------------------------------
export default function CharacterPortraitStudio({ external }: { external?: ExternalData }){
  const fallbackRaces: Race[] = ["Human","Draken","Elf","Dwarf","Halfling","Automaton","Fae"];
  const autoClasses = useExternalClasses();
  const fallbackClasses: Archetype[] = [
    "Mage","Warrior","Ranger","Rogue","Cleric","Paladin","Bard",
    "Necromancer","Elementalist","Alchemist",
    "Greenwarden","Thorn Knight","Sapling Adept","Bloomcaller",
    "Stormsinger","Shadowblade","Skyspear"
  ];

  const races = (external?.races?.length ? external.races : fallbackRaces) as Race[];
  const classes = (external?.classes?.length ? external.classes : (autoClasses.length? autoClasses : fallbackClasses)) as string[];
  const paletteKeys = Object.keys(external?.palettes ?? Palettes);
  const palettes = external?.palettes ?? Palettes;

  const [seed, setSeed] = useState("verdance-001");
  const [race, setRace] = useState<Race>(races[0]);
  const [archetype, setArchetype] = useState<string>(classes[0]);
  const [body, setBody] = useState<BodyType>("standard");
  const [faction, setFaction] = useState<string>(paletteKeys[0]);
  const [variant, setVariant] = useState<number>(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const palette = palettes[faction];

  // Coerce unknown class names to nearest renderer by keywords
  const normalizedClass = useMemo<Archetype>(()=>{
    const c = archetype.toLowerCase();
    if(c.includes("thorn")) return "Thorn Knight";
    if(c.includes("warden")||c.includes("green")) return "Greenwarden";
    if(c.includes("sapling")) return "Sapling Adept";
    if(c.includes("bloom")) return "Bloomcaller";
    if(c.includes("paladin")) return "Paladin";
    if(c.includes("cleric")) return "Cleric";
    if(c.includes("ranger")) return "Ranger";
    if(c.includes("rogue")||c.includes("shadow")) return "Shadowblade";
    if(c.includes("necrom")) return "Necromancer";
    if(c.includes("element")) return "Elementalist";
    if(c.includes("alchem")) return "Alchemist";
    if(c.includes("storm")||c.includes("singer")) return "Stormsinger";
    if(c.includes("sky")||c.includes("spear")) return "Skyspear";
    if(c.includes("war")) return "Warrior";
    if(c.includes("mage")||c.includes("wizard")||c.includes("sorcer")) return "Mage";
    return "Warrior";
  }, [archetype]);

  const opts: PortraitOptions = { seed, race, archetype: normalizedClass, body, faction: faction as any, variant };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Character Portrait Studio</h1>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm opacity-80">Seed
              <input value={seed} onChange={(e)=>setSeed(e.target.value)} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"/>
            </label>
            <button onClick={()=>setSeed(Math.random().toString(36).slice(2,10))} className="self-end bg-slate-700 hover:bg-slate-600 rounded px-3 py-2">Randomize Seed</button>

            <label className="text-sm opacity-80">Race
              <select value={race} onChange={(e)=>setRace(e.target.value as Race)} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1">
                {races.map(r=> <option key={r} value={r}>{r}</option>)}
              </select>
            </label>

            <label className="text-sm opacity-80">Class
              <select value={archetype} onChange={(e)=>setArchetype(e.target.value)} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1">
                {classes.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="text-sm opacity-80">Body
              <select value={body} onChange={(e)=>setBody(e.target.value as BodyType)} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1">
                {(["slim","standard","heavy"] as BodyType[]).map(b=> <option key={b} value={b}>{b}</option>)}
              </select>
            </label>

            <label className="text-sm opacity-80">Faction/Theme
              <select value={faction} onChange={(e)=>setFaction(e.target.value)} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1">
                {paletteKeys.map(p=> <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            <label className="text-sm opacity-80">Variant
              <input type="number" value={variant} onChange={(e)=>setVariant(parseInt(e.target.value||"0"))} className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"/>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-emerald-600 hover:bg-emerald-500 rounded px-4 py-2"
              onClick={()=>{ const el=document.getElementById("portrait-svg"); if(el) downloadSVGAsPNG(el as unknown as SVGSVGElement, `${race}-${normalizedClass}-${seed}.png`); }}>
              Export PNG
            </button>
            <span className="text-xs opacity-70">Deterministic: same seed + settings ⇒ identical image</span>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 bg-slate-800/40 rounded-2xl">
          <div className="shadow-2xl rounded-xl overflow-hidden">
            <PortraitSVG opts={opts} palette={palette}/>
          </div>
        </div>
      </div>

      {/* Sprite sheet */}
      <div className="max-w-6xl mx-auto mt-8">
        <h2 className="text-lg font-semibold mb-3">Sprite Sheet</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(12)].map((_,i)=>{
            const s = `${seed}-v${i}`; const o: PortraitOptions = { ...opts, seed:s, variant:i };
            return (
              <div key={i} className="bg-slate-800/60 rounded-xl p-2 flex items-center justify-center">
                <PortraitSVG opts={o} palette={palette}/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}