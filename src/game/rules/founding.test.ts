import { describe, it, expect } from 'vitest';
import { canFoundColony, foundColony } from './founding';
import { getTile } from '../GameState';
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

describe('founding', () => {
  it('valid colonist can found colony on plains', () => {
    const state = makeState();
    const result = foundColony(state, 'unit_1', 'New Colony');
    const foundedEvent = result.events.find((e) => e.type === 'COLONY_FOUNDED');
    expect(foundedEvent).toBeDefined();
  });

  it('founding on ocean terrain is rejected', () => {
    const state = makeState();
    state.map.tiles[2 * 5 + 2] = {
      terrain: 'ocean' as TerrainType,
      riverMask: 0,
      roadMask: 0,
      discoveredBy: 0,
      visibleTo: 0,
    };
    const result = foundColony(state, 'unit_1', 'New Colony');
    const rejectedEvent = result.events.find((e) => e.type === 'COLONY_FOUNDING_REJECTED');
    expect(rejectedEvent).toBeDefined();
  });

  it('founding on coast terrain is rejected', () => {
    const state = makeState();
    state.map.tiles[2 * 5 + 2] = {
      terrain: 'coast' as TerrainType,
      riverMask: 0,
      roadMask: 0,
      discoveredBy: 0,
      visibleTo: 0,
    };
    const result = foundColony(state, 'unit_1', 'New Colony');
    const rejectedEvent = result.events.find((e) => e.type === 'COLONY_FOUNDING_REJECTED');
    expect(rejectedEvent).toBeDefined();
  });

  it('founding on existing colony is rejected', () => {
    const state = makeState();
    state.map.tiles[2 * 5 + 2].colonyId = 'colony_existing';
    const result = foundColony(state, 'unit_1', 'New Colony');
    const rejectedEvent = result.events.find((e) => e.type === 'COLONY_FOUNDING_REJECTED');
    expect(rejectedEvent).toBeDefined();
  });

  it('founding removes the founding unit', () => {
    const state = makeState();
    const result = foundColony(state, 'unit_1', 'New Colony');
    expect(result.state.units['unit_1']).toBeUndefined();
  });

  it('founding creates colony owned by unit owner', () => {
    const state = makeState();
    const result = foundColony(state, 'unit_1', 'New Colony');
    const foundedEvent = result.events.find((e) => e.type === 'COLONY_FOUNDED');
    expect(foundedEvent).toBeDefined();
    const colonyId = (foundedEvent as any).colonyId;
    expect(result.state.colonies[colonyId].ownerId).toBe('player_1');
  });

  it('founding marks tile with colonyId', () => {
    const state = makeState();
    const result = foundColony(state, 'unit_1', 'New Colony');
    const foundedEvent = result.events.find((e) => e.type === 'COLONY_FOUNDED');
    expect(foundedEvent).toBeDefined();
    const ev = foundedEvent as any;
    const tile = getTile(result.state.map, ev.x, ev.y);
    expect(tile.colonyId).toBe(ev.colonyId);
  });

  it('generated colony name is Colony 1 when no name given', () => {
    const state = makeState();
    const result = foundColony(state, 'unit_1', '');
    const foundedEvent = result.events.find((e) => e.type === 'COLONY_FOUNDED');
    expect(foundedEvent).toBeDefined();
    const ev = foundedEvent as any;
    const colony = result.state.colonies[ev.colonyId];
    expect(colony.name).toBe('Colony 1');
  });

  it('invalid founding leaves state unchanged', () => {
    const state = makeState();
    state.map.tiles[2 * 5 + 2] = {
      terrain: 'ocean' as TerrainType,
      riverMask: 0,
      roadMask: 0,
      discoveredBy: 0,
      visibleTo: 0,
    };
    const result = foundColony(state, 'unit_1', 'New Colony');
    expect(result.state.units['unit_1']).toBeDefined();
  });
});
