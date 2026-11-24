import { Pause, Play } from "lucide-react";
import type { HudSnapshot } from "@/game/engine";
import { TOTAL_DAYS, SPEEDS } from "@/game/rules";
import type { ActionId, Speed } from "@/game/types";
import { PixelButton } from "./PixelButton";

export function ClockBar({ snap, onSpeed, onPause }: { snap: HudSnapshot; onSpeed: (s: Speed) => void; onPause: () => void }) {
  const overall = ((snap.day - 1 + snap.dayProgress) / TOTAL_DAYS) * 100;
  return (
    <div className="pixel-panel flex flex-wrap items-center gap-3 px-3 py-2">
      <div className="min-w-[7.5rem]">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Día</div>
        <div className="text-2xl font-bold leading-none">
          {snap.day}
          <span className="text-base text-muted-foreground"> / {TOTAL_DAYS}</span>
        </div>
      </div>
      <div className="min-w-[8rem] flex-1">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{dayPhase(snap.dayProgress)}</span>
          <span>{Math.round(overall)}% del viaje</span>
        </div>
        <div className="h-3 border-2 border-ink bg-muted">
          <div className="h-full bg-accent" style={{ width: `${overall}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5" role="group" aria-label="Velocidad del tiempo">
        <PixelButton size="icon" variant="wood" onClick={onPause} aria-label={snap.paused ? "Reanudar" : "Pausar"} disabled={snap.ended}>
          {snap.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </PixelButton>
        {SPEEDS.map((sp) => (
          <PixelButton key={sp} size="sm" variant={snap.speed === sp && !snap.paused ? "gold" : "parchment"} active={snap.speed === sp && !snap.paused} onClick={() => onSpeed(sp)} disabled={snap.ended} aria-label={`Velocidad x${sp}`}>
            x{sp}
          </PixelButton>
        ))}
      </div>
    </div>
  );
}

function dayPhase(p: number) {
  if (p < 0.25) return "☀ Mañana";
  if (p < 0.5) return "☀ Mediodía";
  if (p < 0.75) return "◐ Tarde";
  return "☾ Anochecer";
}

export function ResourcePanel({ snap }: { snap: HudSnapshot }) {
  const items = [
    { icon: "🪵", label: "Madera", value: snap.wood },
    { icon: "🍎", label: "Comida", value: snap.food, warn: snap.food < Math.ceil(snap.population / 3) * 2 },
    { icon: "♻", label: "Materiales", value: snap.materials },
    { icon: "🏠", label: "Vecinos", value: `${snap.population}/${snap.capacity}`, warn: snap.population >= snap.capacity },
    { icon: "💧", label: "Agua limpia", value: `${snap.waterPurity}%`, warn: snap.waterPurity < 60 },
    { icon: "🐟", label: "Peces", value: `${snap.fishStock}%`, warn: snap.fishStock < 30 },
  ];
  return (
    <div className="pixel-panel grid grid-cols-3 gap-x-3 gap-y-2 p-3 lg:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>{it.icon}</span>
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{it.label}</div>
            <div className={it.warn ? "font-bold text-destructive" : "font-bold"}>{it.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActionPanel({ snap, onAction }: { snap: HudSnapshot; onAction: (id: ActionId) => void }) {
  return (
    <div className="pixel-panel min-h-[4.5rem] p-2.5">
      <div className="mb-1.5 text-xs uppercase tracking-wider text-muted-foreground">Acciones</div>
      {snap.actions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Acércate a un árbol, el agua, un huerto, una casa o un montón de basura.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {snap.actions.map((a, i) => (
            <PixelButton
              key={a.id}
              size="md"
              variant={a.delta < 0 ? "good" : a.delta > 0 ? "bad" : "parchment"}
              disabled={!a.enabled}
              title={a.reason}
              onClick={() => onAction(a.id)}
            >
              <span className="border-2 border-current px-1 text-xs opacity-80">{i + 1}</span>
              {a.label}
              {a.delta !== 0 && <span className="text-xs opacity-90">{a.delta < 0 ? "◀" : "▶"}</span>}
            </PixelButton>
          ))}
        </div>
      )}
      {snap.actions.some((a) => !a.enabled && a.reason) && (
        <p className="mt-1.5 text-xs text-muted-foreground">{snap.actions.find((a) => !a.enabled)?.reason}</p>
      )}
    </div>
  );
}

export function LogPanel({ log }: { log: string[] }) {
  return (
    <div className="pixel-panel p-3">
      <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Diario del valle</div>
      <ul className="space-y-1 text-sm leading-snug">
        {log.slice(0, 5).map((l, i) => (
          <li key={`${l}-${i}`} className={i === 0 ? "" : "text-muted-foreground"}>
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
