# Design Folder Guide

This folder contains the planning documents for the PixiJS + TypeScript MVP.

## Files

* `game_specs.md` - Main product and architecture specification, including MVP scope, acceptance criteria, source layout, and baseline technology choices.
* `map_generation.md` - Deterministic map generation rules, terrain distribution, start position guarantees, and map-generation tests.
* `game_state_and_commands.md` - Authoritative game state ownership, command dispatch flow, events, initial state, and engine API.
* `movement_and_pathfinding.md` - Land movement rules, movement costs, valid move checks, pathfinding API, and movement tests.
* `colony_logic.md` - Colony founding rules, colony data shape, naming, worked tiles, and founding tests.
* `economy.md` - MVP goods, terrain yields, colony production, food consumption, storage limits, and economy tests.
* `save_load.md` - JSON save format, versioning, validation rules, serialization boundaries, and save/load tests.
* `input_ui_flow.md` - Mouse and keyboard controls, selection behavior, UI panels, and command feedback flow.
* `rendering_sync.md` - How PixiJS renderers synchronize with game state and events without owning game rules.
* `testing_strategy.md` - Overall test priorities, required test coverage, test layout, and MVP acceptance checklist.
