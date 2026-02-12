"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LogRow = {
  id: string;
  created_at: string;
  content: string;
  kind: string;
};

const KIND_OPTIONS = [
  { value: "note", label: "Note" },
  { value: "request", label: "Request" },
  { value: "reminder", label: "Reminder" },
] as const;

const KIND_CLASS: Record<string, string> = {
  note: "bg-gray-100 text-gray-800 border-gray-200",
  request: "bg-blue-100 text-blue-800 border-blue-200",
  reminder: "bg-amber-100 text-amber-800 border-amber-200",
};

export function OperationsLogClient({
  logs,
  createLog,
  updateLog,
  deleteLog,
}: {
  logs: LogRow[];
  createLog: (formData: FormData) => Promise<void>;
  updateLog: (id: string, formData: FormData) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this log entry? This cannot be undone.")) return;
    await deleteLog(id);
    router.refresh();
    setEditingId(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold text-[#2F5D50]">
          Add New Log
        </h2>
        <Button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90"
        >
          {showAdd ? "Cancel" : "Add New Log"}
        </Button>
      </div>

      {showAdd && (
        <form
          action={async (formData: FormData) => {
            await createLog(formData);
            router.refresh();
            setShowAdd(false);
          }}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="space-y-3">
            <div>
              <Label htmlFor="new_content">Content</Label>
              <Textarea
                id="new_content"
                name="content"
                required
                rows={3}
                placeholder="e.g. E-mart requested 100 white mugs."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new_kind">Kind</Label>
              <select
                id="new_kind"
                name="kind"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90">
              Save
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-8 text-center font-sans text-gray-500">
            No operations logged yet.
          </p>
        ) : (
          logs.map((log) =>
            editingId === log.id ? (
              <EditLogForm
                key={log.id}
                log={log}
                onSave={async (formData) => {
                  await updateLog(log.id, formData);
                  router.refresh();
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={log.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      KIND_CLASS[log.kind] ?? KIND_CLASS.note
                    )}
                  >
                    {KIND_OPTIONS.find((o) => o.value === log.kind)?.label ?? log.kind}
                  </span>
                  <time className="ml-2 text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </time>
                  <p className="mt-2 font-sans text-sm text-gray-800">{log.content}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(log.id)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#2F5D50]"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(log.id)}
                    className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </section>
  );
}

function EditLogForm({
  log,
  onSave,
  onCancel,
}: {
  log: LogRow;
  onSave: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    try {
      await onSave(new FormData(formRef.current));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#2F5D50]/30 bg-white p-4 shadow-sm"
    >
      <div className="space-y-3">
        <div>
          <Label>Content</Label>
          <Textarea
            name="content"
            defaultValue={log.content}
            required
            rows={3}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Kind</Label>
          <select
            name="kind"
            defaultValue={log.kind}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
