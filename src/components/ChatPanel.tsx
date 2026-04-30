import { useEffect, useRef, useState } from "react";
import { Send, Stethoscope, Mic } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useBooking, type Filters, type Intent } from "@/store/booking";
import {
  SEDES,
  PROFESIONALES,
  ATTENTION_TYPES,
  FRANJAS,
  SPECIALTIES,
  SERVICES,
  type Specialty,
} from "@/mocks/catalog";
import { cn } from "@/lib/utils";

// ---- Detección de comandos en texto libre ----
function detectSede(t: string): string | undefined {
  const lower = t.toLowerCase();
  return SEDES.find((s) => lower.includes(s.toLowerCase())) ||
    SEDES.find((s) => {
      const last = s.toLowerCase().split(" ").slice(-1)[0];
      return last.length > 4 && lower.includes(last);
    });
}
function detectProfesional(t: string): string | undefined {
  const lower = t.toLowerCase();
  return PROFESIONALES.find((p) => lower.includes(p.toLowerCase())) ||
    PROFESIONALES.find((p) =>
      p.toLowerCase().split(" ").some((w) => w.length > 4 && lower.includes(w)),
    );
}
function detectAttention(t: string): Filters["attention"] | undefined {
  const lower = t.toLowerCase();
  if (lower.includes("telemedicina") || lower.includes("virtual") || lower.includes("video")) return "Telemedicina";
  if (lower.includes("telefón") || lower.includes("telefon") || lower.includes("llamada")) return "Telefónica";
  if (lower.includes("presencial") || lower.includes("en sede") || lower.includes("en persona")) return "Presencial";
  return undefined;
}
function detectFranja(t: string): Filters["franja"] | undefined {
  const lower = t.toLowerCase();
  if (lower.includes("mañana") || lower.includes("manana") || lower.includes("am")) return "Mañana";
  if (lower.includes("tarde")) return "Tarde";
  if (lower.includes("noche") || lower.includes("pm tarde-noche")) return "Noche";
  return undefined;
}
function detectSpecialty(t: string): Specialty | undefined {
  const lower = t.toLowerCase();
  const map: Record<string, Specialty> = {
    cardio: "Cardiología", "corazón": "Cardiología", corazon: "Cardiología",
    derma: "Dermatología", piel: "Dermatología",
    "medicina general": "Medicina General", general: "Medicina General",
    gineco: "Ginecología",
    optome: "Optometría", ojos: "Optometría", vista: "Optometría",
    pediat: "Pediatría", "niño": "Pediatría", nino: "Pediatría",
  };
  for (const k of Object.keys(map)) {
    if (lower.includes(k)) return map[k];
  }
  return undefined;
}

const SUGGESTIONS = [
  "Mostrar solo en la mañana",
  "Quiero telemedicina",
  "Filtrar por Sede Suba",
  "Limpiar filtros",
];

export function ChatPanel() {
  const navigate = useNavigate();
  const chat = useBooking((s) => s.chat);
  const pushChat = useBooking((s) => s.pushChat);
  const clearChat = useBooking((s) => s.clearChat);
  const filters = useBooking((s) => s.filters);
  const filterSource = useBooking((s) => s.filterSource);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const setFilter = useBooking((s) => s.setFilter);
  const clearFilterFn = useBooking((s) => s.clearFilter);
  const resetFilters = useBooking((s) => s.resetFilters);
  const setSpecialty = useBooking((s) => s.setSpecialty);
  const setService = useBooking((s) => s.setService);
  const setIntent = useBooking((s) => s.setIntent);
  const documento = useBooking((s) => s.documento);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeenFilters = useRef<Filters>(filters);
  const lastSeenSpecialty = useRef(specialty);

  // Mensaje de bienvenida si está vacío
  useEffect(() => {
    if (chat.length === 0 && specialty) {
      pushChat({
        from: "bot",
        text: `Estoy mostrando disponibilidad para ${specialty}${service ? ` — ${service}` : ""}. Puedes pedirme que filtre por sede, profesional, tipo de atención o franja horaria.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, typing]);

  // ===== UI -> CHAT: detectar cambios de filtros desde la interfaz =====
  useEffect(() => {
    if (filterSource !== "ui") {
      lastSeenFilters.current = filters;
      return;
    }
    const prev = lastSeenFilters.current;
    const changes: string[] = [];
    (["sede", "profesional", "attention", "franja"] as const).forEach((k) => {
      const a = prev[k];
      const b = filters[k];
      if (a !== b) {
        if (b) changes.push(`${labelFor(k)}: ${b}`);
        else changes.push(`${labelFor(k)}: (sin filtro)`);
      }
    });
    lastSeenFilters.current = filters;
    if (changes.length > 0) {
      pushChat({
        from: "system",
        text: `Aplicaste un filtro desde la interfaz · ${changes.join(" · ")}. Estoy actualizando los resultados.`,
      });
    }
  }, [filters, filterSource, pushChat]);

  // Cambio de especialidad/servicio
  useEffect(() => {
    if (specialty && specialty !== lastSeenSpecialty.current) {
      pushChat({
        from: "system",
        text: `Cambiaste a ${specialty}${service ? ` — ${service}` : ""}. Refrescando disponibilidad…`,
      });
      lastSeenSpecialty.current = specialty;
    }
  }, [specialty, service, pushChat]);

  function botSay(text: string) {
    setTyping(true);
    setTimeout(() => {
      pushChat({ from: "bot", text });
      setTyping(false);
    }, 400);
  }

  function applyFromText(text: string) {
    const lower = text.toLowerCase();
    let acted = false;
    const applied: string[] = [];

    // Comandos de gestión de citas
    const mgmtIntent = detectMgmtIntent(lower);
    if (mgmtIntent) {
      if (!documento) {
        botSay("Para gestionar tus citas necesito tu documento. Inicia el flujo desde el inicio.");
        return true;
      }
      setIntent(mgmtIntent);
      const verb = mgmtIntent === "reagendar" ? "reagendar" : mgmtIntent === "cancelar" ? "cancelar" : mgmtIntent === "confirmar" ? "confirmar" : "pagar";
      botSay(`Te llevo a tus próximas citas para ${verb}…`);
      setTimeout(() => navigate({ to: "/mis-citas" }), 400);
      return true;
    }

    // Limpiar filtros
    if (lower.includes("limpia") || lower.includes("quita") || lower.includes("remover") || lower.includes("borra") && lower.includes("filtro")) {
      if (lower.includes("filtro") || lower.includes("todo")) {
        resetFilters("chat");
        botSay("Listo, quité todos los filtros. Mostrando toda la disponibilidad.");
        return true;
      }
    }

    // Especialidad
    const sp = detectSpecialty(text);
    if (sp && sp !== specialty) {
      setSpecialty(sp);
      const def = SERVICES[sp]?.[0];
      if (def) setService(def);
      applied.push(`especialidad ${sp}`);
      acted = true;
    }

    // Sede
    const sede = detectSede(text);
    if (sede) {
      setFilter("sede", sede, "chat");
      applied.push(`sede "${sede}"`);
      acted = true;
    }

    // Profesional
    const prof = detectProfesional(text);
    if (prof) {
      setFilter("profesional", prof, "chat");
      applied.push(`profesional ${prof}`);
      acted = true;
    }

    // Tipo atención
    const att = detectAttention(text);
    if (att) {
      setFilter("attention", att, "chat");
      applied.push(`atención ${att}`);
      acted = true;
    }

    // Franja
    const fr = detectFranja(text);
    if (fr) {
      setFilter("franja", fr, "chat");
      applied.push(`franja ${fr}`);
      acted = true;
    }

    if (acted) {
      botSay(`Aplicando ${applied.join(", ")}. Mira los resultados a la derecha →`);
      return true;
    }
    return false;
  }

  function handleSend(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text) return;
    pushChat({ from: "user", text });
    setInput("");

    const acted = applyFromText(text);
    if (!acted) {
      botSay(
        "Puedo filtrar por sede, profesional, tipo de atención (presencial / telemedicina / telefónica) o franja (mañana / tarde / noche). También puedes cambiar de especialidad. Por ejemplo: \"muéstrame solo telemedicina en la tarde\".",
      );
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Asistente médico</p>
          <p className="text-xs text-emerald-600">● en línea</p>
        </div>
        <button
          onClick={() => clearChat()}
          className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
        >
          Limpiar
        </button>
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-3">
          {chat.length === 0 && (
            <div className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Escríbele al asistente para refinar la búsqueda. Cualquier filtro que apliques aquí abajo o en la interfaz se sincroniza.
            </div>
          )}
          {chat.map((m) => (
            <Bubble key={m.id} from={m.from} text={m.text} />
          ))}
          {typing && (
            <div className="flex items-end gap-2">
              <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Stethoscope className="h-3 w-3" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sugerencias */}
      <div className="flex flex-wrap gap-1.5 border-t border-border px-3 pt-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pídeme que filtre…"
            className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Dictar"
          >
            <Mic className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleSend()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90"
            aria-label="Enviar"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ from, text }: { from: "bot" | "user" | "system"; text: string }) {
  if (from === "system") {
    return (
      <div className="mx-auto max-w-[90%] rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-center text-[11px] text-emerald-800">
        {text}
      </div>
    );
  }
  return (
    <div className={cn("flex items-end gap-2", from === "user" ? "justify-end" : "justify-start")}>
      {from === "bot" && (
        <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Stethoscope className="h-3 w-3" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
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

function labelFor(k: keyof Filters): string {
  switch (k) {
    case "sede": return "Sede";
    case "profesional": return "Profesional";
    case "attention": return "Tipo de atención";
    case "franja": return "Franja";
  }
}

// Evitar warnings de import no usado
void ATTENTION_TYPES; void FRANJAS; void SPECIALTIES;
