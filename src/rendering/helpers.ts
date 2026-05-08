export const TILE_SIZE = 64;

export function screenToTile(
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  zoom: number
): { x: number; y: number } {
  const worldX = (screenX - panX) / zoom;
  const worldY = (screenY - panY) / zoom;
  return {
    x: Math.floor(worldX / TILE_SIZE),
    y: Math.floor(worldY / TILE_SIZE),
  };
}

export function tileToScreen(
  tileX: number,
  tileY: number,
  panX: number,
  panY: number,
  zoom: number
): { x: number; y: number } {
  return {
    x: tileX * TILE_SIZE * zoom + panX,
    y: tileY * TILE_SIZE * zoom + panY,
  };
}

export type SelectionTarget =
  | { kind: 'unit'; id: string }
  | { kind: 'colony'; id: string }
  | { kind: 'tile'; x: number; y: number }
  | null;

export function getSelectionTarget(
  tileX: number,
  tileY: number,
  unitIds: string[],
  colonyId: string | undefined
): SelectionTarget {
  if (unitIds.length > 0) return { kind: 'unit', id: unitIds[0] };
  if (colonyId) return { kind: 'colony', id: colonyId };
  return { kind: 'tile', x: tileX, y: tileY };
}
