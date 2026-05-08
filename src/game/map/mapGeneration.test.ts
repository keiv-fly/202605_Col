import { describe, it, expect, beforeAll } from 'vitest';
import { generateMap } from './mapGeneration';
import { TERRAIN_DEFS } from './terrain';
import type { GameMap } from '../GameState';
import type { TerrainType } from './terrain';

const VALID_TERRAINS = new Set<TerrainType>([
  'ocean', 'coast', 'plains', 'grassland', 'forest',
  'hills', 'mountains', 'desert', 'tundra', 'marsh',
]);

const SEED = 'mvp-seed-1';
const WIDTH = 64;
const HEIGHT = 40;

describe('mapGeneration', () => {
  let map1: GameMap;
  let map2: GameMap;
  let mapDiff: GameMap;

  beforeAll(() => {
    map1 = generateMap({ width: WIDTH, height: HEIGHT, seed: SEED });
    map2 = generateMap({ width: WIDTH, height: HEIGHT, seed: SEED });
    mapDiff = generateMap({ width: WIDTH, height: HEIGHT, seed: 'different-seed-xyz' });
  });

  it('same seed creates identical map', () => {
    expect(map1.tiles.length).toBe(map2.tiles.length);
    for (let i = 0; i < map1.tiles.length; i++) {
      expect(map1.tiles[i].terrain).toBe(map2.tiles[i].terrain);
    }
  });

  it('different seeds create different maps', () => {
    let differs = false;
    const checkCount = Math.min(100, map1.tiles.length);
    for (let i = 0; i < checkCount; i++) {
      if (map1.tiles[i].terrain !== mapDiff.tiles[i].terrain) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('generated map has correct tile count', () => {
    expect(map1.tiles.length).toBe(WIDTH * HEIGHT);
  });

  it('all tiles have valid terrain', () => {
    for (const tile of map1.tiles) {
      expect(VALID_TERRAINS.has(tile.terrain as TerrainType)).toBe(true);
    }
  });

  it('map has at least 30% land', () => {
    const landTiles = map1.tiles.filter(
      (t) => t.terrain !== 'ocean' && t.terrain !== 'coast'
    );
    const ratio = landTiles.length / map1.tiles.length;
    expect(ratio).toBeGreaterThanOrEqual(0.3);
  });

  it('map has at least 30% water', () => {
    const waterTiles = map1.tiles.filter(
      (t) => t.terrain === 'ocean' || t.terrain === 'coast'
    );
    const ratio = waterTiles.length / map1.tiles.length;
    expect(ratio).toBeGreaterThanOrEqual(0.3);
  });

  it('player start tile is land and not mountains', () => {
    const { startX, startY } = map1;
    const startTile = map1.tiles[startY * map1.width + startX];
    expect(startTile.terrain).not.toBe('ocean');
    expect(startTile.terrain).not.toBe('coast');
    expect(startTile.terrain).not.toBe('mountains');
  });

  it('player start area has food tiles', () => {
    const { startX, startY } = map1;
    const radius = 2;
    let foodTileCount = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = startX + dx;
        const ty = startY + dy;
        if (tx < 0 || tx >= map1.width || ty < 0 || ty >= map1.height) continue;
        const tile = map1.tiles[ty * map1.width + tx];
        const def = TERRAIN_DEFS[tile.terrain as TerrainType];
        if (def && def.baseFood > 0) {
          foodTileCount++;
        }
      }
    }
    expect(foodTileCount).toBeGreaterThanOrEqual(3);
  });
});
