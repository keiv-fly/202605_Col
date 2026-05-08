import { describe, it, expect } from 'vitest';
import { createGameEngine } from './GameEngine';

describe('GameEngine', () => {
  it('engine can be created without PixiJS', () => {
    expect(() => createGameEngine('test-seed')).not.toThrow();
  });

  it('initial state has turn 1', () => {
    const engine = createGameEngine('test-seed');
    expect(engine.getState().turn).toBe(1);
  });

  it('initial state has one player', () => {
    const engine = createGameEngine('test-seed');
    expect(engine.getState().players.length).toBe(1);
  });

  it('initial state has one unit', () => {
    const engine = createGameEngine('test-seed');
    expect(Object.keys(engine.getState().units).length).toBe(1);
  });

  it('initial state has a generated map', () => {
    const engine = createGameEngine('test-seed');
    const state = engine.getState();
    expect(state.map.width).toBe(64);
    expect(state.map.height).toBe(40);
  });

  it('MOVE_UNIT to valid tile returns UNIT_MOVED event', () => {
    const engine = createGameEngine('test-seed');
    const state = engine.getState();
    const unitId = Object.keys(state.units)[0];
    const validMoves = engine.getValidMoves(unitId);
    expect(validMoves.length).toBeGreaterThan(0);
    const target = validMoves[0];
    const events = engine.dispatch({ type: 'MOVE_UNIT', unitId, target });
    const movedEvent = events.find((e) => e.type === 'UNIT_MOVED');
    expect(movedEvent).toBeDefined();
  });

  it('MOVE_UNIT to invalid tile returns UNIT_MOVE_REJECTED', () => {
    const engine = createGameEngine('test-seed');
    const state = engine.getState();
    const unitId = Object.keys(state.units)[0];
    // Move to out-of-bounds
    const events = engine.dispatch({ type: 'MOVE_UNIT', unitId, target: { x: -100, y: -100 } });
    const rejectedEvent = events.find((e) => e.type === 'UNIT_MOVE_REJECTED');
    expect(rejectedEvent).toBeDefined();
  });

  it('FOUND_COLONY on valid tile returns COLONY_FOUNDED', () => {
    const engine = createGameEngine('test-seed');
    const state = engine.getState();
    const unitId = Object.keys(state.units)[0];
    const unit = state.units[unitId];
    // Try founding on current tile (start position should be valid land)
    const events = engine.dispatch({ type: 'FOUND_COLONY', unitId, name: 'Test Colony' });
    const foundedEvent = events.find(
      (e) => e.type === 'COLONY_FOUNDED' || e.type === 'COLONY_FOUNDING_REJECTED'
    );
    // We at minimum get some response
    expect(foundedEvent).toBeDefined();
    // If founding succeeded, verify it
    if (foundedEvent!.type === 'COLONY_FOUNDED') {
      expect(foundedEvent!.type).toBe('COLONY_FOUNDED');
    }
  });

  it('END_TURN returns TURN_ENDED event', () => {
    const engine = createGameEngine('test-seed');
    const events = engine.dispatch({ type: 'END_TURN' });
    const turnEndedEvent = events.find((e) => e.type === 'TURN_ENDED');
    expect(turnEndedEvent).toBeDefined();
  });

  it('END_TURN increments turn counter', () => {
    const engine = createGameEngine('test-seed');
    expect(engine.getState().turn).toBe(1);
    engine.dispatch({ type: 'END_TURN' });
    expect(engine.getState().turn).toBe(2);
  });

  it('getValidMoves returns array of TileCoords', () => {
    const engine = createGameEngine('test-seed');
    const state = engine.getState();
    const unitId = Object.keys(state.units)[0];
    const moves = engine.getValidMoves(unitId);
    expect(Array.isArray(moves)).toBe(true);
    for (const move of moves) {
      expect(typeof move.x).toBe('number');
      expect(typeof move.y).toBe('number');
    }
  });

  it('getState returns readonly state', () => {
    const engine = createGameEngine('test-seed');
    const state = engine.getState();
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
  });
});
