import { describe, expect, it } from "vitest";
import { advanceDays, applyAction, clampMeter, DAY_MS, getActions, idx, newGame, tick, TOTAL_DAYS } from "./rules";
import type { GameState } from "./types";

const clone = (s: GameState): GameState => JSON.parse(JSON.stringify(s));

describe("tiempo de juego", () => {
  it("1 día de juego dura 1 minuto real a velocidad x1", () => {
    expect(advanceDays(0, 60_000, 1)).toBe(1);
    expect(DAY_MS).toBe(60_000);
  });

  it("x2 y x4 aceleran el reloj", () => {
    expect(advanceDays(0, 60_000, 2)).toBe(2);
    expect(advanceDays(0, 60_000, 4)).toBe(4);
  });

  it("la partida termina en el día 100", () => {
    const s = newGame(42);
    tick(s, TOTAL_DAYS * DAY_MS + 5000);
    expect(s.dayFloat).toBe(100);
    expect(s.ended).toBe(true);
  });

  it("acelerar no cambia el medidor ni los recursos de los mismos días", () => {
    const slow = newGame(7);
    const fast = clone(slow);
    fast.speed = 4;
    for (let i = 0; i < 160; i++) tick(slow, 15_000); // 40 días a x1
    for (let i = 0; i < 40; i++) tick(fast, 15_000); // 40 días a x4
    expect(fast.processedDays).toBe(40);
    expect(slow.processedDays).toBe(40);
    expect(fast.meter).toBe(slow.meter);
    expect(fast.resources).toEqual(slow.resources);
    expect(fast.population).toBe(slow.population);
  });
});

describe("medidor de equilibrio", () => {
  it("empieza en el centro y se mantiene entre 0 y 100", () => {
    expect(newGame(1).meter).toBe(50);
    expect(clampMeter(-20)).toBe(0);
    expect(clampMeter(140)).toBe(100);
  });

  it("talar inclina hacia catastrófica y plantar hacia sostenible", () => {
    const s = newGame(3);
    const tx = 30, ty = 18;
    s.tiles[idx(s, tx, ty)] = "tree";
    s.player = { x: tx, y: ty + 1, dir: "up" };
    const before = s.meter;
    applyAction(s, "chop");
    expect(s.meter).toBeGreaterThan(before);
    expect(s.tiles[idx(s, tx, ty)]).toBe("stump");
    const mid = s.meter;
    applyAction(s, "replant");
    expect(s.meter).toBeLessThan(mid);
  });

  it("reciclar mejora el equilibrio y quemar residuos lo empeora", () => {
    const a = newGame(5);
    a.tiles[idx(a, 30, 18)] = "trash";
    a.player = { x: 30, y: 19, dir: "up" };
    const b = clone(a);
    applyAction(a, "recycle");
    applyAction(b, "burn");
    expect(a.meter).toBeLessThan(50);
    expect(b.meter).toBeGreaterThan(50);
  });

  it("solo ofrece acciones del objeto que tienes enfrente", () => {
    const s = newGame(9);
    s.tiles[idx(s, 30, 18)] = "water";
    s.player = { x: 30, y: 19, dir: "up" };
    const ids = getActions(s).map((o) => o.id);
    expect(ids).toContain("fishRod");
    expect(ids).not.toContain("chop");
  });
});
