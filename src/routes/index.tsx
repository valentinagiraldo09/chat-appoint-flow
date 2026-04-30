import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Calendar, RefreshCw, X, CheckCircle2, CreditCard, Info, Mic, Stethoscope } from "lucide-react";
import { useBooking, type Intent } from "@/store/booking";
import { SPECIALTIES, ASEGURADORAS } from "@/mocks/catalog";
import { findPatient, createPatient } from "@/mocks/patients";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asistente de citas médicas" },
      { name: "description", content: "Agenda, reagenda, confirma o cancela tu cita médica con un asistente conversacional." },
    ],
  }),
  component: P0,
});

const INTENTS: { label: string; icon: typeof Calendar; intent: Intent }[] = [
  { label: "Agendar una cita", icon: Calendar, intent: "agendar" },
  { label: "Reagendar mi cita", icon: RefreshCw, intent: "reagendar" },
  { label: "Cancelar mi cita", icon: X, intent: "cancelar" },
  { label: "Confirmar asistencia", icon: CheckCircle2, intent: "confirmar" },
  { label: "Pagar mi cita", icon: CreditCard, intent: "pagar" },
  { label: "Consultar información", icon: Info, intent: "consultar" },
];

const KEYWORDS_AGENDAR = ["agendar", "agenda", "reservar", "turno", "nueva cita", "pedir cita"];

type Bubble = { from: "bot" | "user"; text: string };

type Step =
  | "idle"
  | "terms"
  | "doc"
  | "register_name"
  | "register_email"
  | "register_phone"
  | "register_alt"
  | "register_aseguradora"
  | "intent"
  | "specialty"
  | "done";

function detectIntent(text: string): Intent | null {
  const t = text.toLowerCase();
  if (t.includes("reagend") || t.includes("cambiar") || t.includes("mover")) return "reagendar";
  if (t.includes("cancel")) return "cancelar";
  if (t.includes("confirm")) return "confirmar";
  if (t.includes("pagar") || t.includes("pago")) return "pagar";
  if (KEYWORDS_AGENDAR.some((k) => t.includes(k)) || t.includes("cita")) return "agendar";
  return null;
}

function detectSpecialty(text: string): string | null {
  const t = text.toLowerCase();
  const map: Array<{ key: string; aliases: string[] }> = [
    { key: "Cardiología", aliases: ["cardio", "corazón", "corazon"] },
    { key: "Dermatología", aliases: ["derma", "piel"] },
    { key: "Medicina General", aliases: ["medicina general", "general", "médico general", "medico general"] },
    { key: "Ginecología", aliases: ["gineco"] },
    { key: "Optometría", aliases: ["optome", "vista", "ojos", "lentes"] },
    { key: "Pediatría", aliases: ["pediat", "niño", "nino"] },
  ];
  for (const m of map) if (m.aliases.some((a) => t.includes(a))) return m.key;
  return null;
}

const TERMS_TEXT = `🔒 Términos y condiciones:

La autorización del servicio debe estar vigente para la fecha de tu cita. Si te indica el pago de cuota moderadora o copago, debes realizarlo el día de la consulta.

Al continuar aceptas los términos del servicio y te responsabilizas de la información que compartas.

¿Aceptas los términos para continuar?`;

function P0() {
  const navigate = useNavigate();
  const acceptedTerms = useBooking((s) => s.acceptedTerms);
  const setAcceptedTerms = useBooking((s) => s.setAcceptedTerms);
  const documento = useBooking((s) => s.documento);
  const setDocumento = useBooking((s) => s.setDocumento);
  const setIntent = useBooking((s) => s.setIntent);
  const setSpecialty = useBooking((s) => s.setSpecialty);
  const setAseguradora = useBooking((s) => s.setAseguradora);
  const setPatient = useBooking((s) => s.setPatient);
  const reset = useBooking((s) => s.reset);
  const pushChat = useBooking((s) => s.pushChat);
  const clearChat = useBooking((s) => s.clearChat);

  const [input, setInput] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [step, setStep] = useState<Step>("idle");
  const [mounted, setMounted] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Datos en construcción durante el registro
  const draft = useRef<{
    documento?: string;
    nombre?: string;
    email?: string;
    celular?: string;
    telAlterno?: string;
    aseguradora?: string;
  }>({});

  useEffect(() => setMounted(true), []);

  const inChat = bubbles.length > 0;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [bubbles, typing]);

  function botSay(text: string, after?: () => void) {
    setTyping(true);
    setTimeout(() => {
      setBubbles((b) => [...b, { from: "bot", text }]);
      setTyping(false);
      after?.();
    }, 450);
  }

  function userSay(text: string) {
    setBubbles((b) => [...b, { from: "user", text }]);
  }

  // Transferir bubbles al chat persistente y navegar
  function transferAndNavigate(to: "/disponibilidad" | "/mis-citas" | "/agente" | "/sin-disponibilidad") {
    clearChat();
    bubbles.forEach((b) => pushChat({ from: b.from, text: b.text }));
    setTimeout(() => navigate({ to }), 300);
  }

  // ===== Iniciar conversación =====
  function start(initialIntent?: Intent, initialText?: string) {
    if (initialText) userSay(initialText);
    if (initialIntent) setIntent(initialIntent);

    if (!acceptedTerms) {
      botSay("👋 ¡Hola! Bienvenido a Merlin Global Health.", () => {
        botSay(TERMS_TEXT, () => setStep("terms"));
      });
    } else if (!documento) {
      botSay("🪪 Por favor, escribe el número de documento de identificación del paciente.\n\n💡 (Solo números: sin puntos, comas ni espacios)", () => setStep("doc"));
    } else {
      // Ya identificado → procesar intent
      handleIntentResolved(initialIntent ?? null, initialText ?? null);
    }
  }

  function acceptTerms() {
    userSay("Sí, acepto");
    setAcceptedTerms(true);
    botSay("🪪 Por favor, escribe el número de documento de identificación del paciente.\n\n💡 (Solo números: sin puntos, comas ni espacios)", () => setStep("doc"));
  }

  function rejectTerms() {
    userSay("No");
    botSay("Entendido. Necesitamos que aceptes los términos para continuar. Cuando quieras, vuelve a escribirme. 🙌");
    setStep("done");
  }

  // Procesa documento ingresado
  function handleDoc(text: string) {
    const doc = text.replace(/\D/g, "");
    if (doc.length < 5) {
      botSay("El número de documento debe tener al menos 5 dígitos. Inténtalo nuevamente.");
      return;
    }
    setDocumento(doc);
    const patient = findPatient(doc);
    if (patient) {
      setPatient({
        tipoDocumento: patient.tipoDocumento,
        numeroDocumento: patient.documento,
        nombre: patient.nombre,
        email: patient.email,
        telefono: patient.celular,
        direccion: "",
      });
      botSay(
        `👋 ¡Hola, ${patient.nombre}! Soy tu asistente virtual.\n\nCuéntame, ¿qué quieres hacer hoy?`,
        () => setStep("intent"),
      );
    } else {
      draft.current.documento = doc;
      botSay("👤 Por favor, escribe el nombre completo del paciente:", () => setStep("register_name"));
    }
  }

  function handleIntentResolved(intent: Intent | null, freeText: string | null) {
    const sp = freeText ? detectSpecialty(freeText) : null;
    const eff = intent ?? (sp ? "agendar" : null);
    if (!eff) {
      botSay("Cuéntame, ¿qué quieres hacer hoy? Puedo ayudarte a agendar, reagendar, cancelar, confirmar o pagar una cita.", () => setStep("intent"));
      return;
    }
    setIntent(eff);
    routeByIntent(eff, sp);
  }

  function routeByIntent(intent: Intent, prefilledSpecialty?: string | null) {
    switch (intent) {
      case "agendar": {
        if (prefilledSpecialty) {
          setSpecialty(prefilledSpecialty);
          botSay(`Perfecto, busquemos disponibilidad para ${prefilledSpecialty}…`, () => transferAndNavigate("/disponibilidad"));
        } else {
          botSay("¿Qué especialidad necesitas?", () => setStep("specialty"));
        }
        break;
      }
      case "reagendar":
      case "cancelar":
      case "confirmar":
      case "pagar": {
        const verb = intent === "reagendar" ? "reagendar" : intent === "cancelar" ? "cancelar" : intent === "confirmar" ? "confirmar" : "pagar";
        botSay(`📅 Aquí tienes tus próximas citas. Selecciona la que deseas ${verb}.`, () => transferAndNavigate("/mis-citas"));
        break;
      }
      case "consultar": {
        botSay("Cuéntame qué información necesitas (preparación, resultados, ubicación de sede). Puedes escribirme aquí mismo.");
        setStep("done");
        break;
      }
    }
  }

  function handleIntentChip(intent: Intent, label: string) {
    userSay(label);
    routeByIntent(intent);
  }

  function pickSpecialty(s: string) {
    setSpecialty(s);
    userSay(s);
    botSay(`Genial, busquemos disponibilidad para ${s}…`, () => transferAndNavigate("/disponibilidad"));
  }

  // ===== Registro paciente nuevo =====
  function handleRegister(text: string) {
    if (step === "register_name") {
      draft.current.nombre = text;
      botSay("📧 Por favor, escribe el correo electrónico del paciente:\n\n💡 Ejemplo: juan@correo.com", () => setStep("register_email"));
    } else if (step === "register_email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        botSay("Ese correo no parece válido. Inténtalo de nuevo.");
        return;
      }
      draft.current.email = text;
      botSay("📱 Escribe el número de celular del paciente:", () => setStep("register_phone"));
    } else if (step === "register_phone") {
      const cel = text.replace(/\D/g, "");
      if (cel.length < 7) { botSay("El celular debe tener al menos 7 dígitos."); return; }
      draft.current.celular = cel;
      botSay("📞 ¿Tienes un número de teléfono alternativo? Si no, escribe 0 para continuar.", () => setStep("register_alt"));
    } else if (step === "register_alt") {
      draft.current.telAlterno = text.trim() === "0" ? undefined : text.replace(/\D/g, "");
      botSay(
        `🔍 Para terminar de registrarte, escribe el nombre de tu aseguradora o EPS.\n\n💡 Ejemplo: ${ASEGURADORAS.join(", ")}`,
        () => setStep("register_aseguradora"),
      );
    } else if (step === "register_aseguradora") {
      const lower = text.toLowerCase();
      const match = ASEGURADORAS.find((a) => a.toLowerCase().includes(lower) || lower.includes(a.toLowerCase().split(" ").slice(-1)[0]));
      const aseg = match ?? text;
      draft.current.aseguradora = aseg;
      setAseguradora(aseg);

      const d = draft.current;
      if (d.documento && d.nombre && d.email && d.celular) {
        createPatient({
          documento: d.documento,
          tipoDocumento: "Cédula de ciudadanía",
          nombre: d.nombre,
          email: d.email,
          celular: d.celular,
          telAlterno: d.telAlterno,
        });
        setPatient({
          tipoDocumento: "Cédula de ciudadanía",
          numeroDocumento: d.documento,
          nombre: d.nombre,
          email: d.email,
          telefono: d.celular,
          direccion: "",
        });
      }

      // Si la aseguradora requiere agente (mock: Sura para pacientes nuevos)
      if (aseg.toLowerCase().includes("sura")) {
        botSay("🧑‍💼 Te estoy conectando con uno de nuestros agentes. Por favor espera un momento…", () => transferAndNavigate("/agente"));
      } else {
        botSay(`👋 ¡Hola, ${d.nombre}! Tu registro quedó listo. ¿Qué quieres hacer hoy?`, () => setStep("intent"));
      }
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    // Estado inicial → empezar flujo
    if (step === "idle") {
      const intent = detectIntent(text);
      start(intent ?? undefined, text);
      return;
    }

    userSay(text);

    if (step === "doc") return handleDoc(text);
    if (step.startsWith("register_")) return handleRegister(text);

    if (step === "intent") {
      const intent = detectIntent(text);
      const sp = detectSpecialty(text);
      if (intent || sp) {
        const eff = intent ?? "agendar";
        setIntent(eff);
        routeByIntent(eff, sp);
      } else {
        botSay("No entendí bien. Selecciona una opción de las de abajo o escríbeme algo como “quiero agendar dermatología” o “cancelar mi cita”.");
      }
      return;
    }

    if (step === "specialty") {
      const sp = detectSpecialty(text);
      if (sp) pickSpecialty(sp);
      else botSay("No reconocí esa especialidad. Elige una de las opciones de abajo:");
      return;
    }

    botSay("Estoy aquí. Si quieres iniciar de nuevo, presiona “Nueva conversación”.");
  }

  function newConversation() {
    setBubbles([]);
    setStep("idle");
    reset();
  }

  // ===== Vista inicial (hero) =====
  if (!inChat) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-16 pt-12 md:pt-24">
          <header className="mb-10 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Stethoscope className="h-6 w-6" />
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
                placeholder={mounted ? "Escribe lo que necesitas… ej: Quiero una cita de dermatología" : "Cargando asistente..."}
                disabled={!mounted}
                className="flex-1 bg-transparent px-2 py-3 text-base outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={!mounted}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {INTENTS.map((it) => (
              <button
                key={it.intent}
                onClick={() => start(it.intent, it.label)}
                disabled={!mounted}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== Vista chat =====
  return (
    <div className="flex h-screen flex-col bg-background">
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
            onClick={newConversation}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Nueva conversación
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
          {bubbles.map((b, i) => (
            <div key={i} className={cn("flex items-end gap-2", b.from === "user" ? "justify-end" : "justify-start")}>
              {b.from === "bot" && (
                <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Stethoscope className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
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

          {/* Chips contextuales */}
          {!typing && step === "terms" && (
            <div className="flex flex-wrap gap-2 pl-9 pt-2">
              <button onClick={acceptTerms} className="rounded-full border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                Sí, acepto
              </button>
              <button onClick={rejectTerms} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
                No
              </button>
            </div>
          )}

          {!typing && step === "intent" && (
            <div className="flex flex-wrap gap-2 pl-9 pt-2">
              {INTENTS.map((it) => (
                <button
                  key={it.intent}
                  onClick={() => handleIntentChip(it.intent, it.label)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </button>
              ))}
            </div>
          )}

          {!typing && step === "specialty" && (
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

          {!typing && step === "register_aseguradora" && (
            <div className="flex flex-wrap gap-2 pl-9 pt-2">
              {ASEGURADORAS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setInput(a); setTimeout(handleSend, 0); }}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Dictar">
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
