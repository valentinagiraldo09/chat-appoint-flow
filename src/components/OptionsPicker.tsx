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

  const count = options.length;

  // Regla unificada: máximo 4 chips visibles + "Ver todas (N)" si hay más de 5.
  let visible: string[];
  let showSeeAll: boolean;
  if (count <= 5) {
    visible = options;
    showSeeAll = false;
  } else {
    const seen = new Set<string>();
    const merged = [...recent, ...top].filter(
      (x) => options.includes(x) && !seen.has(x) && (seen.add(x), true),
    );
    const fillers = options.filter((x) => !seen.has(x));
    visible = [...merged, ...fillers].slice(0, 4);
    showSeeAll = true;
  }

  const chipBase =
    "rounded-2xl border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:border-foreground hover:bg-muted whitespace-normal break-words text-left leading-snug max-w-[16rem]";

  const seeAll = showSeeAll ? (
    <button
      key="__all__"
      onClick={() => setOpen(true)}
      className="rounded-full border border-dashed border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground whitespace-nowrap"
    >
      {`Ver todas (${count})`}
    </button>
  ) : null;

  const chips = visible.map((s) => (
    <button key={s} className={chipBase} onClick={() => onPick(s)}>
      {s}
    </button>
  ));

  return (
    <>
      <div className="flex flex-wrap items-start gap-2 pl-10">
        {chips}
        {seeAll}
      </div>
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
