// packages/core/src/unit/balance.ts
export const Balance = {
    // Derived stat coefficients
    hpPerCON: 8,
    mpPerWIS: 5,
    apBase: 10,
    atkPerSTR: 1,
    magPerINT: 1,
    defPerCON: 0.5,  // floors at sum time
    resPerWIS: 0.5,
    accPerDEX: 2,
    evaPerDEX: 1,
    evaPerSPD: 1,
    critBasePermille: 20,   // 2.0%
    critPerLCKPermille: 3,  // 0.3% per LCK
    critDamagePct: 50,      // +50% dmg on crit
    // Combat
    hitFloorPct: 15,  // min 15% chance to hit/miss guardrails
    hitCeilPct: 95,
};