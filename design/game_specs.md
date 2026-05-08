# Colonization-Like Game Specification

## 1. Project Goal

Create a turn-based strategy/economic simulation game inspired by classic *Colonization*-style gameplay.

The game should start as a **PixiJS + TypeScript** project with a clear separation between the UI/rendering layer and the pure game logic layer.

The guiding principle is:

> PixiJS is the view and interaction layer. The game engine is separate from PixiJS.

PixiJS should handle rendering, input, camera, animation, and UI. The game rules should live in a separate pure TypeScript logic layer.

---

## 2. Target Platform

### Initial Target

* Browser-based PC game
* Built with TypeScript
* Rendered with PixiJS
* Bundled with Vite or similar modern frontend tooling

---

## 3. Recommended Technology Stack

### Frontend / Game Client

* **TypeScript**
* **PixiJS**
* **Vite**
* HTML/CSS for surrounding UI if needed

### Game Logic

* Pure TypeScript game engine layer
* No direct dependency on PixiJS inside the core rules

---

## 4. High-Level Architecture

```text
PixiJS / TypeScript Client
  - map rendering
  - input handling
  - camera and zoom
  - animation
  - UI panels
  - menus
  - save/load screens

Game Engine Layer
  - map state
  - units
  - settlements
  - economy
  - production
  - movement
  - combat
  - diplomacy
  - AI
  - pathfinding
  - turn resolution
```

The PixiJS application layer should call the game engine through a small API. It should not directly own or mutate the authoritative game state.

---

## 5. Core Design Principle

Avoid this pattern:

```ts
class MapView {
  update() {
    colony.food += colony.farmers * 2;
    colony.tools -= colony.blacksmiths;
  }
}
```

Use this pattern instead:

```ts
// pure game logic
function simulateTurn(state: GameState, orders: Orders): GameState {
  return nextState;
}

// PixiJS displays result
class MapView {
  endTurn() {
    this.gameState = simulateTurn(this.gameState, this.playerOrders);
    this.renderMap(this.gameState);
  }
}
```

This keeps the UI and game rules cleanly separated.

---

## 6. Game Loop Model

The game is primarily **turn-based**, not real-time.

PixiJS still has a rendering/update loop, but the strategic game simulation advances mostly through explicit actions:

* player moves a unit
* player changes colony production
* player ends turn
* AI performs turn
* economy resolves
* map updates

PixiJS's frame loop should be used for:

* camera movement
* cursor hover
* animations
* smooth unit movement
* UI responsiveness

The actual strategic simulation should not depend on frame rate.

---

## 7. Map Style

The map should be a square-tile 2D strategic map similar to classic Colonization-style games.

### Tile Shape

* Square tiles
* Orthogonal grid
* No isometric projection for the initial version

### Tile Coordinate System

Use logical tile coordinates:

```ts
type TileCoord = {
  x: number;
  y: number;
};
```

Rendering coordinates should be derived from tile coordinates:

```ts
screenX = tile.x * TILE_SIZE;
screenY = tile.y * TILE_SIZE;
```

Game logic should never depend directly on screen pixels.

---

## 8. Tile Size and Zoom Specification

### Recommended Native Tile Size

Use:

```ts
const TILE_SIZE = 64;
```

Native art should be created at **64×64 px**.

This gives a good balance between:

* classic strategy-game readability
* enough room for terrain detail
* modern monitor resolutions
* usable zoom levels
* manageable asset size

### Zoom Levels

Recommended camera zoom levels:

```ts
const ZOOM_LEVELS = [0.5, 1.0, 2.0];
```

Resulting apparent tile sizes:

| Zoom | Apparent Tile Size | Use Case           |
| ---: | -----------------: | ------------------ |
|  0.5 |           32×32 px | Strategic overview |
|  1.0 |           64×64 px | Normal play        |
|  2.0 |         128×128 px | Close inspection   |

### Original Colonization Reference

The original 1994-style map appears to have used approximately **16×16 px** main-map tiles, depending on version and display mode.

For this new project, do not copy the original tile size directly unless the goal is a very strict retro visual style.

Modern recommendation:

```text
Source art:       64×64
Normal display:   64×64
Zoomed out:       32×32
Zoomed in:       128×128
```

### Pixel Art Rendering

If using pixel art:

* use nearest-neighbor scaling
* avoid smoothing/linear filtering
* design tiles so they remain readable at 32×32

At the zoomed-out level, use simplified overlays and icons rather than trying to show every detail.

---

## 9. Map Rendering Layers

The map should be rendered in layers.

Recommended layer order:

```text
1. Base terrain layer
   - ocean
   - plains
   - grassland
   - forest
   - hills
   - mountains
   - desert
   - tundra

2. Feature/resource layer
   - rivers
   - bonus resources
   - special terrain features

3. Improvement layer
   - roads
   - farms
   - mines
   - cleared forest
   - irrigation

4. Settlement layer
   - colonies
   - native villages
   - ports

5. Unit layer
   - ships
   - scouts
   - soldiers
   - pioneers
   - wagon trains
   - colonists

6. Selection/path layer
   - selected tile
   - movement range
   - planned route
   - attack target

7. Fog-of-war layer
   - unexplored tiles
   - currently hidden tiles

8. UI layer
   - buttons
   - panels
   - tooltips
   - minimap
```

Use batched PixiJS containers, pixi-tilemap-style terrain layers, or mesh/particle-based renderers for mostly static terrain and PixiJS sprites for dynamic objects.

---

## 10. PixiJS Rendering Rules

### Use Batched PixiJS Terrain Rendering For

* terrain
* ocean/land tiles
* forests/hills/mountains
* static tile improvements
* possibly roads/rivers if simple

### Use Sprites For

* units
* colonies
* selection markers
* animated effects
* hover highlights
* movement arrows
* temporary UI markers

### Avoid

Do not create every map tile as an individual PixiJS Sprite on large maps.

Bad for large maps:

```ts
for every tile:
  create Sprite
```

Better:

```ts
create batched terrain layers for terrain
create Sprites only for dynamic entities
```

---

## 11. Suggested Map Sizes

Initial development map:

```text
64×40 tiles
```

Early playable map:

```text
128×80 tiles
```

Larger target map:

```text
256×128 tiles
```

Potential large map:

```text
512×256 tiles
```

For very large maps, add chunking, culling, and selective rendering updates.

---

## 12. Game State Model

The game engine should own the authoritative game state.

PixiJS should display that state but not be the state.

### Core State Shape

```ts
type GameState = {
  turn: number;
  currentPlayerId: PlayerId;
  map: GameMap;
  players: Player[];
  units: Record<UnitId, Unit>;
  colonies: Record<ColonyId, Colony>;
  nativeSettlements: Record<NativeSettlementId, NativeSettlement>;
  diplomacy: DiplomacyState;
  market: MarketState;
  rngState: RngState;
};
```

### Map Shape

```ts
type GameMap = {
  width: number;
  height: number;
  tiles: Tile[];
};
```

Use a flat array internally:

```ts
const index = y * width + x;
const tile = tiles[index];
```

This is usually faster and simpler to index than nested arrays.

### Tile Shape

```ts
type Tile = {
  terrain: TerrainType;
  resource?: ResourceType;
  riverMask: number;
  roadMask: number;
  ownerId?: PlayerId;
  colonyId?: ColonyId;
  nativeSettlementId?: NativeSettlementId;
  discoveredBy: PlayerVisibilityMask;
  visibleTo: PlayerVisibilityMask;
};
```

---

## 13. Terrain Types

Initial terrain set:

```ts
type TerrainType =
  | "ocean"
  | "coast"
  | "plains"
  | "grassland"
  | "forest"
  | "hills"
  | "mountains"
  | "desert"
  | "tundra"
  | "marsh";
```

Each terrain should define:

* movement cost
* food yield
* lumber yield
* ore yield
* trade goods yield
* defensive modifier
* valid improvements
* valid resources

Example:

```ts
type TerrainDefinition = {
  id: TerrainType;
  movementCost: number;
  baseYield: Yield;
  defenseModifier: number;
  canHaveRoad: boolean;
  canHaveRiver: boolean;
  canFoundColony: boolean;
};
```

---

## 14. Yield System

Use a generic yield object:

```ts
type Yield = {
  food: number;
  lumber: number;
  ore: number;
  sugar: number;
  tobacco: number;
  cotton: number;
  furs: number;
  silver: number;
  tradeGoods: number;
  crosses: number;
  bells: number;
  tools: number;
  muskets: number;
};
```

Not every tile or building uses every field, but a unified model simplifies production calculations.

---

## 15. Unit System

### Unit Shape

```ts
type Unit = {
  id: UnitId;
  ownerId: PlayerId;
  type: UnitType;
  profession?: ProfessionType;
  x: number;
  y: number;
  movementPoints: number;
  cargo: CargoStack[];
  experience: number;
  orders?: UnitOrder;
};
```

### Initial Unit Types

```ts
type UnitType =
  | "free_colonist"
  | "indentured_servant"
  | "petty_criminal"
  | "expert_farmer"
  | "expert_lumberjack"
  | "expert_ore_miner"
  | "expert_fisherman"
  | "pioneer"
  | "soldier"
  | "dragoon"
  | "scout"
  | "wagon_train"
  | "caravel"
  | "merchantman"
  | "privateer";
```

### Professions

Professions should be data-driven:

```ts
type ProfessionType =
  | "farmer"
  | "fisherman"
  | "lumberjack"
  | "ore_miner"
  | "blacksmith"
  | "carpenter"
  | "statesman"
  | "preacher"
  | "soldier"
  | "pioneer"
  | "scout";
```

---

## 16. Colony System

### Colony Shape

```ts
type Colony = {
  id: ColonyId;
  ownerId: PlayerId;
  name: string;
  x: number;
  y: number;
  population: ColonistAssignment[];
  storage: GoodsStockpile;
  buildings: BuildingType[];
  constructionQueue: ConstructionItem[];
  workedTiles: TileCoord[];
};
```

### Colony Responsibilities

A colony should support:

* food production
* raw material production
* manufactured goods production
* population growth
* construction
* storage limits
* immigration/religion mechanics
* liberty/rebel sentiment mechanics
* defense
* import/export rules

---

## 17. Economy Simulation

The economy should be one of the central systems.

Each turn:

```text
1. collect tile yields
2. apply worker expertise bonuses
3. add building modifiers
4. consume food
5. produce manufactured goods
6. update storage
7. check starvation/growth
8. advance construction
9. update bells/crosses/political points
10. update market effects if goods are sold
```

Economy logic should stay in the game engine layer so it can be tested independently from rendering.

---

## 18. Movement and Pathfinding

### Movement Rules

Each unit has movement points.

Movement cost depends on:

* terrain
* roads
* rivers
* unit type
* embark/disembark rules
* enemy zones
* transport capacity

### Pathfinding

Start with TypeScript A*.

Pathfinding API should be isolated from PixiJS:

```ts
findPath(
  state: GameState,
  unitId: UnitId,
  target: TileCoord
): PathResult;
```

Return complete paths or movement ranges from the pathfinding layer rather than leaking step-by-step rendering details into the game engine.

---

## 19. AI System

AI should be modular.

Initial AI can be simple:

* explore unknown map
* found colonies near good terrain
* produce food and lumber
* build basic improvements
* send goods to Europe
* defend colonies

Later AI can become more sophisticated:

* long-term planning
* trade route optimization
* colony specialization
* threat evaluation
* military campaigns
* diplomacy

AI should stay in the game engine layer and communicate with the UI through commands and events.

---

## 20. PixiJS View Structure

Recommended views/modules:

```text
BootView
  - basic startup
  - config

PreloadView
  - load tilesets
  - load unit sprites
  - load UI assets

MainMenuView
  - new game
  - load game
  - settings

MapView
  - world map rendering
  - tile selection
  - unit selection
  - camera movement

UIView
  - buttons
  - status bars
  - active unit panel
  - turn button

ColonyView
  - colony management screen
  - population assignments
  - production queue
  - storage

EuropeView
  - buy/sell goods
  - recruit colonists
  - purchase ships/equipment

DiplomacyView
  - diplomacy interactions

DebugView
  - optional development overlays
```

The UI can be built either directly in PixiJS or with HTML overlays. For a management-heavy game, HTML UI may be easier for complex colony panels.

---

## 21. Suggested Source Layout

```text
src/
  main.ts

  views/
    BootView.ts
    PreloadView.ts
    MainMenuView.ts
    MapView.ts
    UIView.ts
    ColonyView.ts
    EuropeView.ts

  rendering/
    MapRenderer.ts
    UnitRenderer.ts
    FogRenderer.ts
    SelectionRenderer.ts
    TileAtlas.ts

  game/
    GameEngine.ts
    GameState.ts
    ids.ts
    rng.ts

    map/
      GameMap.ts
      terrain.ts
      resources.ts
      visibility.ts
      mapGeneration.ts

    units/
      Unit.ts
      movement.ts
      professions.ts
      cargo.ts

    colonies/
      Colony.ts
      production.ts
      buildings.ts
      population.ts
      storage.ts

    economy/
      goods.ts
      market.ts
      trade.ts

    rules/
      turn.ts
      combat.ts
      diplomacy.ts
      founding.ts

    ai/
      aiController.ts
      explorationAI.ts
      colonyAI.ts
      tradeAI.ts

    pathfinding/
      astar.ts
      movementCost.ts
```

---

## 22. Game Engine API

The PixiJS layer should interact with the engine through commands and queries.

### Commands

```ts
type GameCommand =
  | { type: "MOVE_UNIT"; unitId: UnitId; target: TileCoord }
  | { type: "FOUND_COLONY"; unitId: UnitId; name: string }
  | { type: "SET_COLONY_PRODUCTION"; colonyId: ColonyId; item: ConstructionItem }
  | { type: "ASSIGN_WORKER"; colonyId: ColonyId; colonistId: ColonistId; assignment: WorkerAssignment }
  | { type: "END_TURN" };
```

### Engine Interface

```ts
interface GameEngine {
  getState(): Readonly<GameState>;
  dispatch(command: GameCommand): GameEvent[];
  getValidMoves(unitId: UnitId): TileCoord[];
  getTileInfo(x: number, y: number): TileInfo;
  save(): SerializedGame;
  load(save: SerializedGame): void;
}
```

### Events

The engine should return events that the UI can animate or display:

```ts
type GameEvent =
  | { type: "UNIT_MOVED"; unitId: UnitId; from: TileCoord; to: TileCoord }
  | { type: "COLONY_FOUNDED"; colonyId: ColonyId; x: number; y: number }
  | { type: "GOODS_PRODUCED"; colonyId: ColonyId; goods: GoodsStockpile }
  | { type: "COMBAT_RESOLVED"; attackerId: UnitId; defenderId: UnitId; result: CombatResult }
  | { type: "TURN_ENDED"; newTurn: number };
```

This design makes it easier to animate results in PixiJS without mixing rules into rendering.

---

## 23. Save/Load Specification

Start with JSON saves.

```ts
type SerializedGame = {
  version: number;
  createdAt: string;
  state: GameState;
};
```

Requirements:

* include version number
* include RNG state
* include all map visibility
* include all players, units, colonies, diplomacy, and market state
* avoid saving PixiJS display objects

Later improvements:

* compression
* binary saves
* autosave
* save thumbnails

---

## 24. Rendering Performance Guidelines

### Do

* use tilemap layers for terrain
* use sprites for units and colonies
* update only changed tiles when possible
* use camera culling
* keep game logic separate from render loop
* batch visual updates after turn resolution

### Avoid

* thousands of independent tile sprites
* recalculating the full economy every frame
* mixing PixiJS objects into saved game state
* making movement or economy depend on frame rate

---

## 25. UI Specification

Main map UI should include:

* minimap
* active unit panel
* tile info panel
* current colony/settlement info
* current goods/money/political status
* end turn button
* action buttons for selected unit
* message log

Unit action buttons may include:

* move
* fortify
* build road
* clear forest
* build colony
* load cargo
* unload cargo
* sail to Europe
* skip turn

Colony UI should include:

* population list
* worker assignment grid
* surrounding tiles
* production queue
* stored goods
* buildings
* food surplus/deficit
* construction progress

---

## 26. MVP Scope

The first playable prototype should be small.

### MVP Features

* generate or load a small map
* render terrain in PixiJS
* camera pan and zoom
* select tiles
* select units
* move a unit on land
* found a colony
* basic colony food/lumber production
* end turn
* save/load JSON

### MVP Map

```text
64×40 tiles
```

### MVP Tile Size

```text
64×64 source tiles
```

### MVP Zoom

```text
0.5×, 1×, 2×
```

### MVP Acceptance Criteria

The MVP is complete when all of the following are true:

* `npm install` completes successfully from a clean checkout
* `npm run dev` starts a local development server without runtime errors
* `npm run build` completes successfully
* `npm test` completes successfully
* the browser opens to a playable map screen, not a landing page
* a deterministic 64×40 square-tile map is generated or loaded on startup
* terrain renders through PixiJS with visually distinct land and water tiles
* the camera can pan across the map
* the camera can switch between 0.5×, 1×, and 2× zoom levels
* hovering a tile shows enough tile information to identify its coordinates and terrain type
* clicking a tile selects it and visibly marks the selected tile
* at least one player-owned land unit exists on the map at startup
* clicking a unit selects it and shows its basic unit information
* a selected land unit can move to a valid adjacent land tile
* invalid movement is rejected and does not mutate the authoritative game state
* a selected valid unit can found a colony on an allowed land tile
* founded colonies appear on the map and are stored in the game state
* ending the turn advances the turn counter by one
* ending the turn applies basic colony food and lumber production
* the game state can be saved to JSON
* a saved JSON game can be loaded back into the game
* loading a saved game restores turn number, map, units, colonies, and stored goods
* PixiJS display objects are not stored in the save file
* game rules can be tested without creating a PixiJS application
* UI/rendering code and game logic remain separated into their own source folders

---

## 27. Milestone Plan

### Visual Prototype

* PixiJS project setup
* tile atlas
* tilemap rendering
* camera pan/zoom
* tile hover and selection
* simple unit sprite

### Game State Prototype

* pure TypeScript `GameState`
* map model
* units
* movement rules
* command/event system

### First Colony Loop

* found colony
* assign worker
* produce food/lumber
* construction queue
* end turn processing

### Exploration and Fog

* discovered tiles
* visible tiles
* fog-of-war rendering
* scout/explorer unit

### Economy Expansion

* more goods
* storage
* manufacturing
* Europe market screen
* ships and cargo

### AI Prototype

* simple AI exploration
* colony founding
* basic production choices

### Performance Review

* measure turn resolution time
* measure pathfinding time
* measure rendering time
* identify bottlenecks

---

## 28. Non-Goals for Early Version

Avoid these at the beginning:

* multiplayer
* huge maps
* complex diplomacy
* advanced AI
* perfect historical simulation
* custom binary save format
* highly animated tactical combat
* isometric rendering

These can be added later after the core loop works.

---

## 29. Key Technical Decisions

### Use PixiJS?

Yes.

PixiJS is enough for drawing a Colonization-like 2D tile map.

### Use 16×16 tiles like the old game?

No, unless making a strict retro clone.

Use 64×64 source art for a modern readable game.

### Store economic game data in TypeScript?

Yes. The authoritative simulation state should live in the TypeScript game engine layer.

### Should PixiJS own the game state?

No.

PixiJS should render and interact with the state, not be the state.

---

## 30. Implementation Rule of Thumb

Every time a new system is added, ask:

> Could this system run without PixiJS?

If yes, it belongs in the game engine layer.

If no, it probably belongs in rendering/UI.

Examples:

| Feature                       | Belongs In                        |
| ----------------------------- | --------------------------------- |
| terrain yield calculation     | game engine                       |
| unit movement rules           | game engine                       |
| pathfinding                   | game engine                       |
| drawing terrain tiles         | PixiJS rendering                  |
| camera zoom                   | PixiJS rendering                  |
| button click handling         | PixiJS/UI                         |
| colony production queue logic | game engine                       |
| colony panel layout           | PixiJS/UI or HTML UI              |
| AI planning                   | game engine                       |

---

## 31. Final Recommended Baseline

Start with this exact baseline:

```text
Language: TypeScript
Framework: PixiJS
Bundler: Vite
Tile size: 64×64 source art
Zoom levels: 0.5×, 1×, 2×
Map type: square orthogonal tilemap
Initial map: 64×40
Target map: 128×80 or larger
Game state: pure TypeScript object model
Rendering: batched PixiJS terrain layers + sprites
Save/load: JSON first
```

The project should be built as a clean TypeScript strategy-game engine with PixiJS as the front-end renderer. The UI/rendering code and game logic should remain in separate folders and communicate through commands, queries, and events.
