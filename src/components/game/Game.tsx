import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GameEngine, type HudSnapshot } from "@/game/engine";
import { newGame, outcome } from "@/game/rules";
import { clearSave, loadGame } from "@/game/save";
import type { Dir } from "@/game/types";
import { BalanceMeter } from "./BalanceMeter";
import { ActionPanel, ClockBar, LogPanel, ResourcePanel } from "./Hud";
import { PixelButton } from "./PixelButton";

const EMPTY = () => () => {};

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [started, setStarted] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  // Boot: load the autosave (or a fresh valley) behind the title screen
  useEffect(() => {
    const saved = loadGame();
    setHasSave(!!saved && !saved.ended);
    const e = new GameEngine(saved && !saved.ended ? saved : newGame());
    e.frozen = true;
    setEngine(e);
  }, []);

  useEffect(() => {
    if (!engine || !canvasRef.current) return;
    engine.attach(canvasRef.current);
    return () => engine.detach();
  }, [engine]);

  const snap = useSyncExternalStore(
    engine?.subscribe ?? EMPTY,
    () => engine?.getSnapshot() ?? null,
    () => null,
  );

  const start = useCallback(
    (fresh: boolean) => {
      if (!engine) return;
      if (fresh) {
        clearSave();
        const e = new GameEngine(newGame());
        setEngine(e);
      } else {
        engine.frozen = false;
        engine.save();
      }
      setStarted(true);
    },
    [engine],
  );

  // Unfreeze a freshly created engine once the game has started
  useEffect(() => {
    if (engine && started && engine.frozen) {
      engine.frozen = false;
      engine.save();
    }
  }, [engine, started]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-3 p-3 sm:p-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-wide text-accent [text-shadow:2px_2px_0_var(--color-ink)] sm:text-3xl">Valle Equilibrio</h1>
        {started && <p className="hidden text-sm text-foreground/70 md:block">Flechas / WASD para moverte · números o E para actuar · P pausa</p>}
      </header>

      {snap && <BalanceMeter meter={snap.meter} />}
      {snap && started && <ClockBar snap={snap} onSpeed={(s) => engine?.setSpeed(s)} onPause={() => engine?.togglePause()} />}

      <div className="grid flex-1 gap-3 lg:grid-cols-[1fr_17rem]">
        <div className="flex flex-col gap-3">
          <div className="pixel-frame relative m-2 overflow-hidden bg-ink">
            <canvas ref={canvasRef} className="pixelated block aspect-[5/3] w-full" aria-label="Mundo de Valle Equilibrio" />
            {snap?.toast && started && (
              <div className="animate-pop pixel-panel absolute left-1/2 top-3 max-w-[90%] -translate-x-1/2 px-3 py-1.5 text-center text-sm">{snap.toast}</div>
            )}
            {snap?.paused && started && !snap.ended && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                <span className="pixel-panel px-4 py-2 text-xl">En pausa</span>
              </div>
            )}
            {!started && <TitleScreen hasSave={hasSave} ready={!!engine} onStart={start} />}
            {snap?.ended && started && <EndScreen snap={snap} onRestart={() => start(true)} />}
          </div>
          {snap && started && <ActionPanel snap={snap} onAction={(id) => engine?.doAction(id)} />}
          {started && engine && <DPad engine={engine} />}
        </div>
        {snap && started && (
          <aside className="flex flex-col gap-3">
            <ResourcePanel snap={snap} />
            <LogPanel log={snap.log} />
          </aside>
        )}
      </div>
    </div>
  );
}

function TitleScreen({ hasSave, ready, onStart }: { hasSave: boolean; ready: boolean; onStart: (fresh: boolean) => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink/55 p-3">
      <div className="animate-pop pixel-panel max-h-full max-w-lg overflow-auto p-4 text-center sm:p-6">
        <h2 className="text-3xl font-bold text-secondary sm:text-4xl">Valle Equilibrio</h2>
        <p className="mt-2 text-sm leading-snug sm:text-base">
          La humanidad acaba de asentarse en este valle. Tala, pesca, construye y siembra… pero cada decisión inclina a la comunidad hacia la armonía o hacia el caos.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Sobrevive 100 días y llega lo más cerca posible de <b className="text-primary">Comunidad sostenible</b>.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {hasSave && (
            <PixelButton variant="good" size="lg" disabled={!ready} onClick={() => onStart(false)}>
              Continuar
            </PixelButton>
          )}
          <PixelButton variant={hasSave ? "parchment" : "good"} size="lg" disabled={!ready} onClick={() => onStart(true)}>
            Nueva partida
          </PixelButton>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Tu progreso se guarda automáticamente.</p>
      </div>
    </div>
  );
}

function EndScreen({ snap, onRestart }: { snap: HudSnapshot; onRestart: () => void }) {
  const o = outcome(snap.meter);
  const sustainable = Math.round(100 - snap.meter);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink/55 p-3">
      <div className="animate-pop pixel-panel max-h-full max-w-md overflow-auto p-5 text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Día 100 · Fin del viaje</div>
        <h2 className="mt-1 text-3xl font-bold text-secondary">{o.title}</h2>
        <p className="mt-2 text-sm">{o.text}</p>
        <div className="mt-3 text-4xl font-bold text-primary">{sustainable}%</div>
        <div className="text-xs text-muted-foreground">sostenible</div>
        <div className="mt-2 text-sm">
          {snap.population} vecinos · {snap.food} comida · agua {snap.waterPurity}% limpia
        </div>
        <PixelButton className="mt-4" variant="good" size="lg" onClick={onRestart}>
          Jugar otra vez
        </PixelButton>
      </div>
    </div>
  );
}

function DPad({ engine }: { engine: GameEngine }) {
  const btn = (d: Dir, label: string, area: string) => (
    <PixelButton
      size="icon"
      variant="wood"
      className={area}
      aria-label={`Mover ${label}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        engine.pressDir(d, true);
      }}
      onPointerUp={() => engine.pressDir(d, false)}
      onPointerCancel={() => engine.pressDir(d, false)}
    >
      {{ up: "▲", down: "▼", left: "◀", right: "▶" }[d]}
    </PixelButton>
  );
  return (
    <div className="grid w-max grid-cols-3 grid-rows-2 gap-1 self-center touch-none lg:hidden">
      {btn("up", "arriba", "col-start-2")}
      {btn("left", "izquierda", "col-start-1 row-start-2")}
      {btn("down", "abajo", "col-start-2 row-start-2")}
      {btn("right", "derecha", "col-start-3 row-start-2")}
    </div>
  );
}
