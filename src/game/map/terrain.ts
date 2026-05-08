export type TerrainType =
  | 'ocean'
  | 'coast'
  | 'plains'
  | 'grassland'
  | 'forest'
  | 'hills'
  | 'mountains'
  | 'desert'
  | 'tundra'
  | 'marsh';

export type TerrainDef = {
  movementCost: number;
  baseFood: number;
  baseLumber: number;
  defenseModifier: number;
  canHaveRoad: boolean;
  canFoundColony: boolean;
  canEnterLand: boolean;
};

export const TERRAIN_DEFS: Record<TerrainType, TerrainDef> = {
  ocean:     { movementCost: 0, baseFood: 1, baseLumber: 0, defenseModifier: 0,  canHaveRoad: false, canFoundColony: false, canEnterLand: false },
  coast:     { movementCost: 0, baseFood: 1, baseLumber: 0, defenseModifier: 0,  canHaveRoad: false, canFoundColony: false, canEnterLand: false },
  plains:    { movementCost: 1, baseFood: 2, baseLumber: 0, defenseModifier: 0,  canHaveRoad: true,  canFoundColony: true,  canEnterLand: true  },
  grassland: { movementCost: 1, baseFood: 3, baseLumber: 0, defenseModifier: 0,  canHaveRoad: true,  canFoundColony: true,  canEnterLand: true  },
  forest:    { movementCost: 2, baseFood: 1, baseLumber: 2, defenseModifier: 50, canHaveRoad: true,  canFoundColony: true,  canEnterLand: true  },
  hills:     { movementCost: 2, baseFood: 1, baseLumber: 0, defenseModifier: 25, canHaveRoad: true,  canFoundColony: true,  canEnterLand: true  },
  mountains: { movementCost: 3, baseFood: 0, baseLumber: 0, defenseModifier: 75, canHaveRoad: true,  canFoundColony: false, canEnterLand: true  },
  desert:    { movementCost: 2, baseFood: 1, baseLumber: 0, defenseModifier: 0,  canHaveRoad: true,  canFoundColony: true,  canEnterLand: true  },
  tundra:    { movementCost: 2, baseFood: 1, baseLumber: 0, defenseModifier: 0,  canHaveRoad: true,  canFoundColony: true,  canEnterLand: true  },
  marsh:     { movementCost: 3, baseFood: 1, baseLumber: 1, defenseModifier: 0,  canHaveRoad: false, canFoundColony: false, canEnterLand: true  },
};

export function getTerrainDef(terrain: TerrainType): TerrainDef {
  return TERRAIN_DEFS[terrain];
}
