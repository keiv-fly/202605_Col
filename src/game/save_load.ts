import type { GameState, SerializedGame } from './GameState';

export function serializeGame(state: GameState): SerializedGame {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    state: JSON.parse(JSON.stringify(state)) as GameState,
  };
}

export function validateSave(data: unknown): SerializedGame {
  if (typeof data !== 'object' || data === null) throw new Error('Invalid save: not an object');
  const d = data as Record<string, unknown>;
  if (d['version'] !== 1) throw new Error('Invalid save: unsupported version');
  if (typeof d['createdAt'] !== 'string') throw new Error('Invalid save: missing createdAt');
  if (typeof d['state'] !== 'object' || d['state'] === null) throw new Error('Invalid save: missing state');
  const s = d['state'] as Record<string, unknown>;
  if (typeof s['turn'] !== 'number') throw new Error('Invalid save: state.turn missing');
  if (typeof s['currentPlayerId'] !== 'string') throw new Error('Invalid save: state.currentPlayerId missing');
  if (!Array.isArray((s['players']))) throw new Error('Invalid save: state.players missing');
  if (typeof s['map'] !== 'object') throw new Error('Invalid save: state.map missing');
  if (typeof s['units'] !== 'object') throw new Error('Invalid save: state.units missing');
  if (typeof s['colonies'] !== 'object') throw new Error('Invalid save: state.colonies missing');
  return data as SerializedGame;
}

export function deserializeGame(data: unknown): GameState {
  const save = validateSave(data);
  return JSON.parse(JSON.stringify(save.state)) as GameState;
}
