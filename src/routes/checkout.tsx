import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, ChevronLeft, UserCheck, FileCheck2, IdCard, CheckCircle2 } from "lucide-react";
import { useBooking } from "@/store/booking";
import { TIPOS_DOCUMENTO } from "@/mocks/catalog";
import { runValidations } from "@/mocks/validations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatTime, parseYmd } from "@/mocks/availability";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
  acceptTerms: z.literal(true, { message: "Debes aceptar el tratamiento de datos" }).or(z.literal(false)).refine((v) => v === true, { message: "Debes aceptar el tratamiento de datos" }),
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
  const aseguradora = useBooking((s) => s.aseguradora);
  const payParticularOverride = useBooking((s) => s.payParticularOverride);
  const setPatient = useBooking((s) => s.setPatient);
  const setValidationResult = useBooking((s) => s.setValidationResult);
  const setPaymentMethod = useBooking((s) => s.setPaymentMethod);
  const setConfirmationCode = useBooking((s) => s.setConfirmationCode);
  const patient = useBooking((s) => s.patient);

  function goConfirmacion(method: "clinic" | "none") {
    setPaymentMethod(method);
    const code = "CIT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setConfirmationCode(code);
    navigate({ to: "/confirmacion" });
  }

  const router = useRouter();
  const [validating, setValidating] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    if (!slot) navigate({ to: "/" });
  }, [slot, navigate]);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues: {
      tipoDocumento: patient?.tipoDocumento ?? "",
      numeroDocumento: patient?.numeroDocumento ?? "",
      nombre: patient?.nombre ?? "",
      email: patient?.email ?? "",
      telefono: patient?.telefono ?? "",
      direccion: patient?.direccion ?? "",
      acceptTerms: (patient ? true : false) as unknown as true,
    },
  });

  useEffect(() => {
    if (patient) {
      form.reset({
        tipoDocumento: patient.tipoDocumento,
        numeroDocumento: patient.numeroDocumento,
        nombre: patient.nombre,
        email: patient.email,
        telefono: patient.telefono,
        direccion: patient.direccion,
        acceptTerms: true as unknown as true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  function onSubmit(values: FormValues) {
    if (!slot) return;
    setPatient({
      tipoDocumento: values.tipoDocumento,
      numeroDocumento: values.numeroDocumento,
      nombre: values.nombre,
      email: values.email,
      telefono: values.telefono,
      direccion: values.direccion,
    });

    // Solo se omiten las validaciones si la aseguradora es "Particular".
    const isParticular = aseguradora === "Particular";
    if (isParticular) {
      setValidationResult(undefined);
      goConfirmacion("clinic");
      return;
    }


    setValidating(true);
    setTimeout(() => {
      const result = runValidations({
        documento: values.numeroDocumento,
        aseguradora,
        specialty,
        service,
        slot,
        bypassCoverage: payParticularOverride,
      });
      setValidationResult(result);
      if (result.kind === "ok") {
        const hasAmount = payParticularOverride || (slot.price ?? 0) > 0;
        goConfirmacion(hasAmount ? "clinic" : "none");
        return;
      }
      navigate({ to: "/validacion" });
    }, 1500);
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

  if (validating) {
    return <ValidatingPatientData />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <button
          type="button"
          onClick={() => setShowLeaveModal(true)}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </button>
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
            <p className="mt-1 text-sm text-muted-foreground">Puedes cargar órdenes médicas, historia clínica, autorizaciones y otros documentos relacionados.</p>
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

          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              size="lg"
              className="rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
            >
              Continuar
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="max-w-md rounded-2xl p-8 text-center [&>button]:hidden">
          <h2 className="text-xl font-bold tracking-tight">
            Tu horario seleccionado se liberará
          </h2>
          {slot && (
            <p className="mt-3 font-semibold text-emerald-600 capitalize">
              {format(parseYmd(slot.date), "EEEE d 'de' MMMM", { locale: es })} a las {formatTime(slot.hour, slot.minute)} con {slot.profesional}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Ese horario podría quedar disponible para otro paciente.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="w-full rounded-full bg-foreground px-8 py-6 text-background hover:bg-foreground/90"
              onClick={() => setShowLeaveModal(false)}
            >
              Quedarse aquí
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowLeaveModal(false);
                router.history.back();
              }}
            >
              Sí, ir atrás
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ValidatingPatientData() {
  const steps = [
    { icon: IdCard, label: "Verificando documento del paciente" },
    { icon: UserCheck, label: "Confirmando datos personales" },
    { icon: FileCheck2, label: "Validando cobertura con tu aseguradora" },
  ];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveIdx(1), 500);
    const t2 = setTimeout(() => setActiveIdx(2), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
              <div className="relative rounded-full bg-emerald-100 p-4">
                <UserCheck className="h-8 w-8 text-emerald-700" />
              </div>
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight">
              Validando datos del paciente
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Esto solo toma un momento. No cierres esta ventana.
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {steps.map((s, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              const Icon = s.icon;
              return (
                <li
                  key={s.label}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                    done && "border-emerald-200 bg-emerald-50/60",
                    active && "border-foreground/40 bg-muted/40",
                    !done && !active && "border-border bg-background opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      done && "bg-emerald-600 text-white",
                      active && "bg-foreground text-background",
                      !done && !active && "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      done && "text-emerald-900",
                      active && "text-foreground",
                      !done && !active && "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
