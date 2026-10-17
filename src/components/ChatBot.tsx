import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, MessageCircle, Send, X } from "lucide-react";
import { CATEGORIES, INDICATORS, REGIONS, type CategoryId } from "@/lib/data";

interface Msg {
  role: "user" | "bot";
  text: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");

// synonimy -> id wskaźnika
const KEYWORDS: [string, string][] = [
  ["ludnosc", "ludnosc"], ["mieszkanc", "ludnosc"], ["populac", "ludnosc"],
  ["urodzen", "urodzenia"], ["dzietnosc", "urodzenia"],
  ["senior", "senior"], ["65", "senior"], ["starzen", "senior"],
  ["drog", "drogi"], ["nawierzchn", "drogi"],
  ["komunikac", "komunikacja"], ["pasazer", "komunikacja"], ["autobus", "komunikacja"],
  ["rower", "rowery"], ["sciezk", "rowery"],
  ["pm10", "pm10"], ["smog", "pm10"], ["powietrz", "pm10"], ["zanieczyszcz", "pm10"],
  ["zielen", "zielen"], ["park", "zielen"],
  ["recykling", "recykling"], ["odpad", "recykling"], ["selektywn", "recykling"],
  ["firm", "firmy"], ["przedsiebior", "firmy"], ["biznes", "firmy"], ["sprzedaz", "firmy"],
  ["bezroboc", "bezrobocie"], ["pracy", "bezrobocie"],
  ["wynagrodzen", "wynagrodzenie"], ["pensj", "wynagrodzenie"], ["zarobk", "wynagrodzenie"], ["plac", "wynagrodzenie"],
  ["szkol", "szkoly"], ["uczni", "szkoly"],
  ["przedszkol", "przedszkola"],
  ["bibliotek", "biblioteki"], ["czytel", "biblioteki"],
  ["mieszkan", "mieszkania"], ["budow", "mieszkania"],
  ["lekarz", "lekarze"], ["zdrow", "lekarze"],
  ["kultur", "kultura"], ["wydarzen", "kultura"],
];

interface Parsed {
  indicator?: string;
  category?: CategoryId;
  regions: string[];
  from?: number;
  to?: number;
  chart?: "bar" | "line";
}

function parseCommand(input: string): Parsed {
  const t = norm(input);
  const out: Parsed = { regions: [] };

  for (const [kw, id] of KEYWORDS) {
    if (t.includes(kw)) {
      out.indicator = id;
      out.category = INDICATORS.find((i) => i.id === id)?.category;
      break;
    }
  }
  if (!out.indicator) {
    const cat = CATEGORIES.find((c) => t.includes(norm(c.name)));
    if (cat) out.category = cat.id;
  }

  for (const r of REGIONS) {
    if (t.includes(norm(r.name)) || t.includes(r.id)) out.regions.push(r.id);
  }

  const years = t.match(/20[0-2][0-9]/g)?.map(Number) ?? [];
  if (years.length >= 2) {
    out.from = Math.min(...years);
    out.to = Math.max(...years);
  } else if (years.length === 1) {
    out.to = years[0];
  }

  if (t.includes("slupkow") || t.includes("bar")) out.chart = "bar";
  else if (t.includes("liniow") || t.includes("trend") || t.includes("line")) out.chart = "line";

  return out;
}

const HELP =
  "Rozumiem polecenia typu: „wykres słupkowy bezrobocia”, „trend ludności Płocka i Sierpca 2015-2024”, „pokaż PM10”. Dostępne tematy: " +
  INDICATORS.map((i) => i.name.toLowerCase()).join(", ") +
  ".";

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Cześć! Powiedz, jaki wykres utworzyć, np. „Utwórz wykres słupkowy bezrobocia w Płocku”, a ustawię Eksplorator." },
  ]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const p = parseCommand(text);
    const reply: Msg = { role: "user", text };

    if (!p.indicator && !p.category) {
      setMsgs((m) => [...m, reply, { role: "bot", text: HELP }]);
      return;
    }

    const ind = p.indicator ? INDICATORS.find((i) => i.id === p.indicator) : undefined;
    const botText = ind
      ? `Ustawiam Eksplorator: ${ind.name}${p.regions.length ? ` dla ${p.regions.map((r) => REGIONS.find((x) => x.id === r)?.name).join(", ")}` : ""}${p.chart === "bar" ? " (wykres słupkowy zmian)" : ""}. Przechodzę…`
      : "Otwieram Eksplorator z wybraną kategorią…";
    setMsgs((m) => [...m, reply, { role: "bot", text: botText }]);

    void navigate({
      to: "/eksplorator",
      search: {
        kategoria: p.category,
        wskaznik: p.indicator,
        regiony: p.regions.length ? p.regions.join(",") : undefined,
        od: p.from,
        do: p.to,
      },
    });
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-display text-sm font-bold">Asystent wykresów</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Zamknij czat" className="rounded-md p-1 hover:bg-primary/80">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Np. wykres słupkowy bezrobocia…"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={send}
              aria-label="Wyślij"
              className="rounded-md bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Otwórz czat"
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
}
