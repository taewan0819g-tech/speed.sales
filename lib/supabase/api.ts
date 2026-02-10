import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

/**
 * Create a Supabase client for API Route Handlers using request cookies.
 * Use this to get the current user and perform RLS-scoped inserts/updates.
 */
export function createApiClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Route Handlers cannot set cookies; middleware handles session refresh
        },
      },
    }
  );
}
