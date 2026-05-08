import { createGameEngine } from './game/GameEngine';
import { BootView } from './views/BootView';
import { PreloadView } from './views/PreloadView';
import { UIView } from './views/UIView';
import { MapView } from './views/MapView';

async function main(): Promise<void> {
  const seed = 'mvp-seed-1';
  const engine = createGameEngine(seed);

  const boot = new BootView();
  await boot.init();

  const preload = new PreloadView(boot.app);
  await preload.load();
  preload.dismiss();

  const ui = new UIView(engine);
  ui.refresh(engine.getState());

  new MapView(boot.app, engine, ui);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  document.body.innerHTML = `<pre style="color:red;padding:20px">${err}</pre>`;
});
