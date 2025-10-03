import React, { useState, useEffect } from 'react';
import type { BattleState, Unit, HexPosition } from '../types';
import { BattleCanvas } from './renderer2d';
import { 
  nextPhase, 
  executeAbility, 
  moveUnit, 
  checkVictoryConditions,
  getValidMoves
} from '../engine';
import { ABILITIES } from '../abilities';
import { calculateAIAction, executeAITurn } from '../ai';
import { calculateBattleRewards, getCasualties } from '../economy';

interface BattleScreenProps {
  initialState: BattleState;
  onExit: (result: 'Victory' | 'Defeat' | 'Retreat', finalState: BattleState) => void;
}

function cloneState(state: BattleState): BattleState {
  return JSON.parse(JSON.stringify(state));
}

export function BattleScreen({ initialState, onExit }: BattleScreenProps) {
  const [state, setState] = useState<BattleState>(cloneState(initialState));
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<'move' | 'ability' | null>(null);
  const [validMoves, setValidMoves] = useState<HexPosition[]>([]);
  const [showLog, setShowLog] = useState(false);
  
  // Handle phase transitions and AI turns
  useEffect(() => {
    if (state.phase === 'EnemyTurn') {
      // Execute AI turn after a brief delay
      const timer = setTimeout(() => {
        const newState = cloneState(state);
        executeAITurn(newState);
        checkVictoryConditions(newState);
        
        if (newState.phase === 'Victory' || newState.phase === 'Defeat') {
          setState(newState);
        } else {
          nextPhase(newState);
          setState(newState);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.phase]);
  
  // Check for battle end conditions
  useEffect(() => {
    if (state.phase === 'Victory' || state.phase === 'Defeat') {
      onExit(state.phase, state);
    }
  }, [state.phase, onExit]);
  
  const playerUnits = state.units.filter(u => 
    u.faction === 'Player' && !u.isDead && !u.isCommander && u.pos
  );
  
  const selectedUnitData = selectedUnit ? 
    state.units.find(u => u.id === selectedUnit) : null;
  
  const availableAbilities = selectedUnitData?.skills.map(skillId => ABILITIES[skillId]).filter(Boolean) || [];
  
  function handleUnitSelect(unitId: string) {
    setSelectedUnit(unitId);
    setSelectedAbility(null);
    setTargetMode(null);
    
    // Update valid moves for selected unit
    const moves = getValidMoves(state, unitId);
    setValidMoves(moves);
  }
  
  function handleAbilitySelect(abilityId: string) {
    setSelectedAbility(abilityId);
    setTargetMode('ability');
  }
  
  function handleMoveMode() {
    setTargetMode('move');
    setSelectedAbility(null);
  }
  
  function handleTileClick(pos: HexPosition) {
    if (!selectedUnit || !selectedUnitData) return;
    
    if (targetMode === 'move') {
      // Try to move unit
      const newState = cloneState(state);
      const success = moveUnit(newState, selectedUnit, pos);
      
      if (success) {
        setState(newState);
        setTargetMode(null);
        setValidMoves([]);
      }
    } else if (targetMode === 'ability' && selectedAbility) {
      // Try to use ability
      const newState = cloneState(state);
      const success = executeAbility(newState, selectedUnit, selectedAbility, pos);
      
      if (success) {
        setState(newState);
        setSelectedAbility(null);
        setTargetMode(null);
        checkVictoryConditions(newState);
      }
    }
  }
  
  function handleEndPhase() {
    const newState = cloneState(state);
    nextPhase(newState);
    setState(newState);
    
    // Clear selections
    setSelectedUnit(null);
    setSelectedAbility(null);
    setTargetMode(null);
    setValidMoves([]);
  }
  
  function handleRetreat() {
    onExit('Retreat', state);
  }
  
  function handleCommanderAbility(abilityId: string) {
    // TODO: Implement commander abilities
    console.log('Commander ability:', abilityId);
  }
  
  const canEndPhase = state.phase === 'HeroTurn' || state.phase === 'UnitsTurn';
  const isPlayerTurn = state.phase === 'HeroTurn' || state.phase === 'UnitsTurn';
  
  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Main battlefield */}
      <div className="flex-1 p-4">
        <BattleCanvas
          state={state}
          onTileClick={handleTileClick}
          selectedUnit={selectedUnit}
          showGrid={true}
        />
      </div>
      
      {/* Right sidebar */}
      <div className="w-80 p-4 border-l border-gray-700 space-y-4">
        {/* Battle status */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Battle Status</h3>
          <div className="space-y-1 text-sm">
            <div>Turn: {state.turn}</div>
            <div>Phase: <span className="font-medium">{state.phase}</span></div>
            <div>Biome: {state.context.biome}</div>
          </div>
        </div>
        
        {/* Commander panel (Hero Turn) */}
        {state.phase === 'HeroTurn' && (
          <div className="bg-blue-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Commander Actions</h3>
            <div className="space-y-2">
              {state.commander.abilities.map(ability => (
                <button
                  key={ability.id}
                  onClick={() => handleCommanderAbility(ability.id)}
                  className="w-full text-left px-3 py-2 bg-blue-800 hover:bg-blue-700 rounded text-sm"
                  disabled={state.commander.runtime.cooldowns?.[ability.id] > 0}
                >
                  <div className="font-medium">{ability.name}</div>
                  <div className="text-xs opacity-75">{ability.description}</div>
                  {state.commander.runtime.cooldowns?.[ability.id] > 0 && (
                    <div className="text-xs text-red-300">
                      Cooldown: {state.commander.runtime.cooldowns[ability.id]}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Unit selection */}
        {isPlayerTurn && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Your Units</h3>
            <div className="space-y-2">
              {playerUnits.map(unit => (
                <div
                  key={unit.id}
                  onClick={() => handleUnitSelect(unit.id)}
                  className={`p-3 rounded cursor-pointer transition-colors ${\n                    selectedUnit === unit.id \n                      ? 'bg-green-700 border-2 border-green-500' \n                      : 'bg-gray-700 hover:bg-gray-600'\n                  }`}
                >
                  <div className="font-medium">{unit.name}</div>
                  <div className="text-sm opacity-75">\n                    Lv{unit.level} {unit.archetype}\n                  </div>\n                  <div className="text-sm\">\n                    HP: {unit.stats.hp}/{unit.stats.maxHp}\n                  </div>\n                  {unit.statuses.length > 0 && (\n                    <div className=\"text-xs text-yellow-300\">\n                      {unit.statuses.map(s => s.name).join(', ')}\n                    </div>\n                  )}\n                </div>\n              ))}\n            </div>\n          </div>\n        )}\n        \n        {/* Unit actions */}\n        {selectedUnitData && isPlayerTurn && (\n          <div className=\"bg-gray-800 rounded-lg p-4\">\n            <h3 className=\"text-lg font-semibold mb-2\">Actions</h3>\n            \n            {/* Movement */}\n            <button\n              onClick={handleMoveMode}\n              className={`w-full mb-2 px-3 py-2 rounded text-sm ${\n                targetMode === 'move' \n                  ? 'bg-blue-600' \n                  : 'bg-gray-700 hover:bg-gray-600'\n              }`}\n            >\n              Move ({selectedUnitData.stats.move} hexes)\n            </button>\n            \n            {/* Abilities */}\n            <div className=\"space-y-1\">\n              <div className=\"text-sm font-medium mb-1\">Abilities:</div>\n              {availableAbilities.map(ability => (\n                <button\n                  key={ability.id}\n                  onClick={() => handleAbilitySelect(ability.id)}\n                  className={`w-full text-left px-3 py-2 rounded text-sm ${\n                    selectedAbility === ability.id \n                      ? 'bg-red-600' \n                      : 'bg-gray-700 hover:bg-gray-600'\n                  }`}\n                >\n                  <div className=\"font-medium\">{ability.name}</div>\n                  <div className=\"text-xs opacity-75\">\n                    Range: {ability.range} | Cooldown: {ability.cooldown}\n                  </div>\n                  {ability.damage && (\n                    <div className=\"text-xs text-red-300\">\n                      Damage: {ability.damage.amount} {ability.damage.type}\n                    </div>\n                  )}\n                  {ability.healing && (\n                    <div className=\"text-xs text-green-300\">\n                      Healing: {ability.healing}\n                    </div>\n                  )}\n                </button>\n              ))}\n            </div>\n          </div>\n        )}\n        \n        {/* Phase controls */}\n        <div className=\"bg-gray-800 rounded-lg p-4 space-y-2\">\n          {canEndPhase && (\n            <button\n              onClick={handleEndPhase}\n              className=\"w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium\"\n            >\n              End {state.phase}\n            </button>\n          )}\n          \n          <button\n            onClick={handleRetreat}\n            className=\"w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium\"\n          >\n            Retreat\n          </button>\n        </div>\n        \n        {/* Battle log */}\n        <div className=\"bg-gray-800 rounded-lg p-4\">\n          <div className=\"flex justify-between items-center mb-2\">\n            <h3 className=\"text-lg font-semibold\">Battle Log</h3>\n            <button\n              onClick={() => setShowLog(!showLog)}\n              className=\"text-sm px-2 py-1 bg-gray-700 rounded hover:bg-gray-600\"\n            >\n              {showLog ? 'Hide' : 'Show'}\n            </button>\n          </div>\n          \n          {showLog && (\n            <div className=\"max-h-32 overflow-y-auto text-sm space-y-1\">\n              {state.log.slice(-10).map((entry, index) => (\n                <div key={index} className=\"opacity-75\">\n                  {entry}\n                </div>\n              ))}\n            </div>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}"