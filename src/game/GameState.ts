import type { PlayerId, UnitId, ColonyId, ColonistId } from './ids';
import type { TerrainType } from './map/terrain';
import type { RngState } from './rng';

export type { PlayerId, UnitId, ColonyId, ColonistId };

export type TileCoord = { x: number; y: number };
export type PlayerVisibilityMask = number;

export type Tile = {
  terrain: TerrainType;
  riverMask: number;
  roadMask: number;
  ownerId?: PlayerId;
  colonyId?: ColonyId;
  discoveredBy: PlayerVisibilityMask;
  visibleTo: PlayerVisibilityMask;
};

export type GameMap = {
  width: number;
  height: number;
  tiles: Tile[];
  startX: number;
  startY: number;
};

export function getTile(map: GameMap, x: number, y: number): Tile {
  return map.tiles[y * map.width + x];
}

export function inBounds(map: GameMap, x: number, y: number): boolean {
  return x >= 0 && x < map.width && y >= 0 && y < map.height;
}

export type GoodsStockpile = { food: number; lumber: number };

export type UnitType =
  | 'free_colonist'
  | 'pioneer'
  | 'scout'
  | 'soldier'
  | 'wagon_train';

export type Unit = {
  id: UnitId;
  ownerId: PlayerId;
  type: UnitType;
  x: number;
  y: number;
  movementPoints: number;
  maxMovementPoints: number;
};

export type ColonistProfession = 'farmer' | 'lumberjack' | 'generalist';

export type ColonistAssignment = {
  id: ColonistId;
  profession: ColonistProfession;
  tile?: TileCoord;
};

export type Colony = {
  id: ColonyId;
  ownerId: PlayerId;
  name: string;
  x: number;
  y: number;
  population: ColonistAssignment[];
  storage: GoodsStockpile;
  buildings: string[];
  constructionQueue: string[];
  workedTiles: TileCoord[];
};

export type Player = { id: PlayerId; name: string };

export type MarketState = Record<string, number>;

export type IdCounters = { unit: number; colony: number; colonist: number };

export type GameState = {
  turn: number;
  currentPlayerId: PlayerId;
  map: GameMap;
  players: Player[];
  units: Record<UnitId, Unit>;
  colonies: Record<ColonyId, Colony>;
  market: MarketState;
  rngState: RngState;
  idCounters: IdCounters;
};

export type GameCommand =
  | { type: 'MOVE_UNIT'; unitId: UnitId; target: TileCoord }
  | { type: 'FOUND_COLONY'; unitId: UnitId; name: string }
  | { type: 'END_TURN' };

export type GameEvent =
  | { type: 'UNIT_MOVED'; unitId: UnitId; from: TileCoord; to: TileCoord }
  | { type: 'UNIT_MOVE_REJECTED'; unitId: UnitId; reason: string }
  | { type: 'COLONY_FOUNDED'; colonyId: ColonyId; x: number; y: number }
  | { type: 'COLONY_FOUNDING_REJECTED'; unitId: UnitId; reason: string }
  | { type: 'GOODS_PRODUCED'; colonyId: ColonyId; goods: Partial<GoodsStockpile> }
  | { type: 'FOOD_SHORTAGE'; colonyId: ColonyId; shortage: number }
  | { type: 'TURN_ENDED'; previousTurn: number; newTurn: number };

export type SerializedGame = {
  version: number;
  createdAt: string;
  state: GameState;
};

export type TileInfo = {
  x: number;
  y: number;
  terrain: TerrainType;
  colonyId?: ColonyId;
  unitIds: UnitId[];
};

export interface GameEngine {
  getState(): Readonly<GameState>;
  dispatch(command: GameCommand): GameEvent[];
  getValidMoves(unitId: UnitId): TileCoord[];
  getTileInfo(x: number, y: number): TileInfo;
  save(): SerializedGame;
  load(save: SerializedGame): void;
}
