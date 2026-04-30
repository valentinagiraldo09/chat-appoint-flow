import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Headphones, Loader2, MessageSquare, Home } from "lucide-react";
import { useBooking } from "@/store/booking";

export const Route = createFileRoute("/agente")({
  head: () => ({ meta: [{ title: "Conectando con un agente" }] }),
  component: Agente,
});

function Agente() {
  const documento = useBooking((s) => s.documento);
  const aseguradora = useBooking((s) => s.aseguradora);
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    const t = setTimeout(() => setConnected(true), 6000);
    return () => { clearInterval(id); clearTimeout(t); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          {connected ? <MessageSquare className="h-8 w-8" /> : <Headphones className="h-8 w-8" />}
        </div>
        <h1 className="mt-5 text-2xl font-bold md:text-3xl">
          {connected ? "Estás en contacto con un agente" : "Conectando con un agente…"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {connected
            ? "Un agente humano continuará contigo desde aquí. Puedes seguir escribiendo y te responderá en breve."
            : "Tu solicitud requiere atención personalizada. Te estamos transfiriendo, por favor espera un momento."}
        </p>

        <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-border bg-card p-5 text-left text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Documento</span>
            <span className="font-medium">{documento ?? "—"}</span>
          </div>
          {aseguradora && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Aseguradora</span>
              <span className="font-medium">{aseguradora}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted-foreground">Tiempo en cola</span>
            <span className="font-medium">{seconds}s</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted-foreground">Estado</span>
            <span className={connected ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
              {connected ? "Agente conectado" : "En cola"}
            </span>
          </div>
        </div>

        {!connected && (
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Tiempo estimado: menos de 30s
          </div>
        )}

        <div className="mt-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
