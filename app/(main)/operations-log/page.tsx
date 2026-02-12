import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  created_at: string;
  content: string;
  kind: string;
};

const KIND_LABELS: Record<string, string> = {
  note: "Note",
  request: "Request",
  reminder: "Reminder",
};

const KIND_CLASS: Record<string, string> = {
  note: "bg-gray-100 text-gray-800 border-gray-200",
  request: "bg-blue-100 text-blue-800 border-blue-200",
  reminder: "bg-amber-100 text-amber-800 border-amber-200",
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

      <section className="space-y-4">
        {list.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-8 text-center font-sans text-gray-500">
            No operations logged yet. Add notes from the Command Center.
          </p>
        ) : (
          <div className="space-y-3">
            {list.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${KIND_CLASS[log.kind] ?? KIND_CLASS.note}`}
                  >
                    {KIND_LABELS[log.kind] ?? log.kind}
                  </span>
                  <time className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 font-sans text-sm text-gray-800">
                  {log.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
