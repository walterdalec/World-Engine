import React from "react";
import { createRoot } from "react-dom/client";
import { WorldSetupScreen } from "./components/WorldSetupScreen";
import { PartyCreationScreen } from "./components/PartyCreationScreen";
import CharacterCreate from "./components/CharacterCreate";
import { Engine } from "./engine.d";
import { DEFAULT_WORLDS } from "./defaultWorlds";

// Simple seed generator (base36 timestamp + random)
function randomSeed(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${t}-${r}`;
}

function App() {
  const [step, setStep] = React.useState<"world" | "party" | "character">("world");
  const [party, setParty] = React.useState<any[]>([]);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0); // Force re-render hook

  // fake engine stub for now
  // Engine stub - will be replaced with real engine
  const eng: Engine = {
    state: {
      meta: {
        seed: (typeof window !== 'undefined') ? window.localStorage.getItem('world-seed') || undefined : undefined,
        presets: {
          list: [],
          loaded: (typeof window !== 'undefined') ? (window.localStorage.getItem('world-preset') || undefined) as any : undefined,
        },
      },
    },
    applyPresetByName: (name: string) => {
      console.log("applyPresetByName", name);
      // Use a proper state update instead of direct mutation
      eng.state = {
        ...eng.state,
        meta: {
          ...eng.state.meta,
          presets: {
            ...eng.state.meta.presets,
            loaded: name
          }
        }
      };
      try { window.localStorage.setItem('world-preset', name); } catch {}
      forceUpdate(); // Force React to re-render when preset changes
    },
    setSeed: (seed: string) => {
      console.log("setSeed", seed);
      eng.state = {
        ...eng.state,
        meta: {
          ...eng.state.meta,
          seed,
        },
      };
      try { window.localStorage.setItem('world-seed', seed); } catch {}
      forceUpdate();
    },
    loadWorldPresets: async function () {
      console.log("loadWorldPresets called");
      // Use a relative path so it works in static hosting and subpaths without relying on process.env at runtime
      const url = `worlds.json`;
      try {
        console.log("Fetching", url, "...");
        const res = await fetch(url, { cache: "no-store" });
        console.log("Fetch response:", res.status, res.statusText);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("Raw JSON data:", data);
        const list = (data && Array.isArray(data.list)) ? data.list : [];
        eng.state = {
          ...eng.state,
          meta: {
            ...eng.state.meta,
            presets: {
              list,
              loaded: eng.state.meta.presets.loaded
            }
          }
        };
        console.log("World presets loaded:", list.map((w: any) => w.name));
        forceUpdate();
      } catch (error) {
        console.error("Failed to load world presets from", url, ":", error);
        // Fallback to built-in defaults so UI still works offline
        eng.state = {
          ...eng.state,
          meta: {
            ...eng.state.meta,
            presets: {
              list: DEFAULT_WORLDS,
              loaded: eng.state.meta.presets.loaded
            }
          }
        };
        console.warn("Using DEFAULT_WORLDS fallback (", DEFAULT_WORLDS.length, ")");
        forceUpdate();
      }
    },
  };

  return (
    <>
      {step === "world" && (
        <WorldSetupScreen eng={eng} onNext={() => setStep("character")} />
      )}
      {step === "party" && (
        <PartyCreationScreen
          eng={eng}
          party={party}
          setParty={setParty}
          onStart={() => setStep("character")}
        />
      )}
      {step === "character" && (
        <div style={{ background: "#030712", minHeight: "100vh" }}>
          <nav style={{ 
            padding: "16px 24px", 
            borderBottom: "1px solid #374151", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            background: "#111827"
          }}>
            <h1 style={{ margin: 0, color: "#f9fafb" }}>World Engine - Character Creator</h1>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setStep("world")}
                style={{ 
                  padding: "8px 16px", 
                  background: "#374151", 
                  color: "#f9fafb", 
                  border: "none", 
                  borderRadius: "6px", 
                  cursor: "pointer" 
                }}
              >
                Back to World Setup
              </button>
              <button 
                onClick={() => console.log("Start Adventure!", party)}
                style={{ 
                  padding: "8px 16px", 
                  background: "#059669", 
                  color: "#f9fafb", 
                  border: "none", 
                  borderRadius: "6px", 
                  cursor: "pointer" 
                }}
              >
                Start Adventure
              </button>
            </div>
          </nav>
          <CharacterCreate />
        </div>
      )}
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Register service worker in production builds
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}
