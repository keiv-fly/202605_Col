import type { GameState, GameEvent } from '../GameState';
import { applyTurnEconomy } from '../colonies/production';
import { MAX_MOVEMENT_POINTS } from '../units/movement';

export function endTurn(state: GameState): { state: GameState; events: GameEvent[] } {
  const { events } = applyTurnEconomy(state);

  // Reset movement points for all units
  for (const unit of Object.values(state.units)) {
    const maxMp = MAX_MOVEMENT_POINTS[unit.type] ?? 1;
    unit.movementPoints = maxMp;
    unit.maxMovementPoints = maxMp;
  }

  const previousTurn = state.turn;
  state.turn += 1;

  return {
    state,
    events: [...events, { type: 'TURN_ENDED', previousTurn, newTurn: state.turn }],
  };
}
