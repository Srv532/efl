import { MeshBuilder, TransformNode, type Mesh } from '@babylonjs/core';
import { ball, box, cyl, edge, mat, meshesOf, pivot } from './kit';

/**
 * Characters and obstacles. Everything faces +Z (the runner's heading), so the
 * chase camera behind the runner sees backs, and oncoming things face -Z.
 */
const SKIN = 0xc98a55;
const SKINS = [0xc98a55, 0xb87444, 0xe0a878, 0x8d5a34];

export interface Rig {
    root: TransformNode;
    animate(t: number, pose?: 'run' | 'jump' | 'slide'): void;
}

function outlineAll(node: TransformNode, width = 0.028) {
    for (const m of meshesOf(node)) edge(m, width);
}

// ---------- the runner ----------

export function buildKabir(): Rig {
    const root = new TransformNode('kabir');
    const body = pivot(root, 0, 0);

    const legs = [-0.17, 0.17].map((x) => {
        const hip = pivot(body, x, 0.86);
        box(hip, 0.22, 0.5, 0.24, SKIN, 0, -0.3, 0);
        box(hip, 0.25, 0.3, 0.27, 0x2d6a9f, 0, -0.14, 0);
        box(hip, 0.26, 0.14, 0.4, 0x3a6df0, 0, -0.6, 0.05);
        box(hip, 0.27, 0.05, 0.42, 0xffffff, 0, -0.67, 0.05);
        return hip;
    });
    const torso = pivot(body, 0, 0.86);
    box(torso, 0.66, 0.62, 0.36, 0xffd60a, 0, 0.32, 0);
    box(torso, 0.68, 0.1, 0.38, 0xff5a36, 0, 0.18, 0);
    box(torso, 0.68, 0.1, 0.38, 0x00c46a, 0, 0.42, 0);
    box(torso, 0.46, 0.5, 0.22, 0x3a6df0, 0, 0.34, -0.28);
    box(torso, 0.34, 0.14, 0.1, 0x2a52c4, 0, 0.2, -0.4);
    box(torso, 0.08, 0.28, 0.06, 0x8b95a5, -0.16, 0.5, -0.19);
    box(torso, 0.08, 0.28, 0.06, 0x8b95a5, 0.16, 0.5, -0.19);
    const arms = [-0.43, 0.43].map((x) => {
        const sh = pivot(torso, x, 0.56);
        box(sh, 0.17, 0.24, 0.21, 0xffd60a, 0, -0.08, 0);
        box(sh, 0.13, 0.34, 0.15, SKIN, 0, -0.34, 0);
        ball(sh, 0.09, SKIN, 0, -0.54, 0);
        return sh;
    });
    const head = pivot(torso, 0, 0.82);
    ball(head, 0.25, 0x2b1b17, 0, 0.05, 0, 1, 1.02, 1.05);
    ball(head, 0.06, SKIN, -0.25, 0, 0);
    ball(head, 0.06, SKIN, 0.25, 0, 0);
    for (const [x, h, tilt] of [[-0.13, 0.2, 0.2], [0, 0.26, 0], [0.13, 0.18, -0.2]] as const) {
        const c = cyl(head, 0, 0.09, h, 0x2b1b17, x, 0.28 + h / 2 - 0.08, 0, false, 5);
        c.rotation.z = tilt;
    }
    box(head, 0.4, 0.07, 0.1, 0x4a3128, 0, 0.04, -0.22);
    outlineAll(root);
    root.scaling.setAll(1.1);

    return {
        root,
        animate(t, pose = 'run') {
            if (pose === 'jump') {
                legs[0].rotation.x = 0.5; legs[1].rotation.x = 0.95;
                arms[0].rotation.x = 2.5; arms[1].rotation.x = 2.5;
                torso.rotation.x = -0.15; torso.rotation.y = 0; body.position.y = 0;
            } else if (pose === 'slide') {
                legs[0].rotation.x = 1.4; legs[1].rotation.x = 1.4;
                arms[0].rotation.x = 1.1; arms[1].rotation.x = 1.1;
                torso.rotation.x = -0.9; torso.rotation.y = 0; body.position.y = -0.22;
            } else {
                const s = Math.sin(t * 13);
                legs[0].rotation.x = s * 0.95; legs[1].rotation.x = -s * 0.95;
                arms[0].rotation.x = -s * 0.9; arms[1].rotation.x = s * 0.9;
                torso.rotation.x = -0.12; torso.rotation.y = s * 0.12;
                body.position.y = Math.abs(Math.cos(t * 13)) * 0.09;
            }
        },
    };
}

// ---------- Mother ----------

export function buildMother(): Rig {
    const root = new TransformNode('mother');
    const body = pivot(root, 0, 0);

    const feet = [-0.16, 0.16].map((x) => {
        const f = pivot(body, x, 0.1);
        box(f, 0.2, 0.1, 0.34, 0x5a2d0c, 0, 0, 0.04);
        return f;
    });
    const skirt = cyl(body, 0.4, 0.8, 1.05, 0xd6336c, 0, 0.64, 0, false, 16);
    cyl(body, 0.82, 0.82, 0.07, 0xffd60a, 0, 0.16, 0, false, 16);
    const torso = pivot(body, 0, 1.12);
    box(torso, 0.72, 0.6, 0.4, 0xd6336c, 0, 0.3, 0);
    const pallu = box(torso, 0.18, 0.78, 0.44, 0xffd60a, 0.1, 0.3, 0);
    pallu.rotation.z = -0.5;
    box(torso, 0.5, 0.06, 0.42, 0xffd60a, 0, 0.02, 0);
    const armL = pivot(torso, -0.46, 0.52);
    box(armL, 0.16, 0.5, 0.18, SKIN, 0, -0.26, 0);
    const armR = pivot(torso, 0.46, 0.52);
    box(armR, 0.16, 0.5, 0.18, SKIN, 0, -0.26, 0);
    ball(armR, 0.1, SKIN, 0, -0.54, 0);
    const chap = ball(armR, 0.17, 0xd94f2b, 0, -0.78, 0.05, 0.55, 1.7, 0.3, false);
    chap.rotation.z = 0.25;
    box(armR, 0.2, 0.05, 0.2, 0xffd60a, 0, -0.7, 0.05);
    const head = pivot(torso, 0, 0.9);
    ball(head, 0.24, 0x1a1010, 0, 0, 0);
    ball(head, 0.16, 0x1a1010, 0, 0.2, -0.14);
    ball(head, 0.045, 0xffd60a, -0.24, -0.04, 0);
    ball(head, 0.045, 0xffd60a, 0.24, -0.04, 0);
    ball(head, 0.05, 0xff2a1a, 0, 0.12, 0.22, 1, 1, 0.4); // bindi
    outlineAll(root);
    root.scaling.setAll(1.15);

    return {
        root,
        animate(t) {
            const s = Math.sin(t * 11);
            feet[0].position.z = s * 0.22; feet[1].position.z = -s * 0.22;
            armL.rotation.x = s * 0.7;
            armR.rotation.x = 2.7 + Math.sin(t * 11 + 1) * 0.35;
            skirt.rotation.z = s * 0.05;
            body.position.y = Math.abs(Math.cos(t * 11)) * 0.07;
        },
    };
}

// ---------- people on the pavement ----------

const SHIRTS = [0xe8505b, 0x3a6df0, 0x00c46a, 0xffd60a, 0x9b5de5, 0xff8a00, 0xffffff, 0x2ec4b6];
const PANTS = [0x2b2f55, 0x3d3d3d, 0x6b4f2a, 0x1f3b73];
const SAREES = [0xd6336c, 0x0fa3b1, 0xf7b32b, 0x7b2cbf, 0x2e9e45, 0xe63946];
const pickOf = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function buildPedestrian(): Rig {
    const woman = Math.random() < 0.4;
    const skin = pickOf(SKINS);
    const root = new TransformNode('pedestrian');
    const body = pivot(root, 0, 0);
    const shirt = woman ? pickOf(SAREES) : pickOf(SHIRTS);
    const legs = [-0.12, 0.12].map((x) => {
        const hip = pivot(body, x, 0.8);
        box(hip, 0.2, 0.7, 0.22, woman ? shirt : pickOf(PANTS), 0, -0.36, 0);
        box(hip, 0.22, 0.1, 0.34, 0x222222, 0, -0.74, 0.05);
        return hip;
    });
    if (woman) cyl(body, 0.26, 0.42, 0.8, shirt, 0, 0.5, 0, false, 12);
    const torso = pivot(body, 0, 0.82);
    box(torso, 0.5, 0.58, 0.3, shirt, 0, 0.3, 0);
    if (woman) box(torso, 0.12, 0.62, 0.34, 0xffd60a, 0.12, 0.3, 0);
    const arms = [-0.34, 0.34].map((x) => {
        const sh = pivot(torso, x, 0.52);
        box(sh, 0.12, 0.5, 0.14, skin, 0, -0.26, 0);
        return sh;
    });
    const head = pivot(torso, 0, 0.78);
    ball(head, 0.2, skin, 0, 0.05, 0);
    ball(head, 0.21, 0x1a1010, 0, 0.1, -0.03, 1, 0.8, 1);
    if (woman) ball(head, 0.12, 0x1a1010, 0, 0.12, -0.2);
    else if (Math.random() < 0.4) box(head, 0.34, 0.1, 0.34, 0xffffff, 0, 0.24, 0); // topi
    root.scaling.setAll(0.95 + Math.random() * 0.15);
    outlineAll(root, 0.02);

    const off = Math.random() * 6;
    return {
        root,
        animate(t) {
            const s = Math.sin((t + off) * 7);
            legs[0].rotation.x = s * 0.6; legs[1].rotation.x = -s * 0.6;
            arms[0].rotation.x = -s * 0.5; arms[1].rotation.x = s * 0.5;
            body.position.y = Math.abs(Math.cos((t + off) * 7)) * 0.04;
        },
    };
}

// ---------- obstacles ----------

export type Kind = 'rickshaw' | 'cart' | 'chappal' | 'barrier' | 'banner';
export type Answer = 'dodge' | 'jump' | 'slide';

export interface ObstacleSpec {
    answer: Answer;
    hw: number; hd: number; y0: number; y1: number; // half width/depth and vertical extent
    weight: number;
    extraSpeed: number;
    build: () => TransformNode;
}

function wheel(g: TransformNode, r: number, w: number, x: number, y: number, z: number) {
    const c = cyl(g, r, r, w, 0x1b1b1b, x, y, z, true, 14);
    c.rotation.z = Math.PI / 2;
    const hub = cyl(g, r * 0.45, r * 0.45, w + 0.02, 0xb8c0cc, x, y, z, false, 10);
    hub.rotation.z = Math.PI / 2;
}

function buildRickshaw() {
    const g = new TransformNode('rickshaw');
    wheel(g, 0.34, 0.24, -1.0, 0.34, -0.9);
    wheel(g, 0.34, 0.24, 1.0, 0.34, -0.9);
    wheel(g, 0.3, 0.2, 0, 0.3, 1.25);
    box(g, 1.9, 0.7, 2.7, 0x1fa35b, 0, 0.75, 0, true);
    box(g, 1.92, 0.12, 2.72, 0x14142b, 0, 1.12, 0);
    box(g, 1.9, 1.15, 1.7, 0xffd60a, 0, 1.75, -0.35, true);
    box(g, 2.0, 0.14, 1.9, 0xf4b400, 0, 2.38, -0.3, true);
    box(g, 1.7, 0.45, 0.06, 0xbdefff, 0, 1.75, 0.5, false, 0.3);
    box(g, 1.7, 0.3, 0.6, 0x14142b, 0, 1.3, 0.85);
    box(g, 0.5, 0.55, 0.3, 0x8b7a4e, 0, 1.7, 0.9, true);
    ball(g, 0.18, SKIN, 0, 2.1, 0.9, 1, 1, 1, true);
    box(g, 0.4, 0.08, 0.3, 0x1a1010, 0, 2.22, 0.9);
    box(g, 0.9, 0.06, 0.06, 0x1b1b1b, 0, 1.55, 1.2);
    box(g, 0.9, 0.5, 0.9, 0x1fa35b, 0, 0.85, 1.35, true);
    ball(g, 0.14, 0xfff3a0, 0, 1.0, 1.85);
    box(g, 0.3, 0.12, 0.05, 0xff2a1a, -0.6, 0.9, -1.38, false, 0.8);
    box(g, 0.3, 0.12, 0.05, 0xff2a1a, 0.6, 0.9, -1.38, false, 0.8);
    g.rotation.y = Math.PI; // front faces the runner
    return g;
}

function buildCart() {
    const g = new TransformNode('cart');
    wheel(g, 0.42, 0.18, -0.95, 0.42, 0.1);
    wheel(g, 0.42, 0.18, 0.95, 0.42, 0.1);
    box(g, 1.7, 0.7, 2.1, 0x8a5a2b, 0, 0.85, 0, true);
    box(g, 1.78, 0.1, 2.18, 0x5c3a18, 0, 1.22, 0);
    for (let i = 0; i < 3; i++) box(g, 1.72, 0.04, 0.04, 0x5c3a18, 0, 0.85, -0.6 + i * 0.6);
    for (const [x, z] of [[-0.45, -0.4], [0.1, 0.35], [0.5, -0.45], [-0.5, 0.45]] as const) ball(g, 0.2, 0xff8a00, x, 1.4, z, 1, 1, 1, true);
    ball(g, 0.32, 0x2e9e45, 0.4, 1.42, 0.5, 1.3, 0.8, 1, true);
    box(g, 0.1, 2.2, 0.1, 0x5c3a18, 0, 2.0, 0);
    // striped umbrella: 8 wedges
    for (let i = 0; i < 8; i++) {
        const w = MeshBuilder.CreateCylinder('wedge', {
            diameterTop: 0, diameterBottom: 3.1, height: 0.85, tessellation: 8, arc: 1 / 8, sideOrientation: 2,
        }, g.getScene());
        w.rotation.y = (i / 8) * Math.PI * 2;
        w.position.y = 3.1;
        w.material = mat(i % 2 ? 0xffffff : 0xff5a36);
        w.parent = g;
    }
    ball(g, 0.1, 0xffd60a, 0, 3.58, 0);
    g.rotation.y = Math.PI;
    return g;
}

function buildChappal() {
    const g = new TransformNode('chappal');
    for (const [x, z, r] of [[-0.35, 0, 0.3], [0.4, 0.25, -0.4]] as const) {
        const c = pivot(g, x, 0, z);
        c.rotation.y = r;
        ball(c, 0.32, 0xd94f2b, 0, 0.1, 0, 1, 0.3, 1.9, true);
        ball(c, 0.28, 0xb53b1b, 0, 0.17, 0, 0.9, 0.2, 1.7);
        const strap = cyl(c, 0, 0.2, 0.45, 0xffd60a, 0, 0.27, 0.28, true, 4);
        strap.rotation.x = Math.PI / 2;
        ball(c, 0.06, 0xfff3a0, 0, 0.3, 0.45);
    }
    return g;
}

function buildBarrier() {
    const g = new TransformNode('barrier');
    for (const x of [-1.3, 1.3]) box(g, 0.14, 0.6, 0.14, 0x444455, x, 0.3, 0, true);
    for (let i = 0; i < 6; i++) box(g, 0.46, 0.32, 0.14, i % 2 ? 0xffffff : 0xff5a36, -1.15 + i * 0.46, 0.75, 0, true);
    for (const x of [-1.3, 1.3]) box(g, 0.2, 0.2, 0.2, 0xffb300, x, 1.05, 0, false, 0.9);
    return g;
}

function buildBanner() {
    const g = new TransformNode('banner');
    for (const x of [-2.0, 2.0]) cyl(g, 0.08, 0.1, 3.0, 0x8b95a5, x, 1.5, 0, true, 8);
    box(g, 4.0, 1.1, 0.08, 0x3a6df0, 0, 2.15, 0, true);
    box(g, 4.0, 0.08, 0.1, 0xffd60a, 0, 2.72, 0);
    for (let i = 0; i < 6; i++) {
        const t = cyl(g, 0.3, 0, 0.5, i % 2 ? 0xffd60a : 0xff5a36, -1.6 + i * 0.64, 1.35, 0, true, 3);
        t.rotation.y = Math.PI / 6;
    }
    return g;
}

export const SPECS: Record<Kind, ObstacleSpec> = {
    rickshaw: { answer: 'dodge', hw: 1.0, hd: 1.5, y0: 0, y1: 2.5, weight: 24, extraSpeed: 3.5, build: buildRickshaw },
    cart: { answer: 'dodge', hw: 0.95, hd: 1.1, y0: 0, y1: 3.6, weight: 20, extraSpeed: 0, build: buildCart },
    chappal: { answer: 'jump', hw: 0.9, hd: 0.7, y0: 0, y1: 0.35, weight: 22, extraSpeed: 0, build: buildChappal },
    barrier: { answer: 'jump', hw: 1.45, hd: 0.2, y0: 0, y1: 1.1, weight: 16, extraSpeed: 0, build: buildBarrier },
    banner: { answer: 'slide', hw: 2.0, hd: 0.2, y0: 1.2, y1: 2.8, weight: 18, extraSpeed: 0, build: buildBanner },
};

export function buildCoin(): TransformNode {
    const g = new TransformNode('coin');
    const disc = cyl(g, 0.42, 0.42, 0.1, 0xffd60a, 0, 0, 0, false, 18, 0.5);
    disc.rotation.x = Math.PI / 2;
    const rim = MeshBuilder.CreateTorus('rim', { diameter: 0.84, thickness: 0.1, tessellation: 18 }, g.getScene());
    rim.rotation.x = Math.PI / 2;
    rim.material = mat(0xf5a300, 0.4);
    rim.parent = g;
    return g;
}

export type { Mesh };
