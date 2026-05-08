import { Graphics, Texture, type Renderer } from 'pixi.js';
import type { TerrainType } from '../game/map/terrain';
import { TILE_SIZE } from './helpers';

const TERRAIN_COLORS: Record<TerrainType, number> = {
  ocean:     0x1a3a5c,
  coast:     0x2e6b9e,
  plains:    0xd4b44a,
  grassland: 0x3a7d44,
  forest:    0x1e4d2b,
  hills:     0x8b5e3c,
  mountains: 0x6b6b6b,
  desert:    0xd4a853,
  tundra:    0xa0b8b0,
  marsh:     0x4a6b3a,
};

export class TileAtlas {
  private textures: Map<TerrainType, Texture> = new Map();

  build(renderer: Renderer): void {
    for (const [terrain, color] of Object.entries(TERRAIN_COLORS) as [TerrainType, number][]) {
      const g = new Graphics();
      g.rect(0, 0, TILE_SIZE, TILE_SIZE).fill(color);
      // subtle border
      g.rect(0, 0, TILE_SIZE, TILE_SIZE).stroke({ color: 0x000000, width: 1, alpha: 0.2 });
      const texture = renderer.generateTexture(g);
      this.textures.set(terrain, texture);
      g.destroy();
    }
  }

  getTexture(terrain: TerrainType): Texture {
    return this.textures.get(terrain) ?? Texture.WHITE;
  }

  destroy(): void {
    for (const tex of this.textures.values()) tex.destroy();
    this.textures.clear();
  }
}
