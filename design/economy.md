# Economy Design

## Purpose

Define MVP colony production and goods storage rules.

Economy logic belongs in the game engine layer. UI code displays current production, deficits, and stored goods but does not calculate them.

## Source Files

```text
src/game/economy/goods.ts
src/game/economy/market.ts
src/game/colonies/production.ts
src/game/rules/turn.ts
src/game/map/terrain.ts
```

## Goods

MVP goods:

```ts
type GoodsType = "food" | "lumber";

type GoodsStockpile = {
  food: number;
  lumber: number;
};
```

Other goods can exist in broader type definitions, but MVP production only needs food and lumber.

## Terrain Base Yields

| Terrain   | Food | Lumber |
| --------- | ---- | ------ |
| plains    | 2    | 0      |
| grassland | 3    | 0      |
| forest    | 1    | 2      |
| hills     | 1    | 0      |
| mountains | 0    | 0      |
| desert    | 1    | 0      |
| tundra    | 1    | 0      |
| marsh     | 1    | 1      |
| coast     | 1    | 0      |
| ocean     | 1    | 0      |

MVP colonies only work land tiles. Water yields can be used later.

## Colony Production Inputs

A colony produces from:

* its center tile
* assigned worked tiles

For MVP, if worker assignment UI is not implemented, each colony automatically works:

1. the colony center tile
2. the best adjacent food tile
3. the best adjacent lumber tile

Only tiles inside map bounds can be worked.

## Food Consumption

Each population unit consumes 2 food per turn.

```ts
netFood = producedFood - population * 2;
```

If net food is negative:

* reduce stored food by the deficit
* if stored food would go below 0, clamp food to 0
* MVP does not kill population from starvation
* emit a warning event if food shortage occurred

## Lumber Production

Lumber is added directly to colony storage each turn.

No construction spending is required for MVP unless the colony has a construction queue implemented.

## Storage

MVP storage limit:

```ts
const DEFAULT_STORAGE_LIMIT = 100;
```

Storage rules:

* storage cannot go below 0
* storage cannot exceed storage limit
* excess goods are discarded
* discarded goods can emit a `GOODS_DISCARDED` event later, but are not required for MVP

## Public API

```ts
function calculateColonyYield(
  state: GameState,
  colonyId: ColonyId
): GoodsStockpile;

function applyColonyProduction(
  state: GameState,
  colonyId: ColonyId
): { state: GameState; events: GameEvent[] };

function applyTurnEconomy(state: GameState): {
  state: GameState;
  events: GameEvent[];
};
```

## Event Output

Economy should emit:

```ts
{ type: "GOODS_PRODUCED"; colonyId; goods }
```

Optional MVP warning:

```ts
{ type: "FOOD_SHORTAGE"; colonyId; shortage }
```

## Tests

Required unit tests:

* terrain yields return expected food and lumber
* colony center tile contributes production
* automatic worked tiles are deterministic
* population consumes food
* food cannot go below 0
* lumber is added to storage
* storage caps at 100
* end turn applies production to every colony
* economy tests run without PixiJS
