import Phaser from 'phaser';
import { GAME_CONFIG } from './config/Constants';
import { BootScene } from './scenes/BootScene';
import { PlayScene } from './scenes/PlayScene';

/**
 * ESCAPE FROM LUNARS - PRODUCTION ENTRY POINT
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [BootScene, PlayScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: false,
        antialias: true,
        powerPreference: 'high-performance'
    }
};

window.addEventListener('load', () => {
    new Phaser.Game(config);
});

// Global Error Handler for on-screen debugging
window.onerror = function (msg, url, lineNo, columnNo, error) {
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
        debugLog.innerHTML += `<div style="color: #ff4444;">[ERROR] ${msg} (${lineNo}:${columnNo})</div>`;
        debugLog.scrollTop = debugLog.scrollHeight;
    }
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
        debugLog.innerHTML += `<div style="color: #ff4444;">[Promise Rejection] ${event.reason}</div>`;
        debugLog.scrollTop = debugLog.scrollHeight;
    }
});
