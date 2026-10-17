import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { bdlQueryOptions } from "./bdl-query";
export { parseFile } from "./import-data";
import { generateSampleData, INDICATORS, REGIONS, type DataRow } from "./data";

interface Ctx {
  rows: DataRow[];
  source: string;
  get: (region: string, indicator: string, year: number | undefined) => number | undefined;
  series: (region: string, indicator: string) => { year: number; value: number }[];
  years: number[];
  importRows: (rows: DataRow[], source: string) => void;
  reset: () => void;
  bdl: { loading: boolean; warnings: string[]; fetchedAt: string | undefined; reload: () => void };
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
  const bdlQuery = useQuery(bdlQueryOptions);
  useEffect(() => {
    if (bdlQuery.data?.rows.length) importRows(bdlQuery.data.rows, "GUS BDL (api.stat.gov.pl) + dane przykładowe dla brakujących wskaźników");
  }, [bdlQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps
  return <DataCtx.Provider value={{ rows, source, get, series, years, importRows, reset, bdl: { loading: bdlQuery.isFetching, warnings: bdlQuery.data?.warnings ?? (bdlQuery.error ? ["Nie udało się połączyć z API BDL."] : []), fetchedAt: bdlQuery.data?.fetchedAt, reload: () => { void bdlQuery.refetch(); } } }}>{children}</DataCtx.Provider>;
}

export function useData() {
  const c = useContext(DataCtx);
  if (!c) throw new Error("Brak DataProvider");
  return c;
}

