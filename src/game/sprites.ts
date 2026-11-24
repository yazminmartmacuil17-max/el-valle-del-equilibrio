import type { PaletteKey } from "./palette";

export type Sprite = string[];

export const KEYMAP: Record<string, PaletteKey> = {
  o: "outline",
  L: "leaf",
  l: "leafLight",
  d: "leafDark",
  T: "trunk",
  t: "trunkLight",
  f: "fruit",
  R: "roof",
  r: "roofDark",
  W: "wall",
  w: "wallDark",
  G: "window",
  D: "trunk",
  K: "trash",
  k: "trashDark",
  B: "bottle",
  Y: "can",
  X: "bag",
  h: "hair",
  s: "skin",
  S: "shirt",
  P: "pants",
  b: "boots",
  e: "eye",
  g: "rock",
  q: "rockDark",
};

export const TREE: Sprite = [
  "......oooo......",
  "....oolllloo....",
  "...olllLLLLLo...",
  "..ollLLLLLLLLo..",
  "..olLLLLLLLLLo..",
  ".olLLLLLLLLLLdo.",
  ".oLLLLLLLLLLLdo.",
  ".oLLLLLLLLLLLdo.",
  ".odLLLLLLLLLddo.",
  "..odLLLLLLLddo..",
  "..oddLLLLdddo...",
  "...ooddddooo....",
  "......oTTo......",
  "......oTTo......",
  ".....oTTTTo.....",
  "......oooo......",
];

export const FRUIT_SPOTS: [number, number][] = [
  [5, 4],
  [9, 6],
  [11, 8],
  [6, 8],
];

export const DEAD_TREE: Sprite = [
  "................",
  "...o.......o....",
  "....T.....T..o..",
  "..o..T...T..T...",
  "...T..T.T..T....",
  "....T.TTT.T.....",
  ".....TTTTT......",
  "......TTT.......",
  "......oTTo......",
  "......oTTo......",
  "......oTTo......",
  "......oTTo......",
  "......oTTo......",
  "......oTTo......",
  ".....oTTTTo.....",
  "......oooo......",
];

export const STUMP: Sprite = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  ".....oooooo.....",
  "....otttttto....",
  "....otTTTTto....",
  "....oTTTTTTo....",
  "....oTTTTTTo....",
  ".....oooooo.....",
  "................",
];

export const SAPLING: Sprite = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "......oo........",
  ".....olLo.oo....",
  ".....oLLooLlo...",
  "......oLTLLo....",
  ".......oTo......",
  ".......oTo......",
  ".......oTo......",
  "......oTTTo.....",
  ".......ooo......",
  "................",
];

export const HOUSE: Sprite = [
  "..........oo....",
  ".......oo.oTo...",
  "......oRRooTo...",
  ".....oRRRRoTo...",
  "....oRRRRRRo....",
  "...oRRRRRRRRo...",
  "..oRRRRRRRRRRo..",
  ".orrrrrrrrrrrro.",
  "..oWWWWWWWWWWo..",
  "..oWGGWWWWGGWo..",
  "..oWGGWWWWGGWo..",
  "..oWWWWDDWWWWo..",
  "..oWWWWDDWWWWo..",
  "..owwwwDDwwwwo..",
  "..oooooooooooo..",
  "................",
];

export const TRASH: Sprite = [
  "................",
  "................",
  "................",
  "................",
  ".......oo.......",
  "......oXXo......",
  ".....oXXXXo.oo..",
  "....oXXXXXXoBo..",
  "...ooXXXXXXoBo..",
  "..oKKoXXXXoBBBo.",
  ".oKKkKooooKBBBo.",
  ".oKkKKKKYYoKBBo.",
  ".oKKKKKoYYoKKKo.",
  ".okkkkkkooKkkko.",
  "..oooooooooooo..",
  "................",
];

export const ROCK: Sprite = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  ".....oooooo.....",
  "....oggggggo....",
  "...ogggggggqo...",
  "..ogggggggqqo...",
  "..ogggggqqqqqo..",
  "..oqqqqqqqqqqo..",
  "...oooooooooo...",
  "................",
  "................",
];

const BODY_A = [
  ".....oSSSSo.....",
  "....oSSSSSSo....",
  "...osSSSSSSso...",
  "...osSSSSSSso...",
  "....oPPPPPPo....",
  "....oPPooPPo....",
  "....oPo..oPo....",
  "....obo..obo....",
  "....ooo..ooo....",
];
const BODY_B = [
  ".....oSSSSo.....",
  "....oSSSSSSo....",
  "...osSSSSSSso...",
  "...osSSSSSSso...",
  "....oPPPPPPo....",
  "....oPPooPPo....",
  "....oPo..oPo....",
  "....obo..ooo....",
  "....ooo.........",
];

const HEAD_DOWN = [
  "................",
  ".....oooooo.....",
  "....ohhhhhho....",
  "...ohhhhhhhho...",
  "...ohssssssho...",
  "...osesssseso...",
  "....osssssso....",
];
const HEAD_UP = [
  "................",
  ".....oooooo.....",
  "....ohhhhhho....",
  "...ohhhhhhhho...",
  "...ohhhhhhhho...",
  "...ohhhhhhhho...",
  "....ohhhhhho....",
];
const HEAD_RIGHT = [
  "................",
  ".....oooooo.....",
  "....ohhhhhho....",
  "...ohhhhhhhho...",
  "...ohhhhhssso...",
  "...ohhhhsseso...",
  "....ohhsssso....",
];
const SIDE_A = [
  ".....oSSSSo.....",
  "....oSSSSSSo....",
  "....oSSsSSSo....",
  "....oSSsSSSo....",
  "....oPPPPPPo....",
  ".....oPPPPo.....",
  ".....oPooPo.....",
  ".....obo.obo....",
  ".....ooo.ooo....",
];
const SIDE_B = [
  ".....oSSSSo.....",
  "....oSSSSSSo....",
  "....oSSSsSSo....",
  "....oSSSsSSo....",
  "....oPPPPPPo....",
  ".....oPPPPo.....",
  "......oPPo......",
  "......obbo......",
  "......oooo......",
];

const mirror = (s: Sprite): Sprite => s.map((r) => r.split("").reverse().join(""));

export const CHAR = {
  down: [[...HEAD_DOWN, ...BODY_A], [...HEAD_DOWN, ...BODY_B]] as Sprite[],
  up: [[...HEAD_UP, ...BODY_A], [...HEAD_UP, ...BODY_B]] as Sprite[],
  right: [[...HEAD_RIGHT, ...SIDE_A], [...HEAD_RIGHT, ...SIDE_B]] as Sprite[],
  left: [mirror([...HEAD_RIGHT, ...SIDE_A]), mirror([...HEAD_RIGHT, ...SIDE_B])] as Sprite[],
};
