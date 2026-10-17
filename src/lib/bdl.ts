import type { DataRow } from './data';

export const BDL_UNITS: Record<string, string> = {
  plock: '071427062000', pplocki: '071427019000', gostynin: '071427004011', sierpc: '071427027011',
  radzanowo: '071427019102', 'stara-biala': '071427019132', slupno: '071427019122',
  lacko: '071427019072', gabin: '071427019063', wyszogrod: '071427019153',
};
export interface BdlIndicator { id: string; variableId: number; label: string; countyOnly?: boolean }
export const BDL_INDICATORS: BdlIndicator[] = [
  { id: 'ludnosc', variableId: 72305, label: 'Ludność wg grup wieku i płci: ogółem' },
  { id: 'wynagrodzenie', variableId: 64428, label: 'Przeciętne miesięczne wynagrodzenia brutto: ogółem', countyOnly: true },
  { id: 'bezrobocie', variableId: 60270, label: 'Stopa bezrobocia rejestrowanego: ogółem', countyOnly: true },
];
export interface BdlResponse {
  results?: { id: number; values: { year: string; val: number | null; attrId: number }[] }[];
  errors?: unknown[];
}
export function bdlRows(region: string, response: BdlResponse): DataRow[] {
  return (response.results ?? []).flatMap(result => {
    const indicator = BDL_INDICATORS.find(item => item.variableId === result.id);
    if (!indicator) return [];
    return result.values.flatMap(value => typeof value.val === 'number' && Number.isFinite(value.val)
      ? [{ region, indicator: indicator.id, year: Number(value.year), value: value.val, source: 'GUS BDL', variableId: result.id, attributeId: value.attrId }]
      : []);
  });
}