import type { ReactNode } from "react";
import { ChatPanel } from "./ChatPanel";

export function AssistantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Chat panel — desktop only */}
      <aside className="hidden w-[360px] shrink-0 border-r border-border lg:flex lg:flex-col">
        <ChatPanel />
      </aside>
      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
