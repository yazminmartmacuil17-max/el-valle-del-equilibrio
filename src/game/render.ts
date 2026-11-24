import { paletteAt, type Palette } from "./palette";
import { hash2 } from "./rng";
import { currentDay, idx, tileAt } from "./rules";
import { CHAR, DEAD_TREE, FRUIT_SPOTS, HOUSE, KEYMAP, ROCK, SAPLING, STUMP, TRASH, TREE, type Sprite } from "./sprites";
import type { Dir, GameState } from "./types";

export const TILE = 16;
export const VIEW_W = 25;
export const VIEW_H = 15;
export const CANVAS_W = VIEW_W * TILE;
export const CANVAS_H = VIEW_H * TILE;

export interface Villager {
  x: number;
  y: number;
  dir: Dir;
  tx: number;
  ty: number;
  wait: number;
  style: Partial<Palette>;
}

export interface Particle {
  kind: "butterfly" | "ash" | "smoke" | "sparkle";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  hue: number;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  good: boolean;
  life: number;
}

export interface RenderExtras {
  time: number;
  moving: boolean;
  villagers: Villager[];
  particles: Particle[];
  floaters: Floater[];
  highlight: boolean;
}

function drawSprite(ctx: CanvasRenderingContext2D, sp: Sprite, px: number, py: number, pal: Palette, over?: Partial<Palette>) {
  for (let y = 0; y < sp.length; y++) {
    const row = sp[y]!;
    for (let x = 0; x < row.length; x++) {
      const c = row[x]!;
      if (c === ".") continue;
      const key = KEYMAP[c];
      if (!key) continue;
      ctx.fillStyle = over?.[key] ?? pal[key];
      ctx.fillRect(px + x, py + y, 1, 1);
    }
  }
}

function ground(ctx: CanvasRenderingContext2D, s: GameState, x: number, y: number, px: number, py: number, pal: Palette, t: number, time: number) {
  const tile = tileAt(s, x, y);
  const h = hash2(x, y);
  if (tile === "water") {
    ctx.fillStyle = pal.water;
    ctx.fillRect(px, py, TILE, TILE);
    // shore shading
    if (tileAt(s, x, y - 1) !== "water") {
      ctx.fillStyle = pal.waterDark;
      ctx.fillRect(px, py, TILE, 2);
    }
    // shimmer
    const phase = Math.floor(time / 400 + h * 8) % 4;
    ctx.fillStyle = pal.waterLight;
    const sx = Math.floor(h * 10) + phase;
    const sy = 4 + Math.floor(hash2(x, y, 3) * 8);
    ctx.fillRect(px + (sx % 12), py + sy, 3, 1);
    if (h > 0.5) ctx.fillRect(px + ((sx + 6) % 13), py + ((sy + 6) % 14), 2, 1);
    // murk/scum spots grow with pollution & meter
    const murk = Math.min(1, t * 0.8 + s.pollution / 200);
    if (hash2(x, y, 9) < murk * 0.7) {
      ctx.fillStyle = pal.scum;
      ctx.fillRect(px + Math.floor(hash2(x, y, 4) * 12), py + Math.floor(hash2(x, y, 5) * 12), 3, 2);
      ctx.fillRect(px + Math.floor(hash2(x, y, 6) * 13), py + Math.floor(hash2(x, y, 7) * 13), 2, 1);
    }
    return;
  }
  if (tile === "sand") {
    ctx.fillStyle = pal.sand;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = pal.sandDark;
    for (let k = 0; k < 4; k++) ctx.fillRect(px + Math.floor(hash2(x, y, k) * 15), py + Math.floor(hash2(x, y, k + 10) * 15), 1, 1);
    return;
  }
  if (tile === "path") {
    ctx.fillStyle = pal.path;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = pal.pathDark;
    for (let k = 0; k < 5; k++) ctx.fillRect(px + Math.floor(hash2(x, y, k) * 15), py + Math.floor(hash2(x, y, k + 10) * 15), 1, 1);
    return;
  }
  if (tile === "farm") {
    ctx.fillStyle = pal.soil;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = pal.soilDark;
    for (let r = 2; r < 16; r += 4) ctx.fillRect(px + 1, py + r, 14, 1);
    const m = s.meta[idx(s, x, y)];
    const stage = m?.stage ?? 0;
    if (stage > 0) {
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++) {
          const cx = px + 2 + c * 4;
          const cy = py + 1 + r * 4;
          ctx.fillStyle = pal.crop;
          if (stage === 1) ctx.fillRect(cx, cy, 1, 1);
          else if (stage === 2) ctx.fillRect(cx, cy - 1, 1, 2);
          else {
            ctx.fillRect(cx - 1, cy - 1, 3, 2);
            ctx.fillStyle = pal.cropRipe;
            ctx.fillRect(cx, cy - 2, 1, 1);
          }
        }
    }
    return;
  }
  // grass base
  ctx.fillStyle = pal.grass;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = pal.grassDark;
  for (let k = 0; k < 4; k++) {
    const gx = px + Math.floor(hash2(x, y, k) * 14);
    const gy = py + Math.floor(hash2(x, y, k + 20) * 14);
    ctx.fillRect(gx, gy, 1, 2);
    ctx.fillRect(gx + 1, gy + 1, 1, 1);
  }
  ctx.fillStyle = pal.grassLight;
  ctx.fillRect(px + Math.floor(h * 14), py + Math.floor(hash2(x, y, 30) * 14), 1, 1);
  // dry patches as things get worse
  if (hash2(x, y, 40) < t * 0.55) {
    ctx.fillStyle = pal.dry;
    ctx.fillRect(px + Math.floor(hash2(x, y, 41) * 10), py + Math.floor(hash2(x, y, 42) * 12), 5, 2);
    ctx.fillRect(px + Math.floor(hash2(x, y, 43) * 12), py + Math.floor(hash2(x, y, 44) * 13), 3, 1);
  }
  // flowers bloom when the community is sustainable
  if (tile === "grass" && hash2(x, y, 50) < (1 - t) * 0.32) {
    const cols = [pal.flowerA, pal.flowerB, pal.flowerC];
    const n = 1 + Math.floor(hash2(x, y, 51) * 3);
    for (let k = 0; k < n; k++) {
      const fx = px + 2 + Math.floor(hash2(x, y, 52 + k) * 11);
      const fy = py + 2 + Math.floor(hash2(x, y, 60 + k) * 11);
      ctx.fillStyle = cols[k % 3]!;
      ctx.fillRect(fx, fy, 1, 1);
      ctx.fillRect(fx - 1, fy + 1, 1, 1);
      ctx.fillRect(fx + 1, fy + 1, 1, 1);
      ctx.fillRect(fx, fy + 2, 1, 1);
      ctx.fillStyle = pal.flowerB;
      ctx.fillRect(fx, fy + 1, 1, 1);
    }
  }
}

function object(ctx: CanvasRenderingContext2D, s: GameState, x: number, y: number, px: number, py: number, pal: Palette, t: number, time: number) {
  const tile = tileAt(s, x, y);
  switch (tile) {
    case "tree": {
      const dead = hash2(x, y, 70) < Math.max(0, (t - 0.5) * 1.8);
      if (dead) {
        drawSprite(ctx, DEAD_TREE, px, py, pal);
        return;
      }
      const sway = Math.sin(time / 900 + x * 0.7 + y) > 0.85 ? 1 : 0;
      drawSprite(ctx, TREE, px + sway, py, pal);
      const m = s.meta[idx(s, x, y)];
      const fruitReady = m?.fruitDay === undefined || currentDay(s) - m.fruitDay >= 4;
      if (fruitReady && t < 0.75 && hash2(x, y, 71) < 0.55) {
        ctx.fillStyle = pal.fruit;
        for (const [fx, fy] of FRUIT_SPOTS.slice(0, 2 + Math.floor(hash2(x, y, 72) * 2))) ctx.fillRect(px + fx + sway, py + fy, 1, 1);
      }
      return;
    }
    case "stump":
      drawSprite(ctx, STUMP, px, py, pal);
      return;
    case "sapling":
      drawSprite(ctx, SAPLING, px, py, pal);
      return;
    case "house":
      drawSprite(ctx, HOUSE, px, py, pal);
      return;
    case "trash":
      drawSprite(ctx, TRASH, px, py, pal);
      return;
    case "rock":
      drawSprite(ctx, ROCK, px, py, pal);
      return;
  }
}

export function render(ctx: CanvasRenderingContext2D, s: GameState, ex: RenderExtras) {
  // Ease the visual curve so the midpoint still feels cozy and the extremes feel distinct
  const t = Math.pow(s.meter / 100, 1.3);
  const pal = paletteAt(t);
  const camX = Math.max(0, Math.min(s.width * TILE - CANVAS_W, Math.round(s.player.x * TILE + 8 - CANVAS_W / 2)));
  const camY = Math.max(0, Math.min(s.height * TILE - CANVAS_H, Math.round(s.player.y * TILE + 8 - CANVAS_H / 2)));
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.save();
  ctx.translate(-camX, -camY);

  const x0 = Math.floor(camX / TILE);
  const y0 = Math.floor(camY / TILE);
  const x1 = Math.min(s.width - 1, x0 + VIEW_W + 1);
  const y1 = Math.min(s.height - 1, y0 + VIEW_H + 1);

  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ground(ctx, s, x, y, x * TILE, y * TILE, pal, t, ex.time);

  // Characters sorted with objects by row for depth
  const actors = [
    ...ex.villagers.map((v) => ({ x: v.x, y: v.y, dir: v.dir, style: v.style, moving: v.wait <= 0 })),
    { x: s.player.x, y: s.player.y, dir: s.player.dir, style: undefined as Partial<Palette> | undefined, moving: ex.moving },
  ];

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) object(ctx, s, x, y, x * TILE, y * TILE, pal, t, ex.time);
    for (const a of actors) {
      if (Math.round(a.y) !== y) continue;
      const frame = a.moving ? Math.floor(ex.time / 160) % 2 : 0;
      const bob = a.moving && frame === 1 ? -1 : 0;
      const px = Math.round(a.x * TILE);
      const py = Math.round(a.y * TILE) + bob;
      ctx.fillStyle = "rgba(20,15,25,0.25)";
      ctx.fillRect(px + 4, py + 15 - bob, 8, 1);
      drawSprite(ctx, CHAR[a.dir][frame]!, px, py, pal, a.style);
    }
  }

  // Facing highlight
  if (ex.highlight) {
    const dv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[s.player.dir];
    const fx = (Math.round(s.player.x) + dv[0]!) * TILE;
    const fy = (Math.round(s.player.y) + dv[1]!) * TILE;
    const blink = Math.floor(ex.time / 350) % 2 === 0;
    ctx.fillStyle = blink ? "rgba(255,250,230,0.95)" : "rgba(255,250,230,0.55)";
    for (const [cx, cy, w, h] of [
      [0, 0, 4, 1], [0, 0, 1, 4], [12, 0, 4, 1], [15, 0, 1, 4],
      [0, 15, 4, 1], [0, 12, 1, 4], [12, 15, 4, 1], [15, 12, 1, 4],
    ] as [number, number, number, number][])
      ctx.fillRect(fx + cx, fy + cy, w, h);
  }

  // World-space particles
  for (const p of ex.particles) {
    const a = Math.min(1, p.life / 20, (p.max - p.life) / 20 + 0.2);
    if (p.kind === "butterfly") {
      const flap = Math.floor(ex.time / 120 + p.hue * 10) % 2;
      ctx.fillStyle = `hsla(${p.hue * 360},85%,72%,${a})`;
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y), 1, flap ? 2 : 1);
      ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y), 1, flap ? 2 : 1);
      ctx.fillStyle = `rgba(60,40,40,${a})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.kind === "sparkle") {
      ctx.fillStyle = `rgba(255,240,170,${a * 0.9})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    } else if (p.kind === "smoke") {
      ctx.fillStyle = `rgba(90,88,85,${a * 0.45})`;
      const r = 2 + Math.floor((p.max - p.life) / 25);
      ctx.fillRect(Math.round(p.x) - r, Math.round(p.y) - r, r * 2, r * 2);
    } else {
      ctx.fillStyle = `rgba(70,68,66,${a * 0.7})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
  }

  // Floating feedback text
  ctx.font = "8px 'Pixelify Sans', monospace";
  ctx.textAlign = "center";
  for (const f of ex.floaters) {
    const a = Math.min(1, f.life / 30);
    ctx.fillStyle = `rgba(30,25,35,${a})`;
    ctx.fillText(f.text, Math.round(f.x) + 1, Math.round(f.y) + 1);
    ctx.fillStyle = f.good ? `rgba(255,245,200,${a})` : `rgba(255,190,170,${a})`;
    ctx.fillText(f.text, Math.round(f.x), Math.round(f.y));
  }
  ctx.restore();

  // Atmosphere: warm light ↔ grey oppressive haze (gradual with meter)
  ctx.save();
  ctx.fillStyle = `rgba(255,196,120,${0.14 * (1 - t)})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalCompositeOperation = "multiply";
  const g = Math.round(255 - 80 * t);
  ctx.fillStyle = `rgb(${g},${g},${Math.round(g + 6 * t)})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(118,116,110,${0.22 * t * t})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const vg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.35, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.65);
  vg.addColorStop(0, "rgba(20,18,24,0)");
  vg.addColorStop(1, `rgba(20,18,24,${0.12 + 0.5 * t})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Sun rays when bright
  if (t < 0.45) {
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,230,170,${0.08 * (1 - t / 0.45)})`;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      const bx = 60 + k * 120 + Math.sin(ex.time / 3000 + k) * 10;
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 30, 0);
      ctx.lineTo(bx - 40, CANVAS_H);
      ctx.lineTo(bx - 90, CANVAS_H);
      ctx.fill();
    }
  }
  ctx.restore();
  return { camX, camY };
}
