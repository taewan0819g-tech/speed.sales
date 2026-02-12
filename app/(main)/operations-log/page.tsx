import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { OperationsLogClient } from "./operations-log-client";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  created_at: string;
  content: string;
  kind: string;
};

export default async function OperationsLogPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  const { data: logs } = await supabase
    .from("operations_logs")
    .select("id, created_at, content, kind")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (logs ?? []) as LogRow[];

  async function createLog(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    const content = String(formData.get("content") ?? "").trim();
    const kind = ["note", "request", "reminder"].includes(String(formData.get("kind"))) ? formData.get("kind") : "note";
    if (!content) return;
    await supabaseServer.from("operations_logs").insert({ user_id: u.id, content, kind });
  }

  async function updateLog(id: string, formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    const content = String(formData.get("content") ?? "").trim();
    const kind = ["note", "request", "reminder"].includes(String(formData.get("kind"))) ? formData.get("kind") : "note";
    if (!content) return;
    await supabaseServer.from("operations_logs").update({ content, kind }).eq("id", id).eq("user_id", u.id);
  }

  async function deleteLog(id: string) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    await supabaseServer.from("operations_logs").delete().eq("id", id).eq("user_id", u.id);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8 bg-gray-50 min-h-screen">
      <header>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-[#2F5D50] md:text-3xl">
          <ClipboardList className="h-8 w-8" />
          Operations Log
        </h1>
        <p className="mt-2 font-sans text-sm text-gray-600">
          Internal notes, production requests, and business reminders.
        </p>
      </header>

      <OperationsLogClient
        logs={list}
        createLog={createLog}
        updateLog={updateLog}
        deleteLog={deleteLog}
      />
    </div>
  );
}
