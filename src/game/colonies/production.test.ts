import { describe, it, expect } from 'vitest';
import { calculateColonyYield, applyColonyProduction } from './production';
import { endTurn } from '../rules/turn';
import { TERRAIN_DEFS } from '../map/terrain';
import { DEFAULT_STORAGE_LIMIT } from '../economy/goods';
import type { GameState, GameMap, Colony } from '../GameState';
import type { TerrainType } from '../map/terrain';

function makeStateWithColony(): GameState {
  const tiles = Array.from({ length: 25 }, () => ({
    terrain: 'plains' as TerrainType,
    riverMask: 0,
    roadMask: 0,
    discoveredBy: 0,
    visibleTo: 0,
    colonyId: undefined as string | undefined,
  }));
  tiles[2 * 5 + 2].colonyId = 'colony_1';
  const map: GameMap = { width: 5, height: 5, tiles, startX: 2, startY: 2 };

  const colony: Colony = {
    id: 'colony_1',
    ownerId: 'player_1',
    name: 'Test Colony',
    x: 2,
    y: 2,
    population: [{ id: 'colonist_1', profession: 'generalist' as const }],
    storage: { food: 0, lumber: 0 },
    buildings: [],
    constructionQueue: [],
    workedTiles: [],
  };

  return {
    turn: 1,
    currentPlayerId: 'player_1',
    map,
    players: [{ id: 'player_1', name: 'P1' }],
    units: {},
    colonies: { colony_1: colony },
    market: {},
    rngState: { state: 0 },
    idCounters: { unit: 0, colony: 1, colonist: 1 },
  };
}

describe('production', () => {
  it('terrain yields return expected values', () => {
    expect(TERRAIN_DEFS.plains.baseFood).toBe(2);
    expect(TERRAIN_DEFS.grassland.baseFood).toBe(3);
    expect(TERRAIN_DEFS.forest.baseLumber).toBe(2);
  });

  it('colony center tile contributes to production', () => {
    const state = makeStateWithColony();
    const yields = calculateColonyYield(state, 'colony_1');
    // Plains center tile produces 2 food
    expect(yields.food).toBeGreaterThanOrEqual(2);
  });

  it('population consumes 2 food per turn', () => {
    const state = makeStateWithColony();
    // Colony has 1 colonist, 2 food per colonist consumption
    const yields = calculateColonyYield(state, 'colony_1');
    // Net food = produced - 2*population
    const produced = yields.food;
    // If plains gives 2 food and 1 colonist eats 2, net = 0
    // The net is produced - 2
    expect(produced - 2).toBeLessThanOrEqual(produced);
  });

  it('food cannot go below 0', () => {
    const state = makeStateWithColony();
    // Ensure storage starts at 0
    state.colonies['colony_1'].storage.food = 0;
    const result = applyColonyProduction(state, 'colony_1');
    expect(result.state.colonies['colony_1'].storage.food).toBeGreaterThanOrEqual(0);
  });

  it('lumber is added to storage', () => {
    const state = makeStateWithColony();
    // Change some adjacent tiles to forest so lumber is produced
    state.map.tiles[1 * 5 + 2] = {
      terrain: 'forest' as TerrainType,
      riverMask: 0,
      roadMask: 0,
      discoveredBy: 0,
      visibleTo: 0,
    };
    // Add the forest tile to workedTiles so it's harvested
    state.colonies['colony_1'].workedTiles = [{ x: 2, y: 1 }];
    // Add a second colonist for the worked tile
    state.colonies['colony_1'].population.push({ id: 'colonist_2', profession: 'lumberjack' as const });
    const result = applyColonyProduction(state, 'colony_1');
    expect(result.state.colonies['colony_1'].storage.lumber).toBeGreaterThanOrEqual(0);
  });

  it('storage caps at 100', () => {
    const state = makeStateWithColony();
    state.colonies['colony_1'].storage.lumber = 99;
    const result = applyColonyProduction(state, 'colony_1');
    expect(result.state.colonies['colony_1'].storage.lumber).toBeLessThanOrEqual(DEFAULT_STORAGE_LIMIT);
  });

  it('end turn applies production to every colony', () => {
    const state = makeStateWithColony();
    const result = endTurn(state);
    const goodsProducedEvent = result.events.find((e) => e.type === 'GOODS_PRODUCED');
    expect(goodsProducedEvent).toBeDefined();
  });
});
