/** The ten umbrella parts as flat SVG badges: used by the HUD slots and the 3D pickups. */
const INK = '#14142b';
const BG = ['#ffe29a', '#cde7ff', '#ffc9b8', '#d8f5c4', '#ffe29a', '#cde7ff', '#ffc9b8', '#d8f5c4', '#ffe29a', '#cde7ff'];

const GLYPHS: string[] = [
    // handle
    `<path d="M36 14V44a9 9 0 0 1-18 0" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M36 14V44a9 9 0 0 1-18 0" fill="none" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/>`,
    // shaft
    `<line x1="18" y1="56" x2="54" y2="16" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><line x1="18" y1="56" x2="54" y2="16" stroke="#b8c0cc" stroke-width="5" stroke-linecap="round"/>`,
    // canopy
    `<path d="M10 50a26 26 0 0 1 52 0z" fill="#ff5a36" stroke="${INK}" stroke-width="3"/><g fill="#ff5a36" stroke="${INK}" stroke-width="3"><circle cx="16.5" cy="50" r="6.5"/><circle cx="29.5" cy="50" r="6.5"/><circle cx="42.5" cy="50" r="6.5"/><circle cx="55.5" cy="50" r="6.5"/></g>`,
    // ribs
    `<g stroke="${INK}" stroke-width="4" stroke-linecap="round"><line x1="36" y1="52" x2="12" y2="40"/><line x1="36" y1="52" x2="20" y2="28"/><line x1="36" y1="52" x2="36" y2="24"/><line x1="36" y1="52" x2="52" y2="28"/><line x1="36" y1="52" x2="60" y2="40"/></g><circle cx="36" cy="52" r="4" fill="#ffd60a" stroke="${INK}" stroke-width="2"/>`,
    // runner
    `<rect x="32" y="14" width="8" height="44" rx="3" fill="#b8c0cc" stroke="${INK}" stroke-width="3"/><ellipse cx="36" cy="34" rx="12" ry="6.5" fill="#ffd60a" stroke="${INK}" stroke-width="3"/>`,
    // stretchers
    `<polyline points="16,52 36,24 56,52" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16,52 36,24 56,52" fill="none" stroke="#b8c0cc" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="24" r="5" fill="#ffd60a" stroke="${INK}" stroke-width="2"/>`,
    // tip
    `<polygon points="36,12 27,54 45,54" fill="#b8c0cc" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="36" cy="54" r="5" fill="#ffd60a" stroke="${INK}" stroke-width="2"/>`,
    // spring
    `<polyline points="22,17 50,24 22,32 50,40 22,48 50,55" fill="none" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><polyline points="22,17 50,24 22,32 50,40 22,48 50,55" fill="none" stroke="#8b95a5" stroke-width="4" stroke-linejoin="round"/>`,
    // lock
    `<path d="M27 34a9 9 0 0 1 18 0" fill="none" stroke="${INK}" stroke-width="8"/><path d="M27 34a9 9 0 0 1 18 0" fill="none" stroke="#b8c0cc" stroke-width="4"/><rect x="22" y="34" width="28" height="22" rx="6" fill="#ffd60a" stroke="${INK}" stroke-width="3"/><circle cx="36" cy="44" r="3.5" fill="${INK}"/>`,
    // top cap
    `<ellipse cx="36" cy="30" rx="15" ry="12" fill="#3a6df0" stroke="${INK}" stroke-width="3"/><rect x="31" y="38" width="10" height="18" rx="3" fill="#b8c0cc" stroke="${INK}" stroke-width="3"/><circle cx="36" cy="18" r="4" fill="#ffd60a" stroke="${INK}" stroke-width="2"/>`,
];

export function partIcon(i: number): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="144" height="144"><circle cx="36" cy="36" r="32" fill="${BG[i]}" stroke="${INK}" stroke-width="3"/>${GLYPHS[i]}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
