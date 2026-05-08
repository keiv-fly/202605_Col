import { Container, Sprite, type Renderer } from 'pixi.js';
import type { GameMap, Tile } from '../game/GameState';
import type { TerrainType } from '../game/map/terrain';
import { TileAtlas } from './TileAtlas';
import { TILE_SIZE } from './helpers';

export class MapRenderer {
  readonly container = new Container();
  private atlas: TileAtlas;
  private sprites: Sprite[] = [];
  private mapWidth = 0;

  constructor(private renderer: Renderer) {
    this.atlas = new TileAtlas();
  }

  init(): void {
    this.atlas.build(this.renderer);
  }

  renderMap(map: GameMap): void {
    this.container.removeChildren();
    this.sprites = [];
    this.mapWidth = map.width;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y * map.width + x];
        const sprite = new Sprite(this.atlas.getTexture(tile.terrain as TerrainType));
        sprite.x = x * TILE_SIZE;
        sprite.y = y * TILE_SIZE;
        this.container.addChild(sprite);
        this.sprites[y * map.width + x] = sprite;
      }
    }
  }

  updateTile(x: number, y: number, tile: Tile): void {
    const sprite = this.sprites[y * this.mapWidth + x];
    if (sprite) {
      sprite.texture = this.atlas.getTexture(tile.terrain as TerrainType);
    }
  }

  destroy(): void {
    this.atlas.destroy();
    this.container.destroy({ children: true });
  }
}
