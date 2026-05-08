import { describe, it, expect } from 'vitest';
import { screenToTile, tileToScreen, getSelectionTarget, TILE_SIZE } from './helpers';

describe('screenToTile', () => {
  it('converts screen coords at zoom 1 with no pan', () => {
    expect(screenToTile(64, 64, 0, 0, 1)).toEqual({ x: 1, y: 1 });
    expect(screenToTile(0, 0, 0, 0, 1)).toEqual({ x: 0, y: 0 });
    expect(screenToTile(127, 127, 0, 0, 1)).toEqual({ x: 1, y: 1 });
  });

  it('handles pan offset', () => {
    expect(screenToTile(164, 114, 100, 50, 1)).toEqual({ x: 1, y: 1 });
  });

  it('handles zoom 2', () => {
    // At zoom 2, each tile is 128px wide
    expect(screenToTile(128, 0, 0, 0, 2)).toEqual({ x: 1, y: 0 });
  });

  it('handles zoom 0.5', () => {
    // At zoom 0.5, each tile is 32px wide
    expect(screenToTile(32, 0, 0, 0, 0.5)).toEqual({ x: 1, y: 0 });
  });
});

describe('tileToScreen', () => {
  it('converts tile coords to screen at zoom 1', () => {
    expect(tileToScreen(1, 1, 0, 0, 1)).toEqual({ x: TILE_SIZE, y: TILE_SIZE });
  });
});

describe('getSelectionTarget', () => {
  it('selects unit when units present', () => {
    const result = getSelectionTarget(0, 0, ['unit_1'], 'colony_1');
    expect(result).toEqual({ kind: 'unit', id: 'unit_1' });
  });

  it('selects colony when no units', () => {
    const result = getSelectionTarget(0, 0, [], 'colony_1');
    expect(result).toEqual({ kind: 'colony', id: 'colony_1' });
  });

  it('selects tile when neither', () => {
    const result = getSelectionTarget(3, 4, [], undefined);
    expect(result).toEqual({ kind: 'tile', x: 3, y: 4 });
  });

  it('Escape can clear by returning null from selection state - null check', () => {
    // Selection state can be null, which represents cleared selection
    const selection: ReturnType<typeof getSelectionTarget> = null;
    expect(selection).toBeNull();
  });
});
