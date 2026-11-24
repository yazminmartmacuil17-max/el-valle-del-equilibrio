import { mulberry32 } from "./rng";
import { createWorld, START_POS } from "./world";
import type { ActionId, ActionOption, ActionResult, Dir, GameState, Speed, Tile } from "./types";

/** 10 in-game days = 1 real minute → one day lasts 6 real seconds at x1. */
export const DAY_MS = 6000;
export const TOTAL_DAYS = 100;
export const SPEEDS: Speed[] = [1, 2, 4];
export const START_METER = 50;
export const HOUSE_CAPACITY = 3;
export const WOOD_PER_HOUSE = 5;

export const clampMeter = (v: number) => Math.max(0, Math.min(100, v));

/** In-game days elapsed after `realMs` milliseconds at a given speed. */
export function advanceDays(dayFloat: number, realMs: number, speed: Speed): number {
  return Math.min(TOTAL_DAYS, dayFloat + (realMs * speed) / DAY_MS);
}

export function currentDay(state: GameState): number {
  return Math.min(TOTAL_DAYS, Math.floor(state.dayFloat) + 1);
}

export function newGame(seed = Math.floor(Math.random() * 1e9)): GameState {
  const world = createWorld(seed);
  return {
    version: 1,
    seed,
    ...world,
    dayFloat: 0,
    processedDays: 0,
    meter: START_METER,
    speed: 1,
    paused: false,
    player: { x: START_POS.x, y: START_POS.y, dir: "down" },
    resources: { wood: 4, food: 12, materials: 0 },
    population: 6,
    pollution: 10,
    fishStock: 80,
    log: ["Día 1: la comunidad llega al valle. ¡Bienvenida!"],
    ended: false,
    initialTrees: world.tiles.filter((t) => t === "tree").length,
  };
}

export const idx = (s: GameState, x: number, y: number) => y * s.width + x;
export function tileAt(s: GameState, x: number, y: number): Tile {
  if (x < 0 || y < 0 || x >= s.width || y >= s.height) return "rock";
  return s.tiles[idx(s, x, y)] ?? "rock";
}

const SOLID: Tile[] = ["water", "tree", "house", "rock", "trash"];
export const isSolid = (t: Tile) => SOLID.includes(t);

export const DIR_VEC: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export function facingTile(s: GameState): { x: number; y: number } {
  const [dx, dy] = DIR_VEC[s.player.dir];
  return { x: Math.round(s.player.x) + dx, y: Math.round(s.player.y) + dy };
}

export const houseCount = (s: GameState) => s.tiles.filter((t) => t === "house").length;
export const treeCount = (s: GameState) => s.tiles.filter((t) => t === "tree").length;
export const trashCount = (s: GameState) => s.tiles.filter((t) => t === "trash").length;
export const capacity = (s: GameState) => houseCount(s) * HOUSE_CAPACITY;

function pushLog(s: GameState, msg: string) {
  s.log = [`Día ${currentDay(s)}: ${msg}`, ...s.log].slice(0, 6);
}

function nudge(s: GameState, delta: number) {
  s.meter = clampMeter(s.meter + delta);
}

/** Contextual options for the tile the player is facing. */
export function getActions(s: GameState): ActionOption[] {
  if (s.ended) return [];
  const { x, y } = facingTile(s);
  const t = tileAt(s, x, y);
  const m = s.meta[idx(s, x, y)] ?? {};
  const day = currentDay(s);
  const r = s.resources;
  const opt = (id: ActionId, label: string, delta: number, enabled = true, reason?: string): ActionOption =>
    reason ? { id, label, delta, enabled, reason } : { id, label, delta, enabled };

  switch (t) {
    case "tree": {
      const fruitReady = m.fruitDay === undefined || day - m.fruitDay >= 4;
      return [
        opt("fruit", "Recolectar fruta", -0.5, fruitReady, fruitReady ? undefined : "Aún no hay fruta"),
        opt("chop", "Talar árbol", 2.5),
      ];
    }
    case "stump":
      return [opt("replant", "Plantar retoño", -2)];
    case "grass":
    case "sand": {
      const opts = [opt("plantTree", "Plantar árbol", -1.5)];
      if (t === "grass") {
        opts.push(
          opt(
            "buildRecycledHouse",
            "Casa con reciclados",
            -1,
            r.wood >= 3 && r.materials >= 3,
            "Necesitas 3 madera y 3 materiales",
          ),
          opt("buildHouse", "Construir casa", 1.5, r.wood >= WOOD_PER_HOUSE, `Necesitas ${WOOD_PER_HOUSE} madera`),
          opt("makeFarm", "Preparar huerto", 0),
        );
      }
      return opts;
    }
    case "water": {
      const opts = [
        opt("fishRod", "Pescar con caña", s.fishStock > 40 ? -0.5 : 1.5, s.fishStock >= 5, "No quedan peces"),
        opt("fishNet", "Pescar con red", 4, s.fishStock >= 20, "Hay muy pocos peces"),
      ];
      if (s.pollution > 0) opts.unshift(opt("cleanWater", "Limpiar el agua", -2));
      return opts;
    }
    case "farm": {
      const stage = m.stage ?? 0;
      if (stage === 0)
        return [opt("sow", "Sembrar", -0.5), opt("sowPesticide", "Sembrar con pesticida", 2.5)];
      if (stage >= 3) return [opt("harvest", "Cosechar", m.pest ? 0.5 : -1)];
      return [opt("harvest", "Cosechar", 0, false, "Los cultivos aún crecen")];
    }
    case "trash":
      return [
        opt("recycle", "Reciclar", -3),
        opt("burn", "Quemar residuos", 4),
        opt("dumpRiver", "Tirar al río", 6),
      ];
    case "house":
      return [opt("talk", "Conversar", 0)];
    default:
      return [];
  }
}

const TIPS = [
  "Si talas, planta un retoño en el tocón. El bosque nos da sombra y fruta.",
  "Pescar con red llena la despensa hoy… y la vacía mañana.",
  "Reciclar la basura nos da materiales para casas nuevas.",
  "Cada casa aloja a 3 vecinos. ¡Llegarán más familias si hay comida!",
  "El pesticida acelera la cosecha, pero el agua se enturbia.",
  "Si la comida se acaba, la gente pasa hambre y todo se desequilibra.",
];

export function applyAction(s: GameState, id: ActionId): ActionResult {
  const option = getActions(s).find((o) => o.id === id);
  if (!option || !option.enabled) return { ok: false, message: option?.reason ?? "No puedes hacer eso aquí", gains: [], delta: 0 };
  const { x, y } = facingTile(s);
  const i = idx(s, x, y);
  const day = currentDay(s);
  const r = s.resources;
  const gains: string[] = [];
  let msg = "";
  const delta = option.delta;

  switch (id) {
    case "chop":
      s.tiles[i] = "stump";
      delete s.meta[i];
      r.wood += 3;
      gains.push("+3 madera");
      msg = "Talaste un árbol.";
      break;
    case "fruit":
      s.meta[i] = { ...s.meta[i], fruitDay: day };
      r.food += 2;
      gains.push("+2 comida");
      msg = "Recolectaste fruta sin dañar el árbol.";
      break;
    case "replant":
    case "plantTree":
      s.tiles[i] = "sapling";
      s.meta[i] = { plantedDay: day };
      msg = "Plantaste un retoño. Crecerá en unos días.";
      break;
    case "buildHouse":
      r.wood -= WOOD_PER_HOUSE;
      s.tiles[i] = "house";
      gains.push("+3 hogar");
      msg = "Construiste una casa con madera nueva.";
      break;
    case "buildRecycledHouse":
      r.wood -= 3;
      r.materials -= 3;
      s.tiles[i] = "house";
      gains.push("+3 hogar");
      msg = "Construiste una casa con materiales reciclados.";
      break;
    case "makeFarm":
      s.tiles[i] = "farm";
      s.meta[i] = { stage: 0 };
      msg = "Preparaste un huerto nuevo.";
      break;
    case "fishRod":
      s.fishStock = Math.max(0, s.fishStock - 5);
      r.food += 2;
      gains.push("+2 comida");
      msg = s.fishStock > 40 ? "Pescaste con calma." : "Pescaste, pero quedan pocos peces.";
      break;
    case "fishNet":
      s.fishStock = Math.max(0, s.fishStock - 25);
      r.food += 6;
      gains.push("+6 comida");
      msg = "La red sacó muchos peces… demasiados.";
      break;
    case "cleanWater":
      s.pollution = Math.max(0, s.pollution - 20);
      r.materials += 1;
      gains.push("+1 material");
      msg = "Limpiaste el agua. ¡Brilla un poco más!";
      break;
    case "sow":
      s.meta[i] = { stage: 1, lastGrowDay: day };
      msg = "Sembraste semillas.";
      break;
    case "sowPesticide":
      s.meta[i] = { stage: 1, lastGrowDay: day, pest: true };
      s.pollution = Math.min(100, s.pollution + 8);
      msg = "Sembraste con pesticida. Crecerá rápido.";
      break;
    case "harvest":
      s.meta[i] = { stage: 0 };
      r.food += 6;
      gains.push("+6 comida");
      msg = "¡Buena cosecha!";
      break;
    case "recycle":
      s.tiles[i] = "grass";
      r.materials += 2;
      gains.push("+2 materiales");
      msg = "Reciclaste los residuos.";
      break;
    case "burn":
      s.tiles[i] = "grass";
      msg = "Quemaste residuos. El humo cubre el valle.";
      break;
    case "dumpRiver":
      s.tiles[i] = "grass";
      s.pollution = Math.min(100, s.pollution + 15);
      msg = "Tiraste la basura al río. El agua se enturbia.";
      break;
    case "talk": {
      const tip = TIPS[(day + x + y) % TIPS.length] ?? TIPS[0]!;
      return { ok: true, message: `Vecina: «${tip}»`, gains: [], delta: 0 };
    }
  }
  nudge(s, delta);
  pushLog(s, msg);
  return { ok: true, message: msg, gains, delta };
}

/** Runs once per in-game day. Deterministic per seed + day so speed never changes outcomes. */
export function processDay(s: GameState, day: number) {
  const rnd = mulberry32(s.seed * 31 + day * 7919);
  const r = s.resources;

  // Community eats
  const need = Math.ceil(s.population / 3);
  r.food -= need;
  if (r.food < 0) {
    r.food = 0;
    nudge(s, 3);
    if (s.population > 2 && rnd() < 0.35) {
      s.population -= 1;
      pushLog(s, "La hambruna se llevó a un vecino…");
    } else pushLog(s, "No hay comida suficiente. La gente pasa hambre.");
  }

  // Families arrive if there is room and food
  if (day % 5 === 0 && r.food > need * 3) {
    if (s.population < capacity(s)) {
      s.population += 1;
      pushLog(s, "Una nueva familia se une a la comunidad.");
    } else {
      nudge(s, 1);
      pushLog(s, "Llegan familias, pero no hay casas para ellas.");
    }
  }

  // Pollution and trash
  const trash = trashCount(s);
  nudge(s, trash * 0.3 + s.pollution * 0.02);
  s.pollution = Math.max(0, s.pollution - 0.5);
  if (rnd() < 0.18 + s.population * 0.015) spawnTrash(s, rnd);

  // Nature
  s.fishStock = Math.min(100, s.fishStock + (s.pollution > 50 ? 0.5 : 2.5));
  const trees = treeCount(s);
  if (trees < s.initialTrees * 0.85) nudge(s, 0.6);
  else if (trees > s.initialTrees * 1.02) nudge(s, -0.3);

  s.tiles.forEach((t, i) => {
    const m = s.meta[i];
    if (t === "sapling" && m?.plantedDay !== undefined && day - m.plantedDay >= 5) {
      s.tiles[i] = "tree";
      s.meta[i] = {};
    }
    if (t === "farm" && m && (m.stage ?? 0) >= 1 && (m.stage ?? 0) < 3) {
      const every = m.pest ? 1 : 3;
      if (day - (m.lastGrowDay ?? day) >= every) {
        m.stage = (m.stage ?? 0) + 1;
        m.lastGrowDay = day;
      }
    }
  });
}

function spawnTrash(s: GameState, rnd: () => number) {
  for (let tries = 0; tries < 20; tries++) {
    const x = 20 + Math.floor(rnd() * 17);
    const y = 12 + Math.floor(rnd() * 13);
    if (tileAt(s, x, y) === "grass" && !(Math.round(s.player.x) === x && Math.round(s.player.y) === y)) {
      s.tiles[idx(s, x, y)] = "trash";
      return;
    }
  }
}

/** Advance the clock; runs daily ticks for every whole day crossed. */
export function tick(s: GameState, realMs: number) {
  if (s.ended || s.paused) return;
  s.dayFloat = advanceDays(s.dayFloat, realMs, s.speed);
  while (s.processedDays < Math.floor(s.dayFloat)) {
    s.processedDays += 1;
    processDay(s, s.processedDays);
  }
  if (s.dayFloat >= TOTAL_DAYS) {
    s.ended = true;
    s.paused = true;
  }
}

export function outcome(meter: number) {
  if (meter <= 20) return { title: "Comunidad sostenible", text: "El valle florece. El agua es clara, la comida abunda y los niños juegan bajo los árboles." };
  if (meter <= 40) return { title: "Comunidad en armonía", text: "Hubo tropiezos, pero la comunidad aprendió a cuidar su hogar." };
  if (meter <= 60) return { title: "Comunidad en la cuerda floja", text: "El valle sobrevive, aunque el equilibrio es frágil." };
  if (meter <= 80) return { title: "Comunidad en declive", text: "El humo y el agua turbia pesan sobre los vecinos. Muchos piensan en marcharse." };
  return { title: "Comunidad catastrófica", text: "La naturaleza se apagó. Hambre, contaminación y silencio llenan el valle." };
}
