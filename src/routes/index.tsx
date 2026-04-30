import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Calendar, RefreshCw, X, CheckCircle2, CreditCard, Info, Mic, Stethoscope } from "lucide-react";
import { useBooking } from "@/store/booking";
import { SPECIALTIES } from "@/mocks/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asistente de citas médicas" },
      { name: "description", content: "Agenda, reagenda o paga tu cita médica con un asistente conversacional." },
    ],
  }),
  component: P0,
});

const INTENTS = [
  { label: "Agendar una cita", icon: Calendar, intent: "agendar" as const },
  { label: "Reagendar mi cita", icon: RefreshCw, intent: "reagendar" as const },
  { label: "Cancelar mi cita", icon: X, intent: "cancelar" as const },
  { label: "Confirmar asistencia", icon: CheckCircle2, intent: "confirmar" as const },
  { label: "Pagar mi cita", icon: CreditCard, intent: "pagar" as const },
  { label: "Consultar información", icon: Info, intent: "consultar" as const },
];

const KEYWORDS_AGENDAR = ["agendar", "agenda", "cita", "doctor", "doctora", "reservar", "turno", "consulta", "especialista"];

type Bubble = { from: "bot" | "user"; text: string };

function detectIntent(text: string): string | null {
  const t = text.toLowerCase();
  if (KEYWORDS_AGENDAR.some((k) => t.includes(k))) return "agendar";
  if (t.includes("reagend")) return "reagendar";
  if (t.includes("cancel")) return "cancelar";
  if (t.includes("confirm")) return "confirmar";
  if (t.includes("pag")) return "pagar";
  return null;
}

// Detecta especialidad escrita libremente (con sinónimos comunes)
function detectSpecialty(text: string): string | null {
  const t = text.toLowerCase();
  const map: Array<{ key: string; aliases: string[] }> = [
    { key: "Cardiología", aliases: ["cardio", "corazón", "corazon", "cardiolog"] },
    { key: "Dermatología", aliases: ["derma", "piel", "dermatolog"] },
    { key: "Medicina General", aliases: ["medicina general", "general", "médico general", "medico general"] },
    { key: "Ginecología", aliases: ["gineco", "ginecolog"] },
    { key: "Optometría", aliases: ["optome", "vista", "ojos", "lentes"] },
    { key: "Pediatría", aliases: ["pediat", "niño", "nino", "hijo"] },
  ];
  for (const m of map) {
    if (m.aliases.some((a) => t.includes(a))) return m.key;
  }
  return null;
}

function P0() {
  const navigate = useNavigate();
  const setSpecialty = useBooking((s) => s.setSpecialty);
  const reset = useBooking((s) => s.reset);
  const pushChat = useBooking((s) => s.pushChat);
  const clearChat = useBooking((s) => s.clearChat);
  const [input, setInput] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [step, setStep] = useState<"idle" | "intent" | "specialty" | "other">("idle");
  const [mounted, setMounted] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    setMounted(true);
  }, []);

  const inChat = bubbles.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [bubbles, typing]);

  function botSay(text: string, after?: () => void) {
    setTyping(true);
    setTimeout(() => {
      setBubbles((b) => [...b, { from: "bot", text }]);
      setTyping(false);
      after?.();
    }, 450);
  }

  function transferChatAndGo(specialty: string) {
    // Transferir bubbles actuales al chat persistente
    clearChat();
    bubbles.forEach((b) => {
      if (b.from === "user" || b.from === "bot") {
        pushChat({ from: b.from, text: b.text });
      }
    });
    pushChat({
      from: "bot",
      text: `Listo. Estoy mostrando disponibilidad para ${specialty}. Puedo aplicar filtros si me los pides aquí, o si los seleccionas en la interfaz te lo confirmo.`,
    });
    setTimeout(() => navigate({ to: "/disponibilidad" }), 500);
  }

  function startAgendarFlow(prefilledSpecialty?: string | null) {
    reset();
    if (prefilledSpecialty) {
      setSpecialty(prefilledSpecialty);
      botSay(`Perfecto, busquemos disponibilidad para ${prefilledSpecialty}. Te llevo a la agenda…`, () => {
        transferChatAndGo(prefilledSpecialty);
      });
      setStep("other");
    } else {
      botSay("Perfecto. ¿Qué especialidad necesitas?", () => setStep("specialty"));
    }
  }

  function handleIntent(intent: string, label?: string, prefilledSpecialty?: string | null) {
    if (label) setBubbles((b) => [...b, { from: "user", text: label }]);
    if (intent === "agendar") {
      startAgendarFlow(prefilledSpecialty);
    } else {
      const map: Record<string, string> = {
        reagendar: "Para reagendar necesitamos el código de tu cita. (Demo: esta opción no está implementada en el prototipo).",
        cancelar: "Lamentamos que tengas que cancelar. (Demo: esta opción no está implementada en el prototipo).",
        confirmar: "Confirma tu asistencia con el código que te enviamos. (Demo: prototipo).",
        pagar: "Puedes pagar una cita pendiente con tu código. (Demo: prototipo).",
        consultar: "Cuéntame qué información necesitas y te ayudo. (Demo: prototipo).",
      };
      botSay(map[intent]);
      setStep("other");
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setBubbles((b) => [...b, { from: "user", text }]);
    setInput("");

    // Si estamos pidiendo especialidad, intentar reconocerla del texto
    if (step === "specialty") {
      const sp = detectSpecialty(text);
      if (sp) {
        setSpecialty(sp);
        botSay(`Genial, busquemos disponibilidad para ${sp}…`, () => {
          transferChatAndGo(sp);
        });
        setStep("other");

      } else {
        botSay("No reconocí esa especialidad. Elige una de las opciones de abajo:");
      }
      return;
    }

    const intent = detectIntent(text);
    const sp = detectSpecialty(text);

    if (intent) {
      // Si en el primer mensaje ya viene especialidad, saltar la pregunta
      handleIntent(intent, undefined, sp);
    } else if (sp) {
      // Mencionó especialidad sin verbo claro → asumir agendar
      handleIntent("agendar", undefined, sp);
    } else {
      botSay("Puedo ayudarte a agendar, reagendar, cancelar, confirmar o pagar una cita. ¿Qué quieres hacer?");
    }
  }

  function pickSpecialty(s: string) {
    setSpecialty(s);
    setBubbles((b) => [...b, { from: "user", text: s }]);
    botSay(`Genial, busquemos disponibilidad para ${s}…`, () => {
      transferChatAndGo(s);
    });
    setStep("other");
  }


  // ===== Vista inicial (hero) — estilo COCO =====
  if (!inChat) {
    return (
      <div
        className="min-h-screen w-full"
        style={{ backgroundColor: "var(--coco-mint)" }}
      >
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16">
          {/* Logo COCO */}
          <div className="mb-10 flex flex-col items-center">
            <div className="flex items-center gap-1 text-5xl font-extrabold tracking-tight" style={{ color: "var(--coco-ink)" }}>
              <span>C</span>
              <span className="relative inline-flex h-10 w-10 items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full border-[3px]"
                  style={{ borderColor: "var(--coco-ink)" }}
                />
                <span
                  className="absolute -top-2 left-1/2 h-3 w-1.5 -translate-x-1/2 rotate-12 rounded-full"
                  style={{ backgroundColor: "var(--coco-green-strong)" }}
                />
              </span>
              <span>CO</span>
            </div>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.3em]" style={{ color: "var(--coco-ink)" }}>
              AI &amp; E-HEALTH
            </p>
          </div>

          {/* Título */}
          <h1
            className="mb-10 text-center text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl"
            style={{ color: "var(--coco-ink)" }}
          >
            Gestiona tus citas
            <br />
            fácil y rápido
          </h1>

          {/* Barra de búsqueda */}
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path
                  d="M12 2l1.8 5.4L19.2 9 13.8 10.8 12 16.2 10.2 10.8 4.8 9l5.4-1.8L12 2z"
                  fill="var(--coco-green-strong)"
                />
              </svg>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={mounted ? "¿Cómo puedo ayudarte hoy?" : "Cargando asistente..."}
                disabled={!mounted}
                className="flex-1 bg-transparent py-3 text-base outline-none placeholder:text-neutral-400 disabled:opacity-60"
                style={{ color: "var(--coco-ink)" }}
              />
              <button
                onClick={handleSend}
                disabled={!mounted}
                aria-label="Enviar"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--coco-green-strong)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chips de intents */}
          <div className="mt-16 flex flex-wrap justify-center gap-3">
            {INTENTS.map((it) => (
              <button
                key={it.intent}
                onClick={() => handleIntent(it.intent, it.label)}
                disabled={!mounted}
                className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ color: "var(--coco-ink)" }}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== Vista chat (barra fija abajo) =====
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header chat */}
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">Asistente médico</p>
            <p className="text-xs text-emerald-600">● en línea</p>
          </div>
          <button
            onClick={() => {
              setBubbles([]);
              setStep("idle");
              reset();
            }}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Nueva conversación
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
          {bubbles.map((b, i) => (
            <div
              key={i}
              className={cn(
                "flex items-end gap-2",
                b.from === "user" ? "justify-end" : "justify-start",
              )}
            >
              {b.from === "bot" && (
                <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Stethoscope className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  b.from === "bot"
                    ? "rounded-bl-sm bg-muted text-foreground"
                    : "rounded-br-sm bg-foreground text-background",
                )}
              >
                {b.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-end gap-2">
              <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Stethoscope className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                </div>
              </div>
            </div>
          )}

          {step === "specialty" && !typing && (
            <div className="flex flex-wrap gap-2 pl-9 pt-2">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  onClick={() => pickSpecialty(s)}
                  className="rounded-full border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barra de escritura fija */}
      <div className="border-t border-border bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 shadow-sm">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribí tu consulta..."
              className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Dictar"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Las respuestas son automáticas y pueden contener errores. No compartas datos personales.
          </p>
        </div>
      </div>
    </div>
  );
}
