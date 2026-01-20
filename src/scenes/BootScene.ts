import Phaser from 'phaser';

/**
 * BOOTSTRAP - The Gateway Scene
 * Handles all asset management and initialization.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.createLoadingUI();

        const debugLog = document.getElementById('debug-log');
        const log = (msg: string) => {
            if (debugLog) {
                debugLog.innerHTML += `<div>${msg}</div>`;
                debugLog.scrollTop = debugLog.scrollHeight;
            }
        };

        log('BootScene: Starting Preload...');

        this.load.on('loaderror', (file: any) => {
            log(`[LOAD ERROR] ${file.key} from ${file.url}`);
        });

        // 1. Sprites
        this.load.setPath('/assets/');
        this.load.spritesheet('kabir', 'sprites/boy.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('mother', 'sprites/mother.png', { frameWidth: 256, frameHeight: 256 });

        // Obstacles
        this.load.image('cheppal', 'sprites/cheppal.png');
        this.load.image('rickshaw', 'sprites/rickshaw.png');
        this.load.image('vendor', 'sprites/vendor.png');

        // Collectibles
        this.load.image('coin', 'sprites/coin.png');
        this.load.spritesheet('powerups', 'sprites/powerups.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('umbrella_part', 'sprites/umbrella_parts.png');

        // 2. Environment
        this.load.image('sky', 'backgrounds/kerala_bg.png');
        this.load.image('ground', 'backgrounds/terraces.png');

        // 3. UI
        this.load.image('logo', 'ui/logo.png');

        // Progress Tracking
        this.load.on('progress', (value: number) => {
            const bar = document.getElementById('loading-progress');
            if (bar) bar.style.width = `${value * 100}%`;

            const text = document.getElementById('loading-text');
            if (text) text.innerText = `Calibrating Moonshot: ${Math.round(value * 100)}%`;
        });

        this.load.on('complete', () => {
            log('BootScene: Assets Loaded. Creating Animations...');
        });
    }

    create() {
        // Define Animations
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('kabir', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'mother_run',
            frames: this.anims.generateFrameNumbers('mother', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        // Hide Loading Screen
        const loader = document.getElementById('loading-screen');
        if (loader) loader.style.display = 'none';

        // Show Main Menu
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.classList.remove('hidden');

            // Activate Play Button
            const playBtn = document.getElementById('play-btn');
            if (playBtn) {
                // Remove old listeners just in case
                const newBtn = playBtn.cloneNode(true);
                playBtn.parentNode?.replaceChild(newBtn, playBtn);

                newBtn.addEventListener('click', () => {
                    mainMenu.classList.add('hidden');
                    this.scene.start('PlayScene');
                });
            }
        } else {
            // Fallback if no menu found
            this.scene.start('PlayScene');
        }
    }

    private createLoadingUI() {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2 - 50, 'INITIALIZING LUNAR SYSTEMS...', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }
}
