import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MainMenu } from "./components/MainMenu";
import { WorldSetupScreen } from "./components/WorldSetupScreen";
import CharacterLibrary from "./components/CharacterLibrary";
import CharacterCreate from "./components/CharacterCreate";
import NameGenerator from "./components/NameGenerator";
import SpellGenerator from "./components/SpellGenerator";
import WorldMap from "./components/SimpleWorldMap";
import { Engine } from "./engine.d";
import { DEFAULT_WORLDS } from "./defaultWorlds";

// Use the same Character type as CharacterCreate
type Character = {
  name: string;
  pronouns: string;
  species: string;
  archetype: string;
  background: string;
  stats: Record<string, number>;
  traits: string[];
  portraitUrl?: string;
  mode: "POINT_BUY" | "ROLL";
};

// Simple seed generator (base36 timestamp + random)
function randomSeed(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${t}-${r}`;
}

function App() {
  const [step, setStep] = React.useState<"menu" | "world" | "party" | "character" | "namegen" | "spellgen" | "worldmap">("menu");
  const [party, setParty] = React.useState<Character[]>([]);
  const [currentCampaign, setCurrentCampaign] = React.useState<any>(null);
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0); // Force re-render hook

  // Campaign management functions
  const saveCampaign = (campaign: any) => {
    try {
      const campaigns = JSON.parse(localStorage.getItem('world-engine-campaigns') || '[]');
      const existing = campaigns.findIndex((c: any) => c.id === campaign.id);
      
      if (existing >= 0) {
        campaigns[existing] = { ...campaign, lastPlayed: new Date().toISOString() };
      } else {
        campaigns.push({
          ...campaign,
          createdAt: new Date().toISOString(),
          lastPlayed: new Date().toISOString()
        });
      }
      
      localStorage.setItem('world-engine-campaigns', JSON.stringify(campaigns));
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleNewCampaign = () => {
    // Create a new campaign ID
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      name: `Campaign ${Date.now().toString().slice(-4)}`,
      worldPreset: '',
      seed: '',
      characters: []
    };
    setCurrentCampaign(newCampaign);
    setStep("world");
  };

  const handleLoadCampaign = (campaign: any) => {
    setCurrentCampaign(campaign);
    // Restore campaign settings to engine
    if (campaign.worldPreset) {
      eng.applyPresetByName?.(campaign.worldPreset);
    }
    if (campaign.seed) {
      eng.setSeed?.(campaign.seed);
    }
    setStep("character"); // Go directly to character creation for existing campaigns
  };

  const handleCharacterCreator = () => {
    // Standalone character creator (not tied to a campaign)
    setCurrentCampaign(null);
    setStep("character");
  };

  const handleNameGenerator = () => {
    // Standalone name generator tool
    setStep("namegen");
  };

  const handleSpellGenerator = () => {
    // Standalone spell generator tool
    setStep("spellgen");
  };

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
      {step === "menu" && (
        <MainMenu
          onNewCampaign={handleNewCampaign}
          onLoadCampaign={handleLoadCampaign}
          onCharacterCreator={handleCharacterCreator}
          onNameGenerator={handleNameGenerator}
          onSpellGenerator={handleSpellGenerator}
        />
      )}
      {step === "world" && (
        <WorldSetupScreen 
          eng={eng} 
          onNext={() => {
            // Save campaign settings when proceeding from world setup
            if (currentCampaign) {
              const updatedCampaign = {
                ...currentCampaign,
                worldPreset: eng?.state?.meta?.presets?.loaded || '',
                seed: eng?.state?.meta?.seed || ''
              };
              setCurrentCampaign(updatedCampaign);
              saveCampaign(updatedCampaign);
            }
            setStep("party");
          }} 
        />
      )}
      {step === "party" && (
        <CharacterLibrary
          eng={eng}
          party={party}
          setParty={setParty}
          onStart={() => setStep("worldmap")}
          onCreateNew={() => setStep("character")}
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
                onClick={() => setStep("menu")}
                style={{ 
                  padding: "8px 16px", 
                  background: "#374151", 
                  color: "#f9fafb", 
                  border: "none", 
                  borderRadius: "6px", 
                  cursor: "pointer" 
                }}
              >
                Back to Menu
              </button>
              {currentCampaign && (
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
                  World Setup
                </button>
              )}
              <button 
                onClick={() => setStep("worldmap")}
                style={{ 
                  padding: "8px 16px", 
                  background: "#059669", 
                  color: "#f9fafb", 
                  border: "none", 
                  borderRadius: "6px", 
                  cursor: "pointer" 
                }}
              >
                Enter World
              </button>
            </div>
          </nav>
          <CharacterCreate />
        </div>
      )}
      {step === "namegen" && (
        <NameGenerator onBack={() => setStep("menu")} />
      )}
      {step === "spellgen" && (
        <SpellGenerator onBack={() => setStep("menu")} />
      )}
      {step === "worldmap" && (
        <WorldMap 
          seedStr={eng?.state?.meta?.seed} 
          onBack={() => setStep("menu")} 
        />
      )}
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Service worker disabled - can cause issues with SPA routing on GitHub Pages
// if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/World-Engine/service-worker.js')
//       .then((registration) => {
//         console.log('SW registered:', registration);
//         
//         // Handle updates
//         registration.addEventListener('updatefound', () => {
//           const newWorker = registration.installing;
//           if (newWorker) {
//             newWorker.addEventListener('statechange', () => {
//               if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
//                 // New content available, refresh the page
//                 window.location.reload();
//               }
//             });
//           }
//         });
//       })
//       .catch((err) => {
//         console.warn('SW registration failed:', err);
//       });
//   });
// }
