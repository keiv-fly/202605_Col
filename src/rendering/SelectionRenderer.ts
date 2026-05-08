import { Container, Graphics } from 'pixi.js';
import type { TileCoord } from '../game/GameState';
import { TILE_SIZE } from './helpers';

export class SelectionRenderer {
  readonly container = new Container();
  private selectedGraphics = new Graphics();
  private validMoveGraphics = new Graphics();

  constructor() {
    this.container.addChild(this.validMoveGraphics);
    this.container.addChild(this.selectedGraphics);
  }

  showSelection(coord: TileCoord | null): void {
    this.selectedGraphics.clear();
    if (!coord) return;
    this.selectedGraphics
      .rect(coord.x * TILE_SIZE + 2, coord.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)
      .stroke({ color: 0xffff00, width: 3 });
  }

  showValidMoves(tiles: TileCoord[]): void {
    this.validMoveGraphics.clear();
    for (const tile of tiles) {
      this.validMoveGraphics
        .rect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        .fill({ color: 0x00ff00, alpha: 0.25 });
    }
  }

  clear(): void {
    this.selectedGraphics.clear();
    this.validMoveGraphics.clear();
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
