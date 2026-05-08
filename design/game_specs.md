# Colonization-Like Game Specification

## 1. Project Goal

Create a turn-based strategy/economic simulation game inspired by classic *Colonization*-style gameplay.

The game should start as a **PixiJS + TypeScript** project and be designed so that calculation-heavy systems can later be moved to **Rust compiled to WebAssembly**.

The guiding principle is:

> PixiJS is the view and interaction layer. The game engine is separate from PixiJS.

PixiJS should handle rendering, input, camera, animation, and UI. The game rules should live in a separate pure logic layer that can later be rewritten or replaced by Rust/WASM.

---

## 2. Target Platform

### Initial Target

* Browser-based PC game
* Built with TypeScript
* Rendered with PixiJS
* Bundled with Vite or similar modern frontend tooling

### Later Target

* Desktop app using Tauri or Electron
* Prefer Tauri if Rust becomes an important part of the project
* Keep the browser version functional during development

---

## 3. Recommended Technology Stack

### Frontend / Game Client

* **TypeScript**
* **PixiJS**
* **Vite**
* HTML/CSS for surrounding UI if needed

### Game Logic, Phase 1

* Pure TypeScript game engine layer
* No direct dependency on PixiJS inside the core rules

### Game Logic, Phase 2

* Rust core compiled to WebAssembly
* TypeScript wrapper around WASM module
* Rust used only after profiling shows bottlenecks

### Desktop Packaging, Later

Preferred:

* **Tauri**

Alternative:

* Electron

Tauri is attractive because the project may already use Rust for simulation, AI, pathfinding, or save/load logic.

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

Later Rust/WASM Core
  - expensive AI planning
  - pathfinding
  - economic simulation
  - trade route optimization
  - large-scale turn simulation
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

This keeps the future Rust migration realistic.

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

This is easier to migrate to Rust and usually faster than nested arrays.

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

Economy logic is a good candidate for later Rust migration if the map, colony count, or AI simulations become large.

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

Later, move to Rust if pathfinding becomes expensive.

Pathfinding API should be isolated from PixiJS:

```ts
findPath(
  state: GameState,
  unitId: UnitId,
  target: TileCoord
): PathResult;
```

Later Rust-compatible API:

```ts
wasm.find_path(unitId, targetX, targetY);
```

Avoid calling Rust once per tile. Ask for a complete path or complete movement range in one call.

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

AI is one of the best candidates for Rust/WASM later because it may require many simulations or searches.

---

## 20. Rust/WASM Migration Strategy

Do not start with Rust immediately unless there is a known performance need.

Start in TypeScript for faster iteration.

Move systems to Rust only after profiling.

### Good Rust Candidates

| System             | Rust Suitability | Reason                            |
| ------------------ | ---------------: | --------------------------------- |
| AI planning        |             High | potentially expensive             |
| pathfinding        |             High | repeated graph search             |
| economy simulation |      Medium/High | many colonies/tiles               |
| trade optimization |             High | combinatorial logic               |
| combat simulation  |           Medium | usually cheap but easy to isolate |
| save compression   |           Medium | useful but not urgent             |
| rendering          |              Low | keep in PixiJS                    |
| UI                 |              Low | keep in TypeScript                |

### JS/WASM Boundary Rule

Avoid many small calls like:

```ts
wasm.get_tile_food(x, y);
wasm.get_tile_ore(x, y);
wasm.get_tile_owner(x, y);
```

Prefer large calls:

```ts
wasm.simulate_turn();
wasm.calculate_ai_orders(playerId);
wasm.find_path(unitId, targetX, targetY);
wasm.export_visible_map_buffer();
```

---

## 21. Rust Ownership Models

There are two possible Rust integration models.

### Model A: TypeScript Owns State, Rust Computes Helpers

TypeScript keeps `GameState`.

Rust receives serialized chunks of data and returns results.

Pros:

* easier to add incrementally
* easier debugging in TypeScript
* simpler save/load at first

Cons:

* serialization overhead
* duplicated data structures
* less performance benefit

Good for:

* pathfinding
* local calculations
* isolated AI helpers

### Model B: Rust Owns Core State

Rust owns the full game state.

TypeScript/PixiJS asks Rust for snapshots or render buffers.

Pros:

* best performance
* clean simulation ownership
* good for large maps

Cons:

* harder debugging
* more complicated UI integration
* more up-front design required

Good for later stages if the game becomes simulation-heavy.

### Recommended Path

Start with Model A.

Move toward Model B only if necessary.

---

## 22. PixiJS View Structure

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

## 23. Suggested Source Layout

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

  wasm/
    colonizationCore.ts
    types.ts
```

Later:

```text
rust-core/
  Cargo.toml
  src/
    lib.rs
    state.rs
    map.rs
    pathfinding.rs
    economy.rs
    ai.rs
```

---

## 24. Game Engine API

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

## 25. Save/Load Specification

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
* Rust-based serialization
* autosave
* save thumbnails

---

## 26. Rendering Performance Guidelines

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
* calling Rust/WASM for tiny per-tile queries
* mixing PixiJS objects into saved game state
* making movement or economy depend on frame rate

---

## 27. UI Specification

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

## 28. MVP Scope

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

---

## 29. Phase Plan

### Phase 1: Visual Prototype

* PixiJS project setup
* tile atlas
* tilemap rendering
* camera pan/zoom
* tile hover and selection
* simple unit sprite

### Phase 2: Game State Prototype

* pure TypeScript `GameState`
* map model
* units
* movement rules
* command/event system

### Phase 3: First Colony Loop

* found colony
* assign worker
* produce food/lumber
* construction queue
* end turn processing

### Phase 4: Exploration and Fog

* discovered tiles
* visible tiles
* fog-of-war rendering
* scout/explorer unit

### Phase 5: Economy Expansion

* more goods
* storage
* manufacturing
* Europe market screen
* ships and cargo

### Phase 6: AI Prototype

* simple AI exploration
* colony founding
* basic production choices

### Phase 7: Profiling

* measure turn resolution time
* measure pathfinding time
* measure rendering time
* identify bottlenecks

### Phase 8: Rust/WASM Integration

Move only the slow systems first:

* pathfinding, or
* AI planning, or
* economy simulation

Do not migrate everything to Rust just because Rust is available.

---

## 30. Non-Goals for Early Version

Avoid these at the beginning:

* multiplayer
* huge maps
* complex diplomacy
* advanced AI
* perfect historical simulation
* custom binary save format
* full Rust core from day one
* highly animated tactical combat
* isometric rendering

These can be added later after the core loop works.

---

## 31. Key Technical Decisions

### Use PixiJS?

Yes.

PixiJS is enough for drawing a Colonization-like 2D tile map.

### Use Rust immediately?

No.

Start with TypeScript logic, but keep it isolated so Rust can replace parts later.

### Use 16×16 tiles like the old game?

No, unless making a strict retro clone.

Use 64×64 source art for a modern readable game.

### Store economic game data in TypeScript or Rust?

Initially TypeScript.

Later, if the simulation core moves to Rust, Rust may own the authoritative simulation state.

### Should PixiJS own the game state?

No.

PixiJS should render and interact with the state, not be the state.

---

## 32. Implementation Rule of Thumb

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
| AI planning                   | game engine, later Rust candidate |

---

## 33. Final Recommended Baseline

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
Rust: later, via WebAssembly, after profiling
Desktop: Tauri later if needed
```

The project should be built as a clean TypeScript strategy-game engine with PixiJS as the front-end renderer. That gives the fastest development path now and preserves the option to move performance-sensitive logic to Rust later.
