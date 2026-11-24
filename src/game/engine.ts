import { VILLAGER_STYLES } from "./palette";
import { render, CANVAS_H, CANVAS_W, TILE, type Floater, type Particle, type Villager } from "./render";
import { applyAction, capacity, currentDay, DIR_VEC, getActions, isSolid, tick, tileAt } from "./rules";
import { saveGame } from "./save";
import type { ActionId, ActionOption, Dir, GameState, Speed } from "./types";

export interface HudSnapshot {
  day: number;
  dayProgress: number;
  meter: number;
  speed: Speed;
  paused: boolean;
  ended: boolean;
  wood: number;
  food: number;
  materials: number;
  population: number;
  capacity: number;
  waterPurity: number;
  fishStock: number;
  actions: ActionOption[];
  log: string[];
  toast: string | null;
}

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

const MOVE_SPEED = 4.5; // tiles per second

export class GameEngine {
  state: GameState;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private last = 0;
  private held: Dir[] = [];
  private listeners = new Set<() => void>();
  private snap: HudSnapshot;
  private snapKey = "";
  private saveTimer = 0;
  private villagers: Villager[] = [];
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private toast: { text: string; until: number } | null = null;
  private moving = false;
  private time = 0;
  /** While true (title screen), the clock and the player are frozen. */
  frozen = false;

  constructor(state: GameState) {
    this.state = state;
    this.snap = this.buildSnapshot();
    this.syncVillagers();
  }

  attach(canvas: HTMLCanvasElement) {
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx = canvas.getContext("2d");
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("beforeunload", this.save);
    document.addEventListener("visibilitychange", this.save);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  detach() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("beforeunload", this.save);
    document.removeEventListener("visibilitychange", this.save);
    this.save();
  }

  save = () => {
    if (!this.frozen) saveGame(this.state);
  };

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.snap;

  setSpeed(speed: Speed) {
    this.state.speed = speed;
    this.state.paused = false;
    this.emit(true);
  }
  togglePause() {
    if (this.state.ended) return;
    this.state.paused = !this.state.paused;
    this.emit(true);
  }

  pressDir(d: Dir, down: boolean) {
    this.held = this.held.filter((h) => h !== d);
    if (down) this.held.push(d);
  }

  doAction(id: ActionId) {
    const res = applyAction(this.state, id);
    const px = this.state.player.x * TILE + 8;
    const py = this.state.player.y * TILE - 2;
    if (!res.ok) {
      this.showToast(res.message);
      return;
    }
    if (id === "talk") {
      this.showToast(res.message, 5000);
    } else {
      const good = res.delta <= 0;
      const lines = [...res.gains];
      if (res.delta !== 0) lines.push(good ? "♥ equilibrio" : "▲ desequilibrio");
      lines.forEach((text, k) => this.floaters.push({ x: px, y: py - k * 9, text, good, life: 70 }));
      const ft = this.facingPx();
      if (id === "burn") for (let k = 0; k < 14; k++) this.spawn("smoke", ft.x + Math.random() * 10, ft.y + Math.random() * 8, (Math.random() - 0.5) * 0.2, -0.25 - Math.random() * 0.2, 120);
      if (good) for (let k = 0; k < 8; k++) this.spawn("sparkle", ft.x + Math.random() * 16, ft.y + Math.random() * 16, 0, -0.3, 40);
    }
    this.save();
    this.emit(true);
  }

  private facingPx() {
    const [dx, dy] = DIR_VEC[this.state.player.dir];
    return { x: (Math.round(this.state.player.x) + dx) * TILE, y: (Math.round(this.state.player.y) + dy) * TILE };
  }

  private showToast(text: string, ms = 2200) {
    this.toast = { text, until: this.time + ms };
    this.emit(true);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.frozen) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
    const d = KEY_DIRS[e.code];
    if (d) {
      e.preventDefault();
      if (!this.held.includes(d)) this.held.push(d);
      return;
    }
    if (e.code === "KeyP") this.togglePause();
    const n = e.code.startsWith("Digit") ? Number(e.code.slice(5)) : e.code === "KeyE" || e.code === "Space" ? 1 : 0;
    if (n > 0) {
      e.preventDefault();
      const opt = this.snap.actions[n - 1];
      if (opt) this.doAction(opt.id);
    }
  };
  private onKeyUp = (e: KeyboardEvent) => {
    const d = KEY_DIRS[e.code];
    if (d) this.held = this.held.filter((h) => h !== d);
  };
  private onBlur = () => {
    this.held = [];
  };

  private loop = (now: number) => {
    const dt = Math.min(100, now - this.last);
    this.last = now;
    this.time += dt;
    const s = this.state;
    const prevPop = s.population;
    if (!this.frozen) tick(s, dt);
    if (s.population !== prevPop) this.syncVillagers();
    if (!s.ended && !this.frozen) this.movePlayer(dt / 1000);
    this.updateVillagers(dt / 1000);
    this.updateParticles(dt);
    if (this.ctx) {
      render(this.ctx, s, {
        time: this.time,
        moving: this.moving,
        villagers: this.villagers,
        particles: this.particles,
        floaters: this.floaters,
        highlight: this.snap.actions.length > 0,
      });
    }
    this.saveTimer += dt;
    if (this.saveTimer > 3000 && !this.frozen) {
      this.saveTimer = 0;
      this.save();
    }
    if (this.toast && this.time > this.toast.until) this.toast = null;
    this.emit(false);
    this.raf = requestAnimationFrame(this.loop);
  };

  private movePlayer(sec: number) {
    const p = this.state.player;
    const d = this.held[this.held.length - 1];
    this.moving = false;
    if (!d) {
      // settle onto grid gently
      p.x += (Math.round(p.x) - p.x) * Math.min(1, sec * 12);
      p.y += (Math.round(p.y) - p.y) * Math.min(1, sec * 12);
      return;
    }
    p.dir = d;
    const [dx, dy] = DIR_VEC[d];
    const step = MOVE_SPEED * sec;
    // align the other axis so movement stays on the 4-direction grid
    if (dx !== 0) p.y += (Math.round(p.y) - p.y) * Math.min(1, sec * 14);
    if (dy !== 0) p.x += (Math.round(p.x) - p.x) * Math.min(1, sec * 14);
    const nx = p.x + dx * step;
    const ny = p.y + dy * step;
    const lead = 0.45;
    const cx = Math.round(nx + dx * lead);
    const cy = Math.round(ny + dy * lead);
    if (!isSolid(tileAt(this.state, cx, cy))) {
      p.x = Math.max(0, Math.min(this.state.width - 1, nx));
      p.y = Math.max(0, Math.min(this.state.height - 1, ny));
      this.moving = true;
    }
  }

  private syncVillagers() {
    const target = Math.min(12, this.state.population);
    while (this.villagers.length < target) {
      const k = this.villagers.length;
      this.villagers.push({
        x: 26 + (k % 5),
        y: 17 + Math.floor(k / 5) * 2,
        dir: "down",
        tx: 26 + (k % 5),
        ty: 17,
        wait: 1 + k * 0.4,
        style: VILLAGER_STYLES[k % VILLAGER_STYLES.length] ?? {},
      });
    }
    this.villagers.length = target;
  }

  private updateVillagers(sec: number) {
    for (const v of this.villagers) {
      if (v.wait > 0) {
        v.wait -= sec;
        if (v.wait <= 0) {
          const dirs: Dir[] = ["up", "down", "left", "right"];
          const d = dirs[Math.floor(Math.random() * 4)] ?? "down";
          const [dx, dy] = DIR_VEC[d];
          const len = 1 + Math.floor(Math.random() * 3);
          const tx = Math.round(v.x) + dx * len;
          const ty = Math.round(v.y) + dy * len;
          const inVillage = tx > 19 && tx < 38 && ty > 11 && ty < 26;
          if (inVillage && !isSolid(tileAt(this.state, tx, ty))) {
            v.tx = tx;
            v.ty = ty;
            v.dir = d;
          } else v.wait = 0.8;
        }
        continue;
      }
      const ddx = v.tx - v.x;
      const ddy = v.ty - v.y;
      const dist = Math.hypot(ddx, ddy);
      const step = 1.6 * sec;
      const next = { x: v.x + (ddx / (dist || 1)) * step, y: v.y + (ddy / (dist || 1)) * step };
      if (dist <= step || isSolid(tileAt(this.state, Math.round(next.x), Math.round(next.y)))) {
        v.x = Math.round(dist <= step ? v.tx : v.x);
        v.y = Math.round(dist <= step ? v.ty : v.y);
        v.wait = 1.5 + Math.random() * 3;
      } else {
        v.x = next.x;
        v.y = next.y;
      }
    }
  }

  private spawn(kind: Particle["kind"], x: number, y: number, vx: number, vy: number, max: number) {
    this.particles.push({ kind, x, y, vx, vy, life: max, max, hue: Math.random() });
  }

  private updateParticles(dt: number) {
    const t = this.state.meter / 100;
    const f = dt / 16.67;
    const p = this.state.player;
    const cx = p.x * TILE;
    const cy = p.y * TILE;
    const counts = { butterfly: 0, ash: 0 };
    for (const q of this.particles) if (q.kind === "butterfly" || q.kind === "ash") counts[q.kind]++;
    if (counts.butterfly < Math.round(10 * Math.max(0, 1 - t * 1.8)) && Math.random() < 0.05)
      this.spawn("butterfly", cx + (Math.random() - 0.5) * CANVAS_W, cy + (Math.random() - 0.5) * CANVAS_H, (Math.random() - 0.5) * 0.5, 0, 400);
    if (counts.ash < Math.round(60 * Math.max(0, t - 0.45) * 2) && Math.random() < 0.6)
      this.spawn("ash", cx + (Math.random() - 0.5) * CANVAS_W * 1.2, cy - CANVAS_H / 2 - 10 + Math.random() * CANVAS_H, -0.15 - Math.random() * 0.2, 0.25 + Math.random() * 0.3, 260);
    // Trash piles smoke in a gloomy valley
    if (t > 0.6 && Math.random() < 0.04) {
      const tx = Math.round(p.x + (Math.random() - 0.5) * 24);
      const ty = Math.round(p.y + (Math.random() - 0.5) * 14);
      if (tileAt(this.state, tx, ty) === "trash") this.spawn("smoke", tx * TILE + 8, ty * TILE + 6, 0.05, -0.2, 150);
    }
    for (const q of this.particles) {
      q.life -= f;
      if (q.kind === "butterfly") {
        q.x += q.vx * f + Math.sin((q.max - q.life) / 18 + q.hue * 6) * 0.3 * f;
        q.y += Math.cos((q.max - q.life) / 14 + q.hue * 4) * 0.3 * f;
      } else {
        q.x += q.vx * f;
        q.y += q.vy * f;
      }
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    for (const fl of this.floaters) {
      fl.life -= f;
      fl.y -= 0.25 * f;
    }
    this.floaters = this.floaters.filter((fl) => fl.life > 0);
  }

  private buildSnapshot(): HudSnapshot {
    const s = this.state;
    return {
      day: currentDay(s),
      dayProgress: s.dayFloat - Math.floor(s.dayFloat),
      meter: s.meter,
      speed: s.speed,
      paused: s.paused,
      ended: s.ended,
      wood: s.resources.wood,
      food: s.resources.food,
      materials: s.resources.materials,
      population: s.population,
      capacity: capacity(s),
      waterPurity: Math.round(100 - s.pollution),
      fishStock: Math.round(s.fishStock),
      actions: getActions(s),
      log: s.log,
      toast: this.toast?.text ?? null,
    };
  }

  private emit(force: boolean) {
    const next = this.buildSnapshot();
    const key = JSON.stringify({ ...next, dayProgress: Math.round(next.dayProgress * 20) });
    if (!force && key === this.snapKey) return;
    this.snapKey = key;
    this.snap = next;
    this.listeners.forEach((l) => l());
  }
}
