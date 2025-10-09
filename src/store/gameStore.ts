import { create } from 'zustand';
import { rng } from "../core/services/random";
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, storageAreaToWebStorage } from '../core/services/storage';
import { Character, validateCharacter, createEmptyCharacter } from '../validation/character-simple';

/**
 * Global game state management using Zustand
 * Perfect for character data, map state, and UI preferences
 */

interface GameState {
    // Character management
    currentCharacter: Partial<Character> | null;
    characters: Character[];

    // UI state
    isCreatingCharacter: boolean;
    currentStep: 'species' | 'archetype' | 'stats' | 'details' | 'complete';
    showDebugMode: boolean;

    // Map state (for future procedural generation)
    currentWorld: string | null;
    mapSettings: {
        seed: string;
        size: number;
        difficulty: number;
    };

    // Actions
    setCurrentCharacter: (_character: Partial<Character> | null) => void;
    updateCurrentCharacter: (_updates: Partial<Character>) => void;
    saveCharacter: () => void;
    loadCharacter: (_id: string) => void;
    deleteCharacter: (_id: string) => void;

    // UI actions
    setCreatingCharacter: (_creating: boolean) => void;
    setCurrentStep: (_step: GameState['currentStep']) => void;
    toggleDebugMode: () => void;

    // Map actions (for future use)
    setCurrentWorld: (_world: string) => void;
    updateMapSettings: (_settings: Partial<GameState['mapSettings']>) => void;
    generateMapSeed: () => void;
}

/**
 * Main game store with persistence
 */
export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // Initial state
            currentCharacter: null,
            characters: [],
            isCreatingCharacter: false,
            currentStep: 'species',
            showDebugMode: false,
            currentWorld: null,
            mapSettings: {
                seed: '',
                size: 100,
                difficulty: 5
            },

            // Character actions
            setCurrentCharacter: (_character) => {
                console.log('🎮 Setting current character:', character?.name || 'null');
                set({ currentCharacter: character });
            },

            updateCurrentCharacter: (_updates) => {
                set((state) => {
                    if (!state.currentCharacter) {
                        console.log('🎮 Creating new character with updates:', _updates);
                        return { currentCharacter: { ...createEmptyCharacter(), ...updates } };
                    }

                    const updated = { ...state.currentCharacter, ...updates, lastModified: new Date() };
                    console.log('🎮 Updated character:', updated.name || 'unnamed');
                    return { currentCharacter: updated };
                });
            },

            saveCharacter: () => {
                const { currentCharacter, characters } = get();
                if (!currentCharacter) {
                    console.warn('🎮 No current character to save');
                    return;
                }

                try {
                    // Validate before saving
                    const validCharacter = validateCharacter(currentCharacter);

                    const existingIndex = characters.findIndex(c => c.name === validCharacter.name);
                    let newCharacters: Character[];

                    if (existingIndex >= 0) {
                        // Update existing
                        newCharacters = [...characters];
                        newCharacters[existingIndex] = validCharacter;
                        console.log('🎮 Updated existing character:', validCharacter.name);
                    } else {
                        // Add new
                        newCharacters = [...characters, validCharacter];
                        console.log('🎮 Saved new character:', validCharacter.name);
                    }

                    set({
                        characters: newCharacters,
                        currentCharacter: validCharacter,
                        isCreatingCharacter: false
                    });
                } catch (error) {
                    console.error('🎮 Failed to save character:', error);
                    throw error;
                }
            },

            loadCharacter: (_id) => {
                const { characters } = get();
                const _character = characters.find(c => c.name === id);
                if (_character) {
                    console.log('🎮 Loaded character:', character.name);
                    set({ currentCharacter: character });
                } else {
                    console.warn('🎮 Character not found:', _id);
                }
            },

            deleteCharacter: (_id) => {
                const { characters, currentCharacter } = get();
                const newCharacters = characters.filter(c => c.name !== id);
                const newCurrent = currentCharacter?.name === id ? null : currentCharacter;

                console.log('🎮 Deleted character:', _id);
                set({
                    characters: newCharacters,
                    currentCharacter: newCurrent
                });
            },

            // UI actions
            setCreatingCharacter: (_creating) => {
                console.log('🎮 Creating character mode:', _creating);
                set({
                    isCreatingCharacter: creating,
                    currentStep: creating ? 'species' : get().currentStep
                });
            },

            setCurrentStep: (_step) => {
                console.log('🎮 Character creation step:', _step);
                set({ currentStep: step });
            },

            toggleDebugMode: () => {
                const newDebugMode = !get().showDebugMode;
                console.log('🎮 Debug mode:', newDebugMode);
                set({ showDebugMode: newDebugMode });
            },

            // Map actions
            setCurrentWorld: (_world) => {
                console.log('🗺️ Setting current world:', _world);
                set({ currentWorld: world });
            },

            updateMapSettings: (_settings) => {
                set((state) => ({
                    mapSettings: { ...state.mapSettings, ...settings }
                }));
                console.log('🗺️ Updated map settings:', get().mapSettings);
            },

            generateMapSeed: () => {
                const seed = rng.next().toString(36).substring(2, 15);
                set((state) => ({
                    mapSettings: { ...state.mapSettings, seed }
                }));
                console.log('🗺️ Generated new map seed:', seed);
            }
        }),
        {
            name: 'world-engine-game-state',
            storage: createJSONStorage(() => storageAreaToWebStorage(storage.local)),
            version: 1,
            // Only persist essential data
            partialize: (state) => ({
                characters: state.characters,
                currentCharacter: state.currentCharacter,
                showDebugMode: state.showDebugMode,
                mapSettings: state.mapSettings
            })
        }
    )
);

/**
 * Convenience hooks for specific parts of state
 */
export const useCurrentCharacter = () => useGameStore(state => state.currentCharacter);
export const useCharacters = () => useGameStore(state => state.characters);
export const useCharacterActions = () => useGameStore(state => ({
    setCurrentCharacter: state.setCurrentCharacter,
    updateCurrentCharacter: state.updateCurrentCharacter,
    saveCharacter: state.saveCharacter,
    loadCharacter: state.loadCharacter,
    deleteCharacter: state.deleteCharacter
}));

export const useUIState = () => useGameStore(state => ({
    isCreatingCharacter: state.isCreatingCharacter,
    currentStep: state.currentStep,
    showDebugMode: state.showDebugMode
}));

export const useUIActions = () => useGameStore(state => ({
    setCreatingCharacter: state.setCreatingCharacter,
    setCurrentStep: state.setCurrentStep,
    toggleDebugMode: state.toggleDebugMode
}));

export const useMapState = () => useGameStore(state => ({
    currentWorld: state.currentWorld,
    mapSettings: state.mapSettings
}));

export const useMapActions = () => useGameStore(state => ({
    setCurrentWorld: state.setCurrentWorld,
    updateMapSettings: state.updateMapSettings,
    generateMapSeed: state.generateMapSeed
}));