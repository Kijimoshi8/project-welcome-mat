import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { generateSampleData, INDICATORS, REGIONS, type DataRow } from "./data";

interface Ctx {
  rows: DataRow[];
  source: string;
  get: (region: string, indicator: string, year: number | undefined) => number | undefined;
  series: (region: string, indicator: string) => { year: number; value: number }[];
  years: number[];
  importRows: (rows: DataRow[], source: string) => void;
  reset: () => void;
}

const DataCtx = createContext<Ctx | null>(null);
const SAMPLE = generateSampleData();

export function DataProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<DataRow[]>(SAMPLE);
  const [source, setSource] = useState("Dane przykładowe (wbudowane)");
  const index = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(`${r.region}|${r.indicator}|${r.year}`, r.value));
    return m;
  }, [rows]);
  const years = useMemo(() => [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b), [rows]);
  const get = useCallback((r: string, i: string, y: number | undefined) => index.get(`${r}|${i}|${y}`), [index]);
  const series = useCallback(
    (r: string, i: string) =>
      years.map((y) => ({ year: y, value: index.get(`${r}|${i}|${y}`) })).filter((p): p is { year: number; value: number } => p.value !== undefined),
    [index, years],
  );
  const importRows = useCallback((incoming: DataRow[], src: string) => {
    setRows((prev) => {
      const m = new Map(prev.map((r) => [`${r.region}|${r.indicator}|${r.year}`, r]));
      incoming.forEach((r) => m.set(`${r.region}|${r.indicator}|${r.year}`, r));
      return [...m.values()];
    });
    setSource(src);
  }, []);
  const reset = useCallback(() => {
    setRows(SAMPLE);
    setSource("Dane przykładowe (wbudowane)");
  }, []);
  return <DataCtx.Provider value={{ rows, source, get, series, years, importRows, reset }}>{children}</DataCtx.Provider>;
}

export function useData() {
  const c = useContext(DataCtx);
  if (!c) throw new Error("Brak DataProvider");
  return c;
}

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .trim();

function resolve<T extends { id: string; name: string }>(list: T[], v: unknown) {
  const n = norm(v);
  return list.find((x) => norm(x.id) === n || norm(x.name) === n)?.id;
}

/** Zamienia rekordy (z JSON lub arkusza) na wiersze danych. Kolumny: region, wskaznik, rok, wartosc. */
export function parseRecords(records: Record<string, unknown>[]): { rows: DataRow[]; skipped: number } {
  const rows: DataRow[] = [];
  let skipped = 0;
  for (const rec of records) {
    const k = Object.fromEntries(Object.entries(rec).map(([a, b]) => [norm(a), b]));
    const region = resolve(REGIONS, k["region"]);
    const indicator = resolve(INDICATORS, k["wskaznik"] ?? k["indicator"]);
    const year = Number(k["rok"] ?? k["year"]);
    const value = Number(String(k["wartosc"] ?? k["value"] ?? "").replace(",", "."));
    if (region && indicator && Number.isFinite(year) && Number.isFinite(value)) rows.push({ region, indicator, year, value });
    else skipped++;
  }
  return { rows, skipped };
}

export async function parseFile(buf: ArrayBuffer, name: string) {
  if (name.toLowerCase().endsWith(".json")) {
    const json = JSON.parse(new TextDecoder().decode(buf));
    return parseRecords(Array.isArray(json) ? json : json.dane ?? json.rows ?? []);
  }
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "array" });
  const all: Record<string, unknown>[] = [];
  wb.SheetNames.forEach((s) => all.push(...XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[s]!)));
  return parseRecords(all);
}
