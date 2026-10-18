import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RegionMap } from "@/components/RegionMap";
import { Button } from "@/components/ui/button";
import { selectedRegions, toggleRegion } from "@/lib/region-selection";
import { CATEGORIES, INDICATORS, REGIONS, fmt, fmtPct, pct, type CategoryId } from "@/lib/data";
import { useData } from "@/lib/store";
import { downloadCsv } from "@/lib/csv";

type S = { wskaznik?: string | undefined; kategoria?: CategoryId | undefined; regiony?: string | undefined; od?: number | undefined; do?: number | undefined };

export const Route = createFileRoute("/eksplorator")({
  validateSearch: (s: Record<string, unknown>): S => ({
    wskaznik: typeof s["wskaznik"] === "string" ? s["wskaznik"] : undefined,
    kategoria: typeof s["kategoria"] === "string" ? (s["kategoria"] as CategoryId) : undefined,
    regiony: typeof s["regiony"] === "string" ? s["regiony"] : undefined,
    od: s["od"] ? Number(s["od"]) : undefined,
    do: s["do"] ? Number(s["do"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Eksplorator danych — Płocka eStatystyka" },
      { name: "description", content: "Mapa, filtry i wykresy wskaźników Płocka i okolic." },
      { property: "og:title", content: "Eksplorator danych — Płocka eStatystyka" },
      { property: "og:description", content: "Interaktywna mapa i wykresy wskaźników regionu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorer,
});

export const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const sel = "w-full rounded-md border bg-card px-3 py-2 text-sm";

function Explorer() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/eksplorator" });
  const { get, years } = useData();
  const set = (p: Partial<S>) => navigate({ search: (prev) => ({ ...prev, ...p }) });

  const cat = s.kategoria ?? INDICATORS.find((i) => i.id === s.wskaznik)?.category ?? "demografia";
  const list = INDICATORS.filter((i) => i.category === cat);
  const ind = list.find((i) => i.id === s.wskaznik) ?? list[0] ?? INDICATORS[0];
  if (!ind) throw new Error("Brak wskaźników");
  const regions = selectedRegions(s.regiony);
  const y1 = s.od ?? years[0] ?? 2015, y2 = s.do ?? years[years.length - 1] ?? 2024;

  const toggle = (id: string) => {
    set({ regiony: toggleRegion(regions, id) });
  };

  const lineData = years.filter((y) => y >= Math.min(y1, y2) && y <= Math.max(y1, y2)).map((y) => {
    const o: Record<string, number | undefined> = { year: y };
    regions.forEach((r) => (o[r] = get(r, ind.id, y)));
    return o;
  });
  const mapVals = Object.fromEntries(REGIONS.map((r) => [r.id, get(r.id, ind.id, y2)]));
  const table = REGIONS.map((r) => {
    const a = get(r.id, ind.id, y1), b = get(r.id, ind.id, y2);
    return { r, a, b, d: a !== undefined && b !== undefined ? b - a : undefined, p: pct(a, b) };
  }).sort((x, z) => (z.p ?? -1e9) - (x.p ?? -1e9));
  const name = (id: string) => REGIONS.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Eksplorator danych</h1>
      <div className="mt-6 grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-4">
        <label className="text-sm font-medium">Kategoria
          <select className={sel} value={cat} onChange={(e) => set({ kategoria: e.target.value as CategoryId, wskaznik: undefined })}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Wskaźnik
          <select className={sel} value={ind.id} onChange={(e) => set({ wskaznik: e.target.value })}>
            {list.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Rok początkowy
          <select className={sel} value={y1} onChange={(e) => set({ od: Number(e.target.value) })}>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Rok końcowy
          <select className={sel} value={y2} onChange={(e) => set({ do: Number(e.target.value) })}>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
        <div className="md:col-span-4">
          <p className="text-sm font-medium"><b>Regiony na wykresie (max 5) — kliknij też na mapie</b></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <Button key={r.id} variant={regions.includes(r.id) ? "default" : "outline"} aria-pressed={regions.includes(r.id)} onClick={() => toggle(r.id)} className="h-auto rounded-full px-3 py-1 text-sm">{r.name}</Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Mapa: {ind.name} ({y2})</h2>
          <div className="mt-4"><RegionMap values={mapVals} selected={regions} onSelect={toggle} higherIsBetter={ind.higherIsBetter} /></div>
        </section>
        <section className="rounded-2xl border bg-card p-5 lg:col-span-3">
          <h2 className="font-display text-lg font-bold">Trend: {ind.name} [{ind.unit}]</h2>
          <div className="mt-4 h-80">
            {regions.length === 0 ? <div role="status" className="flex h-full items-center justify-center text-sm text-muted-foreground">Nie wybrano regionów</div> : <ResponsiveContainer>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => fmt(v)} width={64} domain={["auto", "auto"]} />
                <Tooltip formatter={(v, n) => [fmt(Number(v)), name(String(n))]} />
                <Legend formatter={(v) => name(String(v))} />
                {regions.map((r, i) => <Line key={r} dataKey={r} stroke={COLORS[i % 5] ?? "var(--chart-1)"} strokeWidth={3} dot={{ r: 3 }} />)}
              </LineChart>
            </ResponsiveContainer>}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Zmiana {y1} → {y2} we wszystkich regionach (%)</h2>
        <div className="mt-4 overflow-x-auto">
          <div className="h-72 min-w-[640px]"><ResponsiveContainer>
            <BarChart margin={{ top: 28, right: 20, bottom: 20, left: 8 }} data={table.map((t) => ({ name: t.r.name, p: t.p !== undefined ? Number(t.p.toFixed(2)) : undefined }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" interval={0} fontSize={11} angle={-20} textAnchor="end" height={48} />
              <YAxis unit="%" padding={{ top: 20, bottom: 20 }} />
              <Tooltip formatter={(v) => fmtPct(Number(v))} />
              <Bar dataKey="p" name="Zmiana" radius={[6, 6, 0, 0]}>
                {table.map((t) => <Cell key={t.r.id} fill={(t.p ?? 0) > 0 === ind.higherIsBetter ? "var(--success)" : "var(--destructive)"} />)}
                <LabelList dataKey="p" position="top" offset={8} fill="var(--foreground)" fontSize={12} fontWeight={600} formatter={(value) => value === undefined ? "" : fmtPct(Number(value))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Tabela wyników</h2>
          <button onClick={() => downloadCsv(`plock-${ind.id}-${y1}-${y2}.csv`, ["Region", `${ind.name} ${y1}`, `${ind.name} ${y2}`, "Zmiana", "Zmiana %"], table.map((t) => [t.r.name, t.a, t.b, t.d !== undefined ? Number(t.d.toFixed(2)) : undefined, t.p !== undefined ? Number(t.p.toFixed(2)) : undefined]))} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Eksport CSV</button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Region</th><th className="text-right">{y1}</th><th className="text-right">{y2}</th><th className="text-right">Zmiana</th><th className="text-right">Zmiana %</th></tr></thead>
            <tbody>
              {table.map((t) => (
                <tr key={t.r.id} className="border-t">
                  <td className="py-2 font-medium">{t.r.name}</td>
                  <td className="text-right">{fmt(t.a)}</td>
                  <td className="text-right">{fmt(t.b)}</td>
                  <td className="text-right">{t.d !== undefined ? (t.d > 0 ? "+" : "") + fmt(t.d) : "—"}</td>
                  <td className={`text-right font-semibold ${(t.p ?? 0) > 0 === ind.higherIsBetter ? "text-success" : "text-destructive"}`}>{fmtPct(t.p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
