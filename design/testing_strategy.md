# Testing Strategy Design

## Purpose

Define the tests needed to keep implementation controlled while building the MVP.

Most tests should target pure game logic. PixiJS behavior can be covered with a smaller set of integration tests.

## Tooling

Use:

```text
vitest
```

Expected commands:

```text
npm test
npm run build
```

`npm test` must run in a non-browser test environment for game logic.

## Test Folder Layout

```text
src/game/**/*.test.ts
src/rendering/**/*.test.ts
src/views/**/*.test.ts
```

If browser integration tests are added later, place them under:

```text
tests/browser/
```

## Test Priorities

Priority order:

1. Game state and commands
2. Map generation
3. Movement
4. Colony founding
5. Economy
6. Save/load
7. UI selection helpers
8. Rendering coordinate helpers

## Required Game Logic Tests

Game engine:

* engine can be created without PixiJS
* initial state has turn 1, one player, one unit, and a generated map
* valid command returns success event and updates state
* invalid command returns rejection event and leaves state unchanged

Map:

* deterministic map generation from seed
* tile count equals width * height
* start tile is valid land
* start area has food-producing tiles

Movement:

* valid adjacent land move succeeds
* movement into water is rejected
* movement outside map is rejected
* diagonal movement is rejected
* movement points decrease after movement
* movement points reset on end turn

Colony:

* valid unit can found colony
* invalid founding target is rejected
* founding removes unit and creates colony
* founded colony is reflected on map tile

Economy:

* terrain yields are correct
* end turn applies food and lumber production
* food consumption applies
* storage cannot go below 0 or above limit

Save/load:

* save can be stringified as JSON
* save/load round trip restores equivalent state
* invalid saves are rejected
* failed load does not replace current state

## Required UI And Rendering Tests

These can be pure helper tests where possible:

* `screenToTile` handles camera offset and zoom
* selection priority chooses unit before colony before tile
* Escape clears UI selection
* game rules are not imported from rendering modules
* rendering modules do not mutate game state directly

## Acceptance Test Checklist

Before considering MVP complete:

* `npm install` succeeds
* `npm run build` succeeds
* `npm test` succeeds
* game starts on playable map screen
* player can select and move a unit
* player can found a colony
* end turn advances turn and applies production
* save/load restores the same visible game state

## Test Data

Use fixed seeds in tests:

```text
mvp-seed-1
mvp-seed-2
```

Avoid snapshot tests for large map objects unless they are intentionally small. Prefer specific assertions about dimensions, terrain validity, and start conditions.
