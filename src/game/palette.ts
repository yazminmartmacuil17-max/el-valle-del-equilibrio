/** Two palettes: index 0 = cozy & sustainable, index 1 = grey & catastrophic. Colors lerp with the meter. */
const PAIRS = {
  grass: ["#7cc35a", "#807b62"],
  grassDark: ["#5fa94b", "#5e5b4c"],
  grassLight: ["#a3db6c", "#878369"],
  dry: ["#b8a15e", "#6d6457"],
  leaf: ["#3f9e4c", "#6a6048"],
  leafLight: ["#6cc65c", "#7c7258"],
  leafDark: ["#2a7040", "#46413a"],
  trunk: ["#8a5a36", "#4d433b"],
  trunkLight: ["#b98552", "#6a5f54"],
  outline: ["#2d2a35", "#232227"],
  fruit: ["#ff6b5a", "#7a5a50"],
  water: ["#4fb6e3", "#4d5a3c"],
  waterLight: ["#a8e6f7", "#6c7a50"],
  waterDark: ["#3a8fc6", "#3a4430"],
  scum: ["#4fb6e3", "#6f6a3a"],
  sand: ["#f0d9a0", "#9a9282"],
  sandDark: ["#dcc183", "#857e70"],
  path: ["#ddb97f", "#8b8375"],
  pathDark: ["#c49c64", "#756e63"],
  roof: ["#d9603f", "#6e5550"],
  roofDark: ["#a94730", "#52433f"],
  wall: ["#f6e6c4", "#a29c90"],
  wallDark: ["#d6be96", "#7f786f"],
  window: ["#ffd86b", "#5d6066"],
  soil: ["#8c5d3b", "#4f463d"],
  soilDark: ["#6e4529", "#3c352f"],
  crop: ["#9fd84a", "#787250"],
  cropRipe: ["#ffc93c", "#8a7a52"],
  rock: ["#a8a6a3", "#6e6c68"],
  rockDark: ["#7b7976", "#545250"],
  flowerA: ["#ff9fbd", "#7a7570"],
  flowerB: ["#ffe27a", "#827d6d"],
  flowerC: ["#ffffff", "#8c8a85"],
  trash: ["#8f8676", "#6b665f"],
  trashDark: ["#5f584e", "#46423d"],
  bottle: ["#4ea0d0", "#5a6a72"],
  can: ["#e8c547", "#8a8360"],
  bag: ["#d0584e", "#6e5a55"],
  hair: ["#6b3e26", "#3e342e"],
  skin: ["#f5c79e", "#c4a892"],
  shirt: ["#e9734f", "#7a6660"],
  pants: ["#3f5f9c", "#454a56"],
  boots: ["#5a3a24", "#3a332e"],
  eye: ["#2d2a35", "#232227"],
} as const;

export type PaletteKey = keyof typeof PAIRS;
export type Palette = Record<PaletteKey, string>;

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

let cacheT = -1;
let cache: Palette | null = null;

/** t: 0 sustainable → 1 catastrophic. */
export function paletteAt(t: number): Palette {
  const q = Math.round(t * 200) / 200;
  if (cache && q === cacheT) return cache;
  const out = {} as Palette;
  for (const k of Object.keys(PAIRS) as PaletteKey[]) {
    const [a, b] = PAIRS[k];
    out[k] = lerpColor(a, b, q);
  }
  cacheT = q;
  cache = out;
  return out;
}

export const VILLAGER_STYLES: Partial<Palette>[] = [
  { shirt: "#6fae5a", hair: "#2f2620" },
  { shirt: "#e7b84a", hair: "#a0522d" },
  { shirt: "#5a8fd0", hair: "#1f1c1a" },
  { shirt: "#d46a8f", hair: "#c9893f" },
  { shirt: "#8f6bb8", hair: "#5b3a22" },
  { shirt: "#3fa39a", hair: "#ead39c" },
];
