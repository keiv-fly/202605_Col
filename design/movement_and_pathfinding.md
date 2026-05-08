# Movement And Pathfinding Design

## Purpose

Define MVP movement rules and pathfinding contracts for land units.

Movement rules belong in the game logic layer. Rendering code only displays valid moves, planned paths, and results.

## Source Files

```text
src/game/units/movement.ts
src/game/pathfinding/astar.ts
src/game/pathfinding/movementCost.ts
src/game/map/terrain.ts
```

## Unit Movement Model

Each unit has:

```ts
type Unit = {
  id: UnitId;
  ownerId: PlayerId;
  type: UnitType;
  x: number;
  y: number;
  movementPoints: number;
  maxMovementPoints: number;
  cargo: CargoStack[];
  orders?: UnitOrder;
};
```

MVP land units:

| Unit Type       | Max Movement |
| --------------- | ------------ |
| free_colonist   | 1            |
| pioneer         | 1            |
| scout           | 2            |
| soldier         | 1            |
| wagon_train     | 1            |

## Terrain Movement Costs

| Terrain   | Land Unit Cost | Enterable By Land |
| --------- | -------------- | ----------------- |
| ocean     | blocked        | no                |
| coast     | blocked        | no                |
| plains    | 1              | yes               |
| grassland | 1              | yes               |
| forest    | 2              | yes               |
| hills     | 2              | yes               |
| mountains | 3              | yes               |
| desert    | 2              | yes               |
| tundra    | 2              | yes               |
| marsh     | 3              | yes               |

If a unit has fewer movement points than the destination cost, movement is rejected.

## MVP Movement Rules

* Movement is orthogonal only: north, south, east, west.
* Diagonal movement is not allowed in MVP.
* Units cannot move outside the map.
* Land units cannot enter ocean or coast tiles.
* Units cannot move onto a tile occupied by another unit owned by the same player.
* Enemy units can be treated as blocked in MVP.
* Movement reduces movement points by destination terrain cost.
* Movement points reset to max at the start of the owning player's turn.

## Public API

```ts
function canMoveUnit(
  state: GameState,
  unitId: UnitId,
  target: TileCoord
): MoveValidation;

type MoveValidation =
  | { ok: true; cost: number }
  | { ok: false; reason: string };

function moveUnit(
  state: GameState,
  unitId: UnitId,
  target: TileCoord
): { state: GameState; events: GameEvent[] };

function getValidMoves(state: GameState, unitId: UnitId): TileCoord[];
```

## Pathfinding

Use A* for paths longer than one tile.

```ts
function findPath(
  state: GameState,
  unitId: UnitId,
  target: TileCoord
): PathResult;

type PathResult =
  | { ok: true; path: TileCoord[]; totalCost: number }
  | { ok: false; reason: string };
```

MVP can support adjacent movement first. A* should still be isolated so longer movement can be added later without changing UI contracts.

## Turn Reset

On `END_TURN`:

* increment turn
* reset every unit owned by current player to `maxMovementPoints`

For single-player MVP, the current player remains the same.

## Tests

Required unit tests:

* land unit can move to adjacent plains tile
* land unit cannot move into ocean or coast
* movement outside map is rejected
* diagonal movement is rejected
* movement with insufficient movement points is rejected
* valid movement updates unit coordinates and movement points
* invalid movement leaves state unchanged
* `getValidMoves` returns only legal orthogonal destinations
* movement points reset on end turn
