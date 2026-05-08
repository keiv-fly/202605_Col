import type { Container } from 'pixi.js';
import { TILE_SIZE } from './helpers';

export const ZOOM_LEVELS = [0.5, 1.0, 2.0];

export class CameraController {
  private zoomIndex = 1;
  panX = 0;
  panY = 0;

  get zoom(): number {
    return ZOOM_LEVELS[this.zoomIndex];
  }

  attach(container: Container, canvas: HTMLCanvasElement): void {
    // Pan with keyboard
    const keys = new Set<string>();
    window.addEventListener('keydown', (e) => {
      keys.add(e.key);
      if (e.key === '+' || e.key === '=') this.zoomIn();
      if (e.key === '-') this.zoomOut();
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key));

    // Scroll wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) this.zoomIn();
      else this.zoomOut();
    }, { passive: false });

    // Pan with mouse drag (middle button)
    let dragging = false;
    let dragStartX = 0, dragStartY = 0;
    let panStartX = 0, panStartY = 0;
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1) {
        dragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        panStartX = this.panX;
        panStartY = this.panY;
        e.preventDefault();
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (dragging) {
        this.panX = panStartX + (e.clientX - dragStartX);
        this.panY = panStartY + (e.clientY - dragStartY);
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 1) dragging = false;
    });

    // Tick pan with arrow keys
    let lastTime = 0;
    const PAN_SPEED = 200; // px/s
    const tick = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      const speed = PAN_SPEED * dt;
      if (keys.has('ArrowLeft')) this.panX += speed;
      if (keys.has('ArrowRight')) this.panX -= speed;
      if (keys.has('ArrowUp')) this.panY += speed;
      if (keys.has('ArrowDown')) this.panY -= speed;
      this.apply(container);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  apply(container: Container): void {
    container.x = this.panX;
    container.y = this.panY;
    container.scale.set(this.zoom);
  }

  zoomIn(): void {
    if (this.zoomIndex < ZOOM_LEVELS.length - 1) this.zoomIndex++;
  }

  zoomOut(): void {
    if (this.zoomIndex > 0) this.zoomIndex--;
  }

  screenToTile(screenX: number, screenY: number): { x: number; y: number } {
    const worldX = (screenX - this.panX) / this.zoom;
    const worldY = (screenY - this.panY) / this.zoom;
    return { x: Math.floor(worldX / TILE_SIZE), y: Math.floor(worldY / TILE_SIZE) };
  }
}
