import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useBooking, type Filters } from "@/store/booking";
import { SEDES, PROFESIONALES, ATTENTION_TYPES, FRANJAS } from "@/mocks/catalog";
import { opcionesFiltro, type Slot } from "@/mocks/availability";
import { cn } from "@/lib/utils";

function FilterDropdown({
  label,
  options,
  available,
  value,
  onSelect,
  onClear,
  searchable = true,
}: {
  label: string;
  options: string[];
  available: Set<string>;
  value?: string;
  onSelect: (v: string) => void;
  onClear: () => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  // Show options that are either available given current filters,
  // or the currently selected one (so user can clear it).
  const visibleOptions = options.filter(
    (o) => available.has(o) || value === o,
  );
  const filtered = visibleOptions.filter((o) =>
    o.toLowerCase().includes(q.toLowerCase()),
  );
  const active = !!value;
  const disabled = visibleOptions.length === 0;
  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            active
              ? "bg-foreground text-background border-foreground"
              : "border-border bg-background hover:border-foreground",
            disabled && "cursor-not-allowed opacity-40 hover:border-border",
          )}
        >
          <span>{active ? `${label}: ${value}` : label}</span>
          {active ? (
            <X
              className="h-4 w-4"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-full pl-9"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground">Sin resultados</div>
          )}
          {filtered.map((o) => (
            <button
              key={o}
              onClick={() => {
                onSelect(o);
                setOpen(false);
              }}
              className={cn(
                "block w-full rounded px-2 py-2 text-left text-sm hover:bg-muted",
                value === o && "font-semibold text-emerald-700",
              )}
            >
              {o}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function FiltersBar({ slotPool = [] }: { slotPool?: Slot[] }) {
  const filters = useBooking((s) => s.filters);
  const setFilter = useBooking((s) => s.setFilter);
  const clearFilter = useBooking((s) => s.clearFilter);

  const sedeAvail = opcionesFiltro(slotPool, filters, "sede");
  const profAvail = opcionesFiltro(slotPool, filters, "profesional");
  const attAvail = opcionesFiltro(slotPool, filters, "attention");
  const franjaAvail = opcionesFiltro(slotPool, filters, "franja");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
      <FilterDropdown
        label="Sede"
        options={SEDES}
        available={sedeAvail}
        value={filters.sede}
        onSelect={(v) => setFilter("sede", v)}
        onClear={() => clearFilter("sede")}
      />
      <FilterDropdown
        label="Profesional"
        options={PROFESIONALES}
        available={profAvail}
        value={filters.profesional}
        onSelect={(v) => setFilter("profesional", v)}
        onClear={() => clearFilter("profesional")}
      />
      <FilterDropdown
        label="Tipo de atención"
        options={ATTENTION_TYPES as unknown as string[]}
        available={attAvail}
        value={filters.attention}
        onSelect={(v) => setFilter("attention", v as Filters["attention"])}
        onClear={() => clearFilter("attention")}
      />
      <FilterDropdown
        label="Franja"
        options={FRANJAS as unknown as string[]}
        available={franjaAvail}
        value={filters.franja}
        onSelect={(v) => setFilter("franja", v as Filters["franja"])}
        onClear={() => clearFilter("franja")}
      />
    </div>
  );
}
