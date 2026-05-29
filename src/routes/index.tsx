import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Plus, MapPin, Clock, Stethoscope, Pencil } from "lucide-react";
import { useBooking } from "@/store/booking";
import {
  SPECIALTIES,
  SERVICES,
  EPS_OPTIONS,
  DATE_CHIPS,
  dateChipToISO,
  type DateChipKey,
  type Specialty,
} from "@/mocks/catalog";
import { hasAvailability, findNextAvailableDate, parseYmd, ymd } from "@/mocks/availability";
import { CocoLogo } from "@/components/CocoLogo";
import { ChipList } from "@/components/OptionsPicker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ ask: s.ask === "service" ? "service" : undefined }),
  head: () => ({
    meta: [
      { title: "Asistente Coco — Gestiona tu cita fácil y rápido" },
      { name: "description", content: "Agenda, reagenda, cancela o confirma tu cita médica con Coco." },
    ],
  }),
  component: P0,
});

// ---------- Tipos ----------
type FlowKind = "agendar" | "gestionar" | "reagendar" | "cancelar" | "confirmar" | "pagar" | "consultar" | null;
type ManageIntent = "reagendar" | "cancelar" | "confirmar" | "pagar";
type AgendarStep = "specialty" | "service" | "eps" | "date" | "ready";
type IdStep = "ask-doc" | "show-card" | "confirm-cancel" | "done";

type Draft = {
  specialty?: Specialty;
  service?: string;
  eps?: string;
  dateKey?: DateChipKey;
  dateLabel?: string;
  dateISO?: string;
  requestedDateISO?: string;
};

type Bubble =
  | { id: string; kind: "msg"; from: "bot" | "user"; text: string; editStep?: AgendarStep }
  | { id: string; kind: "summary"; items: string[] }
  | { id: string; kind: "doc-input"; flow: FlowKind }
  | { id: string; kind: "appt-card"; flow: FlowKind }
  | { id: string; kind: "cancel-confirm" }
  | { id: string; kind: "post-cancel" }
  | { id: string; kind: "post-confirm" }
  | { id: string; kind: "date-input" }
  | { id: string; kind: "date-suggest"; iso: string; label: string }
  | { id: string; kind: "manage-options" };

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ---------- Parser ----------
// Normaliza texto: minúsculas + sin acentos
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Distancia de Levenshtein
function lev(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const v: number[] = Array(bl + 1);
  for (let j = 0; j <= bl; j++) v[j] = j;
  for (let i = 1; i <= al; i++) {
    let prev = i - 1;
    v[0] = i;
    for (let j = 1; j <= bl; j++) {
      const tmp = v[j];
      v[j] = Math.min(
        v[j] + 1,
        v[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return v[bl];
}

// Umbral por longitud de keyword
function tol(k: string): number {
  if (k.length <= 4) return 1;
  if (k.length <= 7) return 2;
  return 3;
}

// ¿La frase contiene el keyword (frase de N palabras) con tolerancia a typos?
function fuzzyHas(text: string, keyword: string): boolean {
  const T = norm(text);
  const K = norm(keyword);
  if (T.includes(K)) return true;
  const tokens = T.split(/[^a-z0-9ñ]+/).filter(Boolean);
  const kw = K.split(/\s+/);
  const n = kw.length;
  const t = tol(K.replace(/\s+/g, ""));
  for (let i = 0; i + n <= tokens.length; i++) {
    const chunk = tokens.slice(i, i + n).join(" ");
    if (lev(chunk, K) <= t) return true;
  }
  // también intentar contra cada token si keyword es 1 palabra y largo similar
  if (n === 1) {
    for (const tok of tokens) {
      if (Math.abs(tok.length - K.length) <= t && lev(tok, K) <= t) return true;
    }
  }
  return false;
}

// Devuelve la primera coincidencia: prioriza match exacto (substring) sobre fuzzy
function fuzzyMatch<T>(text: string, entries: Array<[string[], T]>): T | undefined {
  const T = norm(text);
  // 1ª pasada: substring exacto (sin tolerancia a typos) — evita que "agendar" matchee "reagenda"
  for (const [keys, val] of entries) {
    for (const k of keys) if (T.includes(norm(k))) return val;
  }
  // 2ª pasada: fuzzy con tolerancia
  for (const [keys, val] of entries) {
    for (const k of keys) if (fuzzyHas(text, k)) return val;
  }
  return undefined;
}

function detectIntent(t: string): FlowKind {
  return fuzzyMatch<FlowKind>(t, [
    [["reagendar", "reagenda", "cambiar cita", "mover cita"], "reagendar"],
    [["cancelar", "cancela", "anular"], "cancelar"],
    [["confirmar asistencia", "confirmar", "confirma"], "confirmar"],
    [["pagar", "pago"], "pagar"],
    [["gestionar mis citas", "gestionar", "administrar cita", "mis citas"], "gestionar"],
    [["consultar informacion", "informacion", "consultar"], "consultar"],
    [["agendar", "agenda", "cita", "reservar", "turno", "doctor", "especialista"], "agendar"],
  ]) ?? null;
}

// Substring-only match (sin tolerancia a typos) — para keywords cortas/ambiguas
function strictMatch<T>(text: string, entries: Array<[string[], T]>): T | undefined {
  const T = norm(text);
  for (const [keys, val] of entries) {
    for (const k of keys) if (T.includes(norm(k))) return val;
  }
  return undefined;
}

function detectSpecialty(t: string): Specialty | undefined {
  return strictMatch<Specialty>(t, [
    [["cardiologia", "cardio", "corazon"], "Cardiología"],
    [["dermatologia", "derma", "piel"], "Dermatología"],
    [["medicina general", "medico general"], "Medicina General"],
    [["ginecologia", "gineco"], "Ginecología"],
    [["optometria", "optome", "vista", "ojos", "lentes"], "Optometría"],
    [["pediatria", "pediatra"], "Pediatría"],
  ]);
}

function detectService(t: string, sp?: Specialty): string | undefined {
  if (fuzzyMatch(t, [[["primera vez", "primera", "primer"], true]])) return "Primera vez";
  if (fuzzyMatch(t, [[["control", "seguimiento"], true]])) return "Control";
  if (sp === "Dermatología" && fuzzyHas(t, "procedimiento")) return "Procedimiento";
  if (sp === "Ginecología" && fuzzyHas(t, "citologia")) return "Citología";
  if (sp === "Pediatría" && fuzzyHas(t, "crecimiento")) return "Crecimiento y desarrollo";
  return undefined;
}

function detectEPS(t: string): string | undefined {
  return strictMatch<string>(t, [
    [["nueva eps"], "Nueva EPS"],
    [["sanitas"], "EPS Sanitas"],
    [["sura"], "EPS Sura"],
    [["compensar"], "EPS Compensar"],
    [["fomag"], "Fomag"],
    [["particular", "sin eps", "pago propio"], "Particular"],
  ]);
}

const MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

function detectDate(t: string): { key: DateChipKey; label: string; iso?: string } | undefined {
  const l = t.toLowerCase();
  // Fechas específicas: "12 de mayo", "12/05", "12-05-2026"
  const m1 = l.match(/(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/);
  if (m1) {
    const day = parseInt(m1[1], 10);
    const month = MONTHS[m1[2]];
    const year = m1[3] ? parseInt(m1[3], 10) : new Date().getFullYear();
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return { key: "pick", label: d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }), iso: d.toISOString().slice(0, 10) };
    }
  }
  const m2 = l.match(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (m2) {
    const day = parseInt(m2[1], 10);
    const month = parseInt(m2[2], 10) - 1;
    let year = m2[3] ? parseInt(m2[3], 10) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return { key: "pick", label: d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }), iso: d.toISOString().slice(0, 10) };
    }
  }
  if (fuzzyHas(l, "manana") && !/de la manana/.test(l)) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return { key: "pick", label: "Mañana", iso: d.toISOString().slice(0, 10) };
  }
  if (fuzzyMatch(l, [[["lo mas pronto", "cuanto antes", "urgente", "hoy"], true]])) return { key: "asap", label: "Lo más pronto posible" };
  if (fuzzyHas(l, "esta semana")) return { key: "this-week", label: "Esta semana" };
  if (fuzzyMatch(l, [[["proxima semana", "siguiente semana"], true]])) return { key: "next-week", label: "La próxima semana" };
  if (fuzzyMatch(l, [[["15 dias", "quincena", "dos semanas"], true]])) return { key: "in-15-days", label: "En 15 días" };
  // Días de la semana → esta semana
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  for (const d of dias) {
    if (fuzzyHas(l, d)) return { key: "this-week", label: "Esta semana" };
  }
  return undefined;
}

function parseMessage(text: string) {
  const intent = detectIntent(text);
  const specialty = detectSpecialty(text);
  const service = detectService(text, specialty);
  const eps = detectEPS(text);
  const date = detectDate(text);
  return { intent, specialty, service, eps, dateKey: date?.key, dateLabel: date?.label, dateISO: date?.iso };
}

function nextAgendarStep(d: Draft): AgendarStep {
  if (!d.specialty) return "specialty";
  if (!d.service) return "service";
  if (!d.eps) return "eps";
  if (!d.dateKey) return "date";
  if (d.dateKey === "pick" && !d.dateISO) return "date";
  return "ready";
}

function P0() {
  const navigate = useNavigate();
  const { ask } = Route.useSearch();
  const setSpecialty = useBooking((s) => s.setSpecialty);
  const setService = useBooking((s) => s.setService);
  const setAseguradora = useBooking((s) => s.setAseguradora);
  const setPreferredDate = useBooking((s) => s.setPreferredDate);
  const reset = useBooking((s) => s.reset);
  const pushChat = useBooking((s) => s.pushChat);
  const clearChat = useBooking((s) => s.clearChat);

  const [input, setInput] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [flow, setFlow] = useState<FlowKind>(null);
  const [agStep, setAgStep] = useState<AgendarStep | null>(null);
  const [idStep, setIdStep] = useState<IdStep | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [typing, setTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [bubbles, typing]);

  // Auto-arrancar flujo agendar pidiendo especialidad cuando viene ?ask=service
  useEffect(() => {
    if (ask === "service" && mounted && bubbles.length === 0) {
      reset();
      startFlow("agendar", { skipUserBubble: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask, mounted]);

  const inChat = bubbles.length > 0;

  function addBubble(b: Omit<Bubble, "id"> | Record<string, unknown>) {
    setBubbles((bs) => [...bs, { ...b, id: uid() } as Bubble]);
  }

  const botSay = (text: string, after?: () => void) => {
    setTyping(true);
    setTimeout(() => {
      addBubble({ kind: "msg", from: "bot", text });
      setTyping(false);
      after?.();
    }, 450);
  };

  const userSay = (text: string, editStep?: AgendarStep) => addBubble({ kind: "msg", from: "user", text, editStep });

  // ===== AGENDAR =====
  function askAgendar(step: AgendarStep, d: Draft) {
    setAgStep(step);
    if (step === "specialty") {
      botSay("¿Qué especialidad necesitas?");
    } else if (step === "service") {
      botSay("¿Primera vez o control?");
    } else if (step === "eps") {
      botSay("¿Con qué EPS?");
    } else if (step === "date") {
      botSay("¿Para cuándo?");
    } else if (step === "ready") {
      finishAgendar(d);
    }
  }

  function finishAgendar(d: Draft) {
    botSay("Listo, te muestro la disponibilidad.", () => {
      addBubble({
        kind: "summary",
        items: [
          `${d.specialty} ${d.service?.toLowerCase()}`,
          d.eps!,
          d.dateLabel!,
        ],
      });
      // Persistir en store
      if (d.specialty) setSpecialty(d.specialty);
      if (d.service) setService(d.service);
      if (d.eps) setAseguradora(d.eps);
      const resolvedISO = d.dateISO ?? (d.dateKey ? dateChipToISO(d.dateKey) : undefined);
      let preferred: string | undefined = d.requestedDateISO ?? d.dateISO;
      if (!preferred && d.specialty && d.service) {
        const start = resolvedISO ? parseYmd(resolvedISO) : new Date();
        start.setHours(0, 0, 0, 0);
        const firstAvail = findNextAvailableDate(start, d.specialty, d.service);
        if (firstAvail) preferred = ymd(firstAvail);
      }
      if (preferred) setPreferredDate(preferred);
      useBooking.getState().setDate(resolvedISO);
      // Transferir chat lateral
      clearChat();
      bubbles.forEach((b) => {
        if (b.kind === "msg") pushChat({ from: b.from, text: b.text });
      });
      pushChat({
        from: "bot",
        text: `Estoy mostrando disponibilidad para ${d.specialty} — ${d.service} (${d.eps}, ${d.dateLabel}). Pídeme filtros aquí o úsalos en la interfaz.`,
      });
      setTimeout(() => navigate({ to: "/disponibilidad" }), 700);
    });
    setAgStep(null);
  }

  function startFlow(intent: FlowKind, opts?: { skipUserBubble?: boolean; label?: string; parsed?: Partial<Draft> }) {
    if (!opts?.skipUserBubble && opts?.label) userSay(opts.label);
    setFlow(intent);
    if (intent === "agendar") {
      const d: Draft = { ...draft, ...(opts?.parsed ?? {}) };
      setDraft(d);
      const step = nextAgendarStep(d);
      // Mensaje inicial contextual
      if (opts?.parsed?.specialty && step !== "specialty") {
        botSay(`Agendamos ${opts.parsed.specialty}.`, () => askAgendar(step, d));
      } else {
        askAgendar(step, d);
      }
    } else if (intent === "reagendar") {
      setIdStep("ask-doc");
      botSay("Para reagendar, ¿tu número de documento?", () =>
        addBubble({ kind: "doc-input", flow: "reagendar" }),
      );
    } else if (intent === "cancelar") {
      setIdStep("ask-doc");
      botSay("Para cancelar, ¿tu número de documento?", () =>
        addBubble({ kind: "doc-input", flow: "cancelar" }),
      );
    } else if (intent === "confirmar") {
      setIdStep("ask-doc");
      botSay("¿Tu número de documento?", () =>
        addBubble({ kind: "doc-input", flow: "confirmar" }),
      );
    } else if (intent === "pagar") {
      botSay("Para pagar, ¿tu número de documento?", () =>
        addBubble({ kind: "doc-input", flow: "pagar" }),
      );
      setIdStep("ask-doc");
    } else if (intent === "consultar") {
      botSay("¿Qué información necesitas?");
    } else if (intent === "gestionar") {
      botSay("¿Qué quieres hacer?", () =>
        addBubble({ kind: "manage-options" }),
      );
    }
  }

  function pickManageIntent(sub: ManageIntent, label: string) {
    userSay(label);
    startFlow(sub, { skipUserBubble: true });
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    userSay(text);

    if (flow === "agendar" && agStep) {
      const parsed = parseMessage(text);
      const d: Draft = { ...draft };
      const changes: string[] = [];
      if (parsed.specialty) {
        if (d.specialty && d.specialty !== parsed.specialty) changes.push(`la especialidad a ${parsed.specialty}`);
        d.specialty = parsed.specialty;
        if (d.service && !SERVICES[parsed.specialty].includes(d.service)) d.service = undefined;
      }
      if (parsed.service) {
        if (d.service && d.service !== parsed.service) changes.push(`el servicio a ${parsed.service}`);
        d.service = parsed.service;
      }
      if (parsed.eps) {
        if (d.eps && d.eps !== parsed.eps) changes.push(`la aseguradora a ${parsed.eps}`);
        d.eps = parsed.eps;
      }
      if (parsed.dateKey) {
        if (d.dateLabel && d.dateLabel !== parsed.dateLabel) changes.push(`la fecha a ${parsed.dateLabel}`);
        d.dateKey = parsed.dateKey;
        d.dateLabel = parsed.dateLabel;
        d.dateISO = parsed.dateISO;
        d.requestedDateISO = parsed.dateISO;
      }
      setDraft(d);
      if (parsed.dateISO && d.specialty && d.service) {
        validateSpecificDate(d, parsed.dateISO);
        return;
      }
      if (changes.length > 0) {
        botSay(`Listo, cambié ${changes.join(" y ")}.`, () => askAgendar(nextAgendarStep(d), d));
      } else {
        askAgendar(nextAgendarStep(d), d);
      }
      return;
    }

    const parsed = parseMessage(text);
    const intent: FlowKind = parsed.intent ?? (parsed.specialty ? "agendar" : null);
    if (intent) {
      startFlow(intent, { skipUserBubble: true, parsed });
    } else {
      botSay("Puedo agendar, reagendar, cancelar o confirmar. ¿Qué necesitas?");
    }
  }

  function pickSpecialty(s: Specialty) {
    userSay(s, "specialty");
    const d = { ...draft, specialty: s };
    if (d.service && !SERVICES[s].includes(d.service)) d.service = undefined;
    setDraft(d);
    askAgendar(nextAgendarStep(d), d);
  }
  function pickService(s: string) {
    userSay(s, "service");
    const d = { ...draft, service: s };
    setDraft(d);
    askAgendar(nextAgendarStep(d), d);
  }
  function pickEPS(s: string) {
    userSay(s, "eps");
    const d = { ...draft, eps: s };
    setDraft(d);
    askAgendar(nextAgendarStep(d), d);
  }
  function pickDate(key: DateChipKey, label: string) {
    if (key === "pick") {
      userSay("Elegir fecha");
      botSay("¿Qué fecha?", () =>
        addBubble({ kind: "date-input" }),
      );
      return;
    }
    userSay(label, "date");
    const d = { ...draft, dateKey: key, dateLabel: label, dateISO: undefined, requestedDateISO: dateChipToISO(key) };
    setDraft(d);
    askAgendar(nextAgendarStep(d), d);
  }
  function pickSpecificDate(iso: string) {
    const d0 = parseYmd(iso);
    const label = d0.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    userSay(label, "date");
    const d: Draft = { ...draft, dateKey: "pick", dateLabel: label, dateISO: iso, requestedDateISO: iso };
    setDraft(d);
    if (d.specialty && d.service) {
      validateSpecificDate(d, iso);
      return;
    }
    askAgendar(nextAgendarStep(d), d);
  }

  function validateSpecificDate(d: Draft, iso: string) {
    const target = parseYmd(iso);
    if (hasAvailability(target, d.specialty!, d.service!)) {
      askAgendar(nextAgendarStep(d), d);
      return;
    }
    const next = findNextAvailableDate(new Date(target.getTime() + 86400000), d.specialty!, d.service!);
    const targetLabel = target.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
    if (!next) {
      botSay(`Sin disponibilidad para el ${targetLabel} ni días cercanos. ¿Eliges otra fecha?`, () =>
        addBubble({ kind: "date-input" }),
      );
      return;
    }
    const nextIso = ymd(next);
    const nextLabel = next.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
    botSay(`No hay cupo el ${targetLabel}. Lo más cercano: ${nextLabel}. ¿La tomamos?`, () =>
      addBubble({ kind: "date-suggest", iso: nextIso, label: nextLabel }),
    );
  }

  function acceptSuggestedDate(iso: string, label: string) {
    const capLabel = label.charAt(0).toUpperCase() + label.slice(1);
    userSay(`Sí, el ${label}`);
    const d: Draft = { ...draft, dateKey: "pick", dateLabel: capLabel, dateISO: iso, requestedDateISO: draft.requestedDateISO ?? draft.dateISO };
    setDraft(d);
    askAgendar(nextAgendarStep(d), d);
  }

  function rejectSuggestedDate() {
    userSay("No, prefiero otra fecha");
    botSay("Elige la fecha:", () => addBubble({ kind: "date-input" }));
  }

  // ===== Identificación / cards =====
  function submitDoc(_doc: string, f: FlowKind) {
    setIdStep("show-card");
    if (f === "confirmar") {
      addBubble({ kind: "appt-card", flow: f });
    } else {
      botSay("Tus citas activas:", () => addBubble({ kind: "appt-card", flow: f }));
    }
  }

  function onCardAction(f: FlowKind) {
    if (f === "reagendar") {
      reset();
      setSpecialty("Dermatología");
      setService("Primera vez");
      navigate({ to: "/disponibilidad" });
    } else if (f === "cancelar") {
      setIdStep("confirm-cancel");
      botSay("¿Confirmas la cancelación?", () => addBubble({ kind: "cancel-confirm" }));
    } else if (f === "confirmar") {
      botSay("✓ Asistencia confirmada. Te esperamos el jueves 8 de mayo, 9:15 AM.");
      setIdStep("done");
    }
  }

  function confirmCancel(yes: boolean) {
    if (yes) {
      userSay("Sí, cancelar");
      botSay("✓ Cita cancelada. ¿Agendamos una nueva?", () =>
        addBubble({ kind: "post-cancel" }),
      );
      setIdStep("done");
    } else {
      userSay("No, volver");
      setIdStep("show-card");
    }
  }

  function editStep(step: AgendarStep) {
    setFlow("agendar");
    setAgStep(step);
    if (step === "specialty") botSay("Claro, ¿qué especialidad prefieres?");
    else if (step === "service") botSay("Claro, ¿qué tipo de servicio prefieres?");
    else if (step === "eps") botSay("Claro, ¿con qué aseguradora?");
    else if (step === "date") botSay("Claro, ¿para cuándo?", () => addBubble({ kind: "date-input" }));
  }

  function newConversation() {
    setBubbles([]);
    setFlow(null);
    setAgStep(null);
    setIdStep(null);
    setDraft({});
    reset();
  }


  // ============ ESTADO 1 — Hero ============
  if (!inChat) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl">
          <div className="mb-10 flex flex-col items-center text-center">
            <CocoLogo className="mb-8 h-16 w-auto" />
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Gestiona tu cita fácil y rápido
            </h1>
          </div>

          <div className="rounded-2xl border border-border bg-card p-2 shadow-sm transition focus-within:border-foreground/40 focus-within:shadow-md">
            <div className="flex items-center gap-2 px-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ej: Quiero agendar una cita de Medicina General para esta semana"
                disabled={!mounted}
                className="flex-1 bg-transparent px-2 py-3 text-base outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={!mounted || !input.trim()}
                aria-label="Enviar"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background transition hover:bg-foreground/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { label: "Agendar una cita", icon: "🗓", intent: "agendar" as const },
              { label: "Gestionar mis citas", icon: "🗂", intent: "gestionar" as const },
              { label: "Consultar información", icon: "ℹ", intent: "consultar" as const },
            ].map((it) => (
              <button
                key={it.intent}
                onClick={() => startFlow(it.intent as FlowKind, { label: it.label })}
                disabled={!mounted}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-foreground hover:bg-muted disabled:opacity-60"
              >
                <span aria-hidden className="text-base leading-none">{it.icon}</span>
                {it.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ ESTADO 2 — Chat ============
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <CocoLogo className="h-8 w-auto" />
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">Asistente Coco</p>
          </div>
          <button
            onClick={newConversation}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva conversación
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
          {bubbles.map((b, i) => {
            const isLast = i === bubbles.length - 1;
            return <BubbleRenderer
              key={b.id}
              bubble={b}
              isLast={isLast}
              draft={draft}
              flow={flow}
              agStep={agStep}
              idStep={idStep}
              onPickSpecialty={pickSpecialty}
              onPickService={pickService}
              onPickEPS={pickEPS}
              onPickDate={pickDate}
              onPickSpecificDate={pickSpecificDate}
              onSubmitDoc={submitDoc}
              onCardAction={onCardAction}
              onConfirmCancel={confirmCancel}
              onPostCancel={(again) => {
                if (again) {
                  userSay("Agendar nueva cita");
                  newConversation();
                  setTimeout(() => startFlow("agendar", { skipUserBubble: true }), 100);
                } else {
                  userSay("No, gracias");
                }
              }}
              onAcceptSuggestedDate={acceptSuggestedDate}
              onRejectSuggestedDate={rejectSuggestedDate}
              onPickManageIntent={pickManageIntent}
            />;
          })}

          {typing && <TypingIndicator />}


          {/* Chips contextuales al final del flujo */}
          {!typing && flow === "agendar" && agStep && (
            <ChipsRow draft={draft} agStep={agStep}
              onPickSpecialty={pickSpecialty}
              onPickService={pickService}
              onPickEPS={pickEPS}
              onPickDate={pickDate}
            />
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-foreground/40">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe tu consulta..."
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Enviar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Subcomponentes ============

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <BotAvatar />
      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
        </div>
      </div>
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card">
      <CocoLogo className="h-5 w-auto" />
    </div>
  );
}

function MsgBubble({ from, text }: { from: "bot" | "user"; text: string }) {
  return (
    <div className={cn("flex items-end gap-2", from === "user" ? "justify-end" : "justify-start")}>
      {from === "bot" && <BotAvatar />}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          from === "bot"
            ? "rounded-bl-sm bg-muted text-foreground"
            : "rounded-br-sm bg-foreground text-background",
        )}
      >
        {text}
      </div>
    </div>
  );
}

function ChipsRow({
  draft, agStep, onPickSpecialty, onPickService, onPickEPS, onPickDate,
}: {
  draft: Draft; agStep: AgendarStep;
  onPickSpecialty: (s: Specialty) => void;
  onPickService: (s: string) => void;
  onPickEPS: (s: string) => void;
  onPickDate: (k: DateChipKey, l: string) => void;
}) {
  if (agStep === "specialty") {
    return (
      <ChipList
        title="Elige especialidad"
        options={[...SPECIALTIES]}
        onPick={(v) => onPickSpecialty(v as Specialty)}
      />
    );
  }
  if (agStep === "service" && draft.specialty) {
    return (
      <ChipList
        title="Elige el tipo de servicio"
        options={SERVICES[draft.specialty]}
        onPick={onPickService}
      />
    );
  }
  if (agStep === "eps") {
    return (
      <ChipList
        title="Elige tu aseguradora"
        options={EPS_OPTIONS}
        top={["Nueva EPS", "EPS Sanitas", "EPS Sura", "EPS Compensar", "Particular"]}
        onPick={onPickEPS}
      />
    );
  }
  if (agStep === "date") {
    const wrap = "flex flex-wrap gap-2 pl-10";
    const chip = "rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:border-foreground hover:bg-muted";
    return (
      <div className={wrap}>
        {DATE_CHIPS.map((d) => (
          <button key={d.key} className={chip} onClick={() => onPickDate(d.key, d.label)}>{d.label}</button>
        ))}
      </div>
    );
  }
  return null;
}

function SummaryChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 pl-10">
      {items.map((it) => (
        <span key={it} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          ✓ {it}
        </span>
      ))}
    </div>
  );
}

function EditableSummary({ draft, onEdit }: { draft: Draft; onEdit: (s: AgendarStep) => void }) {
  const rows: { step: AgendarStep; label: string; value?: string }[] = [
    { step: "specialty", label: "Especialidad", value: draft.specialty },
    { step: "service", label: "Servicio", value: draft.service },
    { step: "eps", label: "Aseguradora", value: draft.eps },
    { step: "date", label: "Fecha", value: draft.dateLabel },
  ].filter((r) => r.value) as { step: AgendarStep; label: string; value: string }[];
  if (rows.length === 0) return null;
  return (
    <div className="ml-10 flex flex-wrap gap-2">
      {rows.map((r) => (
        <button
          key={r.step}
          onClick={() => onEdit(r.step)}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-foreground hover:bg-muted"
          title={`Editar ${r.label.toLowerCase()}`}
        >
          <span className="text-muted-foreground">{r.label}:</span>
          <span className="font-medium">{r.value}</span>
          <Pencil className="h-3 w-3 text-muted-foreground transition group-hover:text-foreground" />
        </button>
      ))}
    </div>
  );
}

function DocInput({ onSubmit, disabled }: { onSubmit: (v: string) => void; disabled: boolean }) {
  const [v, setV] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2 pl-10">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        disabled={disabled}
        placeholder="Número de documento"
        className="w-56 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/40 disabled:opacity-60"
      />
      <button
        disabled={disabled || !v.trim()}
        onClick={() => onSubmit(v.trim())}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-40"
      >
        Continuar
      </button>
    </div>
  );
}

function ApptCard({ flow, onAction, disabled }: { flow: FlowKind; onAction: () => void; disabled: boolean }) {
  const labelMap: Record<string, string> = {
    reagendar: "Reagendar esta cita →",
    cancelar: "Cancelar esta cita",
    confirmar: "Confirmar asistencia",
  };
  return (
    <div className="ml-10 max-w-md rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Dermatología primera vez</p>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Jueves 8 de mayo · 9:15 AM</p>
        <p className="flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> Dra. María Rodríguez</p>
        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Sede Centro</p>
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className={cn(
          "mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40",
          flow === "cancelar"
            ? "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
            : "bg-foreground text-background hover:bg-foreground/90",
        )}
      >
        {flow ? labelMap[flow] : "Continuar"}
      </button>
    </div>
  );
}

function DateInput({ onSubmit, disabled }: { onSubmit: (iso: string) => void; disabled: boolean }) {
  const [v, setV] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="flex flex-wrap items-center gap-2 pl-10">
      <input
        type="date"
        value={v}
        min={today}
        onChange={(e) => setV(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/40 disabled:opacity-60"
      />
      <button
        disabled={disabled || !v}
        onClick={() => onSubmit(v)}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-40"
      >
        Continuar
      </button>
    </div>
  );
}

function BubbleRenderer(props: {
  bubble: Bubble;
  isLast: boolean;
  draft: Draft;
  flow: FlowKind;
  agStep: AgendarStep | null;
  idStep: IdStep | null;
  onPickSpecialty: (s: Specialty) => void;
  onPickService: (s: string) => void;
  onPickEPS: (s: string) => void;
  onPickDate: (k: DateChipKey, l: string) => void;
  onPickSpecificDate: (iso: string) => void;
  onSubmitDoc: (doc: string, f: FlowKind) => void;
  onCardAction: (f: FlowKind) => void;
  onConfirmCancel: (yes: boolean) => void;
  onPostCancel: (again: boolean) => void;
  onAcceptSuggestedDate: (iso: string, label: string) => void;
  onRejectSuggestedDate: () => void;
  onPickManageIntent: (sub: ManageIntent, label: string) => void;
}) {
  const { bubble: b, isLast } = props;
  if (b.kind === "msg") return <MsgBubble from={b.from} text={b.text} />;
  if (b.kind === "summary") return <SummaryChips items={b.items} />;
  if (b.kind === "doc-input") return <DocInput disabled={!isLast} onSubmit={(v) => props.onSubmitDoc(v, b.flow)} />;
  if (b.kind === "date-input") return <DateInput disabled={!isLast} onSubmit={props.onPickSpecificDate} />;
  if (b.kind === "date-suggest") {
    return (
      <div className="flex flex-wrap gap-2 pl-10">
        <button
          disabled={!isLast}
          onClick={() => props.onAcceptSuggestedDate(b.iso, b.label)}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-40"
        >
          Sí, tomar el {b.label}
        </button>
        <button
          disabled={!isLast}
          onClick={() => props.onRejectSuggestedDate()}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40"
        >
          Elegir otra fecha
        </button>
      </div>
    );
  }
  if (b.kind === "appt-card") return <ApptCard flow={b.flow} disabled={!isLast && props.idStep !== "show-card"} onAction={() => props.onCardAction(b.flow)} />;
  if (b.kind === "cancel-confirm") {
    return (
      <div className="flex flex-wrap gap-2 pl-10">
        <button
          disabled={!isLast}
          onClick={() => props.onConfirmCancel(true)}
          className="rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-40"
        >
          Sí, cancelar
        </button>
        <button
          disabled={!isLast}
          onClick={() => props.onConfirmCancel(false)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40"
        >
          No, volver
        </button>
      </div>
    );
  }
  if (b.kind === "post-cancel") {
    return (
      <div className="flex flex-wrap gap-2 pl-10">
        <button
          disabled={!isLast}
          onClick={() => props.onPostCancel(true)}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-40"
        >
          Agendar nueva cita
        </button>
        <button
          disabled={!isLast}
          onClick={() => props.onPostCancel(false)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40"
        >
          No, gracias
        </button>
      </div>
    );
  }
  if (b.kind === "manage-options") {
    const opts: { sub: ManageIntent; label: string; icon: string }[] = [
      { sub: "reagendar", label: "Reagendar mi cita", icon: "🔄" },
      { sub: "cancelar", label: "Cancelar mi cita", icon: "✕" },
      { sub: "confirmar", label: "Confirmar asistencia", icon: "🕐" },
      { sub: "pagar", label: "Pagar mi cita", icon: "💳" },
    ];
    return (
      <div className="flex flex-wrap gap-2 pl-10">
        {opts.map((o) => (
          <button
            key={o.sub}
            disabled={!isLast}
            onClick={() => props.onPickManageIntent(o.sub, o.label)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:border-foreground hover:bg-muted disabled:opacity-40"
          >
            <span aria-hidden className="text-base leading-none">{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  return null;
}
