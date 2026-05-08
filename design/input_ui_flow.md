# Input UI Flow Design

## Purpose

Define how player input, selection, panels, and commands work in the MVP.

Input and UI code belongs in `views/` and UI modules. Rule validation belongs in `game/`.

## Source Files

```text
src/views/MapView.ts
src/views/UIView.ts
src/rendering/SelectionRenderer.ts
src/game/GameEngine.ts
```

## UI Technology Split

MVP split:

* PixiJS renders map, terrain, units, colonies, hover, selection, and movement overlays.
* HTML/CSS renders panels, buttons, message log, save/load controls, and textual details.

PixiJS and HTML UI both read from the same engine state and dispatch commands through the same engine API.

## UI State

UI state is separate from game state:

```ts
type UIState = {
  hoveredTile?: TileCoord;
  selectedTile?: TileCoord;
  selectedUnitId?: UnitId;
  selectedColonyId?: ColonyId;
  messageLog: string[];
};
```

UI state can reference game IDs but must not contain game objects by mutable reference.

## Mouse Controls

MVP controls:

| Input                  | Behavior                                      |
| ---------------------- | --------------------------------------------- |
| move mouse over map    | update hovered tile                           |
| left click empty tile  | select tile                                   |
| left click unit        | select unit and its tile                      |
| right click land tile  | move selected unit if valid                   |
| click found colony     | dispatch `FOUND_COLONY` for selected unit     |
| click end turn         | dispatch `END_TURN`                           |
| click save             | save current game as JSON                     |
| click load             | load selected or stored JSON save             |

If right-click conflicts with browser context menu, prevent the context menu inside the game canvas.

## Keyboard Controls

MVP controls:

| Key              | Behavior             |
| ---------------- | -------------------- |
| Arrow keys/WASD  | pan camera           |
| + or =           | zoom in              |
| -                | zoom out             |
| Escape           | clear selection      |
| Enter            | end turn             |

Mouse wheel can also cycle zoom levels if it feels natural.

## Selection Rules

Selection priority on click:

1. unit on tile owned by current player
2. colony on tile owned by current player
3. tile

Selecting a unit:

* sets `selectedUnitId`
* sets `selectedTile` to unit location
* clears `selectedColonyId`
* shows unit panel
* shows valid move overlay

Selecting a colony:

* sets `selectedColonyId`
* sets `selectedTile`
* clears `selectedUnitId`
* shows colony panel

Selecting an empty tile:

* sets `selectedTile`
* clears selected unit and colony
* shows tile info panel

## Panels

MVP panels:

* tile info panel: x, y, terrain
* unit panel: unit type, movement points, available actions
* colony panel: name, population count, food, lumber
* top status bar: turn number
* message log: latest command results and rejection reasons

## Command Feedback

Every command event should produce UI feedback:

* successful movement updates map and message log
* rejected movement writes rejection reason to message log
* founded colony updates map, panels, and message log
* end turn updates turn counter and message log
* save/load writes success or failure to message log

## Tests

Recommended tests:

* `screenToTile` maps pointer coordinates to expected tile
* selection priority picks unit before tile
* invalid movement displays rejection reason
* UI selection state does not mutate game state
* Escape clears UI selection only
