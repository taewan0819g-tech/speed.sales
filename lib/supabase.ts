import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ProductInsert = {
  product_name: string;
  material?: string | null;
  size?: string | null;
  handmade?: boolean;
  origin?: string | null;
  key_features?: string | null;
  tone?: string | null;
  target_platforms?: string[] | null;
  created_at?: string;
};
