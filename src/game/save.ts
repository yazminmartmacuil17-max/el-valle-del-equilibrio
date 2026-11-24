import type { GameState } from "./types";

const KEY = "valle-equilibrio-save-v1";

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 1 && Array.isArray(s.tiles) ? s : null;
  } catch {
    return null;
  }
}

export function saveGame(s: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or unavailable */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
