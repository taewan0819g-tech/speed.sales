"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Header({ user }: { user: SupabaseUser | null }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 border-b border-warm-gold/20 bg-white/95 backdrop-blur shadow-soft">
      <div className="container mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="font-serif font-semibold text-lg text-forest-green tracking-tight">
          Speed.Sales
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user.email ?? "User"}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
