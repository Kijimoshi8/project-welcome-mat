import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { INDICATORS, REGIONS } from "@/lib/data";
import { parseFile, useData } from "@/lib/store";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/dane")({
  head: () => ({
    meta: [
      { title: "Import danych — Płocka eStatystyka" },
      { name: "description", content: "Wczytaj własne dane z plików ODS lub JSON." },
      { property: "og:title", content: "Import danych — Płocka eStatystyka" },
      { property: "og:description", content: "Import plików ODS i JSON do portalu." },
    ],
  }),
  component: DataPage,
});

const FILES = ["przyklad.ods", "przyklad.json"];

function DataPage() {
  const { importRows, reset, rows, source, bdl } = useData();
  const [msg, setMsg] = useState<string>();

  const handle = async (buf: ArrayBuffer, name: string) => {
    try {
      const { rows: r, skipped } = await parseFile(buf, name);
      if (!r.length) return setMsg(`Nie znaleziono poprawnych wierszy w pliku ${name}.`);
      importRows(r, `Plik: ${name}`);
      setMsg(`Zaimportowano ${r.length} wierszy z ${name}${skipped ? ` (pominięto ${skipped})` : ""}. Zobacz zmiany w eksploratorze.`);
    } catch (e) {
      setMsg(`Błąd importu: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Import danych</h1>
      <p className="mt-2 text-muted-foreground">Aktualne źródło: <b className="text-foreground">{source}</b> · {rows.length.toLocaleString("pl-PL")} wierszy</p>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="font-display text-lg font-bold">API BDL — Główny Urząd Statystyczny</h2>
        <p className="mt-2 text-sm text-muted-foreground">Oficjalne dane (ludność, wynagrodzenia, bezrobocie, lata 2015–2024) pobierane automatycznie z api.stat.gov.pl. Pozostałe wskaźniki to dane przykładowe.</p>
        <p className="mt-2 text-sm">{bdl.loading ? "Pobieranie danych z GUS…" : bdl.fetchedAt ? `Pobrano: ${new Date(bdl.fetchedAt).toLocaleString("pl-PL")}` : "Brak danych z GUS."}</p>
        {bdl.warnings.map((w) => <p key={w} className="mt-1 text-sm text-destructive">{w}</p>)}
        <button className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" disabled={bdl.loading} onClick={bdl.reload}>Odśwież dane z GUS BDL</button>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Pliki z katalogu public/data/</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {FILES.map((f) => (
            <button key={f} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={async () => { const res = await fetch(`/data/${f}`); if (!res.ok) return setMsg(`Nie znaleziono /data/${f}`); handle(await res.arrayBuffer(), f); }}>Wczytaj {f}</button>
          ))}
          <button className="rounded-md border px-4 py-2 text-sm font-semibold" onClick={() => { reset(); setMsg("Przywrócono dane przykładowe."); }}>Przywróć dane wbudowane</button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Własny plik (.ods, .csv, .xlsx, .json)</h2>
        <input type="file" accept=".ods,.csv,.xlsx,.xls,.json" className="mt-3 block text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) handle(await f.arrayBuffer(), f.name); }} />
        {msg && <p className="mt-4 rounded-md bg-secondary p-3 text-sm">{msg}</p>}
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5 text-sm">
        <h2 className="font-display text-lg font-bold">Format pliku</h2>
        <p className="mt-2">Kolumny: <code>region</code>, <code>wskaznik</code>, <code>rok</code>, <code>wartosc</code>. Region i wskaźnik — identyfikator lub pełna nazwa. Wiersze nadpisują istniejące wartości.</p>
        <p className="mt-2 text-muted-foreground">Regiony: {REGIONS.map((r) => r.id).join(", ")}</p>
        <p className="mt-1 text-muted-foreground">Wskaźniki: {INDICATORS.map((i) => i.id).join(", ")}</p>
        <button className="mt-3 rounded-md border px-3 py-1.5 font-semibold" onClick={() => downloadCsv("szablon.csv", ["region", "wskaznik", "rok", "wartosc"], [["plock", "ludnosc", 2024, 115000]])}>Pobierz szablon CSV</button>
      </section>
    </div>
  );
}
