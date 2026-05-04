import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getMonthAvailability, ymd, parseYmd } from "@/mocks/availability";
import { cn } from "@/lib/utils";

type Props = {
  specialty: string;
  service: string;
  value?: string;
  onSelect: (date: string) => void;
  onClear?: () => void;
  initialMonth?: Date;
};

export function SmartCalendar({ specialty, service, value, onSelect, onClear, initialMonth }: Props) {
  const [view, setView] = useState<Date>(() => {
    if (value) return parseYmd(value);
    if (initialMonth) return initialMonth;
    return new Date();
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const available = useMemo(
    () => getMonthAvailability(view.getFullYear(), view.getMonth(), specialty, service),
    [view, specialty, service],
  );

  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Lunes=0
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrev = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const goNext = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  return (
    <div className="w-[320px] rounded-xl bg-popover p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={goPrev} className="rounded p-1 hover:bg-muted" aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-base font-semibold capitalize">
          {format(view, "MMMM yyyy", { locale: es })}
        </div>
        <button onClick={goNext} className="rounded p-1 hover:bg-muted" aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const date = new Date(view.getFullYear(), view.getMonth(), d);
          const k = ymd(date);
          const isAvail = available.has(k) && date >= today;
          const isSelected = value === k;
          return (
            <button
              key={i}
              disabled={!isAvail}
              onClick={() => isAvail && onSelect(k)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                !isAvail && "cursor-not-allowed text-muted-foreground/50",
                isAvail && !isSelected && "border border-emerald-500 text-emerald-700 hover:bg-emerald-50",
                isSelected && "bg-emerald-600 text-white",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="mt-3 w-full text-center text-sm text-blue-600 hover:underline"
        >
          Limpiar fecha
        </button>
      )}
    </div>
  );
}
