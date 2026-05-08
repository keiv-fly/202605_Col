import type { GameEngine, GameState, TileCoord, ColonyId, UnitId } from '../game/GameState';

export class UIView {
  private container: HTMLDivElement;
  private turnEl: HTMLSpanElement;
  private unitPanel: HTMLDivElement;
  private tilePanel: HTMLDivElement;
  private colonyPanel: HTMLDivElement;
  private msgLog: HTMLDivElement;
  private onEndTurn: () => void = () => {};
  private onSave: () => void = () => {};
  private onLoad: () => void = () => {};

  constructor(private engine: GameEngine) {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      userSelect: 'none',
    });
    document.getElementById('game-container')!.appendChild(this.container);

    this.container.innerHTML = `
      <div id="hud-top" style="position:absolute;top:8px;left:8px;display:flex;gap:8px;pointer-events:auto;">
        <div style="background:rgba(0,0,0,0.75);color:#fff;padding:6px 12px;border-radius:4px;font-family:monospace;font-size:13px;">
          Turn: <span id="turn-counter">1</span>
        </div>
        <button id="btn-save" style="background:rgba(40,80,40,0.9);color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-family:monospace;">Save</button>
        <button id="btn-load" style="background:rgba(40,40,80,0.9);color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-family:monospace;">Load</button>
        <button id="btn-end-turn" style="background:rgba(120,60,0,0.9);color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-family:monospace;font-weight:bold;">End Turn</button>
      </div>
      <div id="hud-right" style="position:absolute;top:8px;right:8px;width:220px;display:flex;flex-direction:column;gap:6px;pointer-events:none;">
        <div id="unit-panel" style="background:rgba(0,0,0,0.75);color:#fff;padding:8px;border-radius:4px;font-family:monospace;font-size:12px;display:none;"></div>
        <div id="tile-panel" style="background:rgba(0,0,0,0.75);color:#fff;padding:8px;border-radius:4px;font-family:monospace;font-size:12px;display:none;"></div>
        <div id="colony-panel" style="background:rgba(0,0,0,0.75);color:#fff;padding:8px;border-radius:4px;font-family:monospace;font-size:12px;display:none;"></div>
      </div>
      <div id="msg-log" style="position:absolute;bottom:8px;left:8px;width:360px;max-height:120px;overflow-y:auto;background:rgba(0,0,0,0.6);color:#ccc;padding:6px;border-radius:4px;font-family:monospace;font-size:11px;"></div>
    `;

    this.turnEl = document.getElementById('turn-counter') as HTMLSpanElement;
    this.unitPanel = document.getElementById('unit-panel') as HTMLDivElement;
    this.tilePanel = document.getElementById('tile-panel') as HTMLDivElement;
    this.colonyPanel = document.getElementById('colony-panel') as HTMLDivElement;
    this.msgLog = document.getElementById('msg-log') as HTMLDivElement;

    document.getElementById('btn-end-turn')!.addEventListener('click', () => this.onEndTurn());
    document.getElementById('btn-save')!.addEventListener('click', () => this.onSave());
    document.getElementById('btn-load')!.addEventListener('click', () => this.onLoad());
  }

  setEndTurnHandler(fn: () => void): void {
    this.onEndTurn = fn;
  }

  setSaveHandler(fn: () => void): void {
    this.onSave = fn;
  }

  setLoadHandler(fn: () => void): void {
    this.onLoad = fn;
  }

  refresh(state: GameState): void {
    this.turnEl.textContent = String(state.turn);
  }

  showUnit(unitId: UnitId | null, state: GameState): void {
    if (!unitId || !state.units[unitId]) {
      this.unitPanel.style.display = 'none';
      return;
    }
    const u = state.units[unitId];
    this.unitPanel.style.display = 'block';
    this.unitPanel.innerHTML = `<b>Unit</b><br>Type: ${u.type}<br>MP: ${u.movementPoints}/${u.maxMovementPoints}<br>Pos: (${u.x},${u.y})`;
  }

  showTile(coord: TileCoord | null, state: GameState): void {
    if (!coord) {
      this.tilePanel.style.display = 'none';
      this.colonyPanel.style.display = 'none';
      return;
    }
    if (coord.x < 0 || coord.x >= state.map.width || coord.y < 0 || coord.y >= state.map.height) {
      this.tilePanel.style.display = 'none';
      return;
    }
    const tile = state.map.tiles[coord.y * state.map.width + coord.x];
    this.tilePanel.style.display = 'block';
    this.tilePanel.innerHTML = `<b>Tile</b><br>Pos: (${coord.x},${coord.y})<br>Terrain: ${tile.terrain}`;

    if (tile.colonyId && state.colonies[tile.colonyId]) {
      const col = state.colonies[tile.colonyId];
      this.colonyPanel.style.display = 'block';
      this.colonyPanel.innerHTML = `<b>Colony: ${col.name}</b><br>Pop: ${col.population.length}<br>Food: ${col.storage.food}<br>Lumber: ${col.storage.lumber}`;
    } else {
      this.colonyPanel.style.display = 'none';
    }
  }

  log(msg: string): void {
    const p = document.createElement('div');
    p.textContent = msg;
    this.msgLog.appendChild(p);
    this.msgLog.scrollTop = this.msgLog.scrollHeight;
    // Keep only last 30 messages
    while (this.msgLog.children.length > 30) {
      this.msgLog.removeChild(this.msgLog.firstChild!);
    }
  }

  destroy(): void {
    this.container.remove();
  }
}
