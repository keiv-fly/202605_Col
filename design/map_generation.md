# Map Generation Design

## Purpose

Define deterministic MVP map generation for a 64x40 square-tile Colonization-like map.

Map generation belongs entirely in the game logic layer. Rendering code receives the generated `GameMap` and does not participate in generation.

## Source Files

```text
src/game/map/mapGeneration.ts
src/game/map/GameMap.ts
src/game/map/terrain.ts
src/game/rng.ts
```

## Public API

```ts
type MapGenerationOptions = {
  width: number;
  height: number;
  seed: string;
};

function generateMap(options: MapGenerationOptions): GameMap;
```

## MVP Requirements

* Generation must be deterministic for the same seed.
* The MVP map size is 64x40.
* The map must contain both land and water.
* The player start tile must always be land.
* The player start area must contain at least 3 food-producing land tiles within radius 2.
* All generated tiles must be valid `TerrainType` values.
* Map storage uses a flat array indexed by `index = y * width + x`.

## Terrain Set

MVP terrain types:

```ts
type TerrainType =
  | "ocean"
  | "coast"
  | "plains"
  | "grassland"
  | "forest"
  | "hills"
  | "mountains";
```

Other terrain types can exist in the broader type definition, but the MVP generator does not need to emit them.

## Terrain Distribution

Use approximate weighted distribution:

| Terrain     | Target Share |
| ----------- | ------------ |
| ocean/coast | 45-55%       |
| plains      | 15-20%       |
| grassland   | 10-15%       |
| forest      | 10-15%       |
| hills       | 5-10%        |
| mountains   | 2-5%         |

Exact percentages do not need to be perfect, but tests should verify that the generated MVP map has at least 30% land and at least 30% water.

## Algorithm

MVP algorithm:

1. Create seeded RNG.
2. Generate low-frequency noise or coarse random blobs for landmass.
3. Mark tiles above land threshold as land and the rest as ocean.
4. Convert ocean tiles adjacent to land into coast.
5. Assign land terrain using seeded weighted random selection.
6. Pick a valid player start tile near the center of the largest or first acceptable land area.
7. Normalize the start area if needed so at least 3 nearby land tiles produce food.
8. Return `GameMap` with width, height, tiles, and start metadata if supported.

## Start Position

The MVP can use a single player start:

```ts
type MapStart = {
  playerId: PlayerId;
  x: number;
  y: number;
};
```

Rules:

* Prefer land tiles between 25% and 75% of map width and height.
* Do not start on mountains.
* Prefer grassland or plains.
* If no ideal tile exists, force a plains tile near the map center.

## Tile Defaults

Every generated tile starts with:

```ts
{
  terrain,
  riverMask: 0,
  roadMask: 0,
  discoveredBy: 0,
  visibleTo: 0
}
```

Optional fields are omitted unless used.

## Tests

Required unit tests:

* same seed creates identical map data
* different seeds create different map data
* generated map has exactly width * height tiles
* all tile coordinates map to the correct flat-array index
* generated map has at least 30% land and at least 30% water
* player start tile is land and not mountains
* player start area has at least 3 food-producing land tiles within radius 2
