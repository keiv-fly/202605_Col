import { Application } from 'pixi.js';

export class BootView {
  app: Application;

  constructor() {
    this.app = new Application();
  }

  async init(): Promise<void> {
    await this.app.init({
      background: 0x1a1a2e,
      resizeTo: window,
      antialias: false,
    });
    const container = document.getElementById('game-container');
    if (!container) throw new Error('No #game-container element');
    container.appendChild(this.app.canvas as HTMLCanvasElement);
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
