import type { GameState, TileCoord, UnitId } from '../GameState';
import { inBounds } from '../GameState';
import { getMovementCost } from './movementCost';

export type PathResult =
  | { ok: true; path: TileCoord[]; totalCost: number }
  | { ok: false; reason: string };

type HeapNode = { coord: TileCoord; f: number };

class MinHeap {
  private items: HeapNode[] = [];
  push(node: HeapNode): void {
    this.items.push(node);
    this.bubbleUp(this.items.length - 1);
  }
  pop(): HeapNode | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.sinkDown(0);
    }
    return top;
  }
  get size(): number { return this.items.length; }
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].f <= this.items[i].f) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }
  private sinkDown(i: number): void {
    const n = this.items.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.items[l].f < this.items[smallest].f) smallest = l;
      if (r < n && this.items[r].f < this.items[smallest].f) smallest = r;
      if (smallest === i) break;
      [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
      i = smallest;
    }
  }
}

function key(x: number, y: number): string { return `${x},${y}`; }
function heuristic(a: TileCoord, b: TileCoord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function findPath(state: GameState, unitId: UnitId, target: TileCoord): PathResult {
  const unit = state.units[unitId];
  if (!unit) return { ok: false, reason: 'Unit not found' };
  if (!inBounds(state.map, target.x, target.y)) return { ok: false, reason: 'Target out of bounds' };

  const start: TileCoord = { x: unit.x, y: unit.y };
  const open = new MinHeap();
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, TileCoord>();

  const startKey = key(start.x, start.y);
  gScore.set(startKey, 0);
  open.push({ coord: start, f: heuristic(start, target) });

  const dirs: TileCoord[] = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

  while (open.size > 0) {
    const current = open.pop()!;
    const cx = current.coord.x, cy = current.coord.y;
    if (cx === target.x && cy === target.y) {
      const path: TileCoord[] = [];
      let c: TileCoord = target;
      while (key(c.x, c.y) !== startKey) {
        path.unshift(c);
        c = cameFrom.get(key(c.x, c.y))!;
      }
      path.unshift(start);
      return { ok: true, path, totalCost: gScore.get(key(cx, cy))! };
    }
    const currentG = gScore.get(key(cx, cy))!;
    for (const d of dirs) {
      const nx = cx + d.x, ny = cy + d.y;
      const cost = getMovementCost(state, unitId, { x: nx, y: ny });
      if (cost === null) continue;
      const tentativeG = currentG + cost;
      const nk = key(nx, ny);
      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, tentativeG);
        cameFrom.set(nk, { x: cx, y: cy });
        open.push({ coord: { x: nx, y: ny }, f: tentativeG + heuristic({ x: nx, y: ny }, target) });
      }
    }
  }
  return { ok: false, reason: 'No path found' };
}
