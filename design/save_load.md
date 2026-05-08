# Save Load Design

## Purpose

Define JSON save/load format, validation rules, and round-trip behavior.

Save/load belongs in the game engine layer. UI code can trigger save/load and store or retrieve serialized text, but it must not alter the schema.

## Source Files

```text
src/game/GameEngine.ts
src/game/GameState.ts
src/game/save/serialize.ts
src/game/save/validate.ts
```

If `src/game/save/` does not exist yet, create it when implementing save/load.

## Save Shape

```ts
type SerializedGame = {
  version: 1;
  createdAt: string;
  state: GameState;
};
```

`createdAt` uses ISO 8601 format from `new Date().toISOString()`.

## Versioning

MVP save version is always `1`.

Load behavior:

* accept version 1
* reject missing version
* reject unsupported versions
* return a clear validation error instead of throwing unhandled exceptions

## Serialization Rules

Saved JSON must include:

* turn number
* current player ID
* map width, height, and tiles
* players
* units
* colonies
* market state
* RNG state
* colony storage and worked tiles

Saved JSON must not include:

* PixiJS display objects
* DOM nodes
* functions
* class instances that cannot be represented as JSON
* circular references

## Public API

```ts
function serializeGame(state: GameState): SerializedGame;

function deserializeGame(save: unknown): DeserializeResult;

type DeserializeResult =
  | { ok: true; state: GameState }
  | { ok: false; errors: string[] };
```

`GameEngine.save()` calls `serializeGame(this.state)`.

`GameEngine.load(save)` validates first, then replaces engine state only when validation succeeds.

## Validation Rules

Validation must check:

* version is 1
* state exists
* map dimensions are positive integers
* tile array length equals width * height
* turn is a positive integer
* current player exists in players
* every unit coordinate is inside map bounds
* every colony coordinate is inside map bounds
* every colony tile has matching `colonyId`
* goods values are non-negative numbers

## Browser Storage

MVP UI can use `localStorage`:

```ts
localStorage.setItem("colonization_mvp_save", JSON.stringify(save));
```

The game engine should not directly depend on `localStorage`.

## Tests

Required unit tests:

* serialize output can be passed to `JSON.stringify`
* save JSON does not contain PixiJS or DOM objects
* save/load round trip restores equivalent game state
* load rejects missing version
* load rejects unsupported version
* load rejects invalid tile array length
* load rejects unit outside map bounds
* failed load does not replace current engine state
