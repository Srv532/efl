import Phaser from 'phaser';
import { GAME_CONFIG } from './config/Constants';
import { BootScene } from './scenes/BootScene';
import { PlayScene } from './scenes/PlayScene';

/**
 * ESCAPE FROM LUNARS - ENTRY POINT
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'phaser-game',
    backgroundColor: '#1a1a2e',
    scene: [BootScene, PlayScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        antialias: true,
        roundPixels: true,
        powerPreference: 'high-performance',
    },
};

window.addEventListener('load', () => {
    new Phaser.Game(config);
});

window.addEventListener('error', (e) => console.error('[EFL]', e.message, `${e.lineno}:${e.colno}`));
window.addEventListener('unhandledrejection', (e) => console.error('[EFL] rejection', e.reason));
