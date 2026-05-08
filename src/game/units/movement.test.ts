import { describe, it, expect } from 'vitest';
import { canMoveUnit, moveUnit, getValidMoves, MAX_MOVEMENT_POINTS } from './movement';
import { endTurn } from '../rules/turn';
import type { GameState, GameMap, Unit } from '../GameState';
import type { TerrainType } from '../map/terrain';

function makeState(): GameState {
  const tiles = Array.from({ length: 25 }, () => ({
    terrain: 'plains' as TerrainType,
    riverMask: 0,
    roadMask: 0,
    discoveredBy: 0,
    visibleTo: 0,
  }));
  const map: GameMap = { width: 5, height: 5, tiles, startX: 2, startY: 2 };
  const unit: Unit = {
    id: 'unit_1',
    ownerId: 'player_1',
    type: 'free_colonist',
    x: 2,
    y: 2,
    movementPoints: 1,
    maxMovementPoints: 1,
  };
  return {
    turn: 1,
    currentPlayerId: 'player_1',
    map,
    players: [{ id: 'player_1', name: 'P1' }],
    units: { unit_1: unit },
    colonies: {},
    market: {},
    rngState: { state: 0 },
    idCounters: { unit: 1, colony: 0, colonist: 0 },
  };
}

describe('movement', () => {
  it('land unit can move to adjacent plains tile', () => {
    const state = makeState();
    const result = moveUnit(state, 'unit_1', { x: 2, y: 1 });
    const movedEvent = result.events.find((e) => e.type === 'UNIT_MOVED');
    expect(movedEvent).toBeDefined();
    expect(movedEvent!.type).toBe('UNIT_MOVED');
    expect(result.state.units['unit_1'].x).toBe(2);
    expect(result.state.units['unit_1'].y).toBe(1);
  });

  it('land unit cannot move into ocean', () => {
    const state = makeState();
    state.map.tiles[1 * 5 + 2] = {
      terrain: 'ocean' as TerrainType,
      riverMask: 0,
      roadMask: 0,
      discoveredBy: 0,
      visibleTo: 0,
    };
    const result = moveUnit(state, 'unit_1', { x: 2, y: 1 });
    const rejectedEvent = result.events.find((e) => e.type === 'UNIT_MOVE_REJECTED');
    expect(rejectedEvent).toBeDefined();
  });

  it('movement outside map is rejected', () => {
    const state = makeState();
    const result = moveUnit(state, 'unit_1', { x: -1, y: 0 });
    const rejectedEvent = result.events.find((e) => e.type === 'UNIT_MOVE_REJECTED');
    expect(rejectedEvent).toBeDefined();
  });

  it('diagonal movement is rejected', () => {
    const state = makeState();
    const result = moveUnit(state, 'unit_1', { x: 1, y: 1 });
    const rejectedEvent = result.events.find((e) => e.type === 'UNIT_MOVE_REJECTED');
    expect(rejectedEvent).toBeDefined();
  });

  it('insufficient movement points rejected', () => {
    const state = makeState();
    state.units['unit_1'].movementPoints = 0;
    const result = moveUnit(state, 'unit_1', { x: 2, y: 1 });
    const rejectedEvent = result.events.find((e) => e.type === 'UNIT_MOVE_REJECTED');
    expect(rejectedEvent).toBeDefined();
  });

  it('valid movement updates position and deducts MP', () => {
    const state = makeState();
    const result = moveUnit(state, 'unit_1', { x: 2, y: 1 });
    const unit = result.state.units['unit_1'];
    expect(unit.x).toBe(2);
    expect(unit.y).toBe(1);
    // Movement cost for plains is 1, so MP should be reduced
    expect(unit.movementPoints).toBeLessThan(1);
  });

  it('invalid movement leaves state unchanged', () => {
    const state = makeState();
    const result = moveUnit(state, 'unit_1', { x: -1, y: 0 });
    expect(result.state.units['unit_1'].x).toBe(2);
    expect(result.state.units['unit_1'].y).toBe(2);
  });

  it('getValidMoves returns only legal orthogonal tiles', () => {
    const state = makeState();
    const moves = getValidMoves(state, 'unit_1');
    // Unit at (2,2) in 5x5 plains with 1 MP - should have 4 orthogonal neighbors
    expect(moves.length).toBe(4);
    for (const move of moves) {
      const dx = Math.abs(move.x - 2);
      const dy = Math.abs(move.y - 2);
      // Must be orthogonal (exactly one axis moves by 1)
      expect(dx + dy).toBe(1);
    }
  });

  it('movement points reset on end turn', () => {
    const state = makeState();
    // Use up movement points
    const afterMove = moveUnit(state, 'unit_1', { x: 2, y: 1 });
    expect(afterMove.state.units['unit_1'].movementPoints).toBeLessThan(
      afterMove.state.units['unit_1'].maxMovementPoints
    );
    // End turn should reset MP
    const afterTurn = endTurn(afterMove.state);
    expect(afterTurn.state.units['unit_1'].movementPoints).toBe(
      afterTurn.state.units['unit_1'].maxMovementPoints
    );
  });
});
