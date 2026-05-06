import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

type Group = { label: string; items: string[] };

export function OptionsPicker({
  open,
  onOpenChange,
  title,
  options,
  recent = [],
  top = [],
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  options: string[];
  recent?: string[];
  top?: string[];
  onPick: (value: string) => void;
}) {
  const isMobile = useIsMobile();
  const groups: Group[] = [];
  const seen = new Set<string>();
  if (recent.length) {
    const items = recent.filter((x) => !seen.has(x) && (seen.add(x), true));
    if (items.length) groups.push({ label: "Recientes", items });
  }
  if (top.length) {
    const items = top.filter((x) => !seen.has(x) && (seen.add(x), true));
    if (items.length) groups.push({ label: "Más usadas", items });
  }
  const rest = options.filter((x) => !seen.has(x));
  groups.push({ label: groups.length ? "Todas" : "Opciones", items: rest });

  function handlePick(v: string) {
    onPick(v);
    onOpenChange(false);
  }

  const body = (
    <Command className="rounded-lg" filter={(value, search) => {
      const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return norm(value).includes(norm(search)) ? 1 : 0;
    }}>
      <CommandInput placeholder="Buscar..." autoFocus />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>Sin resultados.</CommandEmpty>
        {groups.map((g) => (
          <CommandGroup key={g.label} heading={g.label}>
            {g.items.map((opt) => (
              <CommandItem key={opt} value={opt} onSelect={() => handlePick(opt)}>
                {opt}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        {options.length} opciones
      </div>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-2 pb-4">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="p-2">{body}</div>
      </DialogContent>
    </Dialog>
  );
}

export function ChipList({
  options,
  title,
  onPick,
  recent = [],
  top = [],
}: {
  options: string[];
  title: string;
  onPick: (value: string) => void;
  recent?: string[];
  top?: string[];
}) {
  const [open, setOpen] = useState(false);

  const longest = options.reduce((m, o) => Math.max(m, o.length), 0);
  const hasLong = longest > 22;
  const count = options.length;

  // Decidir modo:
  // ≤6 y no hay textos largos → wrap
  // 7-12 o textos largos → fila scrollable + "Ver todas"
  // >12 → top 5 + "Ver todas (N)"
  let mode: "wrap" | "scroll" | "top";
  let visible: string[] = options;
  if (count > 12) {
    mode = "top";
    const seen = new Set<string>();
    const merged = [...recent, ...top].filter((x) => options.includes(x) && !seen.has(x) && (seen.add(x), true));
    const fillers = options.filter((x) => !seen.has(x));
    visible = [...merged, ...fillers].slice(0, 5);
  } else if (count > 6 || hasLong) {
    mode = "scroll";
    visible = options;
  } else {
    mode = "wrap";
    visible = options;
  }

  const chipBase =
    "rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:border-foreground hover:bg-muted whitespace-nowrap truncate min-w-[7rem] max-w-[18ch] text-center";

  const seeAll = (
    <button
      key="__all__"
      onClick={() => setOpen(true)}
      className="rounded-full border border-dashed border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground whitespace-nowrap"
    >
      {mode === "top" ? `Ver todas (${count})` : "Ver todas"}
    </button>
  );

  const chips = visible.map((s) => (
    <button key={s} title={s} className={chipBase} onClick={() => onPick(s)}>
      {s}
    </button>
  ));

  return (
    <>
      {mode === "wrap" ? (
        <div className="flex flex-wrap gap-2 pl-10">{chips}</div>
      ) : (
        <div className="pl-10">
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {chips}
              {seeAll}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
          </div>
        </div>
      )}
      <OptionsPicker
        open={open}
        onOpenChange={setOpen}
        title={title}
        options={options}
        recent={recent}
        top={top}
        onPick={onPick}
      />
    </>
  );
}
