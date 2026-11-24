export type Tile =
  | "grass"
  | "water"
  | "tree"
  | "stump"
  | "sapling"
  | "house"
  | "farm"
  | "trash"
  | "rock"
  | "path"
  | "sand";

export type Dir = "up" | "down" | "left" | "right";
export type Speed = 1 | 2 | 4;

export interface TileMeta {
  plantedDay?: number;
  stage?: number; // farm: 0 empty, 1-2 growing, 3 ripe
  pest?: boolean;
  fruitDay?: number;
  lastGrowDay?: number;
}

export interface Resources {
  wood: number;
  food: number;
  materials: number;
}

export interface GameState {
  version: 1;
  seed: number;
  width: number;
  height: number;
  tiles: Tile[];
  meta: Record<number, TileMeta>;
  dayFloat: number; // elapsed in-game days, 0..100
  processedDays: number; // whole days whose daily tick already ran
  meter: number; // 0 = Comunidad sostenible, 100 = Comunidad catastrófica
  speed: Speed;
  paused: boolean;
  player: { x: number; y: number; dir: Dir };
  resources: Resources;
  population: number;
  pollution: number; // 0..100 water pollution
  fishStock: number; // 0..100
  log: string[];
  ended: boolean;
  initialTrees: number;
}

export type ActionId =
  | "chop"
  | "fruit"
  | "replant"
  | "plantTree"
  | "buildHouse"
  | "buildRecycledHouse"
  | "makeFarm"
  | "fishRod"
  | "fishNet"
  | "cleanWater"
  | "sow"
  | "sowPesticide"
  | "harvest"
  | "recycle"
  | "burn"
  | "dumpRiver"
  | "talk";

export interface ActionOption {
  id: ActionId;
  label: string;
  /** Expected meter change: negative = toward sostenible */
  delta: number;
  enabled: boolean;
  reason?: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  gains: string[];
  delta: number;
}
