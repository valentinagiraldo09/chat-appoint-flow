import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Calendar, RefreshCw, X, CheckCircle2, CreditCard, Info } from "lucide-react";
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

function P0() {
  const navigate = useNavigate();
  const setSpecialty = useBooking((s) => s.setSpecialty);
  const reset = useBooking((s) => s.reset);
  const [input, setInput] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [step, setStep] = useState<"intent" | "specialty" | "other">("intent");
  const [mounted, setMounted] = useState(false);
  // Avoid SSR/hydration timing where first click is lost
  if (typeof window !== "undefined" && !mounted) {
    queueMicrotask(() => setMounted(true));
  }

  function handleIntent(intent: string, label?: string) {
    if (label) setBubbles((b) => [...b, { from: "user", text: label }]);
    if (intent === "agendar") {
      reset();
      setBubbles((b) => [...b, { from: "bot", text: "Perfecto. ¿Qué especialidad necesitas?" }]);
      setStep("specialty");
    } else {
      const map: Record<string, string> = {
        reagendar: "Para reagendar necesitamos el código de tu cita. (Demo: esta opción no está implementada en el prototipo).",
        cancelar: "Lamentamos que tengas que cancelar. (Demo: esta opción no está implementada en el prototipo).",
        confirmar: "Confirma tu asistencia con el código que te enviamos. (Demo: prototipo).",
        pagar: "Puedes pagar una cita pendiente con tu código. (Demo: prototipo).",
        consultar: "Cuéntame qué información necesitas y te ayudo. (Demo: prototipo).",
      };
      setBubbles((b) => [...b, { from: "bot", text: map[intent] }]);
      setStep("other");
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setBubbles((b) => [...b, { from: "user", text }]);
    setInput("");
    const intent = detectIntent(text);
    if (intent) {
      setTimeout(() => handleIntent(intent), 300);
    } else {
      setTimeout(
        () =>
          setBubbles((b) => [
            ...b,
            { from: "bot", text: "Puedo ayudarte a agendar, reagendar, cancelar, confirmar o pagar una cita. ¿Qué quieres hacer?" },
          ]),
        300,
      );
    }
  }

  function pickSpecialty(s: string) {
    setSpecialty(s);
    setBubbles((b) => [...b, { from: "user", text: s }]);
    setTimeout(() => navigate({ to: "/disponibilidad" }), 250);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-12 md:pt-20">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Calendar className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Hola, soy tu asistente médico</h1>
          <p className="mt-2 text-muted-foreground">¿En qué te ayudo hoy?</p>
        </header>

        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="¿Qué quieres hacer hoy?"
              className="flex-1 bg-transparent px-2 py-3 text-base outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSend}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {INTENTS.map((it) => (
            <button
              key={it.intent}
              onClick={() => handleIntent(it.intent, it.label)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-foreground hover:bg-muted"
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </button>
          ))}
        </div>

        {bubbles.length > 0 && (
          <div className="mt-8 space-y-3">
            {bubbles.map((b, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  b.from === "bot"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-foreground text-background",
                )}
              >
                {b.text}
              </div>
            ))}
            {step === "specialty" && (
              <div className="flex flex-wrap gap-2 pt-2">
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
        )}
      </div>
    </div>
  );
}
