# Rendering Sync Design

## Purpose

Define how PixiJS rendering stays synchronized with authoritative game state without mixing rules into rendering.

Rendering code displays state and events. It never decides whether a move, colony founding action, or economy update is valid.

## Source Files

```text
src/rendering/MapRenderer.ts
src/rendering/UnitRenderer.ts
src/rendering/FogRenderer.ts
src/rendering/SelectionRenderer.ts
src/rendering/TileAtlas.ts
src/views/MapView.ts
src/game/GameEngine.ts
```

## Rendering Ownership

PixiJS owns:

* textures
* containers
* sprites
* camera viewport state
* hover and selection overlays
* animation timing

Game engine owns:

* map terrain data
* unit coordinates
* colony coordinates
* valid movement
* production
* save/load state

## Renderer API

```ts
class MapRenderer {
  renderInitialMap(map: GameMap): void;
  updateTiles(changedTiles: TileCoord[]): void;
  screenToTile(screenX: number, screenY: number): TileCoord | undefined;
  setZoom(zoom: number): void;
  panBy(dx: number, dy: number): void;
}

class UnitRenderer {
  syncUnits(units: Record<UnitId, Unit>): void;
  animateUnitMove(unitId: UnitId, from: TileCoord, to: TileCoord): Promise<void>;
}

class SelectionRenderer {
  showHoveredTile(tile?: TileCoord): void;
  showSelectedTile(tile?: TileCoord): void;
  showValidMoves(tiles: TileCoord[]): void;
}
```

## Initial Render Flow

1. Create engine.
2. Read engine state.
3. Build tile textures.
4. Render full terrain map.
5. Render units.
6. Render colonies.
7. Render UI panels from state.

## Command Render Flow

1. UI dispatches command to engine.
2. Engine validates and mutates state if valid.
3. Engine returns events.
4. View passes events to renderers.
5. Renderers update only affected sprites, overlays, and panels.
6. UI message log records event summaries.

## Event Handling

Rendering responses:

| Event                    | Rendering Response                          |
| ------------------------ | ------------------------------------------- |
| UNIT_MOVED               | animate or move unit sprite                 |
| UNIT_MOVE_REJECTED       | no map change, show message                 |
| COLONY_FOUNDED           | remove unit sprite, add colony sprite       |
| GOODS_PRODUCED           | update colony panel if visible              |
| TURN_ENDED               | update status bar and unit movement labels  |
| GAME_LOADED              | clear renderers and rebuild from state      |

## Terrain Rendering

MVP terrain can use generated textures:

* ocean: blue
* coast: lighter blue
* plains: tan green
* grassland: green
* forest: dark green
* hills: olive
* mountains: gray

Use stable tile dimensions based on `TILE_SIZE = 64`.

## Performance Rules

* Do not create new terrain sprites every frame.
* Do not recalculate economy or movement during render ticks.
* Do not store PixiJS sprites in game state.
* Rebuild the full map only on startup or load.
* For normal commands, update only affected units, colonies, overlays, and panels.

## Tests

Recommended tests:

* `screenToTile` returns expected tile at each zoom level
* renderer can rebuild from loaded state
* unit sync removes sprites for deleted units
* colony founded event creates colony visual and removes founding unit visual
* no PixiJS object is passed into engine state or save data
