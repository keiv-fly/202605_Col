# Colony Logic Design

## Purpose

Define MVP colony founding, colony data, worked tiles, storage, and basic production integration.

Colony rules belong in the game engine layer. Rendering code only displays colony state and events.

## Source Files

```text
src/game/colonies/Colony.ts
src/game/colonies/production.ts
src/game/colonies/storage.ts
src/game/rules/founding.ts
src/game/rules/turn.ts
```

## Colony Shape

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

MVP can represent population as simple assignments:

```ts
type ColonistAssignment = {
  id: string;
  profession: "farmer" | "lumberjack" | "generalist";
  tile?: TileCoord;
};
```

## Founding Rules

A unit can found a colony when:

* unit exists
* unit belongs to current player
* unit is on a land tile
* tile is not ocean or coast
* tile does not already contain a colony
* tile does not contain a native settlement
* unit type is allowed to found colonies

MVP founding unit types:

```ts
const CAN_FOUND_COLONY = ["free_colonist", "pioneer", "scout"];
```

After founding:

* create a new colony at the unit position
* assign the unit owner as colony owner
* set the tile `colonyId`
* remove the founding unit from `state.units`
* create one population assignment in the colony
* initialize storage with 0 food and 0 lumber
* emit `COLONY_FOUNDED`

## Colony Naming

If UI provides a name, use it after trimming whitespace.

If no name is provided, generate deterministic names:

```text
Colony 1
Colony 2
Colony 3
```

Empty names are rejected or replaced with the generated name.

## Worked Tiles

MVP worked tile rules:

* a colony can work its center tile
* a colony can work orthogonally or diagonally adjacent tiles within radius 1
* a worked tile must be inside map bounds
* a worked tile must be land
* a worked tile cannot be the center tile of another colony

If no manual assignment UI exists, use automatic assignments from `economy.md`.

## Initial Colony State

```ts
{
  population: [
    { id: "colonist_1", profession: "generalist" }
  ],
  storage: { food: 0, lumber: 0 },
  buildings: [],
  constructionQueue: [],
  workedTiles: []
}
```

## Public API

```ts
function canFoundColony(
  state: GameState,
  unitId: UnitId
): FoundingValidation;

type FoundingValidation =
  | { ok: true }
  | { ok: false; reason: string };

function foundColony(
  state: GameState,
  unitId: UnitId,
  name: string
): { state: GameState; events: GameEvent[] };
```

## Tests

Required unit tests:

* valid colonist can found colony on plains
* founding on ocean or coast is rejected
* founding on existing colony tile is rejected
* founding removes the founding unit
* founding creates a colony owned by the unit owner
* founding marks the map tile with `colonyId`
* generated colony names are deterministic
* invalid founding leaves state unchanged
