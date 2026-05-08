import type { GameState, UnitId, Colony, GameEvent, UnitType } from '../GameState';
import { getTile } from '../GameState';
import { TERRAIN_DEFS } from '../map/terrain';

export const CAN_FOUND_COLONY: UnitType[] = ['free_colonist', 'pioneer', 'scout'];

export type FoundingValidation = { ok: true } | { ok: false; reason: string };

export function canFoundColony(state: GameState, unitId: UnitId): FoundingValidation {
  const unit = state.units[unitId];
  if (!unit) return { ok: false, reason: 'Unit not found' };
  if (unit.ownerId !== state.currentPlayerId) return { ok: false, reason: 'Not your unit' };
  if (!CAN_FOUND_COLONY.includes(unit.type)) return { ok: false, reason: 'Unit type cannot found colonies' };
  const tile = getTile(state.map, unit.x, unit.y);
  const def = TERRAIN_DEFS[tile.terrain];
  if (!def.canFoundColony) return { ok: false, reason: 'Cannot found colony on this terrain' };
  if (tile.colonyId) return { ok: false, reason: 'Colony already exists here' };
  return { ok: true };
}

export function foundColony(state: GameState, unitId: UnitId, name: string): { state: GameState; events: GameEvent[] } {
  const validation = canFoundColony(state, unitId);
  if (!validation.ok) {
    return { state, events: [{ type: 'COLONY_FOUNDING_REJECTED', unitId, reason: validation.reason }] };
  }

  const unit = state.units[unitId];
  state.idCounters.colony++;
  state.idCounters.colonist++;
  const colonyId = `colony_${state.idCounters.colony}`;
  const colonistId = `colonist_${state.idCounters.colonist}`;
  const colonyName = name.trim() || `Colony ${Object.keys(state.colonies).length + 1}`;

  delete state.units[unitId];

  const tile = getTile(state.map, unit.x, unit.y);
  tile.colonyId = colonyId;

  const colony: Colony = {
    id: colonyId,
    ownerId: unit.ownerId,
    name: colonyName,
    x: unit.x,
    y: unit.y,
    population: [{ id: colonistId, profession: 'generalist' }],
    storage: { food: 0, lumber: 0 },
    buildings: [],
    constructionQueue: [],
    workedTiles: [],
  };

  state.colonies[colonyId] = colony;

  return { state, events: [{ type: 'COLONY_FOUNDED', colonyId, x: unit.x, y: unit.y }] };
}
