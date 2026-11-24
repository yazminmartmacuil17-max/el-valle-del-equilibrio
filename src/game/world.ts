import { mulberry32 } from "./rng";
import type { GameState, Tile, TileMeta } from "./types";

export const WORLD_W = 48;
export const WORLD_H = 36;

export function createWorld(seed: number): Pick<GameState, "tiles" | "meta" | "width" | "height"> {
  const rnd = mulberry32(seed);
  const w = WORLD_W;
  const h = WORLD_H;
  const tiles: Tile[] = new Array(w * h).fill("grass");
  const meta: Record<number, TileMeta> = {};
  const set = (x: number, y: number, t: Tile) => {
    if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = t;
  };
  const get = (x: number, y: number): Tile => tiles[y * w + x] ?? "rock";

  // Lake on the west side
  const lcx = 10, lcy = 20, lrx = 7, lry = 6;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = ((x - lcx) / lrx) ** 2 + ((y - lcy) / lry) ** 2;
      const wobble = Math.sin(x * 1.3 + y * 0.7) * 0.12;
      if (d < 1 + wobble) set(x, y, "water");
      else if (d < 1.35 + wobble) set(x, y, "sand");
    }

  // River flowing from the north into the lake
  let rx = 16;
  for (let y = 0; y < lcy - 3; y++) {
    rx += Math.round((rnd() - 0.5) * 1.4);
    rx = Math.max(13, Math.min(19, rx));
    set(rx, y, "water");
    set(rx + 1, y, "water");
    if (get(rx - 1, y) === "grass") set(rx - 1, y, "sand");
    if (get(rx + 2, y) === "grass") set(rx + 2, y, "sand");
  }

  // Forest around the borders and a grove in the east
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (get(x, y) !== "grass") continue;
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      const grove = Math.hypot(x - 39, y - 9) < 6 || Math.hypot(x - 36, y - 28) < 5;
      const p = edge < 2 ? 0.9 : grove ? 0.6 : 0.05;
      if (rnd() < p) set(x, y, "tree");
      else if (rnd() < 0.015) set(x, y, "rock");
    }

  // Village paths
  const vx = 28, vy = 18;
  for (let x = 20; x < 42; x++) set(x, vy, "path");
  for (let y = 8; y < 30; y++) set(vx, y, "path");

  // Village clearing
  for (let y = vy - 5; y <= vy + 5; y++)
    for (let x = vx - 7; x <= vx + 7; x++) {
      const t = get(x, y);
      if (t === "tree" || t === "rock") set(x, y, "grass");
    }

  // Starting houses
  const houses: [number, number][] = [
    [vx - 3, vy - 2],
    [vx + 2, vy - 2],
    [vx - 3, vy + 2],
  ];
  for (const [x, y] of houses) set(x, y, "house");

  // Farm plots
  for (const [x, y] of [
    [vx + 3, vy + 2],
    [vx + 4, vy + 2],
    [vx + 3, vy + 3],
    [vx + 4, vy + 3],
  ] as [number, number][]) {
    set(x, y, "farm");
    meta[y * w + x] = { stage: 0 };
  }

  // A few trash piles left by the settlers
  for (const [x, y] of [
    [vx - 5, vy + 1],
    [vx + 6, vy - 3],
    [22, 15],
  ] as [number, number][]) {
    set(x, y, "trash");
  }

  return { tiles, meta, width: w, height: h };
}

export const START_POS = { x: 28, y: 20 };
