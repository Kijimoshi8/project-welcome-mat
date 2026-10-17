import { REGIONS } from "@/lib/data";
import { fmt } from "@/lib/data";

interface Props {
  values: Record<string, number | undefined>;
  selected: string[];
  onSelect: (id: string) => void;
  higherIsBetter: boolean;
}

/** Schematyczna mapa kafelkowa — układ orientacyjny, NIE granice administracyjne. */
export function RegionMap({ values, selected, onSelect, higherIsBetter }: Props) {
  const nums = Object.values(values).filter((v): v is number => v !== undefined);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const W = 150, H = 110, G = 10;
  return (
    <div>
      <svg viewBox={`0 0 ${4 * (W + G)} ${3 * (H + G)}`} className="w-full" role="img" aria-label="Schematyczna mapa regionów">
        {REGIONS.map((r) => {
          const v = values[r.id];
          let t = v === undefined || max === min ? 0.5 : (v - min) / (max - min);
          if (!higherIsBetter) t = 1 - t;
          const on = selected.includes(r.id);
          return (
            <g key={r.id} onClick={() => onSelect(r.id)} className="cursor-pointer" transform={`translate(${r.x * (W + G)},${r.y * (H + G)})`}>
              <rect width={W} height={H} rx={14} fill="var(--primary)" fillOpacity={0.15 + t * 0.85} stroke={on ? "var(--accent)" : "transparent"} strokeWidth={5} />
              <text x={12} y={28} fontSize={15} fontWeight={700} fill={t > 0.55 ? "var(--primary-foreground)" : "var(--foreground)"}>{r.name}</text>
              <text x={12} y={48} fontSize={11} fill={t > 0.55 ? "var(--primary-foreground)" : "var(--muted-foreground)"}>{r.type}</text>
              <text x={12} y={92} fontSize={22} fontWeight={700} fill={t > 0.55 ? "var(--primary-foreground)" : "var(--foreground)"}>{fmt(v)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span>gorzej</span>
        <div className="h-2 w-40 rounded-full bg-gradient-to-r from-primary/15 to-primary" />
        <span>lepiej</span>
        <span className="ml-auto">Mapa schematyczna — nie odwzorowuje granic administracyjnych</span>
      </div>
    </div>
  );
}
