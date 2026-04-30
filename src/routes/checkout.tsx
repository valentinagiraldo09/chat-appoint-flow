import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Loader2, Upload, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useBooking } from "@/store/booking";
import { ASEGURADORAS, TIPOS_DOCUMENTO } from "@/mocks/catalog";
import { validateCoverage, type CoverageResult } from "@/mocks/coverage";
import { parseYmd } from "@/mocks/availability";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Datos del paciente" }] }),
  component: P4,
});

const schema = z.object({
  tipoDocumento: z.string().min(1, "Requerido"),
  numeroDocumento: z.string().min(4, "Requerido"),
  nombre: z.string().min(3, "Requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(7, "Requerido"),
  direccion: z.string().min(3, "Requerido"),
  aseguradora: z.string().min(1, "Requerido"),
  acceptTerms: z.literal(true, { message: "Debes aceptar el tratamiento de datos" }),
});

type FormValues = z.infer<typeof schema>;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={cn(
          "rounded-xl border border-border bg-background px-4 py-2 focus-within:border-foreground",
          error && "border-destructive",
        )}
      >
        <label className="block text-xs text-muted-foreground">
          <span className="text-destructive">*</span> {label}
        </label>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function P4() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const setPatient = useBooking((s) => s.setPatient);
  const setAseguradora = useBooking((s) => s.setAseguradora);
  const setCoverage = useBooking((s) => s.setCoverage);
  const setPayParticularOverride = useBooking((s) => s.setPayParticularOverride);
  const setAcceptedSuggestedDate = useBooking((s) => s.setAcceptedSuggestedDate);

  const [validating, setValidating] = useState(false);
  const [coverage, setLocalCoverage] = useState<CoverageResult | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!slot) navigate({ to: "/" });
  }, [slot, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipoDocumento: "",
      numeroDocumento: "",
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      aseguradora: "",
      acceptTerms: false as unknown as true,
    },
  });

  function onSubmit(values: FormValues) {
    setPatient({
      tipoDocumento: values.tipoDocumento,
      numeroDocumento: values.numeroDocumento,
      nombre: values.nombre,
      email: values.email,
      telefono: values.telefono,
      direccion: values.direccion,
    });
    setAseguradora(values.aseguradora);

    if (values.aseguradora === "Particular") {
      const r: CoverageResult = { case: 1, message: "Pago particular" };
      setCoverage(r);
      setPayParticularOverride(true);
      navigate({ to: "/oportunidad" });
      return;
    }

    setValidating(true);
    setTimeout(() => {
      const result = validateCoverage(values.aseguradora, specialty ?? "", service ?? "");
      setLocalCoverage(result);
      setCoverage(result);
      setValidating(false);
    }, 1100);
  }

  function proceed(particular: boolean, acceptSuggested = false) {
    setPayParticularOverride(particular);
    setAcceptedSuggestedDate(acceptSuggested);
    navigate({ to: "/oportunidad" });
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    const all = [...files, ...Array.from(list)].slice(0, 3);
    const total = all.reduce((s, f) => s + f.size, 0);
    if (total > 15 * 1024 * 1024) {
      alert("El total no puede superar 15 MB");
      return;
    }
    setFiles(all);
  }

  if (!slot) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="text-3xl font-bold">¿Para quién es esta cita?</h1>
        <p className="mt-2 text-muted-foreground">Completa los datos de la persona que asistirá a la cita.</p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tipo de documento" error={form.formState.errors.tipoDocumento?.message}>
              <select
                {...form.register("tipoDocumento")}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value=""></option>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Número de documento" error={form.formState.errors.numeroDocumento?.message}>
              <input {...form.register("numeroDocumento")} className="w-full bg-transparent text-sm outline-none" />
            </Field>
            <Field label="Nombre completo" error={form.formState.errors.nombre?.message}>
              <input {...form.register("nombre")} className="w-full bg-transparent text-sm outline-none" />
            </Field>
            <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
              <input type="email" {...form.register("email")} className="w-full bg-transparent text-sm outline-none" />
            </Field>
            <Field label="Teléfono" error={form.formState.errors.telefono?.message}>
              <input {...form.register("telefono")} className="w-full bg-transparent text-sm outline-none" />
            </Field>
            <Field label="Dirección" error={form.formState.errors.direccion?.message}>
              <input {...form.register("direccion")} className="w-full bg-transparent text-sm outline-none" />
            </Field>
          </div>

          <div className="pt-2">
            <Field label="Aseguradora" error={form.formState.errors.aseguradora?.message}>
              <select {...form.register("aseguradora")} className="w-full bg-transparent text-sm outline-none">
                <option value=""></option>
                {ASEGURADORAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>
          </div>

          <label className="flex items-start gap-2 pt-2 text-sm">
            <input type="checkbox" {...form.register("acceptTerms")} className="mt-0.5" />
            <span>
              Autorizo el{" "}
              <a className="text-blue-600 underline" href="#">tratamiento de datos personales</a> según la política de la institución
            </span>
          </label>
          {form.formState.errors.acceptTerms && (
            <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>
          )}

          <div className="pt-6">
            <h2 className="text-xl font-bold">¿Quieres agregar documentos a tu cita? <span className="text-muted-foreground font-normal">(opcional)</span></h2>
            <label className="mt-3 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center cursor-pointer hover:bg-muted/50">
              <span className="inline-flex items-center gap-2 rounded-full border border-foreground bg-background px-4 py-2 text-sm font-medium">
                <Upload className="h-4 w-4" /> Cargar documentos
              </span>
              <span className="text-sm text-muted-foreground">o puedes arrastrar y soltar tus archivos aquí</span>
              <span className="text-xs text-muted-foreground">Máx. 3 archivos o 15 MB en total — Formatos .jpg .png .pdf</span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 text-sm text-muted-foreground">
                {files.map((f, i) => (
                  <li key={i}>• {f.name} ({(f.size / 1024).toFixed(0)} KB)</li>
                ))}
              </ul>
            )}
          </div>

          {coverage && (
            <CoverageBanner result={coverage} onProceed={proceed} />
          )}

          {!coverage && (
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                size="lg"
                disabled={validating}
                className="rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
              >
                {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {validating ? "Validando cobertura..." : "Continuar"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function CoverageBanner({
  result,
  onProceed,
}: {
  result: CoverageResult;
  onProceed: (particular: boolean, acceptSuggested?: boolean) => void;
}) {
  if (result.case === 1) {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <div className="font-semibold text-emerald-900">{result.message}</div>
            <div className="text-sm text-emerald-800">Puedes continuar con tu cita.</div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onProceed(false)} className="rounded-full bg-foreground text-background">Continuar</Button>
        </div>
      </div>
    );
  }
  if (result.case === 2) {
    const d = parseYmd(result.suggestedDate);
    return (
      <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <div className="font-semibold text-amber-900">{result.message}</div>
            <div className="text-sm text-amber-800 capitalize">
              Disponibilidad cubierta a partir del {format(d, "EEEE d 'de' MMMM", { locale: es })}.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => onProceed(true)} className="rounded-full">
            Pagar particular
          </Button>
          <Button onClick={() => onProceed(false, true)} className="rounded-full bg-foreground text-background">
            Tomar fecha sugerida
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
        <div>
          <div className="font-semibold text-red-900">{result.message}</div>
          <div className="text-sm text-red-800">Puedes continuar pagando como particular.</div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onProceed(true)} className="rounded-full bg-foreground text-background">
          Pagar particular
        </Button>
      </div>
    </div>
  );
}
