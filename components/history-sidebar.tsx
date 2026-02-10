"use client";

import { Button } from "@/components/ui/button";
import { Plus, Menu } from "lucide-react";

export type HistoryItem = {
  id: string;
  product_name: string;
  created_at: string;
};

type HistorySidebarProps = {
  title?: React.ReactNode;
  items: HistoryItem[];
  selectedId: string | null;
  onNewChat: () => void;
  onSelectItem: (id: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onMobileToggle?: () => void;
};

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function HistorySidebar({
  title = "Your Products",
  items,
  selectedId,
  onNewChat,
  onSelectItem,
  isMobileOpen = false,
  onMobileClose,
  onMobileToggle,
}: HistorySidebarProps) {
  return (
    <>
      {/* Mobile: hamburger to open sidebar (below header) */}
      <div className="fixed left-4 top-14 z-20 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileToggle}
          className="bg-white shadow-soft border border-warm-gold/30 text-charcoal hover:bg-muted"
          aria-label="Open history"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Overlay when sidebar is open on mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Sidebar: white/cream, artisan style, right border warm gold */}
      <aside
        className={`
          fixed left-0 top-14 z-40 flex w-[260px] flex-col
          h-[calc(100vh-3.5rem)] bg-white
          border-r border-warm-gold/30
          shadow-soft
          transition-transform duration-200 ease-out
          lg:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-warm-gold/20 px-3 font-serif">
          {typeof title === "string" ? (
            <span className="font-semibold text-charcoal">{title}</span>
          ) : (
            title
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onNewChat();
              onMobileClose?.();
            }}
            className="gap-1.5 text-muted-foreground hover:bg-forest-green/10 hover:text-forest-green"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No products yet. Generate one to see it here.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectItem(item.id);
                      onMobileClose?.();
                    }}
                    className={`
                      w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors
                      ${selectedId === item.id
                        ? "bg-forest-green/15 text-forest-green border border-warm-gold/40"
                        : "text-muted-foreground hover:bg-muted hover:text-charcoal border border-transparent"}
                    `}
                  >
                    <span className="block truncate font-medium">
                      {item.product_name}
                    </span>
                    <span className="block truncate text-xs opacity-80">
                      {formatHistoryDate(item.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
