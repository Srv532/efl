import {
    Color3, Color4, DefaultRenderingPipeline, DirectionalLight, Engine, FreeCamera, GlowLayer,
    HemisphericLight, Matrix, Mesh, MeshBuilder, ParticleSystem, Scene, ShadowGenerator,
    StandardMaterial, Texture, TransformNode, Vector3,
} from '@babylonjs/core';
import { GAME_CONFIG as C } from '../config/Constants';
import { GameState } from '../core/GameState';
import { showMenu } from '../ui/menu';
import { partIcon } from './icons';
import { hex, initKit, meshesOf } from './kit';
import { buildCoin, buildKabir, buildMother, SPECS, type Kind, type Rig } from './models';
import { Street } from './world';

interface Obstacle { node: TransformNode; kind: Kind; spent: boolean }
interface Pickup { node: TransformNode | Mesh; type: 'coin' | 'part'; part?: number; baseY: number }

const KINDS = Object.keys(SPECS) as Kind[];
const laneX = (lane: number) => (lane - 1) * C.LANE_WIDTH;
const $ = (id: string) => document.getElementById(id);
const FOG = '#f0b878';

function dotTexture(scene: Scene): Texture {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return new Texture(c.toDataURL(), scene);
}

export class Game {
    private engine: Engine;
    private scene: Scene;
    private camera: FreeCamera;
    private shadows: ShadowGenerator;
    private street: Street;
    private kabir: Rig;
    private mother: Rig;
    private partMats: StandardMaterial[] = [];
    private burstPS: ParticleSystem;
    private dustPS: ParticleSystem;
    private dustPos = new Vector3(0, 0.1, -0.4);

    private obstacles: Obstacle[] = [];
    private pickups: Pickup[] = [];

    private running = false;
    private paused = false;
    private ended = false;
    private animT = 0;

    private lane = 1;
    private px = 0;
    private jumpT = -1;
    private slideT = -1;
    private invuln = 0;
    private shake = 0;
    private lunge = -1;

    private spawnAcc = 0;
    private nextGap = 12;
    private lastLane = -1;
    private coins = 0;
    private nextPartAt: number = C.PART_EVERY_M;
    private partActive = false;
    private swipe: { x: number; y: number } | null = null;
    private hud: Record<string, HTMLElement | null> = {};

    constructor(private root: HTMLElement) {
        const canvas = document.createElement('canvas');
        canvas.id = 'scene';
        root.appendChild(canvas);

        this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, powerPreference: 'high-performance' }, true);
        this.engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio, 2));
        const scene = (this.scene = new Scene(this.engine));
        scene.clearColor = Color4.FromHexString(`${FOG}ff`);
        scene.fogMode = Scene.FOGMODE_LINEAR;
        scene.fogColor = Color3.FromHexString(FOG);
        scene.fogStart = 40;
        scene.fogEnd = 125;
        scene.imageProcessingConfiguration.contrast = 1.12;
        scene.imageProcessingConfiguration.exposure = 0.88;
        initKit(scene);

        this.camera = new FreeCamera('cam', new Vector3(0, 5, -9.2), scene);
        this.camera.minZ = 0.1;
        this.camera.maxZ = 160;

        const hemi = new HemisphericLight('sky', new Vector3(0, 1, 0), scene);
        hemi.diffuse = Color3.FromHexString('#fff0d8');
        hemi.groundColor = Color3.FromHexString('#7a5a6a');
        hemi.intensity = 0.85;
        const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, 0.4).normalize(), scene);
        sun.position = new Vector3(10, 20, -8);
        sun.intensity = 1.05;
        sun.diffuse = Color3.FromHexString('#fff1d0');
        sun.autoUpdateExtends = false;
        sun.orthoLeft = -16; sun.orthoRight = 16; sun.orthoBottom = -16; sun.orthoTop = 16;
        sun.shadowMinZ = 1; sun.shadowMaxZ = 70;
        this.shadows = new ShadowGenerator(1024, sun);
        this.shadows.usePercentageCloserFiltering = true;
        this.shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
        this.shadows.bias = 0.002;
        this.shadows.setDarkness(0.45);

        const glow = new GlowLayer('glow', scene, { mainTextureSamples: 2 });
        glow.intensity = 0.55;

        const pipe = new DefaultRenderingPipeline('fx', false, scene, [this.camera]);
        pipe.samples = 4;
        pipe.fxaaEnabled = true;

        // a big soft sun on the horizon
        const sunDisc = MeshBuilder.CreateDisc('sunDisc', { radius: 15, tessellation: 40 }, scene);
        const sm = new StandardMaterial('sunMat', scene);
        sm.disableLighting = true;
        sm.emissiveColor = Color3.FromHexString('#ffe3a0');
        sm.fogEnabled = false;
        sunDisc.material = sm;
        sunDisc.position.set(-28, 24, 145);
        sunDisc.rotation.y = Math.PI;
        glow.addExcludedMesh(sunDisc);

        this.street = new Street(scene);
        for (const m of this.street.receivers) m.receiveShadows = true;

        this.kabir = buildKabir();
        this.mother = buildMother();
        this.mother.root.setEnabled(false);
        for (const rig of [this.kabir, this.mother]) for (const m of meshesOf(rig.root)) this.shadows.addShadowCaster(m);

        for (let i = 0; i < C.PARTS_TOTAL; i++) {
            const m = new StandardMaterial(`part${i}`, scene);
            const tex = new Texture(partIcon(i), scene);
            tex.hasAlpha = true;
            m.diffuseTexture = tex;
            m.emissiveTexture = tex;
            m.opacityTexture = tex;
            m.disableLighting = true;
            m.backFaceCulling = false;
            this.partMats.push(m);
        }

        const dot = dotTexture(scene);
        this.burstPS = new ParticleSystem('burst', 200, scene);
        this.burstPS.particleTexture = dot;
        this.burstPS.emitter = new Vector3(0, 1, 0);
        this.burstPS.minEmitBox = this.burstPS.maxEmitBox = Vector3.Zero();
        this.burstPS.minLifeTime = 0.3; this.burstPS.maxLifeTime = 0.65;
        this.burstPS.minSize = 0.18; this.burstPS.maxSize = 0.4;
        this.burstPS.minEmitPower = 2; this.burstPS.maxEmitPower = 6;
        this.burstPS.direction1 = new Vector3(-1, 1.4, -1); this.burstPS.direction2 = new Vector3(1, 2.6, 1);
        this.burstPS.gravity = new Vector3(0, -10, 0);
        this.burstPS.emitRate = 0;
        this.burstPS.blendMode = ParticleSystem.BLENDMODE_ADD;
        this.burstPS.start();

        this.dustPS = new ParticleSystem('dust', 80, scene);
        this.dustPS.particleTexture = dot;
        this.dustPS.emitter = this.dustPos;
        this.dustPS.minEmitBox = new Vector3(-0.2, 0, -0.1); this.dustPS.maxEmitBox = new Vector3(0.2, 0, 0.1);
        this.dustPS.color1 = new Color4(0.55, 0.5, 0.42, 0.35); this.dustPS.color2 = new Color4(0.5, 0.45, 0.38, 0.2);
        this.dustPS.colorDead = new Color4(0.8, 0.7, 0.55, 0);
        this.dustPS.minLifeTime = 0.25; this.dustPS.maxLifeTime = 0.5;
        this.dustPS.minSize = 0.12; this.dustPS.maxSize = 0.28;
        this.dustPS.minEmitPower = 0.5; this.dustPS.maxEmitPower = 1.5;
        this.dustPS.direction1 = new Vector3(-0.3, 0.6, -1); this.dustPS.direction2 = new Vector3(0.3, 1, -0.3);
        this.dustPS.emitRate = 0;
        this.dustPS.start();

        for (const id of ['hud-score', 'hud-distance', 'mother-distance', 'mother-distance-fill', 'danger-overlay']) this.hud[id] = $(id);

        new ResizeObserver(() => this.resize()).observe(root);
        this.resize();
        this.bindControls();
        this.placeCamera(0);
        let slow = 0, last = performance.now();
        this.engine.runRenderLoop(() => {
            this.frame(Math.min(this.engine.getDeltaTime() / 1000, 0.05));
            this.scene.render();
            // adaptive quality: weak GPUs render at a lower resolution instead of stuttering
            const now = performance.now();
            if (now - last > 2000) {
                last = now;
                slow = this.engine.getFps() < 38 ? slow + 1 : 0;
                if (slow >= 2 && this.engine.getHardwareScalingLevel() < 2) {
                    this.engine.setHardwareScalingLevel(this.engine.getHardwareScalingLevel() + 0.25);
                    slow = 0;
                }
            }
        });
    }

    // ---------- setup ----------

    private resize() {
        this.engine.resize();
        const aspect = this.engine.getRenderWidth() / Math.max(1, this.engine.getRenderHeight());
        const base = (60 * Math.PI) / 180;
        // keep the whole road in view on tall (phone) screens
        this.camera.fov = aspect < 1.6 ? Math.min(2 * Math.atan(Math.tan(base / 2) * (1.6 / aspect)), 2.0) : base;
    }

    private bindControls() {
        const act = (a: 'left' | 'right' | 'jump' | 'slide') => {
            if (!this.running || this.paused || this.ended) return;
            if (a === 'left') this.changeLane(-1);
            else if (a === 'right') this.changeLane(1);
            else if (a === 'jump') this.jump();
            else this.slide();
        };
        window.addEventListener('keydown', (e) => {
            if (!this.running) return;
            const k = e.key.toLowerCase();
            if (k === 'escape' || k === 'p') { if (!e.repeat) this.togglePause(); return; }
            if (e.repeat) return;
            const map: Record<string, 'left' | 'right' | 'jump' | 'slide'> = {
                arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
                arrowup: 'jump', w: 'jump', ' ': 'jump', arrowdown: 'slide', s: 'slide',
            };
            const a = map[k];
            if (a) { e.preventDefault(); act(a); }
        });
        window.addEventListener('blur', () => this.pause());

        const el = this.engine.getRenderingCanvas()!;
        el.addEventListener('pointerdown', (e) => { this.swipe = { x: e.clientX, y: e.clientY }; });
        el.addEventListener('pointerup', (e) => {
            if (!this.swipe) return;
            const dx = e.clientX - this.swipe.x, dy = e.clientY - this.swipe.y;
            this.swipe = null;
            const t = C.SWIPE_THRESHOLD;
            if (Math.abs(dx) < t && Math.abs(dy) < t) act('jump');
            else if (Math.abs(dx) > Math.abs(dy)) act(dx < 0 ? 'left' : 'right');
            else act(dy < 0 ? 'jump' : 'slide');
        });

        const click = (id: string, fn: () => void) => {
            const b = $(id);
            if (b) b.onclick = (e) => { e.preventDefault(); b.blur(); fn(); };
        };
        const press = (id: string, a: 'left' | 'right' | 'jump' | 'slide') => {
            const b = $(id);
            if (b) b.onpointerdown = (e) => { e.preventDefault(); act(a); };
        };
        press('mobile-left', 'left'); press('mobile-right', 'right');
        press('mobile-jump', 'jump'); press('mobile-slide', 'slide');
        click('pause-btn', () => this.togglePause());
        click('resume-btn', () => this.resume());
        click('restart-btn', () => this.start());
        click('retry-btn', () => this.start());
        click('quit-btn', () => this.quit());
        click('menu-btn', () => this.quit());
        click('victory-menu-btn', () => this.quit());
    }

    // ---------- run lifecycle ----------

    public start() {
        const state = GameState.instance;
        state.reset();
        for (const o of this.obstacles) this.dropObstacle(o);
        for (const p of this.pickups) p.node.dispose();
        this.obstacles = []; this.pickups = [];
        this.spawnAcc = 0; this.nextGap = 10; this.lastLane = -1; this.coins = 0;
        this.nextPartAt = C.PART_EVERY_M; this.partActive = false;
        this.lane = 1; this.px = 0; this.jumpT = -1; this.slideT = -1; this.invuln = 0; this.shake = 0; this.lunge = -1;
        this.paused = false; this.ended = false; this.running = true;
        this.mother.root.setEnabled(false);
        this.kabir.root.setEnabled(true);
        ['pause-menu', 'game-over', 'victory-screen', 'main-menu'].forEach((id) => $(id)?.classList.add('hidden'));
        $('game-hud')?.classList.remove('hidden');
        $('pause-btn')?.classList.remove('hidden');
        $('danger-overlay')?.classList.remove('active');
        (document.activeElement as HTMLElement | null)?.blur();
    }

    private quit() {
        this.running = false;
        this.paused = false;
        this.mother.root.setEnabled(false);
        this.dustPS.emitRate = 0;
        showMenu();
    }

    private togglePause() { this.paused ? this.resume() : this.pause(); }

    private pause() {
        if (!this.running || this.paused || this.ended) return;
        this.paused = true;
        $('pause-menu')?.classList.remove('hidden');
        $('resume-btn')?.focus();
    }

    private resume() {
        if (!this.paused) return;
        this.paused = false;
        $('pause-menu')?.classList.add('hidden');
    }

    // ---------- player actions ----------

    private changeLane(dir: -1 | 1) { this.lane = Math.min(2, Math.max(0, this.lane + dir)); }
    private jump() { if (this.jumpT < 0 && this.slideT < 0) this.jumpT = 0; }
    private slide() { if (this.jumpT < 0 && this.slideT < 0) this.slideT = 0; }

    private get py() {
        if (this.jumpT < 0) return 0;
        const u = this.jumpT / C.JUMP_TIME;
        return C.JUMP_HEIGHT * 4 * u * (1 - u);
    }
    private get bodyHeight() { return this.slideT >= 0 ? 0.8 : this.jumpT >= 0 ? 1.5 : 1.8; }

    // ---------- spawning ----------

    private pickKind(): Kind {
        const total = KINDS.reduce((s, k) => s + SPECS[k].weight, 0);
        let r = Math.random() * total;
        for (const k of KINDS) { r -= SPECS[k].weight; if (r <= 0) return k; }
        return 'cart';
    }
    private freeLane(taken: number[]): number {
        const open = [0, 1, 2].filter((l) => !taken.includes(l));
        return open[Math.floor(Math.random() * open.length)];
    }

    private spawnObstacle(kind: Kind, lane: number, z: number = C.SPAWN_Z) {
        const node = SPECS[kind].build();
        const wobble = kind === 'rickshaw' || kind === 'cart' ? (Math.random() - 0.5) * 0.08 : 0;
        node.position.set(laneX(lane), 0, z);
        node.rotation.y += kind === 'chappal' ? (Math.random() - 0.5) * 0.8 : wobble;
        for (const m of meshesOf(node)) this.shadows.addShadowCaster(m);
        this.obstacles.push({ node, kind, spent: false });
    }

    private dropObstacle(o: Obstacle) {
        for (const m of meshesOf(o.node)) this.shadows.removeShadowCaster(m);
        o.node.dispose();
    }

    private spawnWave() {
        const kind = this.pickKind();
        const lane = this.freeLane(this.lastLane >= 0 && SPECS[kind].answer === 'dodge' ? [this.lastLane] : []);
        this.spawnObstacle(kind, lane);
        const used = [lane];
        if (GameState.instance.currentSpeed > 17 && Math.random() < 0.3) {
            const other = this.freeLane(used);
            this.spawnObstacle(Math.random() < 0.5 ? 'rickshaw' : 'cart', other, C.SPAWN_Z + Math.random() * 6);
            used.push(other);
        }
        this.lastLane = lane;
        if (Math.random() < 0.6) {
            const cl = this.freeLane(used);
            for (let i = 0; i < 5; i++) {
                const node = buildCoin();
                node.position.set(laneX(cl), 1.0, C.SPAWN_Z + 10 + i * 3);
                this.pickups.push({ node, type: 'coin', baseY: 1.0 });
            }
        }
    }

    private spawnPart() {
        const idx = GameState.instance.collectedParts.length;
        const plane = MeshBuilder.CreatePlane(`part${idx}`, { size: 1.9 }, this.scene);
        plane.material = this.partMats[idx];
        plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        plane.position.set(laneX(Math.floor(Math.random() * 3)), 1.5, C.SPAWN_Z);
        this.pickups.push({ node: plane, type: 'part', part: idx, baseY: 1.5 });
        this.partActive = true;
    }

    // ---------- feedback ----------

    private burst(x: number, y: number, z: number, n: number, color: number) {
        const ps = this.burstPS;
        (ps.emitter as Vector3).set(x, y, z);
        const c = hex(color);
        ps.color1 = new Color4(c.r, c.g, c.b, 1);
        ps.color2 = new Color4(c.r, c.g, c.b, 0.8);
        ps.colorDead = new Color4(c.r, c.g, c.b, 0);
        ps.manualEmitCount = n;
    }

    private popText(world: Vector3, msg: string, color = '#ffd60a') {
        const w = this.engine.getRenderWidth(), h = this.engine.getRenderHeight();
        const p = Vector3.Project(world, Matrix.IdentityReadOnly, this.scene.getTransformMatrix(), this.camera.viewport.toGlobal(w, h));
        const el = document.createElement('div');
        el.className = 'pop-text';
        el.textContent = msg;
        el.style.color = color;
        el.style.left = `${(p.x / w) * this.root.clientWidth}px`;
        el.style.top = `${(p.y / h) * this.root.clientHeight}px`;
        this.root.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }

    // ---------- game events ----------

    private collect(p: Pickup) {
        const state = GameState.instance;
        const pos = (p.node as TransformNode).position.clone();
        p.node.dispose();
        this.pickups.splice(this.pickups.indexOf(p), 1);
        if (p.type === 'coin') {
            this.coins++;
            state.motherDistance = Math.min(C.MOTHER_MAX, state.motherDistance + C.COIN_BONUS);
            this.burst(pos.x, pos.y, pos.z, 6, 0xffd60a);
            this.popText(pos, '+50');
            return;
        }
        const name = GameState.UMBRELLA_PARTS[p.part ?? 0];
        state.collectedParts.push(name);
        this.partActive = false;
        this.nextPartAt = state.distance + C.PART_EVERY_M;
        state.motherDistance = Math.min(C.MOTHER_MAX, state.motherDistance + C.PART_BONUS);
        const slot = document.querySelector<HTMLElement>(`.slot[data-part="${name}"]`);
        if (slot) { slot.classList.remove('collected'); void slot.offsetWidth; slot.classList.add('collected'); }
        this.burst(pos.x, pos.y, pos.z, 40, 0x7cffb2);
        this.popText(pos, `${name.toUpperCase()}!`, '#7CFFB2');
        if (state.collectedParts.length >= C.PARTS_TOTAL) this.victory();
    }

    private hit(o: Obstacle) {
        const state = GameState.instance;
        o.spent = true;
        this.invuln = C.INVULN_TIME;
        this.shake = 0.5;
        state.motherDistance -= C.HIT_PENALTY;
        state.currentSpeed = Math.max(state.tuning.speed, state.currentSpeed * 0.82);
        this.burst(this.px, 1, 0, 30, 0xff7070);
        this.popText(new Vector3(this.px, 2.4, 0), `-${C.HIT_PENALTY}m`, '#ff7070');
    }

    private endRun() {
        this.ended = true;
        GameState.instance.isGameOver = true;
        this.dustPS.emitRate = 0;
        $('pause-btn')?.classList.add('hidden');
        $('danger-overlay')?.classList.remove('active');
    }

    private gameOver() {
        if (this.ended) return;
        this.endRun();
        const state = GameState.instance;
        state.refreshScore(this.coins);
        const isBest = state.saveHighScore();
        this.shake = 0.8;
        this.lunge = 0;
        setTimeout(() => {
            $('game-hud')?.classList.add('hidden');
            $('final-score')!.textContent = String(state.score);
            $('final-distance')!.textContent = `${Math.floor(state.distance)}m`;
            $('final-parts')!.textContent = `${state.collectedParts.length}/${C.PARTS_TOTAL}`;
            $('new-high-score')?.classList.toggle('hidden', !isBest);
            $('game-over')?.classList.remove('hidden');
            $('retry-btn')?.focus();
        }, 700);
    }

    private victory() {
        if (this.ended) return;
        this.endRun();
        const state = GameState.instance;
        state.refreshScore(this.coins);
        state.saveHighScore();
        setTimeout(() => {
            $('game-hud')?.classList.add('hidden');
            $('victory-score')!.textContent = String(state.score);
            $('victory-distance')!.textContent = `${Math.floor(state.distance)}m`;
            $('victory-screen')?.classList.remove('hidden');
            $('victory-menu-btn')?.focus();
        }, 500);
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
            fill.style.width = `${(m / C.MOTHER_MAX) * 100}%`;
            const level = m < C.MOTHER_DANGER * 0.6 ? 'critical' : m < C.MOTHER_DANGER ? 'danger' : m < 30 ? 'warning' : 'safe';
            if (fill.dataset.level !== level) { fill.dataset.level = level; fill.className = `mother-distance-fill ${level}`; }
        }
        this.hud['danger-overlay']?.classList.toggle('active', m < C.MOTHER_DANGER && !this.ended);
    }

    // ---------- frame loop ----------

    private placeCamera(dt: number) {
        this.shake = Math.max(0, this.shake - dt * 2);
        const sx = (Math.random() - 0.5) * this.shake * 0.6, sy = (Math.random() - 0.5) * this.shake * 0.4;
        this.camera.position.set(this.px * 0.55 + sx, 5.0 + sy + this.py * 0.25, -9.2);
        this.camera.setTarget(new Vector3(this.px * 0.4, 1.3, 9));
    }

    private frame(dt: number) {
        if (!this.running) {
            // title screen: the street idles past
            this.animT += dt * 0.5;
            this.street.scroll(6 * dt, dt, this.animT);
            this.kabir.root.position.set(0, 0, 0);
            this.kabir.animate(this.animT, 'run');
            this.placeCamera(dt);
        } else if (!this.paused) {
            this.step(dt);
        }
    }

    private step(dt: number) {
        const state = GameState.instance;
        const tune = state.tuning;

        if (this.ended) {
            this.animT += dt * 0.3;
            this.updateMother(dt);
            this.placeCamera(dt);
            return;
        }

        state.currentSpeed = Math.min(tune.max, state.currentSpeed + C.SPEED_ACCEL * dt);
        const dz = state.currentSpeed * dt;
        state.addDistance(dz);
        state.refreshScore(this.coins);
        this.animT += dt * (state.currentSpeed / 16);
        this.street.scroll(dz, dt, this.animT);

        // player
        const targetX = laneX(this.lane);
        this.px += (targetX - this.px) * Math.min(1, dt * 14);
        if (this.jumpT >= 0) { this.jumpT += dt; if (this.jumpT >= C.JUMP_TIME) this.jumpT = -1; }
        if (this.slideT >= 0) { this.slideT += dt; if (this.slideT >= C.SLIDE_TIME) this.slideT = -1; }
        if (this.invuln > 0) this.invuln -= dt;
        const k = this.kabir;
        k.root.position.set(this.px, this.py, 0);
        k.root.rotation.z = (targetX - this.px) * 0.1;
        k.root.setEnabled(this.invuln <= 0 || Math.floor(this.invuln * 14) % 2 === 0);
        k.animate(this.animT, this.slideT >= 0 ? 'slide' : this.jumpT >= 0 ? 'jump' : 'run');
        this.dustPos.set(this.px, 0.1, -0.5);
        this.dustPS.emitRate = this.jumpT >= 0 ? 0 : 40;

        // spawning by distance travelled
        this.spawnAcc += dz;
        if (this.spawnAcc >= this.nextGap) {
            this.spawnAcc = 0;
            this.nextGap = (13 + Math.random() * 7) * tune.gap;
            this.spawnWave();
        }
        if (!this.partActive && state.distance >= this.nextPartAt && state.collectedParts.length < C.PARTS_TOTAL) this.spawnPart();

        // obstacles
        const top = this.py + this.bodyHeight;
        for (const o of [...this.obstacles]) {
            const spec = SPECS[o.kind];
            o.node.position.z -= dz + spec.extraSpeed * dt;
            if (o.node.position.z < C.DESPAWN_Z) { this.dropObstacle(o); this.obstacles.splice(this.obstacles.indexOf(o), 1); continue; }
            if (o.spent || this.invuln > 0) continue;
            const hitX = Math.abs(this.px - o.node.position.x) < 0.32 + spec.hw;
            const hitZ = Math.abs(o.node.position.z) < 0.35 + spec.hd;
            const hitY = this.py < spec.y1 && top > spec.y0;
            if (hitX && hitZ && hitY) this.hit(o);
        }

        // pickups
        for (const p of [...this.pickups]) {
            const n = p.node as TransformNode;
            n.position.z -= dz;
            if (p.type === 'coin') n.rotation.y += dt * 5;
            else n.position.y = p.baseY + Math.sin(this.animT * 4) * 0.15;
            if (n.position.z < C.DESPAWN_Z) {
                n.dispose();
                this.pickups.splice(this.pickups.indexOf(p), 1);
                if (p.type === 'part') { this.partActive = false; this.nextPartAt = state.distance + 40; }
                continue;
            }
            if (Math.abs(n.position.x - this.px) < 1.2 && Math.abs(n.position.z) < 1.2) this.collect(p);
        }

        // Mother closes in
        state.motherDistance -= tune.drain * dt;
        if (state.motherDistance <= 0) { state.motherDistance = 0; this.paintHud(); this.gameOver(); return; }
        this.updateMother(dt);
        this.placeCamera(dt);
        this.paintHud();
    }

    private updateMother(dt: number) {
        const m = this.mother;
        let z: number;
        if (this.lunge >= 0) {
            this.lunge = Math.min(1, this.lunge + dt * 4);
            z = -(3.2 + (1.2 - 3.2) * this.lunge);
        } else {
            z = -(3.2 + (GameState.instance.motherDistance / C.MOTHER_MAX) * 11);
        }
        const x = m.root.position.x + (this.px - m.root.position.x) * Math.min(1, dt * 5);
        m.root.position.set(x, 0, z);
        m.root.setEnabled(z > -8.6);
        m.animate(this.animT);
    }
}
