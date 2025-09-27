import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MainMenu } from "./components/MainMenu";
import { WorldSetupScreen } from "./components/WorldSetupScreen";
import CharacterLibrary from "./components/CharacterLibrary";
import NameGenerator from "./components/NameGenerator";
import SpellGenerator from "./components/SpellGenerator";
import SpellAssignment from "./components/SpellAssignment";
import HealingSystem from "./components/HealingSystem";
import WorldMapEngine from "./components/WorldMapEngine";
import CharacterPortraitStudio from "./components/CharacterPortraitStudio";
import { Engine } from "./engine.d";
import { DEFAULT_WORLDS } from "./defaultWorlds";

// Character type definition
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
  const [step, setStep] = React.useState<"menu" | "world" | "party" | "namegen" | "spellgen" | "spellassign" | "healing" | "worldmap" | "portrait">("menu");
  const [party, setParty] = React.useState<Character[]>([]);
  const [currentCampaign, setCurrentCampaign] = React.useState<any>(null);
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0); // Force re-render hook

  // Initialize app and setup periodic saves
  React.useEffect(() => {
    // Check for crash recovery on startup
    const emergencySave = sessionStorage.getItem('world-engine-emergency-save');
    if (emergencySave) {
      try {
        const campaign = JSON.parse(emergencySave);
        console.log('Found emergency save, attempting recovery...');

        const campaigns = JSON.parse(localStorage.getItem('world-engine-campaigns') || '[]');
        const existing = campaigns.findIndex((c: any) => c.id === campaign.id);

        if (existing >= 0) {
          campaigns[existing] = campaign;
        } else {
          campaigns.push(campaign);
        }

        localStorage.setItem('world-engine-campaigns', JSON.stringify(campaigns));
        sessionStorage.removeItem('world-engine-emergency-save');

        alert('🚨 Emergency save recovered from previous session!');
      } catch (error) {
        console.error('Failed to recover emergency save:', error);
      }
    }

    // Setup periodic backup (every 5 minutes)
    const backupInterval = setInterval(() => {
      try {
        const campaigns = JSON.parse(localStorage.getItem('world-engine-campaigns') || '[]');
        if (campaigns.length > 0) {
          sessionStorage.setItem('world-engine-campaigns-session', JSON.stringify(campaigns));
          console.log('Periodic session backup completed');
        }
      } catch (error) {
        console.error('Periodic backup failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on unmount
    return () => clearInterval(backupInterval);
  }, []);

  // Enhanced Campaign management functions with multiple backup layers
  const saveCampaign = (campaign: any) => {
    try {
      const timestamp = new Date().toISOString();
      const campaigns = JSON.parse(localStorage.getItem('world-engine-campaigns') || '[]');
      const existing = campaigns.findIndex((c: any) => c.id === campaign.id);

      const updatedCampaign = {
        ...campaign,
        lastPlayed: timestamp,
        saveVersion: '2.0',
        ...(existing < 0 && { createdAt: timestamp })
      };

      if (existing >= 0) {
        campaigns[existing] = updatedCampaign;
      } else {
        campaigns.push(updatedCampaign);
      }

      // Multi-layer backup system
      // Layer 1: Primary localStorage
      localStorage.setItem('world-engine-campaigns', JSON.stringify(campaigns));

      // Layer 2: Backup localStorage with timestamp
      localStorage.setItem('world-engine-campaigns-backup', JSON.stringify({
        campaigns,
        backupTime: timestamp,
        version: '2.0'
      }));

      // Layer 3: SessionStorage for crash recovery
      sessionStorage.setItem('world-engine-campaigns-session', JSON.stringify(campaigns));

      // Layer 4: Individual campaign backup
      localStorage.setItem(`world-engine-campaign-${campaign.id}`, JSON.stringify(updatedCampaign));

      // Layer 5: Automatic download backup every 10 saves
      const saveCount = parseInt(localStorage.getItem('world-engine-save-count') || '0') + 1;
      localStorage.setItem('world-engine-save-count', saveCount.toString());

      if (saveCount % 10 === 0) {
        downloadCampaignBackup(campaigns, `auto-backup-${saveCount}`);
      }

      console.log(`Campaign saved with ${campaigns.length} total campaigns (save #${saveCount})`);
    } catch (error) {
      console.error('Error saving campaign:', error);
      // Attempt emergency save to sessionStorage
      try {
        sessionStorage.setItem('world-engine-emergency-save', JSON.stringify(campaign));
        alert('Primary save failed, but emergency backup created. Please export your campaign manually.');
      } catch (emergencyError) {
        console.error('Emergency save also failed:', emergencyError);
        alert('Critical: All save attempts failed. Please export your campaign data immediately.');
      }
    }
  };

  // Campaign recovery functions
  const recoverCampaigns = () => {
    try {
      // Try primary storage first
      let campaigns = JSON.parse(localStorage.getItem('world-engine-campaigns') || '[]');

      if (campaigns.length === 0) {
        // Try backup storage
        const backup = JSON.parse(localStorage.getItem('world-engine-campaigns-backup') || '{}');
        if (backup.campaigns && backup.campaigns.length > 0) {
          campaigns = backup.campaigns;
          localStorage.setItem('world-engine-campaigns', JSON.stringify(campaigns));
          console.log('Recovered campaigns from backup storage');
        }
      }

      if (campaigns.length === 0) {
        // Try session storage
        const sessionCampaigns = JSON.parse(sessionStorage.getItem('world-engine-campaigns-session') || '[]');
        if (sessionCampaigns.length > 0) {
          campaigns = sessionCampaigns;
          localStorage.setItem('world-engine-campaigns', JSON.stringify(campaigns));
          console.log('Recovered campaigns from session storage');
        }
      }

      return campaigns;
    } catch (error) {
      console.error('Error recovering campaigns:', error);
      return [];
    }
  };

  // Export/Import functions
  const downloadCampaignBackup = (campaigns: any[], filename = 'world-engine-campaigns-backup') => {
    try {
      const backup = {
        campaigns,
        exportDate: new Date().toISOString(),
        version: '2.0',
        worldEngineVersion: 'v1.0.0'
      };

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      console.log('Campaign backup downloaded');
    } catch (error) {
      console.error('Error downloading backup:', error);
    }
  };

  const importCampaignBackup = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string);
          if (backup.campaigns && Array.isArray(backup.campaigns)) {
            localStorage.setItem('world-engine-campaigns', JSON.stringify(backup.campaigns));
            localStorage.setItem('world-engine-campaigns-backup', JSON.stringify(backup));
            console.log(`Imported ${backup.campaigns.length} campaigns`);
            resolve(backup.campaigns);
          } else {
            reject(new Error('Invalid backup file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
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
    setStep("worldmap"); // Go directly to the game world for existing campaigns
  };

  const handleNameGenerator = () => {
    // Standalone name generator tool
    setStep("namegen");
  };

  const handleSpellGenerator = () => {
    // Standalone spell generator tool
    setStep("spellgen");
  };

  const handleSpellAssignment = () => {
    // Spell assignment tool
    setStep("spellassign");
  };

  const handleHealingSystem = () => {
    // Standalone healing system
    setStep("healing");
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
      try { window.localStorage.setItem('world-preset', name); } catch { }
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
      try { window.localStorage.setItem('world-seed', seed); } catch { }
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
          onNameGenerator={handleNameGenerator}
          onSpellGenerator={handleSpellGenerator}
          onSpellAssignment={handleSpellAssignment}
          onHealingSystem={handleHealingSystem}
          onPortraitStudio={() => setStep("portrait")}
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
          onCreateNew={() => setStep("worldmap")}
        />
      )}
      {step === "namegen" && (
        <NameGenerator onBack={() => setStep("menu")} />
      )}
      {step === "spellgen" && (
        <SpellGenerator onBack={() => setStep("menu")} />
      )}
      {step === "spellassign" && (
        <SpellAssignment onBack={() => setStep("menu")} />
      )}
      {step === "healing" && (
        <HealingSystem onBack={() => setStep("menu")} />
      )}
      {step === "worldmap" && (
        <WorldMapEngine
          seedStr={eng?.state?.meta?.seed}
          onBack={() => setStep("menu")}
        />
      )}
      {step === "portrait" && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setStep("menu")}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 1000,
              background: '#374151',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 15px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ← Back to Menu
          </button>
          <CharacterPortraitStudio />
        </div>
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
