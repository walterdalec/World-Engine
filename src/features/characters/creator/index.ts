/**
 * Character Creator Module
 * Classic character creation interface
 */

export { ClassicCharacterCreator } from './ClassicCharacterCreator';

// Re-export creator types and utilities for convenience
export type {
    CreatorInput,
    CreatorResult,
    SpeciesId,
    BackgroundId,
    ArchetypeId,
    StatAllocation,
    MasteryPick,
    ValidationResult
} from '../../../core/creator/types';

export {
    buildCharacter,
    validateInput,
    CharacterCreator
} from '../../../core/creator';