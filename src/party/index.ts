/**
 * Canvas 10 - Party Framework
 * 
 * Hero + Named Hirelings with complete lifecycle management
 * Export public API for integration with game systems
 */

// Types
export type {
    PartyState,
    PartyMember,
    RecruitDef,
    BuildSpec,
    CharacterId,
    Sex,
    PartyEvent,
    MoraleReason,
    InjurySeverity,
    RecruitSpawnConfig
} from './types';

export { MORALE_THRESHOLDS } from './types';

// Core API
export {
    initParty,
    getParty,
    getRoster,
    canHire,
    hire,
    dismiss,
    payPartyWages,
    applyMemberInjury,
    flagDeath,
    adjustMemberMorale,
    processBattleResults,
    revive,
    getRecruitPool,
    getWages,
    onPartyEvent,
    resetParty
} from './api';

// State utilities
export {
    getAllMembers,
    getLivingMembers,
    getInjuredMembers,
    getLowMoraleMembers,
    calculateDailyUpkeep,
    getAverageLevel,
    hasRoomForMember,
    getPartyPower
} from './state';

// Morale utilities
export {
    getMoraleStatus,
    getMoraleEmoji,
    willDesert,
    isThreatening,
    isComplaining
} from './morale';

// Wage utilities
export {
    calculateSeverance,
    getDaysWagesOverdue,
    getWageStatus,
    previewWageCost
} from './wages';

// Injury utilities
export {
    getInjuryStatus,
    calculateRevivalCost,
    canRevive,
    healInjury
} from './injuries';

// Data utilities
export {
    getRecruitTemplate,
    getAllRecruitTemplates,
    getRegionSpawnConfig
} from './data';
