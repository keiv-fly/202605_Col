import { Container, type Application } from 'pixi.js';
import type { GameEngine, TileCoord, UnitId } from '../game/GameState';
import { MapRenderer } from '../rendering/MapRenderer';
import { UnitRenderer } from '../rendering/UnitRenderer';
import { SelectionRenderer } from '../rendering/SelectionRenderer';
import { CameraController } from '../rendering/CameraController';
import { getSelectionTarget } from '../rendering/helpers';
import type { UIView } from './UIView';

export class MapView {
  private mapContainer = new Container();
  private mapRenderer: MapRenderer;
  private unitRenderer: UnitRenderer;
  private selectionRenderer: SelectionRenderer;
  private camera: CameraController;

  private selectedUnitId: UnitId | null = null;
  private selectedTile: TileCoord | null = null;
  private hoveredTile: TileCoord | null = null;

  constructor(
    private app: Application,
    private engine: GameEngine,
    private ui: UIView,
  ) {
    this.mapRenderer = new MapRenderer(app.renderer);
    this.unitRenderer = new UnitRenderer();
    this.selectionRenderer = new SelectionRenderer();
    this.camera = new CameraController();

    // Layer order
    this.mapContainer.addChild(this.mapRenderer.container);
    this.mapContainer.addChild(this.selectionRenderer.container);
    this.mapContainer.addChild(this.unitRenderer.container);

    app.stage.addChild(this.mapContainer);
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    this.mapRenderer.init();

    const state = engine.getState();
    this.mapRenderer.renderMap(state.map);
    this.unitRenderer.sync(state);

    this.camera.attach(this.mapContainer, app.canvas as HTMLCanvasElement);
    this.camera.panX = app.screen.width / 2 - state.map.startX * 64;
    this.camera.panY = app.screen.height / 2 - state.map.startY * 64;
    this.camera.apply(this.mapContainer);

    this.setupInput();
    this.setupUI();
  }

  private setupUI(): void {
    this.ui.setEndTurnHandler(() => {
      const events = this.engine.dispatch({ type: 'END_TURN' });
      this.selectedUnitId = null;
      this.selectedTile = null;
      this.selectionRenderer.clear();
      this.syncRenderers();
      for (const ev of events) {
        if (ev.type === 'TURN_ENDED') this.ui.log(`Turn ${ev.newTurn} began`);
        if (ev.type === 'GOODS_PRODUCED') this.ui.log(`Colony produced goods`);
        if (ev.type === 'FOOD_SHORTAGE') this.ui.log(`Food shortage in colony!`);
      }
      this.ui.refresh(this.engine.getState());
    });

    this.ui.setSaveHandler(() => {
      const save = this.engine.save();
      const json = JSON.stringify(save, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colony-save-turn${this.engine.getState().turn}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.ui.log('Game saved');
    });

    this.ui.setLoadHandler(() => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target!.result as string);
            this.engine.load(data);
            this.selectedUnitId = null;
            this.selectedTile = null;
            this.selectionRenderer.clear();
            const state = this.engine.getState();
            this.mapRenderer.renderMap(state.map);
            this.syncRenderers();
            this.ui.refresh(state);
            this.ui.log('Game loaded');
          } catch (err) {
            this.ui.log(`Load failed: ${err}`);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  private setupInput(): void {
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.addEventListener('click', (e) => this.handleClick(e));
    canvas.addEventListener('mousemove', (e) => this.handleHover(e));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.clearSelection();
      if (e.key === 'f' || e.key === 'F') this.tryFoundColony();
    });
  }

  private handleClick(e: MouseEvent): void {
    const tile = this.camera.screenToTile(e.clientX, e.clientY);
    const info = this.engine.getTileInfo(tile.x, tile.y);
    const target = getSelectionTarget(tile.x, tile.y, info.unitIds, info.colonyId);

    if (target?.kind === 'unit') {
      this.selectedUnitId = target.id;
      this.selectedTile = tile;
      const moves = this.engine.getValidMoves(target.id);
      this.selectionRenderer.showSelection(tile);
      this.selectionRenderer.showValidMoves(moves);
      this.ui.showUnit(target.id, this.engine.getState());
      this.ui.showTile(tile, this.engine.getState());
    } else if (this.selectedUnitId !== null) {
      // Try to move selected unit to this tile
      const events = this.engine.dispatch({ type: 'MOVE_UNIT', unitId: this.selectedUnitId, target: tile });
      for (const ev of events) {
        if (ev.type === 'UNIT_MOVED') {
          this.selectedTile = tile;
          this.selectionRenderer.showSelection(tile);
          const moves = this.engine.getValidMoves(this.selectedUnitId);
          this.selectionRenderer.showValidMoves(moves);
          this.ui.log(`Unit moved to (${tile.x},${tile.y})`);
        } else if (ev.type === 'UNIT_MOVE_REJECTED') {
          this.ui.log(`Move rejected: ${ev.reason}`);
        }
      }
      this.syncRenderers();
      this.ui.showUnit(this.selectedUnitId, this.engine.getState());
      this.ui.showTile(tile, this.engine.getState());
    } else {
      this.selectedTile = tile;
      this.selectedUnitId = null;
      this.selectionRenderer.showSelection(tile);
      this.selectionRenderer.showValidMoves([]);
      this.ui.showUnit(null, this.engine.getState());
      this.ui.showTile(tile, this.engine.getState());
    }
  }

  private handleHover(e: MouseEvent): void {
    const tile = this.camera.screenToTile(e.clientX, e.clientY);
    if (this.hoveredTile?.x === tile.x && this.hoveredTile?.y === tile.y) return;
    this.hoveredTile = tile;
  }

  private tryFoundColony(): void {
    if (!this.selectedUnitId) return;
    const name = prompt('Colony name (leave blank for auto):') ?? '';
    const events = this.engine.dispatch({ type: 'FOUND_COLONY', unitId: this.selectedUnitId, name });
    for (const ev of events) {
      if (ev.type === 'COLONY_FOUNDED') {
        this.ui.log(`Colony founded at (${ev.x},${ev.y})`);
        const state = this.engine.getState();
        const tile = state.map.tiles[ev.y * state.map.width + ev.x];
        this.mapRenderer.updateTile(ev.x, ev.y, tile);
        this.selectedUnitId = null;
        this.selectionRenderer.clear();
      } else if (ev.type === 'COLONY_FOUNDING_REJECTED') {
        this.ui.log(`Cannot found colony: ${ev.reason}`);
      }
    }
    this.syncRenderers();
    this.ui.refresh(this.engine.getState());
  }

  private clearSelection(): void {
    this.selectedUnitId = null;
    this.selectedTile = null;
    this.selectionRenderer.clear();
    this.ui.showUnit(null, this.engine.getState());
    this.ui.showTile(null, this.engine.getState());
  }

  private syncRenderers(): void {
    this.unitRenderer.sync(this.engine.getState());
  }

  destroy(): void {
    this.mapRenderer.destroy();
    this.unitRenderer.destroy();
    this.selectionRenderer.destroy();
  }
}
