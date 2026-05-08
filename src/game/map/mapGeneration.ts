import { createRng } from '../rng';
import type { GameMap, Tile } from '../GameState';
import { TERRAIN_DEFS, type TerrainType } from './terrain';

export type MapGenerationOptions = {
  width: number;
  height: number;
  seed: string;
};

const LAND_TERRAIN_POOL: TerrainType[] = [
  'plains', 'plains', 'plains',
  'grassland', 'grassland', 'grassland',
  'forest', 'forest',
  'hills', 'hills',
  'mountains',
];

export function generateMap(options: MapGenerationOptions): GameMap {
  const { width, height, seed } = options;
  const rng = createRng(seed);
  const size = width * height;

  // Step 1: random heights
  const heights = new Float32Array(size);
  for (let i = 0; i < size; i++) heights[i] = rng.next();

  // Step 2: 5x5 box blur (one pass)
  const smoothed = new Float32Array(size);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += heights[ny * width + nx];
            count++;
          }
        }
      }
      smoothed[y * width + x] = sum / count;
    }
  }

  // Step 3: find 40th percentile threshold — 60% land candidates so inland
  // tiles remain >30% after coast conversion strips the boundary band
  const sorted = Array.from(smoothed).sort((a, b) => a - b);
  const threshold = sorted[Math.floor(size * 0.4)];

  // Step 4: assign terrain
  const terrains: TerrainType[] = new Array(size);
  const isLand: boolean[] = new Array(size);

  for (let i = 0; i < size; i++) {
    if (smoothed[i] >= threshold) {
      isLand[i] = true;
      terrains[i] = rng.nextChoice(LAND_TERRAIN_POOL);
    } else {
      isLand[i] = false;
      terrains[i] = 'ocean';
    }
  }

  // Step 5: convert land tiles adjacent to ocean into coast
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!isLand[i]) continue;
      for (const { dx, dy } of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (!isLand[ny * width + nx]) {
            terrains[i] = 'coast';
            break;
          }
        }
      }
    }
  }

  // Step 6: find player start
  let startX = Math.floor(width / 2);
  let startY = Math.floor(height / 2);
  const minX = Math.floor(width * 0.25);
  const maxX = Math.floor(width * 0.75);
  const minY = Math.floor(height * 0.25);
  const maxY = Math.floor(height * 0.75);

  const preferred: Array<{ x: number; y: number; score: number }> = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const t = terrains[y * width + x];
      if (t === 'ocean' || t === 'coast' || t === 'mountains') continue;
      const score = t === 'grassland' ? 2 : t === 'plains' ? 1 : 0;
      preferred.push({ x, y, score });
    }
  }
  preferred.sort((a, b) => b.score - a.score);
  if (preferred.length > 0) {
    startX = preferred[0].x;
    startY = preferred[0].y;
  }

  // Step 7: guarantee food in radius 2
  let foodCount = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const nx = startX + dx, ny = startY + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const t = terrains[ny * width + nx];
        if (t !== 'ocean' && t !== 'coast' && TERRAIN_DEFS[t].baseFood > 0) foodCount++;
      }
    }
  }
  if (foodCount < 3) {
    let fixed = 0;
    for (let dy = -2; dy <= 2 && fixed < 3; dy++) {
      for (let dx = -2; dx <= 2 && fixed < 3; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = startX + dx, ny = startY + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const i = ny * width + nx;
          if (terrains[i] !== 'ocean') {
            terrains[i] = 'grassland';
            isLand[i] = true;
            fixed++;
          }
        }
      }
    }
  }

  // Build tile array
  const tiles: Tile[] = new Array(size);
  for (let i = 0; i < size; i++) {
    tiles[i] = {
      terrain: terrains[i],
      riverMask: 0,
      roadMask: 0,
      discoveredBy: 0,
      visibleTo: 0,
    };
  }

  return { width, height, tiles, startX, startY };
}
