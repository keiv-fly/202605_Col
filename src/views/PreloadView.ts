import type { Application } from 'pixi.js';

export class PreloadView {
  private el: HTMLDivElement;

  constructor(private app: Application) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '18px',
      background: 'rgba(0,0,0,0.8)',
      zIndex: '10',
    });
    this.el.textContent = 'Loading...';
    document.getElementById('game-container')!.appendChild(this.el);
  }

  async load(): Promise<void> {
    // Simulate asset loading (tile atlas is generated in MapRenderer.init())
    await Promise.resolve();
  }

  dismiss(): void {
    this.el.remove();
  }
}
