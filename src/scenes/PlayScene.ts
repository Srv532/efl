import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/Constants';
import { GameState } from '../core/GameState';
import { Kabir } from '../entities/Kabir';
import { showMenu } from '../ui/menu';

type Kind = 'rickshaw' | 'cart' | 'chappal' | 'barrier' | 'banner';
/** dodge = change lane, jump = leap over it, slide = duck under it */
type Answer = 'dodge' | 'jump' | 'slide';

const SPECS: Record<Kind, { hw: number; hh: number; answer: Answer; depth: number; weight: number; extra: number }> = {
    rickshaw: { hw: 60, hh: 100, answer: 'dodge', depth: GAME_CONFIG.LAYERS.ITEMS, weight: 24, extra: 140 },
    cart: { hw: 62, hh: 78, answer: 'dodge', depth: GAME_CONFIG.LAYERS.ITEMS, weight: 20, extra: 0 },
    chappal: { hw: 44, hh: 38, answer: 'jump', depth: GAME_CONFIG.LAYERS.ITEMS, weight: 22, extra: 0 },
    barrier: { hw: 88, hh: 20, answer: 'jump', depth: GAME_CONFIG.LAYERS.ITEMS, weight: 16, extra: 0 },
    banner: { hw: 90, hh: 22, answer: 'slide', depth: GAME_CONFIG.LAYERS.OVERHEAD, weight: 18, extra: 0 },
};
const KINDS = Object.keys(SPECS) as Kind[];

interface Obstacle { s: Phaser.GameObjects.Image; kind: Kind; spent: boolean }
interface Pickup { s: Phaser.GameObjects.Sprite; type: 'coin' | 'part'; part?: number }

const laneX = (lane: number) => GAME_CONFIG.LANE_CENTER + (lane - 1) * GAME_CONFIG.LANE_WIDTH;
const $ = (id: string) => document.getElementById(id);

export class PlayScene extends Phaser.Scene {
    private player!: Kabir;
    private mother!: Phaser.GameObjects.Sprite;
    private street!: Phaser.GameObjects.TileSprite;
    private burst!: Phaser.GameObjects.Particles.ParticleEmitter;

    private obstacles: Obstacle[] = [];
    private pickups: Pickup[] = [];
    private spawnAcc = 0;
    private nextGap = 500;
    private lastLane = -1;
    private coins = 0;
    private nextPartAt = GAME_CONFIG.PART_EVERY_M;
    private partActive = false;
    private paused = false;
    private ended = false;
    private cleanup: Array<() => void> = [];
    private hud: Record<string, HTMLElement | null> = {};
    private swipe: { x: number; y: number } | null = null;

    constructor() {
        super('PlayScene');
    }

    create() {
        const state = GameState.instance;
        state.reset();
        this.obstacles = [];
        this.pickups = [];
        this.spawnAcc = 0;
        this.nextGap = 420;
        this.lastLane = -1;
        this.coins = 0;
        this.nextPartAt = GAME_CONFIG.PART_EVERY_M;
        this.partActive = false;
        this.paused = false;
        this.ended = false;

        this.street = this.add.tileSprite(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 'street')
            .setOrigin(0, 0).setDepth(GAME_CONFIG.LAYERS.BG);

        this.mother = this.add.sprite(laneX(1), GAME_CONFIG.HEIGHT + 200, 'mother')
            .setScale(1.3).setDepth(GAME_CONFIG.LAYERS.MOTHER);
        this.mother.play('mother_run');

        this.player = new Kabir(this);

        this.add.particles(0, 0, 'dot', {
            follow: this.player.sprite, followOffset: { x: 0, y: 56 },
            lifespan: 380, speedY: { min: 90, max: 170 }, speedX: { min: -30, max: 30 },
            scale: { start: 0.9, end: 0 }, alpha: { start: 0.55, end: 0 }, tint: 0xd8c7a3, frequency: 55,
        }).setDepth(GAME_CONFIG.LAYERS.SHADOW);
        this.burst = this.add.particles(0, 0, 'dot', {
            emitting: false, lifespan: 520, speed: { min: 90, max: 260 },
            scale: { start: 1.3, end: 0 }, alpha: { start: 1, end: 0 },
        }).setDepth(GAME_CONFIG.LAYERS.FX);

        this.cameras.main.fadeIn(350, 13, 5, 24);

        this.cacheHud();
        this.bindControls();
        $('game-hud')?.classList.remove('hidden');
        ['pause-menu', 'game-over', 'victory-screen'].forEach((id) => $(id)?.classList.add('hidden'));
        $('danger-overlay')?.classList.remove('active');
        $('pause-btn')?.classList.remove('hidden');
    }

    // ---------- input ----------

    private bindControls() {
        const act = (a: 'left' | 'right' | 'jump' | 'slide') => {
            if (this.paused || this.ended) return;
            if (a === 'left' || a === 'right') this.player.switchLane(a);
            else if (a === 'jump') this.player.jump();
            else this.player.slide();
        };

        const onKey = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (k === 'escape' || k === 'p') { if (!e.repeat) this.togglePause(); return; }
            if (e.repeat) return;
            const map: Record<string, 'left' | 'right' | 'jump' | 'slide'> = {
                arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
                arrowup: 'jump', w: 'jump', ' ': 'jump', arrowdown: 'slide', s: 'slide',
            };
            const a = map[k];
            if (a) { e.preventDefault(); act(a); }
        };
        window.addEventListener('keydown', onKey);
        this.cleanup.push(() => window.removeEventListener('keydown', onKey));

        const onBlur = () => this.pause();
        window.addEventListener('blur', onBlur);
        this.cleanup.push(() => window.removeEventListener('blur', onBlur));

        // swipe on the canvas: left/right = lane, up = jump, down = slide, tap = jump
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { this.swipe = { x: p.x, y: p.y }; });
        this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
            if (!this.swipe) return;
            const dx = p.x - this.swipe.x, dy = p.y - this.swipe.y;
            this.swipe = null;
            const t = GAME_CONFIG.SWIPE_THRESHOLD;
            if (Math.abs(dx) < t && Math.abs(dy) < t) act('jump');
            else if (Math.abs(dx) > Math.abs(dy)) act(dx < 0 ? 'left' : 'right');
            else act(dy < 0 ? 'jump' : 'slide');
        });

        const bind = (id: string, fn: () => void) => {
            const el = $(id);
            if (!el) return;
            el.onclick = (e) => { e.preventDefault(); (el as HTMLElement).blur(); fn(); };
        };
        const hold = (id: string, a: 'left' | 'right' | 'jump' | 'slide') => {
            const el = $(id);
            if (!el) return;
            el.onpointerdown = (e) => { e.preventDefault(); act(a); };
            el.onclick = null;
        };
        hold('mobile-left', 'left'); hold('mobile-right', 'right');
        hold('mobile-jump', 'jump'); hold('mobile-slide', 'slide');
        bind('pause-btn', () => this.togglePause());
        bind('resume-btn', () => this.resumeGame());
        bind('restart-btn', () => this.scene.restart());
        bind('quit-btn', () => this.quit());
        bind('retry-btn', () => this.scene.restart());
        bind('menu-btn', () => this.quit());
        bind('victory-menu-btn', () => this.quit());

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.cleanup.forEach((fn) => fn());
            this.cleanup = [];
        });
    }

    private togglePause() { this.paused ? this.resumeGame() : this.pause(); }

    private pause() {
        if (this.paused || this.ended || !this.scene.isActive()) return;
        this.paused = true;
        this.scene.pause();
        $('pause-menu')?.classList.remove('hidden');
        $('resume-btn')?.focus();
    }

    private resumeGame() {
        if (!this.paused) return;
        this.paused = false;
        $('pause-menu')?.classList.add('hidden');
        this.scene.resume();
    }

    private quit() {
        this.scene.stop();
        showMenu();
    }

    // ---------- spawning ----------

    private pickKind(): Kind {
        const total = KINDS.reduce((s, k) => s + SPECS[k].weight, 0);
        let r = Math.random() * total;
        for (const k of KINDS) { r -= SPECS[k].weight; if (r <= 0) return k; }
        return 'cart';
    }

    private freeLane(taken: number[]): number {
        const open = [0, 1, 2].filter((l) => !taken.includes(l));
        return open[Phaser.Math.Between(0, open.length - 1)];
    }

    private spawnObstacle(kind: Kind, lane: number, y = -140) {
        const spec = SPECS[kind];
        const img = this.add.image(laneX(lane), y, kind).setDepth(spec.depth);
        if (kind === 'chappal') img.setAngle(Phaser.Math.Between(-25, 25));
        this.obstacles.push({ s: img, kind, spent: false });
    }

    private spawnWave() {
        const kind = this.pickKind();
        const lane = this.freeLane(this.lastLane >= 0 && SPECS[kind].answer === 'dodge' ? [this.lastLane] : []);
        this.spawnObstacle(kind, lane);
        const used = [lane];
        // later in the run, block a second lane with a vehicle (one lane always stays open)
        if (GameState.instance.currentSpeed > 600 && Math.random() < 0.3) {
            const other = this.freeLane(used);
            this.spawnObstacle(Math.random() < 0.5 ? 'rickshaw' : 'cart', other, -140 - Phaser.Math.Between(0, 120));
            used.push(other);
        }
        this.lastLane = lane;
        if (Math.random() < 0.6) this.spawnCoins(this.freeLane(used));
    }

    private spawnCoins(lane: number) {
        for (let i = 0; i < 5; i++) {
            const s = this.add.sprite(laneX(lane), -260 - i * 85, 'coin').setDepth(GAME_CONFIG.LAYERS.ITEMS);
            s.play({ key: 'coin_spin', startFrame: i % 6 });
            this.pickups.push({ s, type: 'coin' });
        }
    }

    private spawnPart() {
        const idx = GameState.instance.collectedParts.length;
        const lane = Phaser.Math.Between(0, 2);
        const s = this.add.sprite(laneX(lane), -120, 'parts', idx).setDepth(GAME_CONFIG.LAYERS.ITEMS);
        this.tweens.add({ targets: s, scale: 1.18, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.pickups.push({ s, type: 'part', part: idx });
        this.partActive = true;
    }

    // ---------- gameplay events ----------

    private popText(x: number, y: number, msg: string, color = '#ffd60a') {
        const t = this.add.text(x, y, msg, {
            fontFamily: 'Rajdhani, Arial', fontSize: '30px', fontStyle: 'bold',
            color, stroke: '#14142b', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(GAME_CONFIG.LAYERS.FX);
        this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }

    private collect(p: Pickup) {
        const state = GameState.instance;
        p.s.destroy();
        this.pickups.splice(this.pickups.indexOf(p), 1);
        if (p.type === 'coin') {
            this.coins++;
            state.motherDistance = Math.min(GAME_CONFIG.MOTHER_MAX, state.motherDistance + GAME_CONFIG.COIN_BONUS);
            this.burst.explode(5, p.s.x, p.s.y);
            this.popText(p.s.x, p.s.y - 20, '+50');
            return;
        }
        const name = GameState.UMBRELLA_PARTS[p.part ?? 0];
        state.collectedParts.push(name);
        this.partActive = false;
        this.nextPartAt = state.distance + GAME_CONFIG.PART_EVERY_M;
        state.motherDistance = Math.min(GAME_CONFIG.MOTHER_MAX, state.motherDistance + GAME_CONFIG.PART_BONUS);
        const slot = document.querySelector(`.slot[data-part="${name}"]`);
        if (slot) { slot.classList.remove('collected'); void (slot as HTMLElement).offsetWidth; slot.classList.add('collected'); }
        this.burst.explode(16, this.player.x, this.player.y);
        this.popText(this.player.x, this.player.y - 70, `${name.toUpperCase()}!`, '#7CFFB2');
        if (state.collectedParts.length >= GAME_CONFIG.PARTS_TOTAL) this.victory();
    }

    private hit(o: Obstacle, now: number) {
        const state = GameState.instance;
        o.spent = true;
        o.s.setAlpha(0.55);
        this.player.stumble(now);
        state.motherDistance -= GAME_CONFIG.HIT_PENALTY;
        state.currentSpeed = Math.max(state.tuning.speed, state.currentSpeed * 0.82);
        this.cameras.main.shake(220, 0.012);
        this.burst.explode(14, this.player.x, this.player.y);
        this.popText(this.player.x, this.player.y - 70, `-${GAME_CONFIG.HIT_PENALTY}m`, '#ff7070');
    }

    private endRun() {
        this.ended = true;
        GameState.instance.isGameOver = true;
        this.player.freeze();
        this.mother.anims.stop();
        $('pause-btn')?.classList.add('hidden');
        $('danger-overlay')?.classList.remove('active');
    }

    private gameOver() {
        if (this.ended) return;
        this.endRun();
        const state = GameState.instance;
        state.refreshScore(this.coins);
        const isBest = state.saveHighScore();
        this.cameras.main.shake(300, 0.02);
        this.tweens.add({ targets: this.mother, y: this.player.y + 24, duration: 250, ease: 'Cubic.easeIn' });
        this.time.delayedCall(650, () => {
            $('game-hud')?.classList.add('hidden');
            $('final-score')!.textContent = String(state.score);
            $('final-distance')!.textContent = `${Math.floor(state.distance)}m`;
            $('final-parts')!.textContent = `${state.collectedParts.length}/${GAME_CONFIG.PARTS_TOTAL}`;
            $('new-high-score')?.classList.toggle('hidden', !isBest);
            $('game-over')?.classList.remove('hidden');
            $('retry-btn')?.focus();
        });
    }

    private victory() {
        if (this.ended) return;
        this.endRun();
        const state = GameState.instance;
        state.refreshScore(this.coins);
        state.saveHighScore();
        this.time.delayedCall(500, () => {
            $('game-hud')?.classList.add('hidden');
            $('victory-score')!.textContent = String(state.score);
            $('victory-distance')!.textContent = `${Math.floor(state.distance)}m`;
            $('victory-screen')?.classList.remove('hidden');
            $('victory-menu-btn')?.focus();
        });
    }

    // ---------- frame loop ----------

    private cacheHud() {
        for (const id of ['hud-score', 'hud-distance', 'mother-distance', 'mother-distance-fill', 'danger-overlay']) {
            this.hud[id] = $(id);
        }
    }

    private paintHud() {
        const state = GameState.instance;
        const set = (id: string, v: string) => { const el = this.hud[id]; if (el && el.textContent !== v) el.textContent = v; };
        set('hud-score', String(state.score));
        set('hud-distance', `${Math.floor(state.distance)}m`);
        const m = Math.max(0, state.motherDistance);
        set('mother-distance', `${Math.round(m)}m`);
        const fill = this.hud['mother-distance-fill'];
        if (fill) {
            fill.style.width = `${(m / GAME_CONFIG.MOTHER_MAX) * 100}%`;
            const level = m < GAME_CONFIG.MOTHER_DANGER * 0.6 ? 'critical' : m < GAME_CONFIG.MOTHER_DANGER ? 'danger' : m < 30 ? 'warning' : 'safe';
            if (fill.dataset.level !== level) { fill.dataset.level = level; fill.className = `mother-distance-fill ${level}`; }
        }
        this.hud['danger-overlay']?.classList.toggle('active', m < GAME_CONFIG.MOTHER_DANGER && !this.ended);
    }

    update(time: number, rawDelta: number) {
        if (this.ended) return;
        const state = GameState.instance;
        const dt = Math.min(rawDelta, 50) / 1000;
        const tune = state.tuning;

        state.currentSpeed = Math.min(tune.max, state.currentSpeed + GAME_CONFIG.SPEED_ACCEL * dt);
        const dy = state.currentSpeed * dt;
        state.addDistance(dy);
        state.refreshScore(this.coins);
        this.street.tilePositionY -= dy;

        // spawning by distance travelled, so gaps feel the same at any speed
        this.spawnAcc += dy;
        if (this.spawnAcc >= this.nextGap) {
            this.spawnAcc = 0;
            this.nextGap = Phaser.Math.Between(560, 760) * tune.gap;
            this.spawnWave();
        }
        if (!this.partActive && state.distance >= this.nextPartAt && state.collectedParts.length < GAME_CONFIG.PARTS_TOTAL) {
            this.spawnPart();
        }

        // obstacles
        const pb = this.player.hitbox;
        for (const o of [...this.obstacles]) {
            const spec = SPECS[o.kind];
            o.s.y += dy + spec.extra * dt;
            if (o.s.y > GAME_CONFIG.HEIGHT + 200) { o.s.destroy(); this.obstacles.splice(this.obstacles.indexOf(o), 1); continue; }
            if (o.spent || time < this.player.invulnUntil) continue;
            const overlap = Math.abs(pb.cx - o.s.x) < pb.w / 2 + spec.hw && Math.abs(pb.cy - o.s.y) < pb.h / 2 + spec.hh;
            if (!overlap) continue;
            const safe = (spec.answer === 'jump' && this.player.airborne) || (spec.answer === 'slide' && this.player.sliding);
            if (!safe) this.hit(o, time);
        }

        // pickups
        for (const p of [...this.pickups]) {
            p.s.y += dy;
            if (p.s.y > GAME_CONFIG.HEIGHT + 120) {
                p.s.destroy();
                this.pickups.splice(this.pickups.indexOf(p), 1);
                if (p.type === 'part') { this.partActive = false; this.nextPartAt = state.distance + 40; }
                continue;
            }
            if (Math.abs(p.s.x - this.player.x) < 52 && Math.abs(p.s.y - this.player.y) < 60) this.collect(p);
        }

        // mother closes in over time; position shows how close she is
        state.motherDistance -= tune.drain * dt;
        if (state.motherDistance <= 0) { state.motherDistance = 0; this.paintHud(); this.gameOver(); return; }
        const t = state.motherDistance / GAME_CONFIG.MOTHER_MAX;
        const closeY = this.player.y + 30;
        const farY = GAME_CONFIG.HEIGHT + 230;
        this.mother.y = Phaser.Math.Linear(closeY, farY, t);
        this.mother.x = Phaser.Math.Linear(this.mother.x, this.player.x, Math.min(1, dt * 5));

        this.paintHud();
    }
}
