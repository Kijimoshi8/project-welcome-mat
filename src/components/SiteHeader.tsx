import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CATEGORIES, INDICATORS } from "@/lib/data";

const NAV = [
  { to: "/", label: "Start" },
  { to: "/eksplorator", label: "Eksplorator" },
  { to: "/porownanie", label: "Porównanie" },
  { to: "/dla-firm", label: "Dla inwestorów" },
  { to: "/dane", label: "Import danych" },
] as const;

export function SiteHeader() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const hits = q.trim()
    ? INDICATORS.filter((i) => (i.name + " " + i.category).toLowerCase().includes(q.toLowerCase())).slice(0, 7)
    : [];
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">P</span>
          Płocka eStatystyka
        </Link>
        <nav className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary !text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="relative ml-auto w-full sm:w-72">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj wskaźnika…" className="w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          {hits.length > 0 && (
            <ul className="absolute right-0 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
              {hits.map((h) => (
                <li key={h.id}>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-secondary" onClick={() => { setQ(""); navigate({ to: "/eksplorator", search: { wskaznik: h.id } }); }}>
                    {h.name}
                    <span className="block text-xs text-muted-foreground">{CATEGORIES.find((c) => c.id === h.category)?.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="bg-accent/15 py-1 text-center text-xs font-medium text-foreground">
        Prototyp demonstracyjny
      </div>
    </header>
  );
}
