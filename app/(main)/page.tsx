"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type LogEntry = {
  id: string;
  created_at: string;
  content: string;
  ai_response: string | null;
};

export default function StudioLogPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/studio-log");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please login to use the Command Center.");
      router.push("/login");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/studio-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please sign in to use Command Center.");
          return;
        }
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      setInput("");
      setLogs((prev) => [
        {
          id: data.logId ?? crypto.randomUUID(),
          created_at: new Date().toISOString(),
          content: trimmed,
          ai_response: data.message ?? null,
        },
        ...prev,
      ]);
    } catch {
      setError("Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-ivory">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
        {/* Command Center: primary action area */}
        <div className="rounded-2xl border border-[#2F6652]/20 bg-white p-8 shadow-xl sm:p-10">
          <h1 className="font-serif text-2xl font-bold text-[#2F5D50] md:text-3xl">
            Command Center
          </h1>
          <p className="mt-2 font-sans text-sm font-bold text-gray-600">
            Just say it naturally. I track orders, inventory, expenses, and
            organize your CS inbox automatically. (Product codes like MUG-001 are
            optional, but recommended to avoid any confusion!)
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Sold 2 Mugs (MUG-001) to Kim... or 'James wants a refund for the Pink Pants (PNT-042) because of loose stitching...'"
              className="min-h-[120px] resize-none rounded-xl border-gray-200 bg-white font-sans text-gray-700 placeholder:text-gray-400 focus:border-[#2F6652] focus:outline-none focus:ring-2 focus:ring-[#2F6652]/10"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="mt-4 w-full rounded-xl bg-[#2F6652] px-6 py-2.5 font-semibold text-white shadow-md hover:bg-[#2F5D50]/90 sm:w-auto sm:min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Run"
              )}
            </Button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Activity History: passive history, narrower and lighter */}
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          <h2 className="font-serif text-lg font-semibold text-[#2F5D50]">
            Activity History
          </h2>
          {logs.length === 0 ? (
            <p className="font-sans text-sm text-gray-500">
              No logs yet. Add one above.
            </p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
              {logs.map((log) => (
                <div key={log.id}>
                  <Card className="overflow-hidden rounded-xl border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-4">
                      <p className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                        {log.content}
                      </p>
                      {log.ai_response && (
                        <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 font-sans text-sm text-gray-800">
                          {log.ai_response}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
