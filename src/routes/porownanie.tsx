import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, INDICATORS, REGIONS, fmt, fmtPct, pct } from "@/lib/data";
import { useData } from "@/lib/store";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/porownanie")({
  head: () => ({
    meta: [
      { title: "Porównanie regionów — Płock w liczbach" },
      { name: "description", content: "Porównaj dwa regiony: różnice liczbowe i procentowe dla wszystkich wskaźników." },
      { property: "og:title", content: "Porównanie regionów — Płock w liczbach" },
      { property: "og:description", content: "Różnice liczbowe i procentowe między regionami." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Compare,
});

const sel = "w-full rounded-md border bg-card px-3 py-2 text-sm";

function Compare() {
  const { get, years } = useData();
  const [a, setA] = useState("plock");
  const [b, setB] = useState("gostynin");
  const [y1, setY1] = useState(years[0] ?? 2015);
  const [y2, setY2] = useState(years[years.length - 1] ?? 2024);
  const [cat, setCat] = useState<string>("all");
  const [focus, setFocus] = useState("wynagrodzenie");
  const na = REGIONS.find((r) => r.id === a)?.name ?? a, nb = REGIONS.find((r) => r.id === b)?.name ?? b;

  const rows = INDICATORS.filter((i) => cat === "all" || i.category === cat).map((i) => {
    const a1 = get(a, i.id, y1), a2 = get(a, i.id, y2), b1 = get(b, i.id, y1), b2 = get(b, i.id, y2);
    const pa = pct(a1, a2), pb = pct(b1, b2);
    return { i, a2, b2, diff: a2 !== undefined && b2 !== undefined ? a2 - b2 : undefined, diffPct: pct(b2, a2), pa, pb };
  });
  const fi = INDICATORS.find((i) => i.id === focus);
  const focusData = [y1, y2].map((y) => ({ rok: String(y), [na]: get(a, focus, y), [nb]: get(b, focus, y) }));
  const dynData = rows.map((r) => ({ name: r.i.name, [na]: r.pa !== undefined ? Number(r.pa.toFixed(2)) : 0, [nb]: r.pb !== undefined ? Number(r.pb.toFixed(2)) : 0 }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Porównanie regionów</h1>
      <div className="mt-6 grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm font-medium">Region A
          <select className={sel} value={a} onChange={(e) => setA(e.target.value)}>{REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        </label>
        <label className="text-sm font-medium">Region B
          <select className={sel} value={b} onChange={(e) => setB(e.target.value)}>{REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        </label>
        <label className="text-sm font-medium">Rok 1
          <select className={sel} value={y1} onChange={(e) => setY1(Number(e.target.value))}>{years.map((y) => <option key={y}>{y}</option>)}</select>
        </label>
        <label className="text-sm font-medium">Rok 2
          <select className={sel} value={y2} onChange={(e) => setY2(Number(e.target.value))}>{years.map((y) => <option key={y}>{y}</option>)}</select>
        </label>
        <label className="text-sm font-medium">Kategoria
          <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">Wszystkie</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Wartości: {y1} vs {y2}</h2>
            <select className="rounded-md border bg-card px-2 py-1 text-sm" value={focus} onChange={(e) => setFocus(e.target.value)}>
              {INDICATORS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer>
              <BarChart data={focusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="rok" />
                <YAxis tickFormatter={(v) => fmt(v)} width={64} />
                <Tooltip formatter={(v) => `${fmt(Number(v))} ${fi?.unit ?? ""}`} />
                <Legend />
                <Bar dataKey={na} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey={nb} fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Dynamika zmian {y1} → {y2} (%)</h2>
            <div className="flex gap-4 text-sm">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 bg-[var(--chart-1)]" />{na}</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 bg-[var(--chart-2)]" />{nb}</span>
            </div>
          </div>
          <div className="mt-4 h-80 overflow-y-auto overflow-x-hidden rounded-md border" tabIndex={0} aria-label="Dynamika zmian według wskaźników">
            <ResponsiveContainer width="100%" height={Math.max(320, rows.length * 54 + 64)}>
              <BarChart data={dynData} layout="vertical" margin={{ left: 8, right: 72, top: 16, bottom: 16 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" unit="%" />
                <YAxis type="category" dataKey="name" width={170} fontSize={11} interval={0} />
                <Tooltip formatter={(v) => fmtPct(Number(v))} />
                <Bar dataKey={na} fill="var(--chart-1)" />
                <Bar dataKey={nb} fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{na} vs {nb} w roku {y2}</h2>
          <button onClick={() => downloadCsv(`porownanie-${a}-${b}-${y1}-${y2}.csv`, ["Wskaźnik", "Jednostka", `${na} ${y2}`, `${nb} ${y2}`, "Różnica A−B", "Różnica %", `Zmiana ${na} %`, `Zmiana ${nb} %`], rows.map((r) => [r.i.name, r.i.unit, r.a2, r.b2, r.diff !== undefined ? Number(r.diff.toFixed(2)) : undefined, r.diffPct !== undefined ? Number(r.diffPct.toFixed(2)) : undefined, r.pa !== undefined ? Number(r.pa.toFixed(2)) : undefined, r.pb !== undefined ? Number(r.pb.toFixed(2)) : undefined]))} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Eksport CSV</button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2">Wskaźnik</th><th className="text-right">{na}</th><th className="text-right">{nb}</th><th className="text-right">Różnica</th><th className="text-right">Różnica %</th><th className="text-right">Zmiana {na}</th><th className="text-right">Zmiana {nb}</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const aBetter = r.diff !== undefined && (r.diff > 0) === r.i.higherIsBetter;
                return (
                  <tr key={r.i.id} className="border-t">
                    <td className="py-2 font-medium">{r.i.name} <span className="text-muted-foreground">[{r.i.unit}]</span></td>
                    <td className="text-right">{fmt(r.a2)}</td>
                    <td className="text-right">{fmt(r.b2)}</td>
                    <td className={`text-right font-semibold ${aBetter ? "text-success" : "text-destructive"}`}>{r.diff !== undefined ? (r.diff > 0 ? "+" : "") + fmt(r.diff) : "—"}</td>
                    <td className="text-right">{fmtPct(r.diffPct)}</td>
                    <td className="text-right">{fmtPct(r.pa)}</td>
                    <td className="text-right">{fmtPct(r.pb)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Kolor różnicy: zielony — region A wypada lepiej (uwzględnia kierunek wskaźnika). Dane przykładowe.</p>
      </section>
    </div>
  );
}
