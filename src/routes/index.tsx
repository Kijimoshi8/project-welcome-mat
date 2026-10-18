import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, INDICATORS, fmt, fmtPct, pct } from "@/lib/data";
import { useData } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Płock w liczbach — statystyki regionu" },
      { name: "description", content: "Najważniejsze wskaźniki rozwoju Płocka i okolic w jednym miejscu." },
      { property: "og:title", content: "Płock w liczbach" },
      { property: "og:description", content: "Analizuj i porównuj statystyki Płocka i okolic." },
    ],
  }),
  component: Home,
});

const KEY = ["ludnosc", "wynagrodzenie", "bezrobocie", "pm10", "rowery", "mieszkania"];

function Home() {
  const { get, series, years } = useData();
  const first = years[0] ?? 2015, last = years[years.length - 1] ?? 2024;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="hero-surface rounded-3xl p-8 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">Portal danych regionalnych</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold text-primary-foreground md:text-6xl">Płock w liczbach</h1>
        <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">Wybierz region, wskaźnik i dwa lata — porównaj zmiany w kilka sekund. Dla mieszkańców, uczniów, firm i analityków.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/eksplorator" className="rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground">Otwórz eksplorator</Link>
          <Link to="/porownanie" className="rounded-lg border border-primary-foreground/30 px-5 py-3 font-semibold text-primary-foreground">Porównaj regiony</Link>
        </div>
      </section>

      <h2 className="mt-12 font-display text-2xl font-bold">Kategorie</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((c) => (
          <Link key={c.id} to="/eksplorator" search={{ kategoria: c.id }} className="rounded-xl border bg-card p-4 text-center font-semibold hover:bg-secondary">
            {c.name}
            <span className="block text-xs font-normal text-muted-foreground">{INDICATORS.filter((i) => i.category === c.id).length} wskaźniki</span>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold">Płock: kluczowe wskaźniki {first}–{last}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {KEY.map((id) => {
          const ind = INDICATORS.find((i) => i.id === id)!;
          const a = get("plock", id, first), b = get("plock", id, last);
          const p = pct(a, b);
          const good = p !== undefined && (p > 0) === ind.higherIsBetter;
          return (
            <Link key={id} to="/eksplorator" search={{ wskaznik: id }} className="rounded-2xl border bg-card p-5 transition hover:shadow-lg">
              <p className="text-sm text-muted-foreground">{ind.name}</p>
              <p className="mt-1 font-display text-3xl font-bold">{fmt(b)} <span className="text-base font-medium text-muted-foreground">{ind.unit}</span></p>
              <p className={`text-sm font-semibold ${good ? "text-success" : "text-destructive"}`}>{fmtPct(p)} od {first}</p>
              <div className="mt-3 h-20">
                <ResponsiveContainer>
                  <AreaChart data={series("plock", id)}>
                    <Area dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-12 rounded-2xl border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Wynagrodzenie brutto w Płocku (zł)</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <AreaChart data={series("plock", "wynagrodzenie")}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => fmt(v)} width={60} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Area dataKey="value" name="Wynagrodzenie" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
