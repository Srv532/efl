import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/Constants';
import { GameState } from '../core/GameState';
import { Kabir } from '../entities/Kabir';

/**
 * LUNAR CHASE - The Main Gameplay Scene
 * Implements high-fidelity parallax, entity management, and HUD.
 */
export class PlayScene extends Phaser.Scene {
    private player!: Kabir;
    private sky!: Phaser.GameObjects.TileSprite;
    private ground!: Phaser.GameObjects.TileSprite;
    private scoreText!: Phaser.GameObjects.Text;
    private distanceText!: Phaser.GameObjects.Text;

    private obstacles!: Phaser.Physics.Arcade.Group;
    private collectibles!: Phaser.Physics.Arcade.Group;

    constructor() {
        super('PlayScene');
    }

    create() {
        GameState.instance.reset();

        // 1. Scene Construction
        this.sky = this.add.tileSprite(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 'sky')
            .setOrigin(0, 0)
            .setDepth(GAME_CONFIG.LAYERS.BG);

        this.ground = this.add.tileSprite(0, GAME_CONFIG.HEIGHT - 100, GAME_CONFIG.WIDTH, 200, 'ground')
            .setOrigin(0, 0)
            .setDepth(GAME_CONFIG.LAYERS.GROUND);

        // 2. Entities
        this.player = new Kabir(this);

        // Groups & Pooling
        this.obstacles = this.physics.add.group({
            defaultKey: 'cheppal',
            maxSize: 10,
            runChildUpdate: true
        });

        this.collectibles = this.physics.add.group();

        // 3. Collision Logic
        this.physics.add.overlap(this.player, this.obstacles, this.handleGameOver, undefined, this);
        this.physics.add.overlap(this.player, this.collectibles, this.handleCollection, undefined, this);

        // 4. Input Setup
        this.setupInput();

        // 5. HUD
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', { fontSize: '24px', color: '#fff' }).setDepth(100);
        this.distanceText = this.add.text(20, 50, 'DISTANCE: 0m', { fontSize: '24px', color: '#fff' }).setDepth(100);

        // Show HUD
        const hud = document.getElementById('game-hud');
        if (hud) hud.classList.remove('hidden');

        // 6. Spawn Timer
        this.time.addEvent({
            delay: GAME_CONFIG.SPAWN_INTERVAL_MIN,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
    }

    private setupInput() {
        // Keyboard Control
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-LEFT', () => this.player.switchLane('left'));
            this.input.keyboard.on('keydown-RIGHT', () => this.player.switchLane('right'));
            this.input.keyboard.on('keydown-UP', () => this.player.jump());
            this.input.keyboard.on('keydown-DOWN', () => this.player.slide());
            this.input.keyboard.on('keydown-A', () => this.player.switchLane('left'));
            this.input.keyboard.on('keydown-D', () => this.player.switchLane('right'));
            this.input.keyboard.on('keydown-W', () => this.player.jump());
            this.input.keyboard.on('keydown-S', () => this.player.slide());
            this.input.keyboard.on('keydown-SPACE', () => this.player.jump());
        }

        // Touch / UI Control
        const bindBtn = (id: string, action: () => void) => {
            const btn = document.getElementById(id);
            if (btn) {
                // Remove old listeners to prevent duplicates if scene restarts
                const newBtn = btn.cloneNode(true) as HTMLElement;
                btn.parentNode?.replaceChild(newBtn, btn);

                newBtn.addEventListener('touchstart', (e) => { e.preventDefault(); action(); });
                newBtn.addEventListener('click', (e) => { e.preventDefault(); action(); });
            }
        };

        bindBtn('mobile-left', () => this.player.switchLane('left'));
        bindBtn('mobile-right', () => this.player.switchLane('right'));
        bindBtn('mobile-jump', () => this.player.jump());
        bindBtn('mobile-slide', () => this.player.slide());

        // Resume Button
        const resumeBtn = document.getElementById('resume-btn');
        const pauseMenu = document.getElementById('pause-menu');
        const pauseBtn = document.getElementById('pause-btn');

        if (pauseBtn && pauseMenu && resumeBtn) {
            pauseBtn.onclick = () => {
                this.physics.pause();
                pauseMenu.classList.remove('hidden');
            };

            resumeBtn.onclick = () => {
                this.physics.resume();
                pauseMenu.classList.add('hidden');
            };

            const quitBtn = document.getElementById('quit-btn');
            if (quitBtn) {
                quitBtn.onclick = () => {
                    pauseMenu.classList.add('hidden');
                    this.scene.start('BootScene'); // Return to title
                };
            }

            const restartBtn = document.getElementById('restart-btn');
            if (restartBtn) {
                restartBtn.onclick = () => {
                    pauseMenu.classList.add('hidden');
                    this.scene.restart();
                };
            }
        }
    }

    private spawnObstacle() {
        if (GameState.instance.isGameOver) return;

        const lane = Phaser.Math.Between(0, 2);
        const x = GAME_CONFIG.LANE_CENTER + (lane - 1) * GAME_CONFIG.LANE_WIDTH;

        // Random Obstacle Type
        const typeRoll = Phaser.Math.Between(0, 100);
        let type = 'cheppal';

        if (typeRoll > 75) type = 'rickshaw';
        else if (typeRoll > 50) type = 'vendor';

        // Object Pooling: Get inactive or create new
        let obstacle = this.obstacles.get(x, -100);

        if (!obstacle) {
            obstacle = this.obstacles.create(x, -100, type);
        }

        if (obstacle) {
            obstacle.setTexture(type);
            obstacle.setActive(true);
            obstacle.setVisible(true);
            obstacle.setPosition(x, -100);
            obstacle.setVelocityY(GameState.instance.currentSpeed);
            obstacle.setDepth(GAME_CONFIG.LAYERS.ENTITIES);

            // Fix Hitbox based on Type (Assets are ~1024px, need aggressive scaling)
            if (obstacle.body) {
                obstacle.body.enable = true;
                if (type === 'rickshaw') {
                    obstacle.setScale(0.25); // Result: ~256px
                    obstacle.body.setSize(180, 200);
                    obstacle.body.setOffset(400, 400); // Center hitbox on large texture
                } else if (type === 'vendor') {
                    obstacle.setScale(0.25); // Result: ~256px
                    obstacle.body.setSize(180, 150);
                    obstacle.body.setOffset(400, 400);
                } else {
                    obstacle.setScale(0.1); // Cheppal ~100px
                    obstacle.body.setSize(60, 100);
                    obstacle.body.setOffset(450, 450);
                }
            }
        }

        // Spawn Coins (50% chance)
        if (Phaser.Math.Between(0, 100) > 50) {
            this.spawnCoins(lane);
        }
    }

    private spawnCoins(laneIndex: number) {
        const x = GAME_CONFIG.LANE_CENTER + (laneIndex - 1) * GAME_CONFIG.LANE_WIDTH;

        // CHECK FOR UMBRELLA PART SPAWN
        // Basic Logic: Spawn a part every 500m if not already collected
        const nextPartIndex = GameState.instance.collectedParts.length;
        if (nextPartIndex < GameState.UMBRELLA_PARTS.length) {
            const distThreshold = (nextPartIndex + 1) * 300; // e.g., 300m, 600m, 900m
            if (GameState.instance.distance > distThreshold && Phaser.Math.Between(0, 100) > 80) {
                // 20% chance to spawn the needed part once threshold reached
                const partName = GameState.UMBRELLA_PARTS[nextPartIndex];

                // Spawn Part instead of Coins
                const part = this.collectibles.create(x, -350, 'umbrella_part');
                part.setName(partName); // Store part ID
                part.setScale(0.15);
                part.setVelocityY(GameState.instance.currentSpeed);
                part.setDepth(GAME_CONFIG.LAYERS.ENTITIES);
                if (part.body) {
                    part.body.setCircle(200);
                    part.body.setOffset(200, 200);
                }
                return; // Skip coins if part spawned
            }
        }

        // Spawn 3 coins in a row behind obstacle
        for (let i = 1; i <= 3; i++) {
            const coin = this.collectibles.create(x, -350 - (i * 120), 'coin'); // Spawn further back
            if (coin) {
                coin.setName('coin');
                coin.setScale(0.1); // Scale down giant coin
                coin.setVelocityY(GameState.instance.currentSpeed);
                coin.setDepth(GAME_CONFIG.LAYERS.ENTITIES);
                if (coin.body) {
                    coin.body.setCircle(250); // Relative to unscaled 1024px texture
                    coin.body.setOffset(262, 262);
                }
            }
        }
    }

    private handleCollection(_player: any, collectible: any) {
        const type = collectible.name;
        collectible.destroy();

        if (type === 'coin') {
            GameState.instance.score += 50;
            // Visual text popup
            const sprite = collectible as Phaser.Physics.Arcade.Sprite;
            this.showFloatingText(sprite.x, sprite.y, '+50');
        } else {
            // It's an umbrella part!
            const partName = type;
            if (!GameState.instance.collectedParts.includes(partName)) {
                GameState.instance.collectedParts.push(partName);
                GameState.instance.umbrellaParts++;
                GameState.instance.score += 1000;

                // Update UI Slot
                const slot = document.querySelector(`.slot[data-part="${partName}"]`);
                if (slot) slot.classList.add('collected');

                this.showFloatingText(collectible.x, collectible.y, `GOT ${partName.toUpperCase()}!`, '#00b894');

                // Check Win
                if (GameState.instance.collectedParts.length >= GameState.UMBRELLA_PARTS.length) {
                    this.handleVictory();
                }
            }
        }
    }

    private showFloatingText(x: number, y: number, msg: string, color: string = '#ffd700') {
        const text = this.add.text(x, y, msg, {
            fontSize: '24px', color: color, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    private handleVictory() {
        this.physics.pause();
        const winScreen = document.getElementById('victory-screen');
        if (winScreen) {
            winScreen.classList.remove('hidden');
            document.getElementById('victory-score')!.innerText = GameState.instance.score.toString();
            document.getElementById('victory-distance')!.innerText = Math.floor(GameState.instance.distance) + 'm';

            const menuBtn = document.getElementById('victory-menu-btn');
            if (menuBtn) {
                menuBtn.onclick = () => {
                    winScreen.classList.add('hidden');
                    this.scene.start('BootScene');
                };
            }
        }
    }

    private handleGameOver() {
        if (GameState.instance.isGameOver) return;
        GameState.instance.isGameOver = true;

        this.physics.pause();
        this.player.setTint(0xff0000);

        // Hide HUD
        const hud = document.getElementById('game-hud');
        if (hud) hud.classList.add('hidden');

        // Show Game Over UI
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');

            const finalScore = document.getElementById('final-score');
            if (finalScore) finalScore.innerText = GameState.instance.score.toString();

            const finalDist = document.getElementById('final-distance');
            if (finalDist) finalDist.innerText = Math.floor(GameState.instance.distance) + 'm';

            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) {
                retryBtn.onclick = () => {
                    gameOverScreen.classList.add('hidden');
                    this.scene.restart();
                };
            }

            const menuBtn = document.getElementById('menu-btn');
            if (menuBtn) {
                menuBtn.onclick = () => {
                    gameOverScreen.classList.add('hidden');
                    this.scene.start('BootScene');
                };
            }
        }
    }

    update(_time: number, delta: number) {
        if (GameState.instance.isGameOver) return;

        // 1. State Updates
        GameState.instance.updateDistance(delta);
        GameState.instance.currentSpeed = Math.min(GAME_CONFIG.SPEED_MAX, GameState.instance.currentSpeed + 0.5); // Slightly faster accel

        // 2. Visual Movement (Parallax)
        this.sky.tilePositionX += (GameState.instance.currentSpeed * 0.05 * delta) / 1000;
        this.ground.tilePositionY -= (GameState.instance.currentSpeed * delta) / 1000; // Vertical scroll for ground

        // 3. HUD Refresh
        // 3. HUD Refresh (Phaser Text - Hidden logic but kept for safety)
        this.scoreText.setText(`SCORE: ${GameState.instance.score}`);
        this.distanceText.setText(`DISTANCE: ${Math.floor(GameState.instance.distance)}m`);

        // HTML HUD REFRESH
        const hudScore = document.getElementById('hud-score');
        if (hudScore) hudScore.innerText = GameState.instance.score.toString();

        const hudDist = document.getElementById('hud-distance');
        if (hudDist) hudDist.innerText = Math.floor(GameState.instance.distance) + 'm';

        // 4. Update Obstacles Speed & Cleanup
        this.obstacles.getChildren().forEach((child: any) => {
            const obstacle = child as Phaser.Physics.Arcade.Sprite;
            if (obstacle.active) {
                obstacle.setVelocityY(GameState.instance.currentSpeed);

                if (obstacle.y > GAME_CONFIG.HEIGHT + 100) {
                    this.obstacles.killAndHide(obstacle);
                    if (obstacle.body) obstacle.body.enable = false;
                }
            }
        });

        // 5. Update Coins
        this.collectibles.getChildren().forEach((child: any) => {
            const coin = child as Phaser.Physics.Arcade.Sprite;
            if (coin.active) {
                coin.setVelocityY(GameState.instance.currentSpeed);
                if (coin.y > GAME_CONFIG.HEIGHT + 100) {
                    coin.destroy();
                }
            }
        });
    }
}
