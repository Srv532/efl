import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/Constants';
import { RUN_FRAMES } from '../art/draw';

const JUMP_FRAME = RUN_FRAMES;
const SLIDE_FRAME = RUN_FRAMES + 1;
const BASE_SCALE = 1.15;

/** The player. Top-down view: a jump is faked with scale and a shrinking shadow. */
export class Kabir {
    public readonly sprite: Phaser.GameObjects.Sprite;
    public readonly shadow: Phaser.GameObjects.Image;
    public lane = 1;
    public airborne = false;
    public sliding = false;
    public invulnUntil = 0;

    private readonly scene: Phaser.Scene;
    private busy = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        const y = GAME_CONFIG.HEIGHT - 190;
        this.shadow = scene.add.image(GAME_CONFIG.LANE_CENTER, y + 52, 'shadow')
            .setDepth(GAME_CONFIG.LAYERS.SHADOW);
        this.sprite = scene.add.sprite(GAME_CONFIG.LANE_CENTER, y, 'kabir')
            .setScale(BASE_SCALE)
            .setDepth(GAME_CONFIG.LAYERS.PLAYER);
        this.sprite.play('run');
    }

    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }

    /** Body box used for collisions (centre + size). */
    get hitbox() {
        if (this.sliding) return { cx: this.x, cy: this.y + 18, w: 56, h: 44 };
        return { cx: this.x, cy: this.y + 6, w: 56, h: 84 };
    }

    public switchLane(direction: 'left' | 'right') {
        const next = Phaser.Math.Clamp(this.lane + (direction === 'left' ? -1 : 1), 0, 2);
        if (next === this.lane) return;
        this.lane = next;
        const x = GAME_CONFIG.LANE_CENTER + (this.lane - 1) * GAME_CONFIG.LANE_WIDTH;
        const lean = direction === 'left' ? -14 : 14;
        this.scene.tweens.add({ targets: [this.sprite, this.shadow], x, duration: 140, ease: 'Cubic.easeOut' });
        this.scene.tweens.add({ targets: this.sprite, angle: lean, duration: 70, yoyo: true, ease: 'Sine.easeOut' });
    }

    public jump() {
        if (this.busy) return;
        this.busy = true;
        this.airborne = true;
        this.sprite.anims.stop();
        this.sprite.setFrame(JUMP_FRAME);
        const half = GAME_CONFIG.JUMP_TIME / 2;
        this.scene.tweens.add({
            targets: this.sprite, scale: BASE_SCALE * 1.4, duration: half, yoyo: true, ease: 'Sine.easeOut',
            onComplete: () => { this.airborne = false; this.busy = false; this.sprite.play('run'); },
        });
        this.scene.tweens.add({
            targets: this.shadow, scale: 0.55, alpha: 0.5, duration: half, yoyo: true, ease: 'Sine.easeOut',
        });
    }

    public slide() {
        if (this.busy) return;
        this.busy = true;
        this.sliding = true;
        this.sprite.anims.stop();
        this.sprite.setFrame(SLIDE_FRAME);
        this.scene.tweens.add({
            targets: this.sprite, scaleY: BASE_SCALE * 0.62, scaleX: BASE_SCALE * 1.1,
            duration: 110, yoyo: true, hold: GAME_CONFIG.SLIDE_TIME - 220, ease: 'Sine.easeOut',
            onComplete: () => { this.sliding = false; this.busy = false; this.sprite.play('run'); },
        });
    }

    public stumble(now: number) {
        this.invulnUntil = now + GAME_CONFIG.INVULN_TIME;
        this.scene.tweens.add({
            targets: this.sprite, alpha: 0.3, duration: 90, yoyo: true, repeat: 7,
            onComplete: () => this.sprite.setAlpha(1),
        });
        this.sprite.setTint(0xff7070);
        this.scene.time.delayedCall(260, () => this.sprite.clearTint());
    }

    public freeze() {
        this.sprite.anims.stop();
    }
}
