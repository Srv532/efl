import {
    Color3, Mesh, MeshBuilder, StandardMaterial, TransformNode, type Scene,
} from '@babylonjs/core';

/** Small modelling kit on top of Babylon: cached flat materials and primitive helpers. */
let scene: Scene;
const mats = new Map<string, StandardMaterial>();

export const hex = (n: number) => Color3.FromHexString(`#${n.toString(16).padStart(6, '0')}`);

export function initKit(s: Scene) {
    scene = s;
    mats.clear();
}

/** Flat, matte material. `glow` makes it self-lit (windows, lamps) so the glow layer picks it up. */
export function mat(color: number, glow = 0): StandardMaterial {
    const key = `${color}:${glow}`;
    let m = mats.get(key);
    if (!m) {
        m = new StandardMaterial(key, scene);
        m.diffuseColor = hex(color);
        m.specularColor = Color3.Black();
        if (glow) m.emissiveColor = hex(color).scale(glow);
        mats.set(key, m);
    }
    return m;
}

const INK = Color3.FromHexString('#14142b');
export function edge(m: Mesh, width = 0.03) {
    m.renderOutline = true;
    m.outlineColor = INK;
    m.outlineWidth = width;
}

type Parent = TransformNode | null;
function place(m: Mesh, parent: Parent, x: number, y: number, z: number) {
    m.position.set(x, y, z);
    if (parent) m.parent = parent;
    return m;
}

export function box(parent: Parent, w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, o = false, glow = 0) {
    const m = MeshBuilder.CreateBox('box', { width: w, height: h, depth: d }, scene);
    m.material = mat(color, glow);
    if (o) edge(m);
    return place(m, parent, x, y, z);
}

export function ball(parent: Parent, r: number, color: number, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, o = false) {
    const m = MeshBuilder.CreateSphere('ball', { diameter: r * 2, segments: 10 }, scene);
    m.material = mat(color);
    m.scaling.set(sx, sy, sz);
    if (o) edge(m);
    return place(m, parent, x, y, z);
}

export function cyl(parent: Parent, rt: number, rb: number, h: number, color: number, x = 0, y = 0, z = 0, o = false, seg = 14, glow = 0) {
    const m = MeshBuilder.CreateCylinder('cyl', { diameterTop: rt * 2, diameterBottom: rb * 2, height: h, tessellation: seg }, scene);
    m.material = mat(color, glow);
    if (o) edge(m);
    return place(m, parent, x, y, z);
}

export function pivot(parent: Parent, x: number, y: number, z = 0) {
    const n = new TransformNode('pivot', scene);
    n.position.set(x, y, z);
    if (parent) n.parent = parent;
    return n;
}

/** Collects primitives, then fuses them into one mesh (one draw call per material). */
export class Collector {
    private list: Mesh[] = [];
    public readonly node = new TransformNode('collect', scene);

    box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, glow = 0) {
        const m = box(null, w, h, d, color, x, y, z, false, glow);
        this.list.push(m);
        return m;
    }
    cyl(rt: number, rb: number, h: number, color: number, x = 0, y = 0, z = 0, seg = 10, glow = 0) {
        const m = cyl(null, rt, rb, h, color, x, y, z, false, seg, glow);
        this.list.push(m);
        return m;
    }
    ball(r: number, color: number, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
        const m = ball(null, r, color, x, y, z, sx, sy, sz);
        this.list.push(m);
        return m;
    }
    /** Returns the fused mesh. Sources are disposed. */
    merge(name: string): Mesh {
        const merged = Mesh.MergeMeshes(this.list, true, true, undefined, false, true) as Mesh;
        merged.name = name;
        merged.isVisible = false; // used as the source for instances only
        this.list = [];
        return merged;
    }
}

export function meshesOf(node: TransformNode): Mesh[] {
    return node.getChildMeshes() as Mesh[];
}
