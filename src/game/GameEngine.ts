import type { GameEngine, GameState, GameCommand, GameEvent, TileInfo, UnitId, TileCoord, SerializedGame } from './GameState';
import { getTile, inBounds } from './GameState';
import { generateMap } from './map/mapGeneration';
import { moveUnit, getValidMoves } from './units/movement';
import { foundColony } from './rules/founding';
import { endTurn } from './rules/turn';
import { serializeGame, validateSave, deserializeGame } from './save_load';

class GameEngineImpl implements GameEngine {
  private state: GameState;

  constructor(seed: string) {
    const map = generateMap({ width: 64, height: 40, seed });
    this.state = {
      turn: 1,
      currentPlayerId: 'player_1',
      map,
      players: [{ id: 'player_1', name: 'Player 1' }],
      units: {
        unit_1: {
          id: 'unit_1',
          ownerId: 'player_1',
          type: 'free_colonist',
          x: map.startX,
          y: map.startY,
          movementPoints: 1,
          maxMovementPoints: 1,
        },
      },
      colonies: {},
      market: {},
      rngState: { state: 0 },
      idCounters: { unit: 1, colony: 0, colonist: 0 },
    };
  }

  getState(): Readonly<GameState> {
    return this.state as Readonly<GameState>;
  }

  dispatch(command: GameCommand): GameEvent[] {
    switch (command.type) {
      case 'MOVE_UNIT': {
        const { events } = moveUnit(this.state, command.unitId, command.target);
        return events;
      }
      case 'FOUND_COLONY': {
        const { events } = foundColony(this.state, command.unitId, command.name);
        return events;
      }
      case 'END_TURN': {
        const { events } = endTurn(this.state);
        return events;
      }
    }
  }

  getValidMoves(unitId: UnitId): TileCoord[] {
    return getValidMoves(this.state, unitId);
  }

  getTileInfo(x: number, y: number): TileInfo {
    if (!inBounds(this.state.map, x, y)) {
      return { x, y, terrain: 'ocean', unitIds: [] };
    }
    const tile = getTile(this.state.map, x, y);
    const unitIds = Object.values(this.state.units)
      .filter(u => u.x === x && u.y === y)
      .map(u => u.id);
    return { x, y, terrain: tile.terrain, colonyId: tile.colonyId, unitIds };
  }

  save(): SerializedGame {
    return serializeGame(this.state);
  }

  load(save: SerializedGame): void {
    const validated = validateSave(save);
    this.state = deserializeGame(validated);
  }
}

export function createGameEngine(seed: string): GameEngine {
  return new GameEngineImpl(seed);
}
