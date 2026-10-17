// Katalog wskaźników i regionów; oficjalne wartości są pobierane z API BDL.
export type CategoryId = "demografia" | "transport" | "srodowisko" | "gospodarka" | "edukacja" | "jakosc";

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "demografia", name: "Demografia" },
  { id: "transport", name: "Transport" },
  { id: "srodowisko", name: "Środowisko" },
  { id: "gospodarka", name: "Gospodarka" },
  { id: "edukacja", name: "Edukacja" },
  { id: "jakosc", name: "Jakość życia" },
];

export interface Indicator {
  id: string;
  name: string;
  category: CategoryId;
  unit: string;
  higherIsBetter: boolean;
  base: number;
  trend: number; // roczna zmiana względna
}

export const INDICATORS: Indicator[] = [
  { id: "ludnosc", name: "Liczba mieszkańców", category: "demografia", unit: "os.", higherIsBetter: true, base: 40000, trend: -0.004 },
  { id: "urodzenia", name: "Urodzenia na 1000 mieszkańców", category: "demografia", unit: "‰", higherIsBetter: true, base: 9.5, trend: -0.012 },
  { id: "senior", name: "Udział osób 65+", category: "demografia", unit: "%", higherIsBetter: false, base: 17, trend: 0.02 },
  { id: "drogi", name: "Drogi o nawierzchni twardej", category: "transport", unit: "km", higherIsBetter: true, base: 320, trend: 0.015 },
  { id: "komunikacja", name: "Pasażerowie komunikacji publicznej", category: "transport", unit: "tys./rok", higherIsBetter: true, base: 2400, trend: 0.01 },
  { id: "rowery", name: "Długość dróg rowerowych", category: "transport", unit: "km", higherIsBetter: true, base: 28, trend: 0.07 },
  { id: "pm10", name: "Średnie stężenie PM10", category: "srodowisko", unit: "µg/m³", higherIsBetter: false, base: 32, trend: -0.03 },
  { id: "zielen", name: "Tereny zieleni na mieszkańca", category: "srodowisko", unit: "m²", higherIsBetter: true, base: 22, trend: 0.012 },
  { id: "recykling", name: "Odpady zebrane selektywnie", category: "srodowisko", unit: "%", higherIsBetter: true, base: 24, trend: 0.06 },
  { id: "firmy", name: "Firmy na 1000 mieszkańców", category: "gospodarka", unit: "szt.", higherIsBetter: true, base: 95, trend: 0.02 },
  { id: "bezrobocie", name: "Stopa bezrobocia", category: "gospodarka", unit: "%", higherIsBetter: false, base: 9, trend: -0.05 },
  { id: "wynagrodzenie", name: "Przeciętne wynagrodzenie brutto", category: "gospodarka", unit: "zł", higherIsBetter: true, base: 4200, trend: 0.065 },
  { id: "szkoly", name: "Uczniowie na szkołę podstawową", category: "edukacja", unit: "os.", higherIsBetter: false, base: 260, trend: -0.005 },
  { id: "przedszkola", name: "Dzieci objęte edukacją przedszkolną", category: "edukacja", unit: "%", higherIsBetter: true, base: 78, trend: 0.015 },
  { id: "biblioteki", name: "Czytelnicy bibliotek na 1000 os.", category: "edukacja", unit: "os.", higherIsBetter: true, base: 160, trend: -0.01 },
  { id: "mieszkania", name: "Mieszkania oddane do użytku", category: "jakosc", unit: "szt.", higherIsBetter: true, base: 280, trend: 0.04 },
  { id: "lekarze", name: "Lekarze na 10 tys. mieszkańców", category: "jakosc", unit: "os.", higherIsBetter: true, base: 21, trend: 0.02 },
  { id: "kultura", name: "Wydarzenia kulturalne", category: "jakosc", unit: "szt./rok", higherIsBetter: true, base: 140, trend: 0.03 },
];

export interface Region {
  id: string;
  name: string;
  type: string;
  scale: number;
  // pozycja na schematycznej mapie kafelkowej (nie są to granice administracyjne)
  x: number;
  y: number;
}

export const REGIONS: Region[] = [
  { id: "plock", name: "Płock", type: "miasto", scale: 3, x: 2, y: 1 },
  { id: "pplocki", name: "Powiat płocki", type: "powiat", scale: 2.6, x: 1, y: 1 },
  { id: "gostynin", name: "Gostynin", type: "miasto", scale: 0.45, x: 1, y: 2 },
  { id: "sierpc", name: "Sierpc", type: "miasto", scale: 0.45, x: 2, y: 0 },
  { id: "radzanowo", name: "Radzanowo", type: "gmina", scale: 0.25, x: 3, y: 0 },
  { id: "stara-biala", name: "Stara Biała", type: "gmina", scale: 0.33, x: 1, y: 0 },
  { id: "slupno", name: "Słupno", type: "gmina", scale: 0.2, x: 3, y: 1 },
  { id: "lacko", name: "Łąck", type: "gmina", scale: 0.13, x: 2, y: 2 },
  { id: "gabin", name: "Gąbin", type: "gmina", scale: 0.27, x: 0, y: 2 },
  { id: "wyszogrod", name: "Wyszogród", type: "gmina", scale: 0.15, x: 3, y: 2 },
];

export const YEARS = Array.from({ length: 10 }, (_, i) => 2015 + i);

export interface DataRow {
  region: string;
  indicator: string;
  year: number;
  value: number;
  source?: string;
  variableId?: number;
  attributeId?: number;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

const ABSOLUTE = new Set(["ludnosc", "drogi", "komunikacja", "rowery", "mieszkania", "kultura"]);

export function generateSampleData(): DataRow[] {
  const rows: DataRow[] = [];
  for (const r of REGIONS) {
    for (const ind of INDICATORS) {
      const rf = 0.8 + hash(r.id + ind.id) * 0.4;
      const tf = ind.trend + (hash(ind.id + r.id + "t") - 0.5) * 0.03;
      const scale = ABSOLUTE.has(ind.id) ? r.scale : 1;
      YEARS.forEach((y, i) => {
        const noise = 1 + (hash(r.id + ind.id + y) - 0.5) * 0.04;
        let v = ind.base * scale * rf * Math.pow(1 + tf, i) * noise;
        if (ind.id === "komunikacja" && y === 2020) v *= 0.7;
        const dec = v > 1000 ? 0 : v > 100 ? 1 : 2;
        rows.push({ region: r.id, indicator: ind.id, year: y, value: Number(v.toFixed(dec)) });
      });
    }
  }
  return rows;
}

export const fmt = (v: number | undefined, digits = 1) =>
  v === undefined || Number.isNaN(v)
    ? "—"
    : v.toLocaleString("pl-PL", { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : digits });

export const pct = (a?: number, b?: number) =>
  a === undefined || b === undefined || a === 0 ? undefined : ((b - a) / Math.abs(a)) * 100;

export const fmtPct = (p?: number) => (p === undefined ? "—" : `${p > 0 ? "+" : ""}${p.toFixed(1).replace(".", ",")}%`);
