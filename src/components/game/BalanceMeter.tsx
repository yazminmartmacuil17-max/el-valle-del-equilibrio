interface Props {
  meter: number; // 0 sostenible … 100 catastrófica
}

export function BalanceMeter({ meter }: Props) {
  const pos = Math.max(0, Math.min(100, meter));
  const sustainable = Math.round(100 - pos);
  const catastrophic = 100 - sustainable;
  const leaning = pos < 45 ? "Inclinación sostenible" : pos > 55 ? "Inclinación catastrófica" : "En equilibrio";

  return (
    <div className="pixel-panel px-3 pb-3 pt-2" role="meter" aria-label="Medidor de equilibrio" aria-valuemin={0} aria-valuemax={100} aria-valuenow={sustainable} aria-valuetext={`${sustainable}% sostenible, ${catastrophic}% catastrófica`}>
      <div className="mb-1 flex items-end justify-between gap-2 text-sm sm:text-base">
        <span className="font-semibold text-primary [text-shadow:1px_1px_0_var(--color-ink)]">🌿 Comunidad sostenible</span>
        <span className="hidden text-xs uppercase tracking-wider text-muted-foreground sm:inline">{leaning}</span>
        <span className="font-semibold text-catastrophe">Comunidad catastrófica 💀</span>
      </div>
      <div className="relative pt-4">
        <div
          className="absolute top-0 -translate-x-1/2 transition-[left] duration-700 ease-out"
          style={{ left: `${Math.min(94, Math.max(6, pos))}%` }}
          aria-hidden
        >
          <div className="animate-bob flex flex-col items-center">
            <span className="mb-0.5 whitespace-nowrap border-2 border-ink bg-card px-1 text-base font-medium leading-tight text-card-foreground">
              {pos <= 50 ? `${sustainable}% sost.` : `${catastrophic}% catast.`}
            </span>
            <svg width="14" height="10" viewBox="0 0 7 5" className="pixelated">
              <path d="M0 0h7v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1z" className="fill-ink" />
              <path d="M1 0h5v1h-1v1h-1v1h-1v-1h-1v-1h-1z" className="fill-accent" />
            </svg>
          </div>
        </div>
        <div className="meter-track relative mt-5 h-5 border-[3px] border-ink">
          {[25, 50, 75].map((m) => (
            <span key={m} className="absolute top-0 h-full w-[3px] bg-ink/40" style={{ left: `${m}%` }} />
          ))}
          <span
            className="absolute top-[-3px] h-[calc(100%+6px)] w-[4px] -translate-x-1/2 bg-ink transition-[left] duration-700 ease-out"
            style={{ left: `${pos}%` }}
          />
        </div>
      </div>
    </div>
  );
}
