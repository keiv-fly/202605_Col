# Game Development Todo List

Colonization-like turn-based strategy game — TypeScript + PixiJS + Vite.

---

## Phase 1 — Project Setup

- [ ] **#1** Initialize Vite + TypeScript + PixiJS project
  - Run `npm create vite@latest` with TypeScript template, install PixiJS and vitest
  - Configure tsconfig, add npm scripts: `dev`, `build`, `test`
  - Set up `src/` folder structure: `views/`, `rendering/`, `game/` with all sub-folders

---

## Phase 2 — Core Types & Data *(parallel after #1)*

- [ ] **#2** Define core TypeScript types (`src/game/GameState.ts`, `src/game/ids.ts`, `src/game/map/terrain.ts`)
  - `TerrainType`, `TileCoord`, `Tile`, `GameMap`, `Unit`, `UnitType`, `ProfessionType`
  - `Colony`, `ColonistAssignment`, `GoodsStockpile`, `GoodsType`, `Player`
  - `PlayerId`, `UnitId`, `ColonyId`, `MarketState`, `RngState`, `GameState`
  - `GameCommand`, `GameEvent`, `SerializedGame`
  - No PixiJS imports in any of these files
  - *Blocked by: #1*

- [ ] **#3** Implement seeded RNG (`src/game/rng.ts`)
  - Deterministic PRNG (e.g. mulberry32): `createRng(seed: string): Rng`
  - API: `next(): number`, `nextInt(min, max): number`, `nextChoice(array)`
  - RNG state must be serializable for save/load
  - *Blocked by: #1*

---

## Phase 3 — Game Logic *(builds on #2–3)*

- [ ] **#4** Implement terrain definitions and yield table (`src/game/map/terrain.ts`)
  - `TerrainDefinition` for all MVP types: ocean, coast, plains, grassland, forest, hills, mountains
  - Each entry: `movementCost`, `baseYield { food, lumber }`, `defenseModifier`, `canHaveRoad`, `canFoundColony`, `canEnterLandUnit`
  - Export `TERRAIN_DEFS` map and `getTerrainDef(type)` helper
  - *Blocked by: #2*

- [ ] **#5** Implement deterministic map generation (`src/game/map/mapGeneration.ts`)
  - `generateMap(options: MapGenerationOptions): GameMap`
  - Algorithm: seeded RNG → coarse noise blobs → coast border pass → weighted terrain assignment → valid player start tile
  - Guarantee ≥3 food tiles within radius 2 of start
  - Flat tile array: `index = y * width + x`
  - Tile defaults: `riverMask:0, roadMask:0, discoveredBy:0, visibleTo:0`
  - *Blocked by: #3, #4*

- [ ] **#6** Implement movement rules and valid-move checks (`src/game/units/movement.ts`)
  - `canMoveUnit(state, unitId, target): MoveValidation` — orthogonal only, in-bounds, not ocean/coast, sufficient MP
  - `moveUnit(state, unitId, target): { state, events }` — returns `UNIT_MOVED` or `UNIT_MOVE_REJECTED`
  - `getValidMoves(state, unitId): TileCoord[]`
  - Terrain movement costs per design doc; no diagonal movement in MVP
  - *Blocked by: #2, #4*

- [ ] **#7** Implement A* pathfinding (`src/game/pathfinding/astar.ts`)
  - `findPath(state, unitId, target): PathResult` using A* with Manhattan heuristic
  - Returns `{ ok: true, path: TileCoord[], totalCost }` or `{ ok: false, reason }`
  - No PixiJS dependency
  - *Blocked by: #6*

- [ ] **#8** Implement colony founding rules (`src/game/rules/founding.ts`)
  - `canFoundColony(state, unitId): FoundingValidation`
  - `foundColony(state, unitId, name): { state, events }`
  - Founding: removes unit, creates Colony, marks tile `colonyId`, inits storage `{food:0, lumber:0}`, emits `COLONY_FOUNDED`
  - Allowed unit types: `free_colonist`, `pioneer`, `scout`
  - Deterministic name generation: "Colony 1", "Colony 2", …
  - *Blocked by: #2, #4*

- [ ] **#9** Implement colony economy and turn production (`src/game/colonies/production.ts`, `src/game/rules/turn.ts`)
  - `calculateColonyYield(state, colonyId): GoodsStockpile` — auto-works center + best adjacent food + best adjacent lumber tile
  - `applyColonyProduction(state, colonyId): { state, events }` — add food/lumber, subtract 2 food per colonist, clamp 0–100, emit `GOODS_PRODUCED`
  - `applyTurnEconomy(state)` — applies production for all colonies and resets unit movement points
  - `END_TURN` command increments turn and calls `applyTurnEconomy`
  - *Blocked by: #4, #8*

- [ ] **#10** Implement GameEngine with command dispatch (`src/game/GameEngine.ts`)
  - `createGameEngine(seed): GameEngine`
  - Initial state: turn 1, one player, 64×40 map, one `free_colonist` at start position, empty colonies
  - `dispatch(command): GameEvent[]` routing to move/found/endTurn handlers
  - Implements `getState()`, `getValidMoves()`, `getTileInfo()`, `save()`, `load()`
  - Engine is sole owner of state — UI never mutates directly
  - *Blocked by: #5, #6, #7, #8, #9*

- [ ] **#11** Implement save/load serialization (`src/game/save_load.ts`)
  - `serializeGame(state): SerializedGame` → `{ version: 1, createdAt: ISO string, state }`
  - `deserializeGame(data): GameState` — validates version and shape, throws on invalid
  - `engine.load()` leaves current state unchanged on failure
  - No PixiJS objects in save file
  - *Blocked by: #10*

- [ ] **#12** Write game logic unit tests (vitest, `src/game/**/*.test.ts`)
  - RNG: determinism, different seeds produce different output
  - Map: seed determinism, tile count, land/water ratio ≥30% each, valid start tile
  - Movement: valid move, water/out-of-bounds/diagonal rejection, MP cost and reset on end turn
  - Colony: valid founding, invalid terrain, duplicate colony, unit removal, map tile marking
  - Economy: terrain yields, production per turn, food consumption, storage clamping (0–100)
  - Save/load: JSON round-trip, invalid save rejection, failed load preserves state
  - All tests run without PixiJS
  - *Blocked by: #11*

---

## Phase 4 — Rendering *(parallel with Phase 3 from #1)*

- [ ] **#13** Create tile atlas and color-coded terrain sprites (`src/rendering/TileAtlas.ts`)
  - Generate 64×64 colored textures per terrain type using PixiJS Graphics (no external art needed for MVP)
  - Color map: ocean=navy, coast=steelblue, plains=khaki, grassland=green, forest=darkgreen, hills=saddlebrown, mountains=gray
  - `TileAtlas` class with `getTexture(terrain): Texture`
  - Nearest-neighbor scaling for pixel-art readiness
  - *Blocked by: #1, #4*

- [ ] **#14** Implement MapRenderer with batched terrain layer (`src/rendering/MapRenderer.ts`)
  - Render 64×40 tile map using PixiJS; avoid one Sprite per tile on large maps
  - Camera viewport culling — only render visible tiles
  - `renderMap(map: GameMap)` and `updateTile(x, y, tile: Tile)`
  - No game logic inside — reads `GameMap` data only
  - *Blocked by: #13*

- [ ] **#15** Implement camera pan and zoom
  - Pan: arrow keys or middle-mouse drag
  - Zoom: scroll wheel or +/- keys, cycles through `[0.5, 1.0, 2.0]`
  - `screenToTile(sx, sy, camera): TileCoord` helper for click mapping
  - Camera does not own or mutate game state
  - *Blocked by: #14*

- [ ] **#16** Implement SelectionRenderer (`src/rendering/SelectionRenderer.ts`)
  - Highlight rectangle on selected tile (yellow border)
  - Tint reachable tiles (green overlay) when a unit is selected
  - Updates on game events; sits above terrain layer, below UI
  - No game logic — reads selection state from MapView and valid-move list from engine
  - *Blocked by: #14*

- [ ] **#17** Implement UnitRenderer (`src/rendering/UnitRenderer.ts`)
  - Render each unit as a colored circle or simple sprite on the unit layer
  - Position: `tile.x * TILE_SIZE`, `tile.y * TILE_SIZE`
  - Sync with game state after every dispatch: add/remove sprites on create/remove, update on `UNIT_MOVED`
  - No game logic
  - *Blocked by: #13, #10*

---

## Phase 5 — Views & UI

- [ ] **#18** Implement MapView — wires input, camera, and renderers (`src/views/MapView.ts`)
  - Owns PixiJS stage; coordinates MapRenderer, UnitRenderer, SelectionRenderer, camera
  - Click: `screenToTile` → select unit (priority) or tile
  - Unit selected + click valid tile → dispatch `MOVE_UNIT`
  - `F` key + unit selected → dispatch `FOUND_COLONY`
  - Hover → show tile coord and terrain in tooltip
  - Escape clears selection
  - Processes returned `GameEvent[]` to sync renderers
  - *Blocked by: #15, #16, #17*

- [ ] **#19** Implement UIView — HUD panels (`src/views/UIView.ts`)
  - Active unit panel: unit type, movement points remaining
  - Tile info panel: coordinates, terrain type
  - Turn counter display
  - Colony info panel: name, stored food, stored lumber (shown when colony tile selected)
  - End Turn button → dispatch `END_TURN`, update turn counter
  - All data sourced from `engine.getState()` — no game logic in UI
  - *Blocked by: #10*

- [ ] **#20** Implement save/load UI (buttons + file serialization)
  - Save button: `engine.save()` → `JSON.stringify` → download as `.json` (or localStorage)
  - Load button: file input or localStorage → parse JSON → `engine.load(data)` → re-render
  - Show error message on invalid file
  - Confirm before overwriting current game on load
  - *Blocked by: #11, #19*

- [ ] **#21** Implement BootView and PreloadView (`src/views/BootView.ts`, `PreloadView.ts`)
  - BootView: init PixiJS Application, size canvas to window, append to DOM
  - PreloadView: generate tile textures via TileAtlas, load sprite sheets, show loading indicator
  - On complete: transition to MapView
  - Game engine init (`createGameEngine(seed)`) happens in `main.ts`
  - *Blocked by: #13*

---

## Phase 6 — Integration & Tests

- [ ] **#22** Wire everything in `main.ts` and verify MVP acceptance criteria
  - `createGameEngine("mvp-seed-1")` → PixiJS app → BootView → PreloadView → MapView + UIView
  - Verify all MVP acceptance criteria (game_specs.md §26):
    - `npm install`, `npm run dev`, `npm run build`, `npm test` all pass
    - Browser opens to playable map; unit can move, found colony, end turn
    - Save/load restores turn, map, units, colonies, stored goods
    - No PixiJS objects in save file
    - Game logic and rendering stay in separate folders with no cross-mutation
  - *Blocked by: #18, #19, #20, #21*

- [ ] **#23** Write rendering/UI unit tests (`src/rendering/**/*.test.ts`, `src/views/**/*.test.ts`)
  - `screenToTile` handles camera offset and zoom correctly
  - Selection priority: unit > colony > tile
  - Escape clears selection state
  - Rendering modules do not import game logic with mutation
  - Game rules are not imported from rendering modules
  - No PixiJS instantiation required for these helper tests
  - *Blocked by: #18*

---

## MVP Acceptance Checklist

- [ ] `npm install` completes from clean checkout
- [ ] `npm run dev` starts without runtime errors
- [ ] `npm run build` completes successfully
- [ ] `npm test` passes all tests
- [ ] Browser opens to a playable map screen
- [ ] Deterministic 64×40 map generates on startup
- [ ] Terrain renders with visually distinct land and water
- [ ] Camera pans across the map
- [ ] Camera zooms at 0.5×, 1×, 2×
- [ ] Hovering a tile shows coordinates and terrain type
- [ ] Clicking a tile selects and visibly marks it
- [ ] At least one player-owned land unit exists at startup
- [ ] Clicking a unit selects it and shows unit info
- [ ] Selected unit can move to a valid adjacent land tile
- [ ] Invalid movement is rejected without mutating state
- [ ] Valid unit can found a colony on an allowed tile
- [ ] Founded colonies appear on map and in game state
- [ ] End turn advances the turn counter by one
- [ ] End turn applies basic colony food and lumber production
- [ ] Game state can be saved to JSON
- [ ] Saved JSON can be loaded back
- [ ] Load restores turn, map, units, colonies, and stored goods
- [ ] PixiJS display objects are not in the save file
- [ ] Game rules can be tested without a PixiJS application
- [ ] UI/rendering and game logic are in separate source folders
