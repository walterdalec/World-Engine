/**
 * Strategic Layer Tests - Basic functionality verification
 */

import { describe, it, expect } from 'vitest';
import { 
  mkCampaign, 
  mkTerritory, 
  mkCastle, 
  mkFaction,
  type CampaignState 
} from '../types';
import { calcIncome, applyIncome, settleUpkeep } from '../economy';
import { recomputeSupply, isInSupply } from '../world';
import { nextSeason, runSeasonStart, runSeasonEnd } from '../time';

describe('Strategic Layer - World Engine', () => {
  it('should create campaign with World Engine factions', () => {
    const campaign = mkCampaign(12345);
    
    expect(campaign.seed).toBe(12345);
    expect(campaign.season).toBe('Spring');
    expect(campaign.year).toBe(1);
    expect(campaign.factions.has('Player')).toBe(true);
    
    const playerFaction = campaign.factions.get('Player')!;
    expect(playerFaction.species).toBe('human');
    expect(playerFaction.name).toBe('Human Alliance');
  });

  it('should calculate income from World Engine territories', () => {
    const s = mkCampaign();
    
    // Add territories with World Engine resource tags
    s.territories.set('Capital', mkTerritory('Capital', 'Player', ['Mine'], ['capital'], mkCastle('Capital')));
    s.territories.set('Mine', mkTerritory('Mine', 'Player', ['Capital'], ['mine']));
    s.territories.set('Shrine', mkTerritory('Shrine', 'Player', ['Capital'], ['shrine']));
    s.territories.set('Farm', mkTerritory('Farm', 'Player', ['Capital'], ['farm']));
    
    const income = calcIncome(s);
    const playerIncome = income['Player'];
    
    expect(playerIncome.gold).toBeGreaterThan(100); // Capital + mine income
    expect(playerIncome.mana).toBeGreaterThan(20); // Capital + shrine income
    expect(playerIncome.food).toBe(40); // Farm income
  });

  it('should handle supply lines correctly', () => {
    const s = mkCampaign();
    
    // Create connected territories
    s.territories.set('Cap', mkTerritory('Cap', 'Player', ['Mine'], ['capital']));
    s.territories.set('Mine', mkTerritory('Mine', 'Player', ['Cap', 'Isolated'], ['mine']));
    s.territories.set('Isolated', mkTerritory('Isolated', 'Player', ['Mine'], ['farm']));
    
    recomputeSupply(s);
    
    expect(isInSupply(s, 'Cap')).toBe(true); // Capital is always in supply
    expect(isInSupply(s, 'Mine')).toBe(true); // Connected to capital
    expect(isInSupply(s, 'Isolated')).toBe(true); // Connected through mine
  });

  it('should advance seasons and years correctly', () => {
    const s = mkCampaign();
    
    expect(s.season).toBe('Spring');
    expect(s.year).toBe(1);
    expect(s.turn).toBe(0);
    
    nextSeason(s);
    expect(s.season).toBe('Summer');
    expect(s.year).toBe(1);
    expect(s.turn).toBe(1);
    
    nextSeason(s); // Fall
    nextSeason(s); // Winter
    nextSeason(s); // Spring year 2
    
    expect(s.season).toBe('Spring');
    expect(s.year).toBe(2);
    expect(s.turn).toBe(4);
  });

  it('should apply species bonuses correctly', () => {
    const s = mkCampaign();
    
    // Add Sylvanborn faction
    s.factions.set('Sylvan', mkFaction('Sylvan'));
    
    // Add territories with nature resources
    s.territories.set('Forest1', mkTerritory('Forest1', 'Sylvan', [], ['lumber']));
    s.territories.set('Forest2', mkTerritory('Forest2', 'Player', [], ['lumber']));
    
    const income = calcIncome(s);
    
    // Sylvanborn should get bonus from lumber territories
    const sylvanIncome = income['Sylvan'];
    const humanIncome = income['Player'];
    
    expect(sylvanIncome.materials).toBeGreaterThan(humanIncome.materials);
  });

  it('should handle complete economic cycle', () => {
    const s = mkCampaign();
    
    // Setup basic economy
    s.territories.set('Cap', mkTerritory('Cap', 'Player', [], ['capital'], mkCastle('Cap')));
    s.territories.set('Mine', mkTerritory('Mine', 'Player', [], ['mine']));
    s.territories.get('Cap')!.garrison = ['unit1', 'unit2'];
    
    const initialGold = s.factions.get('Player')!.treasury.gold;
    
    // Run full season cycle
    runSeasonStart(s);
    runSeasonEnd(s);
    
    const finalGold = s.factions.get('Player')!.treasury.gold;
    
    // Should have net positive income after upkeep
    expect(finalGold).toBeGreaterThan(initialGold);
    expect(s.logs.length).toBeGreaterThan(0); // Should have logged events
  });
});