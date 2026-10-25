import { Game } from './game/Game';
import { partIcon } from './game/icons';
import { initMenu } from './ui/menu';

/**
 * ESCAPE FROM LUNARS - ENTRY POINT
 */
function boot() {
    const root = document.getElementById('game-canvas');
    if (!root) return;

    // HUD slots use the same badges as the 3D pickups
    document.querySelectorAll<HTMLElement>('.slot').forEach((slot, i) => {
        slot.innerHTML = `<img alt="" draggable="false" src="${partIcon(i)}">`;
    });

    const game = new Game(root);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__efl = game;
    document.getElementById('loading-screen')?.classList.add('hidden');
    initMenu(() => game.start());
}

window.addEventListener('load', boot);
window.addEventListener('error', (e) => console.error('[EFL]', e.message, `${e.lineno}:${e.colno}`));
window.addEventListener('unhandledrejection', (e) => console.error('[EFL] rejection', e.reason));
