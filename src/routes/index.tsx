import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Stethoscope, Search, ChevronDown } from "lucide-react";
import { useBooking } from "@/store/booking";
import { SPECIALTIES, SERVICES, type Specialty } from "@/mocks/catalog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda tu cita médica" },
      { name: "description", content: "Selecciona tu especialidad y agenda tu cita médica en línea." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const setSpecialty = useBooking((s) => s.setSpecialty);
  const setService = useBooking((s) => s.setService);

  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<Specialty | null>(specialty as Specialty | null);

  const label = specialty
    ? service
      ? `${specialty} — ${service}`
      : specialty
    : "Selecciona servicio";

  function buscar() {
    if (!specialty) return;
    if (!service) {
      const def = SERVICES[specialty as Specialty]?.[0];
      if (def) setService(def);
    }
    navigate({ to: "/disponibilidad" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-16 pt-12 md:pt-24">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Agenda tu cita médica</h1>
          <p className="mt-2 text-muted-foreground">Selecciona el servicio que necesitas y encuentra disponibilidad.</p>
        </header>

        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-1">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-full border border-border bg-background px-4 py-3 text-left text-sm font-medium hover:border-foreground">
                    <span className="truncate">{label}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[420px] p-0">
                  <div className="flex">
                    <div className="w-1/2 border-r border-border p-2">
                      {SPECIALTIES.map((sp) => (
                        <button
                          key={sp}
                          onMouseEnter={() => setHover(sp)}
                          onClick={() => setHover(sp)}
                          className={cn(
                            "block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted",
                            hover === sp && "bg-muted font-semibold",
                          )}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                    <div className="w-1/2 p-2">
                      {hover &&
                        SERVICES[hover].map((sv) => (
                          <button
                            key={sv}
                            onClick={() => {
                              setSpecialty(hover);
                              setService(sv);
                              setOpen(false);
                            }}
                            className={cn(
                              "block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted",
                              specialty === hover && service === sv && "bg-emerald-50 font-semibold text-emerald-700",
                            )}
                          >
                            {sv}
                          </button>
                        ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <button
              onClick={buscar}
              disabled={!specialty}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              <Search className="h-4 w-4" /> Buscar disponibilidad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
