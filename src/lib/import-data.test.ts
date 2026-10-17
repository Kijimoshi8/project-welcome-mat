import { describe, it, expect } from 'vitest';
import { parseFile, parseRecords } from './import-data';
import * as XLSX from 'xlsx';

describe('statistical file import', () => {
  it('imports CSV values without converting decimal commas to dates', async () => {
    const csv = 'region;wskaznik;rok;wartosc\nPłock;bezrobocie;2024;8,5\nplock;ludnosc;2024;115 000';
    const result = await parseFile(new TextEncoder().encode(csv).buffer, 'dane.csv');
    expect(result.rows.map(r => r.value)).toEqual([8.5, 115000]);
    expect(result.skipped).toBe(0);
  });
  it('imports ODS statistics', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ region: 'plock', wskaznik: 'ludnosc', rok: 2024, wartosc: 114000 }]), 'Dane');
    const result = await parseFile(XLSX.write(wb, { bookType: 'ods', type: 'array' }), 'dane.ods');
    expect(result.rows).toEqual([{ region: 'plock', indicator: 'ludnosc', year: 2024, value: 114000 }]);
  });
  it('does not turn missing file values into zero', () => {
    expect(parseRecords([{ region: 'plock', wskaznik: 'ludnosc', rok: 2024, wartosc: '' }])).toEqual({ rows: [], skipped: 1 });
  });
});