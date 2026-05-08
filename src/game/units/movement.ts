import type { GameState, TileCoord, UnitId, UnitType, GameEvent } from '../GameState';
import { getTile, inBounds } from '../GameState';
import { TERRAIN_DEFS } from '../map/terrain';

export const MAX_MOVEMENT_POINTS: Record<UnitType, number> = {
  free_colonist: 1,
  pioneer: 1,
  scout: 2,
  soldier: 1,
  wagon_train: 1,
};

export type MoveValidation =
  | { ok: true; cost: number }
  | { ok: false; reason: string };

export function canMoveUnit(state: GameState, unitId: UnitId, target: TileCoord): MoveValidation {
  const unit = state.units[unitId];
  if (!unit) return { ok: false, reason: 'Unit not found' };
  if (unit.ownerId !== state.currentPlayerId) return { ok: false, reason: 'Not your unit' };

  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  if ((Math.abs(dx) + Math.abs(dy)) !== 1) return { ok: false, reason: 'Must move exactly one tile orthogonally' };

  if (!inBounds(state.map, target.x, target.y)) return { ok: false, reason: 'Out of map bounds' };

  const targetTile = getTile(state.map, target.x, target.y);
  const def = TERRAIN_DEFS[targetTile.terrain];
  if (!def.canEnterLand) return { ok: false, reason: 'Cannot enter water tile' };

  const cost = def.movementCost;
  if (unit.movementPoints < cost) return { ok: false, reason: 'Insufficient movement points' };

  const occupant = Object.values(state.units).find(
    u => u.id !== unitId && u.ownerId === state.currentPlayerId && u.x === target.x && u.y === target.y
  );
  if (occupant) return { ok: false, reason: 'Tile occupied by friendly unit' };

  return { ok: true, cost };
}

export function moveUnit(state: GameState, unitId: UnitId, target: TileCoord): { state: GameState; events: GameEvent[] } {
  const validation = canMoveUnit(state, unitId, target);
  if (!validation.ok) {
    return { state, events: [{ type: 'UNIT_MOVE_REJECTED', unitId, reason: validation.reason }] };
  }
  const unit = state.units[unitId];
  const from: TileCoord = { x: unit.x, y: unit.y };
  unit.x = target.x;
  unit.y = target.y;
  unit.movementPoints -= validation.cost;
  return { state, events: [{ type: 'UNIT_MOVED', unitId, from, to: target }] };
}

export function getValidMoves(state: GameState, unitId: UnitId): TileCoord[] {
  const unit = state.units[unitId];
  if (!unit || unit.ownerId !== state.currentPlayerId) return [];
  const dirs: TileCoord[] = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
  const results: TileCoord[] = [];
  for (const d of dirs) {
    const target = { x: unit.x + d.x, y: unit.y + d.y };
    const v = canMoveUnit(state, unitId, target);
    if (v.ok) results.push(target);
  }
  return results;
}
