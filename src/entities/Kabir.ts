import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/Constants';

export class Kabir extends Phaser.Physics.Arcade.Sprite {
    private currentLane: number = 1;
    private targetX: number = GAME_CONFIG.LANE_CENTER;
    private isSliding: boolean = false;

    constructor(scene: Phaser.Scene) {
        // Adjusted Y for 256px sprite (Feet at ~650)
        super(scene, GAME_CONFIG.LANE_CENTER, GAME_CONFIG.HEIGHT - 180, 'kabir');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setGravityY(GAME_CONFIG.GRAVITY);
        this.setDepth(GAME_CONFIG.LAYERS.ENTITIES);
        this.play('run');

        // Initial Hitbox for 256x256 sprite
        // Tighter box around the body
        this.body!.setSize(80, 160);
        this.body!.setOffset(88, 96);
    }

    public switchLane(direction: 'left' | 'right') {
        if (direction === 'left' && this.currentLane > 0) {
            this.currentLane--;
        } else if (direction === 'right' && this.currentLane < 2) {
            this.currentLane++;
        }

        this.targetX = GAME_CONFIG.LANE_CENTER + (this.currentLane - 1) * GAME_CONFIG.LANE_WIDTH;

        this.scene.tweens.add({
            targets: this,
            x: this.targetX,
            duration: 150,
            ease: 'Cubic.easeOut'
        });
    }

    public jump() {
        if (this.body!.blocked.down) {
            this.setVelocityY(GAME_CONFIG.JUMP_VELOCITY);
            this.play('run', false); // Optional jump frame here
        }
    }

    public slide() {
        if (!this.isSliding && this.body!.blocked.down) {
            this.isSliding = true;
            this.body!.setSize(60, 50);
            this.body!.setOffset(34, 70);

            this.scene.time.delayedCall(GAME_CONFIG.SLIDE_DURATION, () => {
                this.isSliding = false;
                // RESTORE CORRECT 256px SPRITE HITBOX
                this.body!.setSize(80, 160);
                this.body!.setOffset(88, 96);
            });
        }
    }
}
