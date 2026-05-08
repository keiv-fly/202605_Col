import type { GameState, ColonyId, GoodsStockpile, GameEvent } from '../GameState';
import { getTile, inBounds } from '../GameState';
import { TERRAIN_DEFS } from '../map/terrain';
import { DEFAULT_STORAGE_LIMIT } from '../economy/goods';

export function calculateColonyYield(state: GameState, colonyId: ColonyId): GoodsStockpile {
  const colony = state.colonies[colonyId];
  if (!colony) return { food: 0, lumber: 0 };

  const centerDef = TERRAIN_DEFS[getTile(state.map, colony.x, colony.y).terrain];
  let totalFood = centerDef.baseFood;
  let totalLumber = centerDef.baseLumber;

  // Find best adjacent food and lumber tiles (8 neighbors)
  let bestFoodTile: { food: number; lumber: number } | null = null;
  let bestLumberTile: { food: number; lumber: number } | null = null;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = colony.x + dx, ny = colony.y + dy;
      if (!inBounds(state.map, nx, ny)) continue;
      const tile = getTile(state.map, nx, ny);
      const def = TERRAIN_DEFS[tile.terrain];
      if (!def.canEnterLand) continue;
      if (!bestFoodTile || def.baseFood > bestFoodTile.food) {
        bestFoodTile = { food: def.baseFood, lumber: def.baseLumber };
      }
      if (!bestLumberTile || def.baseLumber > bestLumberTile.lumber) {
        bestLumberTile = { food: def.baseFood, lumber: def.baseLumber };
      }
    }
  }

  if (bestFoodTile) totalFood += bestFoodTile.food;
  if (bestLumberTile) totalLumber += bestLumberTile.lumber;

  return { food: totalFood, lumber: totalLumber };
}

export function applyColonyProduction(state: GameState, colonyId: ColonyId): { state: GameState; events: GameEvent[] } {
  const colony = state.colonies[colonyId];
  if (!colony) return { state, events: [] };

  const produced = calculateColonyYield(state, colonyId);
  const consumed = colony.population.length * 2;
  const netFood = produced.food - consumed;
  const events: GameEvent[] = [];

  colony.storage.food = Math.max(0, Math.min(DEFAULT_STORAGE_LIMIT, colony.storage.food + netFood));
  colony.storage.lumber = Math.max(0, Math.min(DEFAULT_STORAGE_LIMIT, colony.storage.lumber + produced.lumber));

  events.push({ type: 'GOODS_PRODUCED', colonyId, goods: { food: produced.food, lumber: produced.lumber } });
  if (netFood < 0) {
    events.push({ type: 'FOOD_SHORTAGE', colonyId, shortage: Math.abs(netFood) });
  }

  return { state, events };
}

export function applyTurnEconomy(state: GameState): { state: GameState; events: GameEvent[] } {
  const allEvents: GameEvent[] = [];
  for (const colonyId of Object.keys(state.colonies)) {
    const { events } = applyColonyProduction(state, colonyId);
    allEvents.push(...events);
  }
  return { state, events: allEvents };
}
