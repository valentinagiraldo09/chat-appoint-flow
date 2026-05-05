import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrimaryAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: React.ReactNode;
  icon?: LucideIcon;
  onClick: () => void;
}) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
    >
      {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
      {label}
    </Button>
  );
}

export function SecondaryActions({
  title = "Otras opciones",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 px-1 text-sm font-medium text-muted-foreground">
        {title}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {children}
      </div>
    </div>
  );
}

export function SecondaryActionRow({
  icon: Icon,
  label,
  description,
  onClick,
  href,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="truncate text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </>
  );

  const cls =
    "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/40 border-b border-border last:border-b-0";

  if (href) {
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}
