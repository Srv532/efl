import Phaser from 'phaser';
import { generateArt } from '../art/draw';
import { GameState } from '../core/GameState';
import { initMenu } from '../ui/menu';

/**
 * BOOT - draws every texture in code (nothing to download), then opens the title screen.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        generateArt(this);

        // HUD slots and the title backdrop use the same art as the game.
        document.querySelectorAll<HTMLElement>('.slot').forEach((slot, i) => {
            slot.innerHTML = `<img alt="" draggable="false" src="${this.textures.getBase64('parts', i)}">`;
        });
        const bg = document.querySelector<HTMLElement>('.menu-background');
        if (bg) bg.style.backgroundImage = `linear-gradient(rgba(13,5,24,.62), rgba(13,5,24,.82)), url(${this.textures.getBase64('street')})`;

        document.getElementById('loading-screen')?.classList.add('hidden');
        void GameState.instance;
        initMenu(() => this.game.scene.start('PlayScene'));
    }
}
