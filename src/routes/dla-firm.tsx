import { createFileRoute, Link } from "@tanstack/react-router";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { INDICATORS, REGIONS, fmt } from "@/lib/data";
import { useData } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/dla-firm")({
  head: () => ({
    meta: [
      { title: "Dla firm — Płocka eStatystyka" },
      { name: "description", content: "Wskaźniki inwestycyjne i potencjał gospodarczy Płocka i okolic." },
      { property: "og:title", content: "Dla firm — Płocka eStatystyka" },
      { property: "og:description", content: "Gdzie zainwestować? Ranking atrakcyjności regionów." },
    ],
  }),
  component: Business,
});

const KEYS = ["firmy", "wynagrodzenie", "bezrobocie", "drogi", "przedszkola", "mieszkania"];

function Business() {
  const { get, years } = useData();
  const y = years[years.length - 1] ?? 2024;
  const [r, setR] = useState("plock");
  const score = (reg: string, id: string) => {
    const ind = INDICATORS.find((i) => i.id === id)!;
    const vals = REGIONS.map((x) => get(x.id, id, y) ?? 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    const t = max === min ? 0.5 : ((get(reg, id, y) ?? 0) - min) / (max - min);
    return Math.round((ind.higherIsBetter ? t : 1 - t) * 100);
  };
  const ranking = REGIONS.map((x) => ({ x, s: Math.round(KEYS.reduce((a, k) => a + score(x.id, k), 0) / KEYS.length) })).sort((a, b) => b.s - a.s);
  const radar = KEYS.map((k) => ({ k: INDICATORS.find((i) => i.id === k)!.name, v: score(r, k) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="hero-surface rounded-3xl p-8">
        <h1 className="font-display text-4xl font-bold text-primary-foreground">Dla firm</h1>
        <p className="mt-3 max-w-2xl text-primary-foreground/80">Indeks atrakcyjności inwestycyjnej ({y}) łączy sześć wskaźników: przedsiębiorczość, płace, bezrobocie, infrastrukturę, opiekę przedszkolną i budownictwo. Skala 0–100 względem pozostałych regionów.</p>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Ranking regionów</h2>
          <ol className="mt-4 space-y-2">
            {ranking.map(({ x, s }, i) => (
              <li key={x.id}>
                <button onClick={() => setR(x.id)} className={`flex w-full items-center gap-3 rounded-lg p-2 text-left ${r === x.id ? "bg-secondary" : "hover:bg-secondary/60"}`}>
                  <span className="w-6 font-bold text-muted-foreground">{i + 1}.</span>
                  <span className="w-36 font-medium">{x.name}</span>
                  <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${s}%` }} /></span>
                  <span className="w-10 text-right font-bold">{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Profil: {REGIONS.find((x) => x.id === r)!.name}</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <RadarChart data={radar} outerRadius="70%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="k" fontSize={11} />
                <Tooltip />
                <Radar dataKey="v" name="Wynik" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {KEYS.map((k) => { const ind = INDICATORS.find((i) => i.id === k)!; return (
              <div key={k} className="rounded-lg bg-muted p-3"><dt className="text-muted-foreground">{ind.name}</dt><dd className="font-bold">{fmt(get(r, k, y))} {ind.unit}</dd></div>
            ); })}
          </dl>
          <Link to="/porownanie" className="mt-4 inline-block font-semibold text-primary underline">Porównaj z innym regionem →</Link>
        </section>
      </div>
    </div>
  );
}
