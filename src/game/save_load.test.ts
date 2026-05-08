import { describe, it, expect } from 'vitest';
import { createGameEngine } from './GameEngine';
import { serializeGame, validateSave, deserializeGame } from './save_load';

describe('save_load', () => {
  it('serializeGame produces valid SerializedGame', () => {
    const engine = createGameEngine('save-test-seed');
    const state = engine.getState();
    const save = serializeGame(state);
    expect(save.version).toBe(1);
    expect(typeof save.createdAt).toBe('string');
    expect(save.state).toBeDefined();
    expect(typeof save.state).toBe('object');
  });

  it('save can be stringified as JSON', () => {
    const engine = createGameEngine('save-test-seed');
    const state = engine.getState();
    expect(() => JSON.stringify(serializeGame(state))).not.toThrow();
  });

  it('deserializeGame round-trips state', () => {
    const engine = createGameEngine('save-test-seed');
    const originalState = engine.getState();
    const save = serializeGame(originalState);
    const restored = deserializeGame(save);
    expect(restored.turn).toBe(originalState.turn);
    expect(restored.currentPlayerId).toBe(originalState.currentPlayerId);
    expect(restored.map.width).toBe(originalState.map.width);
    expect(restored.map.height).toBe(originalState.map.height);
    expect(Object.keys(restored.units)).toEqual(Object.keys(originalState.units));
    expect(Object.keys(restored.colonies)).toEqual(Object.keys(originalState.colonies));
  });

  it('validateSave throws on null', () => {
    expect(() => validateSave(null)).toThrow();
  });

  it('validateSave throws on wrong version', () => {
    expect(() =>
      validateSave({ version: 99, createdAt: 'x', state: {} })
    ).toThrow();
  });

  it('validateSave throws on missing state', () => {
    expect(() =>
      validateSave({ version: 1, createdAt: 'x' })
    ).toThrow();
  });

  it('engine load works after save', () => {
    const engine = createGameEngine('load-test-seed');
    const state = engine.getState();
    const unitId = Object.keys(state.units)[0];
    const validMoves = engine.getValidMoves(unitId);

    // Move unit if possible
    let movedX = state.units[unitId].x;
    let movedY = state.units[unitId].y;
    if (validMoves.length > 0) {
      engine.dispatch({ type: 'MOVE_UNIT', unitId, target: validMoves[0] });
      movedX = validMoves[0].x;
      movedY = validMoves[0].y;
    }

    const save = engine.save();
    const engine2 = createGameEngine('load-test-seed-2');
    engine2.load(save);

    const loadedState = engine2.getState();
    // Unit may no longer exist if colony was founded, but if it does check position
    if (loadedState.units[unitId]) {
      expect(loadedState.units[unitId].x).toBe(movedX);
      expect(loadedState.units[unitId].y).toBe(movedY);
    }
    expect(loadedState.turn).toBe(engine.getState().turn);
  });

  it('failed load does not replace current state', () => {
    const engine = createGameEngine('stable-test-seed');
    const originalTurn = engine.getState().turn;
    const invalidSave = { version: 99, createdAt: 'bad', state: null };
    try {
      engine.load(invalidSave as any);
    } catch {
      // Expected to throw
    }
    // State should remain unchanged
    expect(engine.getState().turn).toBe(originalTurn);
  });
});
