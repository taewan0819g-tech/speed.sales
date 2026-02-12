"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Sparkles,
  MessageCircle,
  TrendingUp,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/", label: "Studio Log", icon: Home },
  { path: "/orders", label: "Orders & Stock", icon: Package },
  { path: "/marketing", label: "Marketing", icon: Sparkles },
  { path: "/cs", label: "CS Master", icon: MessageCircle },
  { path: "/finance", label: "Insights", icon: TrendingUp },
] as const;

type GlobalNavProps = {
  user: SupabaseUser | null;
};

export function GlobalNav({ user }: GlobalNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navContent = (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-gray-200 px-4">
        <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
          <img src="/logo.png" alt="Speed.Sales" className="h-7 w-auto" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === "/" ? pathname === "/" : pathname.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#2F5D50] shadow-sm"
                  : "bg-transparent text-gray-600 hover:bg-white/80 hover:text-gray-900 hover:shadow-sm"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-gray-200 p-3">
        {user ? (
          <div className="space-y-2">
            <p className="truncate px-2 text-xs text-gray-500">
              {user.email ?? "User"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: menu button */}
      <div className="fixed left-4 top-14 z-20 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((o) => !o)}
          className="border border-gray-200 bg-gray-50/80 shadow-sm"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      {/* Sidebar / GNB */}
      <aside
        className={`
          fixed left-0 top-14 z-40 flex w-[260px] flex-col
          min-h-[calc(100vh-3.5rem)] h-[calc(100vh-3.5rem)] bg-gray-50/80
          border-r border-gray-200 backdrop-blur-xl
          transition-transform duration-200 ease-out
          lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {navContent}
      </aside>
    </>
  );
}
