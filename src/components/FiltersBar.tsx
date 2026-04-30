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
import { cn } from "@/lib/utils";

function FilterDropdown({
  label,
  options,
  value,
  onSelect,
  onClear,
}: {
  label: string;
  options: string[];
  value?: string;
  onSelect: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  const active = !!value;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            active
              ? "bg-foreground text-background border-foreground"
              : "border-border bg-background hover:border-foreground",
          )}
        >
          <span>
            {active ? `${label}: ${value}` : label}
          </span>
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

export function FiltersBar() {
  const filters = useBooking((s) => s.filters);
  const setFilter = useBooking((s) => s.setFilter);
  const clearFilter = useBooking((s) => s.clearFilter);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
      <FilterDropdown
        label="Sede"
        options={SEDES}
        value={filters.sede}
        onSelect={(v) => setFilter("sede", v)}
        onClear={() => clearFilter("sede")}
      />
      <FilterDropdown
        label="Profesional"
        options={PROFESIONALES}
        value={filters.profesional}
        onSelect={(v) => setFilter("profesional", v)}
        onClear={() => clearFilter("profesional")}
      />
      <FilterDropdown
        label="Tipo de atención"
        options={ATTENTION_TYPES as unknown as string[]}
        value={filters.attention}
        onSelect={(v) => setFilter("attention", v as Filters["attention"])}
        onClear={() => clearFilter("attention")}
      />
      <FilterDropdown
        label="Franja"
        options={FRANJAS as unknown as string[]}
        value={filters.franja}
        onSelect={(v) => setFilter("franja", v as Filters["franja"])}
        onClear={() => clearFilter("franja")}
      />
    </div>
  );
}
