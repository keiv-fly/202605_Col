import type { GameState, TileCoord, UnitId } from '../GameState';
import { getTile, inBounds } from '../GameState';
import { TERRAIN_DEFS } from '../map/terrain';

export function getMovementCost(state: GameState, unitId: UnitId, to: TileCoord): number | null {
  if (!inBounds(state.map, to.x, to.y)) return null;
  const unit = state.units[unitId];
  if (!unit) return null;
  const tile = getTile(state.map, to.x, to.y);
  const def = TERRAIN_DEFS[tile.terrain];
  if (!def.canEnterLand) return null;
  return def.movementCost;
}
