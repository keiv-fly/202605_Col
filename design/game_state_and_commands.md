# Game State And Commands Design

## Purpose

Define the authoritative game state, command flow, events, and module boundaries.

The game engine owns state. PixiJS and HTML UI code can query state and dispatch commands, but they must not mutate game state directly.

## Source Files

```text
src/game/GameEngine.ts
src/game/GameState.ts
src/game/ids.ts
src/game/rules/turn.ts
src/game/rules/founding.ts
src/game/units/movement.ts
src/game/colonies/production.ts
```

## Engine API

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

## State Ownership

Rules:

* `GameEngine` is the only object allowed to replace or mutate `GameState`.
* Rendering code receives read-only snapshots or event payloads.
* UI code dispatches commands and renders returned events.
* Tests should be able to create and use `GameEngine` without PixiJS.

## Minimum State Shape

```ts
type GameState = {
  turn: number;
  currentPlayerId: PlayerId;
  map: GameMap;
  players: Player[];
  units: Record<UnitId, Unit>;
  colonies: Record<ColonyId, Colony>;
  market: MarketState;
  rngState: RngState;
};
```

MVP can omit diplomacy and native settlements from active behavior, but types can exist as empty records if useful.

## ID Rules

Use string IDs with readable prefixes:

```ts
type PlayerId = string; // "player_1"
type UnitId = string; // "unit_1"
type ColonyId = string; // "colony_1"
```

ID generation must be deterministic and owned by game logic.

## Commands

MVP commands:

```ts
type GameCommand =
  | { type: "MOVE_UNIT"; unitId: UnitId; target: TileCoord }
  | { type: "FOUND_COLONY"; unitId: UnitId; name: string }
  | { type: "END_TURN" }
  | { type: "SAVE_GAME" }
  | { type: "LOAD_GAME"; save: SerializedGame };
```

`SAVE_GAME` can return a game event containing serialized data, or the UI can call `engine.save()` directly.

## Events

MVP events:

```ts
type GameEvent =
  | { type: "UNIT_MOVED"; unitId: UnitId; from: TileCoord; to: TileCoord }
  | { type: "UNIT_MOVE_REJECTED"; unitId: UnitId; reason: string }
  | { type: "COLONY_FOUNDED"; colonyId: ColonyId; x: number; y: number }
  | { type: "COLONY_FOUNDING_REJECTED"; unitId: UnitId; reason: string }
  | { type: "GOODS_PRODUCED"; colonyId: ColonyId; goods: Partial<GoodsStockpile> }
  | { type: "TURN_ENDED"; previousTurn: number; newTurn: number }
  | { type: "GAME_SAVED"; save: SerializedGame }
  | { type: "GAME_LOADED" };
```

Events are facts about what happened. They should not contain PixiJS objects, DOM nodes, or callbacks.

## Dispatch Rules

Every command follows this flow:

1. Validate command shape.
2. Validate command against current state.
3. If invalid, return a rejection event and leave state unchanged.
4. If valid, apply state change.
5. Return one or more events describing the change.

## Initial Game State

`createGameEngine(seed)` should initialize:

* turn 1
* one player
* one generated 64x40 map
* one land unit owned by the player
* empty colonies
* empty or default market
* deterministic RNG state

## Tests

Required unit tests:

* creating an engine does not require PixiJS
* initial state has one player and one unit
* valid commands mutate state and return events
* invalid commands return rejection events and preserve state
* `getState()` does not allow UI code to mutate authoritative state accidentally
* events never include PixiJS or DOM objects
