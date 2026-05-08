import { Container, Graphics, Text } from 'pixi.js';
import type { GameState, UnitId } from '../game/GameState';
import { TILE_SIZE } from './helpers';

const UNIT_COLORS: Record<string, number> = {
  free_colonist: 0xf0e68c,
  pioneer:       0xffa500,
  scout:         0x87ceeb,
  soldier:       0xff6347,
  wagon_train:   0xdeb887,
};

export class UnitRenderer {
  readonly container = new Container();
  private unitSprites = new Map<UnitId, Container>();

  sync(state: GameState): void {
    const currentIds = new Set(Object.keys(state.units));

    // Remove sprites for units that no longer exist
    for (const [id, sprite] of this.unitSprites) {
      if (!currentIds.has(id)) {
        this.container.removeChild(sprite);
        sprite.destroy({ children: true });
        this.unitSprites.delete(id);
      }
    }

    // Add or update sprites
    for (const unit of Object.values(state.units)) {
      let unitContainer = this.unitSprites.get(unit.id);
      if (!unitContainer) {
        unitContainer = this.createUnitSprite(unit.type);
        this.container.addChild(unitContainer);
        this.unitSprites.set(unit.id, unitContainer);
      }
      unitContainer.x = unit.x * TILE_SIZE + TILE_SIZE / 2;
      unitContainer.y = unit.y * TILE_SIZE + TILE_SIZE / 2;
    }
  }

  private createUnitSprite(type: string): Container {
    const c = new Container();
    const g = new Graphics();
    const color = UNIT_COLORS[type] ?? 0xffffff;
    g.circle(0, 0, 18).fill(color);
    g.circle(0, 0, 18).stroke({ color: 0x000000, width: 2 });
    c.addChild(g);
    const label = new Text({
      text: type[0].toUpperCase(),
      style: {
        fill: 0x000000,
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'monospace',
      },
    });
    label.anchor.set(0.5);
    c.addChild(label);
    return c;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
