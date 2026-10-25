import { TransformNode, type AbstractMesh, type InstancedMesh, type Mesh, type Scene } from '@babylonjs/core';
import { Collector } from './kit';
import { buildPedestrian, type Rig } from './models';

const SEG_LEN = 24;
const SEG_COUNT = 9;
const WALLS = [0xe9b872, 0xd96b8a, 0x6fb7c4, 0x9ac36a, 0xe8805a, 0x7a86d1, 0xf2d07a, 0xc9a0dc];
const TRIM = 0xf5ecd7;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** One detailed building (shopfront, windows, balconies, rooftop clutter), side = +1 right / -1 left. */
function makeBuilding(side: number): Mesh {
    const c = new Collector();
    const w = rnd(6, 8), d = rnd(8, 11);
    const floors = 2 + Math.floor(Math.random() * 3);
    const fh = 3.1;
    const h = floors * fh + 0.4;
    const wall = pick(WALLS);
    const wx = side * (8.2 + w / 2);
    const face = side * 8.2; // road-facing wall plane
    const into = -side; // direction from the wall toward the road

    c.box(w, h, d, wall, wx, h / 2, 0);
    // floor bands
    for (let f = 1; f <= floors; f++) c.box(0.3, 0.2, d + 0.3, TRIM, face + into * -0.0, f * fh + (f === floors ? 0.3 : 0), 0);
    // shopfront
    const sw = d * 0.72;
    c.box(0.12, 2.6, sw, 0x2b2530, face + into * 0.06, 1.35, 0);
    c.box(0.1, 1.2, sw * 0.8, 0xffe9a8, face + into * 0.1, 1.2, 0, 0.55);
    for (let i = 0; i < 4; i++) c.box(0.1, 0.9, 0.5, pick([0xff5a36, 0x3a6df0, 0x00c46a, 0xffd60a]), face + into * 0.16, 0.65, -sw * 0.3 + i * (sw * 0.2)); // goods
    c.box(0.4, 0.8, sw, pick([0xff5a36, 0x3a6df0, 0x7b2cbf, 0x00a86b]), face + into * 0.2, 3.0, 0); // sign board
    // striped awning, tilted down toward the road
    const aw = c.box(1.9, 0.1, sw, 0xffffff, face + into * 1.0, 2.7, 0);
    aw.rotation.z = -side * 0.18;
    const stripes = 8;
    for (let i = 0; i < stripes; i += 2) {
        const s = c.box(1.92, 0.12, sw / stripes, 0xff5a36, face + into * 1.0, 2.7, -sw / 2 + (i + 0.5) * (sw / stripes));
        s.rotation.z = -side * 0.18;
    }
    // upper floors: framed windows, sills, some balconies
    for (let f = 1; f < floors; f++) {
        const y = f * fh + 1.7;
        const n = 3;
        for (let k = 0; k < n; k++) {
            const z = -d * 0.3 + k * (d * 0.3);
            c.box(0.12, 1.5, 1.3, 0x3a2f45, face + into * 0.06, y, z);
            c.box(0.1, 1.3, 1.1, 0xbdefff, face + into * 0.1, y, z, 0.3);
            c.box(0.1, 1.3, 0.06, 0x3a2f45, face + into * 0.12, y, z);
            c.box(0.35, 0.1, 1.5, TRIM, face + into * 0.2, y - 0.8, z);
        }
        if (Math.random() < 0.5) {
            c.box(1.0, 0.12, d * 0.6, 0x8b95a5, face + into * 0.55, f * fh + 0.95, 0);
            for (let k = 0; k < 7; k++) c.box(0.05, 0.7, 0.05, 0x5a5f6b, face + into * 1.03, f * fh + 1.35, -d * 0.28 + k * (d * 0.56 / 6));
            c.box(0.05, 0.06, d * 0.6, 0x5a5f6b, face + into * 1.03, f * fh + 1.7, 0);
        }
    }
    // roof: parapet, water tank, AC units, antenna
    const roofY = h;
    c.box(w + 0.3, 0.45, 0.2, TRIM, wx, roofY + 0.2, -d / 2);
    c.box(w + 0.3, 0.45, 0.2, TRIM, wx, roofY + 0.2, d / 2);
    c.box(0.2, 0.45, d, TRIM, face + into * -0.0, roofY + 0.2, 0);
    c.cyl(0.75, 0.75, 1.3, 0x2f5f9e, wx + side * 0.8, roofY + 1.5, rnd(-2, 2), 12);
    for (const dx of [-0.5, 0.5]) for (const dz of [-0.5, 0.5]) c.box(0.1, 0.8, 0.1, 0x5a5f6b, wx + side * 0.8 + dx, roofY + 0.4, 0 + dz);
    c.box(0.9, 0.6, 0.7, 0xdfe5ee, wx - side * 1.2, roofY + 0.5, rnd(-3, 3));
    c.cyl(0.03, 0.03, 2.2, 0x14142b, wx, roofY + 1.2, rnd(-3, 3), 4);
    return c.merge('building');
}

function makePalm(): Mesh {
    const c = new Collector();
    const lean = rnd(-0.5, 0.5);
    for (let i = 0; i < 6; i++) {
        c.cyl(0.14 - i * 0.008, 0.18 - i * 0.008, 0.9, i % 2 ? 0x8a5a2b : 0x7a4f26, lean * i * i * 0.05, 0.45 + i * 0.86, 0, 8);
    }
    const cx = lean * 25 * 0.05, cy = 5.4;
    for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const leaf = c.box(0.34, 0.06, 3.2, i % 2 ? 0x1f7a3a : 0x2e9e45, cx + Math.cos(a) * 1.4, cy - 0.25, Math.sin(a) * 1.4);
        leaf.rotation.y = -a + Math.PI / 2;
        leaf.rotation.x = 0;
        leaf.rotation.z = 0;
        leaf.rotation.x = 0.55; // droop
    }
    for (let i = 0; i < 3; i++) c.ball(0.2, 0x5c3a18, cx + rnd(-0.3, 0.3), cy - 0.35, rnd(-0.3, 0.3));
    return c.merge('palm');
}

function makeLamp(side: number): Mesh {
    const c = new Collector();
    c.cyl(0.07, 0.11, 4.6, 0x3b3f4d, 0, 2.3, 0, 8);
    c.box(1.3, 0.08, 0.1, 0x3b3f4d, -side * 0.65, 4.55, 0);
    c.box(0.45, 0.14, 0.3, 0xfff1b0, -side * 1.25, 4.45, 0, 0.9);
    c.box(0.3, 0.3, 0.3, 0x2b2f3a, 0, 0.15, 0);
    return c.merge('lamp');
}

function makeScooter(): Mesh {
    const c = new Collector();
    const col = pick([0xe63946, 0x3a6df0, 0xffd60a, 0x00a86b]);
    c.cyl(0.32, 0.32, 0.16, 0x1b1b1b, 0, 0.32, 0.75, 12).rotation.z = Math.PI / 2;
    c.cyl(0.32, 0.32, 0.16, 0x1b1b1b, 0, 0.32, -0.75, 12).rotation.z = Math.PI / 2;
    c.box(0.34, 0.5, 1.2, col, 0, 0.6, -0.1);
    c.box(0.36, 0.14, 0.7, 0x2b2f3a, 0, 0.98, -0.3);
    c.box(0.5, 0.06, 0.06, 0x1b1b1b, 0, 1.25, 0.7);
    c.box(0.2, 0.2, 0.16, 0xfff1b0, 0, 1.15, 0.78, 0.8);
    c.box(0.3, 0.65, 0.3, col, 0, 0.8, 0.62);
    return c.merge('scooter');
}

interface Walker { rig: Rig; node: TransformNode; z: number; dir: number; speed: number }

/** An endless street: a ring of segments that scroll toward the camera and wrap. */
export class Street {
    public readonly root: TransformNode;
    private segs: TransformNode[] = [];
    private propNodes: TransformNode[] = [];
    private walkers: Walker[][] = [];
    private variants: { building: Record<number, Mesh[]>; palm: Mesh[]; lamp: Record<number, Mesh>; scooter: Mesh[] };
    public readonly receivers: AbstractMesh[] = [];

    constructor(scene: Scene) {
        this.root = new TransformNode('street', scene);
        this.variants = {
            building: { '-1': [], '1': [] },
            palm: [makePalm(), makePalm(), makePalm()],
            lamp: { '-1': makeLamp(-1), '1': makeLamp(1) },
            scooter: [makeScooter(), makeScooter(), makeScooter()],
        };
        for (const s of [-1, 1]) for (let i = 0; i < 6; i++) this.variants.building[s].push(makeBuilding(s));

        // road, lines, kerbs and pavements: one fused source mesh, instanced per segment
        const base = new Collector();
        base.box(9.6, 0.1, SEG_LEN, 0x30313f, 0, -0.05, 0);
        for (const s of [-1, 1]) {
            base.box(0.14, 0.02, SEG_LEN, 0xffd60a, s * 4.5, 0.01, 0);
            base.box(0.4, 0.28, SEG_LEN, 0xb9b2a0, s * 5.0, 0.14, 0);
            base.box(3.2, 0.24, SEG_LEN, 0xd8c7a3, s * 6.8, 0.12, 0);
            for (let k = 0; k < SEG_LEN / 2; k++) base.box(3.2, 0.02, 0.05, 0xbba984, s * 6.8, 0.25, -SEG_LEN / 2 + k * 2);
        }
        for (const x of [-1.5, 1.5]) for (let k = 0; k < 4; k++) base.box(0.14, 0.02, 3, 0xf5f1e8, x, 0.01, -SEG_LEN / 2 + 1.5 + k * 6);
        const baseMesh = base.merge('road');
        baseMesh.receiveShadows = true;
        this.receivers.push(baseMesh);

        for (let i = 0; i < SEG_COUNT; i++) {
            const seg = new TransformNode('seg', scene);
            seg.parent = this.root;
            seg.position.z = -14 + i * SEG_LEN;
            const inst = baseMesh.createInstance(`road${i}`);
            inst.parent = seg;
            const props = new TransformNode('props', scene);
            props.parent = seg;
            this.segs.push(seg);
            this.propNodes.push(props);
            this.walkers.push([]);
            this.decorate(i);
        }
    }

    private decorate(i: number) {
        const props = this.propNodes[i];
        for (const c of props.getChildren()) c.dispose();
        for (const w of this.walkers[i]) w.node.dispose();
        this.walkers[i] = [];
        const inst = (m: Mesh, x: number, z: number, ry = 0) => {
            const n: InstancedMesh = m.createInstance('i');
            n.parent = props;
            n.position.set(x, 0, z);
            n.rotation.y = ry;
            return n;
        };
        for (const side of [-1, 1]) {
            inst(pick(this.variants.building[side]), 0, -SEG_LEN / 4);
            inst(pick(this.variants.building[side]), 0, SEG_LEN / 4 + 0.5);
            inst(pick(this.variants.palm), side * rnd(6.4, 7.2), rnd(-10, 10), rnd(0, 6));
            inst(this.variants.lamp[side], side * 5.5, rnd(-8, 8));
            if (Math.random() < 0.6) inst(pick(this.variants.scooter), side * rnd(7.6, 8.0), rnd(-10, 10), Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1));
            // a couple of people strolling on the pavement
            for (let k = 0; k < (Math.random() < 0.7 ? 1 : 2); k++) {
                const rig = buildPedestrian();
                rig.root.parent = props;
                const dir = Math.random() < 0.5 ? 1 : -1;
                const walker: Walker = { rig, node: rig.root, z: rnd(-10, 10), dir, speed: rnd(0.9, 1.5) };
                rig.root.position.set(side * rnd(6.0, 7.6), 0.24, walker.z);
                rig.root.rotation.y = dir > 0 ? 0 : Math.PI;
                this.walkers[i].push(walker);
            }
        }
    }

    /** Move the world toward the camera by dz metres and animate the people in it. */
    public scroll(dz: number, dt: number, t: number) {
        for (let i = 0; i < this.segs.length; i++) {
            const seg = this.segs[i];
            seg.position.z -= dz;
            if (seg.position.z < -(SEG_LEN + 14)) {
                seg.position.z += SEG_COUNT * SEG_LEN;
                this.decorate(i);
            }
            for (const w of this.walkers[i]) {
                w.z += w.dir * w.speed * dt;
                if (Math.abs(w.z) > 11) { w.dir *= -1; w.z = Math.sign(w.z) * 11; w.node.rotation.y = w.dir > 0 ? 0 : Math.PI; }
                w.node.position.z = w.z;
                w.rig.animate(t);
            }
        }
    }
}
