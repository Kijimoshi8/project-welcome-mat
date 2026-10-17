import { INDICATORS, REGIONS, type DataRow } from './data';

const norm = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').trim();
function resolve<T extends { id: string; name: string }>(list: T[], value: unknown) {
  const n = norm(value);
  return list.find((item) => norm(item.id) === n || norm(item.name) === n)?.id;
}
export function parseRecords(records: Record<string, unknown>[]): { rows: DataRow[]; skipped: number } {
  const rows: DataRow[] = [];
  let skipped = 0;
  for (const rec of records) {
    const k = Object.fromEntries(Object.entries(rec).map(([a, b]) => [norm(a), b]));
    const region = resolve(REGIONS, k['region']);
    const indicator = resolve(INDICATORS, k['wskaznik'] ?? k['indicator']);
    const year = Number(k['rok'] ?? k['year']);
    const raw = String(k['wartosc'] ?? k['value'] ?? '').trim();
    const value = Number(raw.replace(/[\s\u00a0]/g, '').replace(',', '.'));
    if (region && indicator && Number.isInteger(year) && year >= 1900 && year <= 2100 && raw !== '' && Number.isFinite(value)) rows.push({ region, indicator, year, value });
    else skipped++;
  }
  return { rows, skipped };
}
export async function parseFile(buf: ArrayBuffer, name: string) {
  if (name.toLowerCase().endsWith('.json')) {
    const json = JSON.parse(new TextDecoder().decode(buf));
    return parseRecords(Array.isArray(json) ? json : json.dane ?? json.rows ?? []);
  }
  const XLSX = await import('xlsx');
  const wb = name.toLowerCase().endsWith('.csv')
    ? XLSX.read(new TextDecoder('utf-8').decode(buf).replace(/^\uFEFF/, ''), { type: 'string', raw: true })
    : XLSX.read(buf, { type: 'array' });
  const records: Record<string, unknown>[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (sheet) records.push(...XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet));
  }
  return parseRecords(records);
}