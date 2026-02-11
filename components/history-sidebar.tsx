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

      {/* Sidebar: distinct workspace panel (soft gray theme) */}
      <aside
        className={`
          fixed left-0 top-14 z-40 flex w-[260px] flex-col
          min-h-[calc(100vh-3.5rem)] h-[calc(100vh-3.5rem)] bg-gray-50/80
          border-r border-gray-200 backdrop-blur-xl
          transition-transform duration-200 ease-out
          lg:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="shrink-0 border-b border-gray-200 px-3 pt-4 pb-4">
          <div className="mb-3">
            {typeof title === "string" ? (
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                {title}
              </span>
            ) : (
              title
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onNewChat();
              onMobileClose?.();
            }}
            className="w-full justify-center gap-1.5 rounded-xl border-gray-200 bg-white py-2.5 font-medium text-gray-700 shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-2 py-4 text-sm text-gray-500">
              No products yet. Generate one to see it here.
            </p>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectItem(item.id);
                      onMobileClose?.();
                    }}
                    className={`
                      w-full rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200
                      ${selectedId === item.id
                        ? "bg-white font-medium text-gray-900 shadow-sm ring-1 ring-black/5"
                        : "bg-transparent text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"}
                    `}
                  >
                    <span className="block truncate">
                      {item.product_name}
                    </span>
                    <span className="block truncate text-xs opacity-70">
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
