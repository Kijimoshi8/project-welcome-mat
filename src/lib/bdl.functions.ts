import { createServerFn } from '@tanstack/react-start';
import { BDL_INDICATORS, BDL_UNITS, bdlRows } from './bdl';
import type { BdlResponse } from './bdl';
import type { DataRow } from './data';

interface Dataset { rows: DataRow[]; fetchedAt: string; warnings: string[] }
let cache: { expires: number; data: Dataset } | undefined;
let pending: Promise<Dataset> | undefined;

export const getBdlData = createServerFn({ method: 'GET' }).handler(async (): Promise<Dataset> => {
  if (cache && cache.expires > Date.now()) return cache.data;
  if (pending) return pending;
  const key = process.env['BDL_CLIENT_ID'];
  pending = (async () => {
    const rows: DataRow[] = [];
    const warnings: string[] = [];
    const units = Object.entries(BDL_UNITS);
    for (let offset = 0; offset < units.length; offset += 4) {
      await Promise.all(units.slice(offset, offset + 4).map(async ([region, unit]) => {
        const params = new URLSearchParams({ format: 'json', 'page-size': '100' });
        for (const ind of BDL_INDICATORS) {
          if (!ind.countyOnly || unit.endsWith('000')) params.append('var-id', String(ind.variableId));
        }
        // 2024 is the latest complete comparison year; missing years remain missing.
        for (let year = 2015; year <= 2024; year++) params.append('year', String(year));
        try {
          const response = await fetch(`https://bdl.stat.gov.pl/api/v1/data/by-unit/${unit}?${params}`, {
            headers: key ? { 'X-ClientId': key, Accept: 'application/json' } : { Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
          });
          if (!response.ok) throw new Error(`BDL status ${response.status}`);
          const data: BdlResponse = await response.json();
          if (data.errors) throw new Error('BDL rejected request');
          const incoming = bdlRows(region, data);
          rows.push(...incoming);
          if (!incoming.length) warnings.push(`Brak danych BDL dla regionu: ${region}.`);
        } catch {
          warnings.push(`Nie udało się pobrać danych GUS dla regionu: ${region}. Spróbuj ponownie później.`);
        }
      }));
    }
    const data = { rows, fetchedAt: new Date().toISOString(), warnings };
    if (rows.length && !warnings.length) cache = { expires: Date.now() + 3600000, data };
    return data;
  })();
  try { return await pending; } finally { pending = undefined; }
});