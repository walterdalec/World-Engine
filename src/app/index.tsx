import React from "react";
import { rng } from "../core/services/random";
import { createRoot } from "react-dom/client";
import "../index.css";
import { MainMenu, WorldSetupScreen, VersionDisplay } from "../features/ui";
import { CharacterLibrary, CharacterCreate, NameGenerator, ClassicCharacterCreator } from "../features/characters";
import { SpellGenerator, SpellAssignment } from "../features/spells";
import { HealingSystem, BattleMockup, BattlePage, MinimalBattlePage, BrigandineHexBattle } from "../features/battle";
import { WorldMapEngine, EnhancedWorldMap, SimpleWorldMap, ProceduralDevTools } from "../features/world";
import { IntegratedCampaign } from "../features/strategy";
import EncountersTestPage from "../features/world/encounters/EncountersTestPage";
import { SimplePortraitTest } from "../features/portraits";
import { CombatUIDemo } from "../pages/CombatUIDemo";
import { storage } from "../core/services/storage";
import type { Engine } from "../engine.d";
import { DEFAULT_WORLDS } from "../core/config";

// Character type definition
type Character = {
  name: string;
  gender: string;
  species: string;
  archetype: string;
  background: string;
  stats: Record<string, number>;
  traits: string[];
  portraitUrl?: string;
  mode: "POINT_BUY" | "ROLL";
};

// Simple seed generator (base36 timestamp + random)
function _randomSeed(): string {
  const t = Date.now().toString(36);
  const r = rng.next().toString(36).slice(2, 8);
  return `${t}-${r}`;
}

function App() {
  const [step, setStep] = React.useState<"menu" | "world" | "party" | "namegen" | "spellgen" | "spellassign" | "healing" | "worldmap" | "enhancedmap" | "simplemap" | "charactercreate" | "classiccharacter" | "portraittest" | "battlesystem" | "battle" | "minimalBattle" | "brigandineHex" | "autoupdater" | "combat-ui-demo" | "procedural" | "encounters" | "integrated-campaign">("menu");
  const [party, setParty] = React.useState<Character[]>([]);
  const [currentCampaign, setCurrentCampaign] = React.useState<any>(null);
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0); // Force re-render hook

  // Initialize app and setup periodic saves
  React.useEffect(() => {
    // Check for crash recovery on startup
    const emergencySave = storage.session.getItem('world-engine-emergency-save');
    if (emergencySave) {
      try {
        const campaign = JSON.parse(emergencySave);
        console.log('Found emergency save, attempting recovery...');

        const campaigns = JSON.parse(storage.local.getItem('world-engine-campaigns') || '[]');
        const existing = campaigns.findIndex((c: any) => c.id === campaign.id);

        if (existing >= 0) {
          campaigns[existing] = campaign;
        } else {
          campaigns.push(campaign);
        }

        storage.local.setItem('world-engine-campaigns', JSON.stringify(campaigns));
        storage.session.removeItem('world-engine-emergency-save');

        alert('Emergency save recovered from previous session!');
      } catch (error) {
        console.error('Failed to recover emergency save:', error);
      }
    }

    // Setup periodic backup (every 5 minutes)
    const backupInterval = setInterval(() => {
      try {
        const campaigns = JSON.parse(storage.local.getItem('world-engine-campaigns') || '[]');
        if (campaigns.length > 0) {
          storage.session.setItem('world-engine-campaigns-session', JSON.stringify(campaigns));
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
      const campaigns = JSON.parse(storage.local.getItem('world-engine-campaigns') || '[]');
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
      storage.local.setItem('world-engine-campaigns', JSON.stringify(campaigns));

      // Layer 2: Backup localStorage with timestamp
      storage.local.setItem('world-engine-campaigns-backup', JSON.stringify({
        campaigns,
        backupTime: timestamp,
        version: '2.0'
      }));

      // Layer 3: SessionStorage for crash recovery
      storage.session.setItem('world-engine-campaigns-session', JSON.stringify(campaigns));

      // Layer 4: Individual campaign backup
      storage.local.setItem(`world-engine-campaign-${campaign.id}`, JSON.stringify(updatedCampaign));

      // Layer 5: Automatic download backup every 10 saves
      const saveCount = parseInt(storage.local.getItem('world-engine-save-count') || '0') + 1;
      storage.local.setItem('world-engine-save-count', saveCount.toString());

      if (saveCount % 10 === 0) {
        downloadCampaignBackup(campaigns, `auto-backup-${saveCount}`);
      }

      console.log(`Campaign saved with ${campaigns.length} total campaigns (save #${saveCount})`);
    } catch (error) {
      console.error('Error saving campaign:', error);
      // Attempt emergency save to sessionStorage
      try {
        storage.session.setItem('world-engine-emergency-save', JSON.stringify(campaign));
        alert('Primary save failed, but emergency backup created. Please export your campaign manually.');
      } catch (emergencyError) {
        console.error('Emergency save also failed:', emergencyError);
        alert('Critical: All save attempts failed. Please export your campaign data immediately.');
      }
    }
  };

  // Campaign recovery functions
  const _recoverCampaigns = () => {
    try {
      // Try primary storage first
      let campaigns = JSON.parse(storage.local.getItem('world-engine-campaigns') || '[]');

      if (campaigns.length === 0) {
        // Try backup storage
        const backup = JSON.parse(storage.local.getItem('world-engine-campaigns-backup') || '{}');
        if (backup.campaigns && backup.campaigns.length > 0) {
          campaigns = backup.campaigns;
          storage.local.setItem('world-engine-campaigns', JSON.stringify(campaigns));
          console.log('Recovered campaigns from backup storage');
        }
      }

      if (campaigns.length === 0) {
        // Try session storage
        const sessionCampaigns = JSON.parse(storage.session.getItem('world-engine-campaigns-session') || '[]');
        if (sessionCampaigns.length > 0) {
          campaigns = sessionCampaigns;
          storage.local.setItem('world-engine-campaigns', JSON.stringify(campaigns));
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

  const _importCampaignBackup = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string);
          if (backup.campaigns && Array.isArray(backup.campaigns)) {
            storage.local.setItem('world-engine-campaigns', JSON.stringify(backup.campaigns));
            storage.local.setItem('world-engine-campaigns-backup', JSON.stringify(backup));
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

  const handleCharacterCreate = () => {
    // Standalone character creator
    setStep("charactercreate");
  };

  const handleClassicCharacterCreate = () => {
    // Classic M&M-style character creator
    setStep("classiccharacter");
  };

  const handlePortraitTest = () => {
    // Portrait test page
    setStep("portraittest");
  };

  const handleAutoUpdater = () => {
    // Auto-updater test page
    setStep("autoupdater");
  };

  const handleBattleSystem = () => {
    // Battle system demo
    setStep("battlesystem");
  };

  const handleBrigandineHex = () => {
    // Brigandine-style hex battle
    setStep("brigandineHex");
  };

  const handleBattlePage = () => {
    // Clean battle page
    setStep("battle");
  };

  const handleMinimalBattle = () => {
    // Simple battle using GameEngine
    setStep("minimalBattle");
  };

  const handleEnhancedMap = () => {
    // Enhanced strategic world map
    setStep("enhancedmap");
  };

  const handleSimpleMap = () => {
    // Simple exploration world map
    setStep("simplemap");
  };

  const handleCombatUIDemo = () => {
    // Combat UI demonstration with mock data
    setStep("combat-ui-demo");
  };

  const handleProcedural = () => {
    // Procedural generation dev tools
    setStep("procedural");
  };

  const handleEncounters = () => {
    // Encounters system test page
    setStep("encounters");
  };

  const handleIntegratedCampaign = () => {
    // Integrated campaign mode - all systems working together
    setStep("integrated-campaign");
  };

  // fake engine stub for now
  // Engine stub - will be replaced with real engine
  const eng: Engine = {
    state: {
      meta: {
        seed: (typeof window !== 'undefined') ? storage.local.getItem('world-seed') || undefined : undefined,
        presets: {
          list: [],
          loaded: (typeof window !== 'undefined') ? (storage.local.getItem('world-preset') || undefined) as any : undefined,
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
      try { storage.local.setItem('world-preset', name); } catch { }
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
      try { storage.local.setItem('world-seed', seed); } catch { }
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
      <VersionDisplay />
      {step === "menu" && (
        <MainMenu
          onNewCampaign={handleNewCampaign}
          onLoadCampaign={handleLoadCampaign}
          onNameGenerator={handleNameGenerator}
          onSpellGenerator={handleSpellGenerator}
          onSpellAssignment={handleSpellAssignment}
          onHealingSystem={handleHealingSystem}
          onCharacterCreate={handleCharacterCreate}
          onClassicCharacterCreate={handleClassicCharacterCreate}
          onPortraitTest={handlePortraitTest}
          onAutoUpdater={handleAutoUpdater}
          onBattleSystem={handleBattleSystem}
          onBrigandineHex={handleBrigandineHex}
          onBattlePage={handleBattlePage}
          onMinimalBattle={handleMinimalBattle}
          onEnhancedMap={handleEnhancedMap}
          onSimpleMap={handleSimpleMap}
          onCombatUIDemo={handleCombatUIDemo}
          onProcedural={handleProcedural}
          onEncounters={handleEncounters}
          onIntegratedCampaign={handleIntegratedCampaign}
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
      {step === "charactercreate" && (
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
            Back to Menu
          </button>
          <CharacterCreate
            onBack={() => setStep("menu")}
            onDone={() => setStep("menu")}
          />
        </div>
      )}
      {step === "classiccharacter" && (
        <ClassicCharacterCreator
          onCharacterCreated={(character) => {
            console.log('Character created:', character);
            // TODO: Add to party or save to library
            setStep("menu");
          }}
          onCancel={() => setStep("menu")}
        />
      )}
      {step === "portraittest" && (
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
            Back to Menu
          </button>
          <SimplePortraitTest />
        </div>
      )}
      {step === "autoupdater" && (
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
            Back to Menu
          </button>
        </div>
      )}
      {step === "battlesystem" && (
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
            Back to Menu
          </button>
          <BattleMockup />
        </div>
      )}
      {step === "battle" && (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
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
            Back to Menu
          </button>
          <BattlePage />
        </div>
      )}
      {step === "minimalBattle" && (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
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
            Back to Menu
          </button>
          <MinimalBattlePage />
        </div>
      )}
      {step === "brigandineHex" && (
        <BrigandineHexBattle onBack={() => setStep("menu")} />
      )}
      {step === "enhancedmap" && (
        <div style={{ position: 'relative' }}>
          <EnhancedWorldMap
            seedStr={eng?.state?.meta?.seed}
            onBack={() => setStep("menu")}
          />
        </div>
      )}
      {step === "simplemap" && (
        <div style={{ position: 'relative' }}>
          <SimpleWorldMap
            seedStr={eng?.state?.meta?.seed}
            onBack={() => setStep("menu")}
          />
        </div>
      )}
      {step === "combat-ui-demo" && (
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
            Back to Menu
          </button>
          <CombatUIDemo />
        </div>
      )}
      {step === "procedural" && (
        <div style={{ position: 'relative' }}>
          <ProceduralDevTools />
          <button
            onClick={() => setStep("menu")}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '10px 20px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Back to Menu
          </button>
        </div>
      )}
      {step === "encounters" && (
        <div style={{ position: 'relative' }}>
          <EncountersTestPage />
          <button
            onClick={() => setStep("menu")}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '10px 20px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              zIndex: 1000
            }}
          >
            ← Back to Menu
          </button>
        </div>
      )}
      {step === "integrated-campaign" && (
        <IntegratedCampaign
          onNavigateToCharacterCreate={handleCharacterCreate}
          onNavigateToMenu={() => setStep("menu")}
        />
      )}
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
