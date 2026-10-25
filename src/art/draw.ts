import Phaser from 'phaser';

/**
 * Procedural art. Every sprite is drawn with code onto a transparent canvas,
 * so there are no image files to download, no baked-in backgrounds and no
 * blur at any resolution. Style: flat colour blocks with a dark ink outline.
 * The game is a top-down street chase: everything is seen from above.
 */
const INK = 0x14142b;

type G = Phaser.GameObjects.Graphics;

const make = (scene: Phaser.Scene): G => scene.make.graphics({ x: 0, y: 0 }, false);

function rr(g: G, x: number, y: number, w: number, h: number, r: number, fill: number, lw = 3) {
    g.fillStyle(fill, 1).fillRoundedRect(x, y, w, h, r);
    if (lw) g.lineStyle(lw, INK, 1).strokeRoundedRect(x, y, w, h, r);
}

function circ(g: G, x: number, y: number, r: number, fill: number, lw = 3) {
    g.fillStyle(fill, 1).fillCircle(x, y, r);
    if (lw) g.lineStyle(lw, INK, 1).strokeCircle(x, y, r);
}

function ell(g: G, x: number, y: number, w: number, h: number, fill: number, lw = 3) {
    g.fillStyle(fill, 1).fillEllipse(x, y, w, h);
    if (lw) g.lineStyle(lw, INK, 1).strokeEllipse(x, y, w, h);
}

function line(g: G, x1: number, y1: number, x2: number, y2: number, w: number, color: number) {
    g.lineStyle(w, color, 1).lineBetween(x1, y1, x2, y2);
}

function slice(g: G, x: number, y: number, r: number, a0: number, a1: number, fill: number, lw = 3) {
    g.fillStyle(fill, 1).beginPath().slice(x, y, r, a0, a1, false).closePath().fillPath();
    if (lw) g.lineStyle(lw, INK, 1).beginPath().slice(x, y, r, a0, a1, false).closePath().strokePath();
}

function mulberry32(seed: number) {
    let a = seed;
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const SKIN = 0xc98a55;
export const RUN_FRAMES = 6;
export const FRAME = 128;

type Pose = 'run' | 'jump' | 'slide';

/** Kabir seen from above and behind. (ox, oy) is the top-left of his 128px frame. */
function drawKabir(g: G, ox: number, oy: number, phase: number, pose: Pose) {
    const s = Math.sin(phase);
    let legL = s * 11, legR = -s * 11, armL = -s * 12, armR = s * 12;
    let armSpread = 0;
    if (pose === 'jump') { legL = -3; legR = -3; armL = -14; armR = -14; armSpread = 7; }
    if (pose === 'slide') { legL = 4; legR = 4; armL = -6; armR = -6; armSpread = -6; }
    const cx = ox + 64;

    // legs
    for (const [dx, off] of [[-10, legL], [10, legR]] as const) {
        const x = cx + dx - 8, y = oy + 70 + off;
        rr(g, x, y, 16, 30, 6, SKIN, 3);
        rr(g, x - 1, y - 2, 18, 16, 6, 0x2d6a9f, 3);
        ell(g, x + 8, y + 31, 22, 13, 0x3a6df0, 3);
        line(g, x - 1, y + 36, x + 17, y + 36, 3, 0xffffff);
    }
    // arms
    for (const [dx, off] of [[-33 - armSpread, armL], [33 + armSpread, armR]] as const) {
        const x = cx + dx - 7, y = oy + 46 + off;
        rr(g, x, y, 14, 32, 6, SKIN, 3);
        rr(g, x - 1, y - 1, 16, 13, 5, 0xffd60a, 3);
        circ(g, x + 7, y + 34, 6.5, SKIN, 3);
    }
    // torso: striped tee
    rr(g, cx - 24, oy + 40, 48, 40, 15, 0xffd60a, 0);
    g.fillStyle(0xff5a36, 1).fillRect(cx - 22, oy + 52, 44, 7);
    g.fillStyle(0x00c46a, 1).fillRect(cx - 22, oy + 64, 44, 7);
    g.lineStyle(3, INK, 1).strokeRoundedRect(cx - 24, oy + 40, 48, 40, 15);
    // school bag
    rr(g, cx - 15, oy + 47, 30, 26, 9, 0x3a6df0, 3);
    rr(g, cx - 10, oy + 62, 20, 8, 3, 0x2a52c4, 2);
    line(g, cx - 12, oy + 42, cx - 12, oy + 49, 3, INK);
    line(g, cx + 12, oy + 42, cx + 12, oy + 49, 3, INK);
    // head: mostly hair from behind
    circ(g, cx - 17, oy + 36, 4.5, SKIN, 3);
    circ(g, cx + 17, oy + 36, 4.5, SKIN, 3);
    circ(g, cx, oy + 33, 17, 0x2b1b17, 3);
    g.fillStyle(0x2b1b17, 1).fillTriangle(cx - 9, oy + 19, cx - 4, oy + 7, cx + 1, oy + 19);
    g.fillStyle(0x2b1b17, 1).fillTriangle(cx - 1, oy + 19, cx + 6, oy + 6, cx + 11, oy + 20);
    g.lineStyle(3, INK, 1).strokeTriangle(cx - 9, oy + 19, cx - 4, oy + 7, cx + 1, oy + 19);
    g.lineStyle(3, INK, 1).strokeTriangle(cx - 1, oy + 19, cx + 6, oy + 6, cx + 11, oy + 20);
    g.fillStyle(0x4a3128, 1).fillEllipse(cx - 5, oy + 27, 10, 6);
}

/** Mother, seen from above and behind, a chappal raised in one hand. */
function drawMother(g: G, ox: number, oy: number, phase: number) {
    const s = Math.sin(phase);
    const cx = ox + 64;
    // saree skirt sways
    ell(g, cx + s * 4, oy + 88, 78, 46, 0xd6336c, 3);
    g.lineStyle(4, 0xffd60a, 1).strokeEllipse(cx + s * 4, oy + 92, 70, 34);
    // feet
    ell(g, cx - 12 + s * 3, oy + 108 + s * 5, 16, 11, 0x5a2d0c, 2);
    ell(g, cx + 12 - s * 3, oy + 108 - s * 5, 16, 11, 0x5a2d0c, 2);
    // swinging arm
    rr(g, cx - 42, oy + 46 + s * 10, 14, 30, 6, SKIN, 3);
    rr(g, cx - 43, oy + 45 + s * 10, 16, 12, 5, 0xd6336c, 3);
    // raised arm with chappal
    rr(g, cx + 28, oy + 22 - s * 4, 14, 32, 6, SKIN, 3);
    rr(g, cx + 27, oy + 44 - s * 4, 16, 12, 5, 0xd6336c, 3);
    ell(g, cx + 35, oy + 8 - s * 4, 20, 36, 0xd94f2b, 3);
    g.fillStyle(0xffd60a, 1).fillTriangle(cx + 28, oy + 2 - s * 4, cx + 42, oy + 2 - s * 4, cx + 35, oy + 16 - s * 4);
    g.lineStyle(2, INK, 1).strokeTriangle(cx + 28, oy + 2 - s * 4, cx + 42, oy + 2 - s * 4, cx + 35, oy + 16 - s * 4);
    // torso with pallu
    rr(g, cx - 30, oy + 44, 60, 50, 18, 0xd6336c, 3);
    g.lineStyle(7, 0xffd60a, 1).lineBetween(cx - 28, oy + 52, cx + 24, oy + 90);
    g.lineStyle(3, INK, 1).strokeRoundedRect(cx - 30, oy + 44, 60, 50, 18);
    // head and bun
    circ(g, cx, oy + 28, 11, 0x1a1010, 3);
    circ(g, cx, oy + 42, 17, 0x1a1010, 3);
    circ(g, cx - 16, oy + 44, 3, 0xffd60a, 2);
    circ(g, cx + 16, oy + 44, 3, 0xffd60a, 2);
    g.lineStyle(2, 0x4a3128, 1).lineBetween(cx, oy + 28, cx, oy + 58);
}

function drawRickshaw(g: G) {
    // wheels
    rr(g, 2, 44, 18, 48, 6, 0x1b1b1b, 3);
    rr(g, 130, 44, 18, 48, 6, 0x1b1b1b, 3);
    rr(g, 66, 196, 18, 30, 6, 0x1b1b1b, 3);
    // body + roof
    rr(g, 16, 14, 118, 188, 30, 0xffd60a, 4);
    rr(g, 16, 112, 118, 90, 24, 0x1fa35b, 0);
    g.lineStyle(4, INK, 1).strokeRoundedRect(16, 14, 118, 188, 30);
    rr(g, 34, 28, 82, 120, 20, 0xf4b400, 3);
    for (const y of [56, 84, 112]) line(g, 40, y, 110, y, 3, INK);
    // windscreen and bumper
    rr(g, 30, 150, 90, 28, 10, 0xbdefff, 3);
    line(g, 75, 150, 75, 178, 3, INK);
    rr(g, 38, 196, 74, 14, 7, 0x1fa35b, 3);
    // headlamp + mirrors
    circ(g, 75, 214, 8, 0xfff3a0, 3);
    circ(g, 8, 160, 6, 0xb8c0cc, 2);
    circ(g, 142, 160, 6, 0xb8c0cc, 2);
}

function drawCart(g: G) {
    // wheels + cart body
    rr(g, 10, 118, 16, 40, 5, 0x1b1b1b, 3);
    rr(g, 124, 118, 16, 40, 5, 0x1b1b1b, 3);
    rr(g, 24, 70, 102, 118, 10, 0x8a5a2b, 3);
    for (const y of [96, 122, 148]) line(g, 28, y, 122, y, 2, 0x5c3a18);
    // handle
    rr(g, 52, 186, 46, 10, 5, 0x5c3a18, 3);
    // fruit
    circ(g, 48, 132, 11, 0xff8a00, 3);
    circ(g, 70, 150, 11, 0xff8a00, 3);
    circ(g, 98, 128, 11, 0xff8a00, 3);
    ell(g, 100, 160, 34, 20, 0x2e9e45, 3);
    ell(g, 100, 160, 22, 10, 0xff4d5a, 2);
    ell(g, 54, 170, 30, 11, 0xffd60a, 3);
    // umbrella canopy from above
    const cx = 75, cy = 66, r = 64;
    for (let i = 0; i < 8; i++) {
        slice(g, cx, cy, r, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4, i % 2 ? 0xffffff : 0xff5a36, 2);
    }
    g.lineStyle(4, INK, 1).strokeCircle(cx, cy, r);
    circ(g, cx, cy, 6, 0xffd60a, 3);
}

function drawChappal(g: G) {
    const one = (x: number, y: number) => {
        ell(g, x, y, 40, 84, 0xd94f2b, 3);
        ell(g, x, y + 4, 28, 66, 0xb53b1b, 0);
        g.fillStyle(0xffd60a, 1).fillTriangle(x - 17, y - 14, x + 17, y - 14, x, y - 40);
        g.lineStyle(3, INK, 1).strokeTriangle(x - 17, y - 14, x + 17, y - 14, x, y - 40);
        circ(g, x, y - 30, 4, 0xfff3a0, 2);
    };
    one(34, 56);
    one(72, 50);
}

function drawBarrier(g: G) {
    rr(g, 22, 52, 14, 24, 3, 0x444455, 3);
    rr(g, 154, 52, 14, 24, 3, 0x444455, 3);
    rr(g, 6, 14, 178, 42, 10, 0xffffff, 0);
    for (let i = 0; i < 6; i++) {
        g.fillStyle(0xff5a36, 1).fillRect(10 + i * 30, 17, 15, 36);
    }
    g.lineStyle(4, INK, 1).strokeRoundedRect(6, 14, 178, 42, 10);
    circ(g, 20, 14, 7, 0xffb300, 3);
    circ(g, 170, 14, 7, 0xffb300, 3);
}

function drawBanner(g: G) {
    // overhead cloth sign: shadow, ropes, fabric
    ell(g, 100, 78, 176, 40, 0x000000, 0);
    g.fillStyle(0x000000, 0.28).fillEllipse(100, 86, 176, 38);
    line(g, 0, 8, 22, 28, 4, INK);
    line(g, 200, 8, 178, 28, 4, INK);
    rr(g, 14, 18, 172, 52, 8, 0x3a6df0, 4);
    for (let i = 0; i < 5; i++) {
        const x = 34 + i * 34;
        g.fillStyle(0xffd60a, 1).fillTriangle(x, 26, x + 14, 44, x, 62);
        g.fillStyle(0xff5a36, 1).fillTriangle(x + 17, 26, x + 17, 62, x + 3, 44);
    }
    g.lineStyle(4, INK, 1).strokeRoundedRect(14, 18, 172, 52, 8);
    circ(g, 14, 18, 5, 0xb8c0cc, 2);
    circ(g, 186, 18, 5, 0xb8c0cc, 2);
}

function drawCoinFrames(g: G) {
    const widths = [40, 34, 22, 8, 22, 34];
    widths.forEach((w, i) => {
        const ox = i * 48;
        ell(g, ox + 24, 24, w, 40, 0xffd60a, 3);
        if (w > 16) {
            g.lineStyle(2, 0xf5a300, 1).strokeEllipse(ox + 24, 24, w * 0.62, 26);
            line(g, ox + 24, 14, ox + 24, 34, 3, 0xf5a300);
        } else {
            g.fillStyle(0xf5a300, 1).fillRect(ox + 22, 8, 4, 32);
        }
    });
}

const PART_BG = [0xffe29a, 0xcde7ff, 0xffc9b8, 0xd8f5c4, 0xffe29a, 0xcde7ff, 0xffc9b8, 0xd8f5c4, 0xffe29a, 0xcde7ff];

function drawPart(g: G, i: number) {
    const ox = i * 72, cx = ox + 36;
    circ(g, cx, 36, 32, PART_BG[i], 3);
    const stroke = (pts: number[][], wInk: number, wCol: number, col: number) => {
        g.lineStyle(wInk, INK, 1).beginPath().moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach((p) => g.lineTo(p[0], p[1]));
        g.strokePath();
        g.lineStyle(wCol, col, 1).beginPath().moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach((p) => g.lineTo(p[0], p[1]));
        g.strokePath();
    };
    switch (i) {
        case 0: // handle
            stroke([[cx, 14], [cx, 44]], 12, 7, 0x8a5a2b);
            g.lineStyle(12, INK, 1).beginPath().arc(cx - 9, 44, 9, 0, Math.PI).strokePath();
            g.lineStyle(7, 0x8a5a2b, 1).beginPath().arc(cx - 9, 44, 9, 0, Math.PI).strokePath();
            break;
        case 1: // shaft
            stroke([[ox + 18, 56], [ox + 54, 16]], 11, 6, 0xb8c0cc);
            break;
        case 2: // canopy
            slice(g, cx, 50, 26, Math.PI, Math.PI * 2, 0xff5a36, 3);
            for (let k = 0; k < 4; k++) circ(g, cx - 19.5 + k * 13, 50, 6.5, 0xff5a36, 3);
            break;
        case 3: // ribs
            for (let k = 0; k < 5; k++) {
                const a = Math.PI * (1.15 + k * 0.175);
                stroke([[cx, 52], [cx + Math.cos(a) * 26, 52 + Math.sin(a) * 26]], 6, 3, 0xb8c0cc);
            }
            circ(g, cx, 52, 4, 0xffd60a, 2);
            break;
        case 4: // runner
            rr(g, cx - 4, 14, 8, 44, 3, 0xb8c0cc, 3);
            ell(g, cx, 34, 24, 13, 0xffd60a, 3);
            break;
        case 5: // stretchers
            stroke([[ox + 16, 52], [cx, 24], [ox + 56, 52]], 10, 5, 0xb8c0cc);
            circ(g, cx, 24, 5, 0xffd60a, 2);
            circ(g, ox + 16, 52, 4, 0xffd60a, 2);
            circ(g, ox + 56, 52, 4, 0xffd60a, 2);
            break;
        case 6: // tip
            g.fillStyle(0xb8c0cc, 1).fillTriangle(cx, 12, cx - 9, 54, cx + 9, 54);
            g.lineStyle(3, INK, 1).strokeTriangle(cx, 12, cx - 9, 54, cx + 9, 54);
            circ(g, cx, 54, 5, 0xffd60a, 2);
            break;
        case 7: // spring
            stroke([[ox + 22, 17], [ox + 50, 24], [ox + 22, 32], [ox + 50, 40], [ox + 22, 48], [ox + 50, 55]], 8, 4, 0x8b95a5);
            break;
        case 8: // lock
            g.lineStyle(8, INK, 1).beginPath().arc(cx, 34, 9, Math.PI, Math.PI * 2).strokePath();
            g.lineStyle(4, 0xb8c0cc, 1).beginPath().arc(cx, 34, 9, Math.PI, Math.PI * 2).strokePath();
            rr(g, cx - 14, 34, 28, 22, 6, 0xffd60a, 3);
            circ(g, cx, 44, 3.5, INK, 0);
            break;
        default: // top cap
            ell(g, cx, 30, 30, 24, 0x3a6df0, 3);
            rr(g, cx - 5, 38, 10, 18, 3, 0xb8c0cc, 3);
            circ(g, cx, 18, 4, 0xffd60a, 2);
    }
}

function drawStreet(g: G) {
    const W = 1280, H = 720;
    const rnd = mulberry32(7);
    // road
    g.fillStyle(0x30313f, 1).fillRect(280, 0, 720, H);
    for (let i = 0; i < 320; i++) {
        g.fillStyle(rnd() > 0.5 ? 0x3b3c4c : 0x292a37, 0.7).fillRect(282 + rnd() * 716, rnd() * H, 2 + rnd() * 5, 2 + rnd() * 3);
    }
    // lane dashes (period 60 divides 720: tiles seamlessly)
    for (const x of [517, 757]) {
        for (let k = 0; k < 12; k++) g.fillStyle(0xf5f1e8, 0.9).fillRoundedRect(x, k * 60 + 10, 6, 38, 2);
    }
    // road edge lines
    g.fillStyle(0xffd60a, 1).fillRect(292, 0, 4, H).fillRect(984, 0, 4, H);
    // manholes
    for (const [x, y] of [[400, 260], [880, 560]]) {
        circ(g, x, y, 24, 0x23242f, 3);
        g.lineStyle(2, 0x3b3c4c, 1).strokeCircle(x, y, 14);
    }
    // sidewalks + kerbs
    for (const x0 of [130, 1018]) {
        g.fillStyle(0xd8c7a3, 1).fillRect(x0, 0, 132, H);
        g.lineStyle(2, 0xbba984, 1);
        for (let y = 0; y <= H; y += 60) g.lineBetween(x0, y, x0 + 132, y);
        for (let x = x0 + 44; x < x0 + 132; x += 44) g.lineBetween(x, 0, x, H);
    }
    for (const x0 of [262, 1000]) {
        g.fillStyle(0xb9b2a0, 1).fillRect(x0, 0, 18, H);
        g.lineStyle(3, INK, 0.7).lineBetween(x0 === 262 ? 262 : 1018, 0, x0 === 262 ? 262 : 1018, H);
    }
    // shopfronts: roofs + awnings along both edges
    const heights = [150, 120, 180, 130, 140];
    const roofs = [0xc4552d, 0x6c5ce7, 0x2e9e45, 0xd6336c, 0x3a6df0];
    for (const side of [0, 1]) {
        let y = 0;
        heights.forEach((h, i) => {
            const x = side === 0 ? 0 : 1150;
            const w = 130;
            g.fillStyle(roofs[(i + side * 2) % roofs.length], 1).fillRect(x, y + 4, w, h - 8);
            g.lineStyle(4, INK, 1).strokeRect(x, y + 4, w, h - 8);
            g.fillStyle(0x000000, 0.12).fillRect(x + 8, y + 12, 40, h - 24);
            circ(g, x + (side === 0 ? 40 : 90), y + h / 2, 14, 0x23242f, 3);
            // striped awning on the sidewalk side
            const ax = side === 0 ? 100 : 1150;
            for (let s = 0; s < Math.floor((h - 12) / 18); s++) {
                g.fillStyle(s % 2 ? 0xffffff : 0xff5a36, 1).fillRect(side === 0 ? ax : 1150, y + 8 + s * 18, 30, 18);
            }
            g.lineStyle(3, INK, 1).strokeRect(side === 0 ? ax : 1150, y + 8, 30, Math.floor((h - 12) / 18) * 18);
            y += h;
        });
    }
    // coconut palms from above
    for (const [px, py] of [[196, 100], [196, 470], [1084, 270], [1084, 630]]) {
        for (let k = 0; k < 9; k++) {
            const a = (k / 9) * Math.PI * 2 + 0.3;
            const x1 = px + Math.cos(a) * 62, y1 = py + Math.sin(a) * 62;
            const nx = Math.cos(a + Math.PI / 2) * 11, ny = Math.sin(a + Math.PI / 2) * 11;
            g.fillStyle(k % 2 ? 0x1f7a3a : 0x2e9e45, 1).fillTriangle(px, py, x1 + nx, y1 + ny, x1 - nx, y1 - ny);
            g.lineStyle(2, INK, 1).strokeTriangle(px, py, x1 + nx, y1 + ny, x1 - nx, y1 - ny);
        }
        circ(g, px, py, 9, 0x8a5a2b, 3);
        circ(g, px - 3, py + 2, 3, 0xd8c7a3, 0);
    }
    void W;
}

/** Generate every texture and animation the game needs. Safe to call once. */
export function generateArt(scene: Phaser.Scene) {
    const tex = scene.textures;
    const build = (key: string, w: number, h: number, draw: (g: G) => void) => {
        if (tex.exists(key)) return;
        const g = make(scene);
        draw(g);
        g.generateTexture(key, w, h);
        g.destroy();
    };
    const sheet = (key: string, fw: number, fh: number, n: number, draw: (g: G) => void) => {
        build(key, fw * n, fh, draw);
        const t = tex.get(key);
        for (let i = 0; i < n; i++) t.add(i, 0, i * fw, 0, fw, fh);
    };

    sheet('kabir', FRAME, FRAME, RUN_FRAMES + 2, (g) => {
        for (let i = 0; i < RUN_FRAMES; i++) drawKabir(g, i * FRAME, 0, (i / RUN_FRAMES) * Math.PI * 2, 'run');
        drawKabir(g, RUN_FRAMES * FRAME, 0, 0, 'jump');
        drawKabir(g, (RUN_FRAMES + 1) * FRAME, 0, 0, 'slide');
    });
    sheet('mother', FRAME, FRAME, RUN_FRAMES, (g) => {
        for (let i = 0; i < RUN_FRAMES; i++) drawMother(g, i * FRAME, 0, (i / RUN_FRAMES) * Math.PI * 2);
    });
    build('rickshaw', 150, 230, drawRickshaw);
    build('cart', 150, 200, drawCart);
    build('chappal', 110, 110, drawChappal);
    build('barrier', 190, 76, drawBarrier);
    build('banner', 200, 100, drawBanner);
    sheet('coin', 48, 48, 6, drawCoinFrames);
    sheet('parts', 72, 72, 10, (g) => { for (let i = 0; i < 10; i++) drawPart(g, i); });
    build('street', 1280, 720, drawStreet);
    build('shadow', 100, 40, (g) => { g.fillStyle(0x000000, 0.4).fillEllipse(50, 20, 96, 36); });
    build('dot', 8, 8, (g) => { g.fillStyle(0xffffff, 1).fillCircle(4, 4, 4); });

    const anims = scene.anims;
    const add = (key: string, tk: string, start: number, end: number, rate: number) => {
        if (!anims.exists(key)) anims.create({ key, frames: anims.generateFrameNumbers(tk, { start, end }), frameRate: rate, repeat: -1 });
    };
    add('run', 'kabir', 0, RUN_FRAMES - 1, 14);
    add('mother_run', 'mother', 0, RUN_FRAMES - 1, 11);
    add('coin_spin', 'coin', 0, 5, 12);
}
