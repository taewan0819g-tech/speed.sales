"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CSInquiry = {
  id: string;
  created_at: string;
  customer_name: string;
  content: string;
  product_name: string | null;
  status: string;
  ai_reply: string | null;
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting for Customer" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    waiting: "Waiting for Customer",
    resolved: "Resolved",
    closed: "Closed",
  };
  return map[status] ?? status;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    open: "bg-red-100 text-red-800 border-red-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    waiting: "bg-orange-100 text-orange-800 border-orange-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
    closed: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

const TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function CSInbox({
  inquiries,
  updateStatus,
  createInquiry,
  updateInquiry,
  deleteInquiry,
}: {
  inquiries: CSInquiry[];
  updateStatus: (inquiryId: string, newStatus: string) => Promise<void>;
  createInquiry?: (formData: FormData) => Promise<void>;
  updateInquiry?: (id: string, formData: FormData) => Promise<void>;
  deleteInquiry?: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<TabValue>("all");
  const [createOpen, setCreateOpen] = React.useState(false);

  const filtered =
    filter === "all"
      ? inquiries
      : inquiries.filter((i) => i.status === filter);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateStatus(id, newStatus);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === tab.value
                  ? "bg-[#2F5D50] text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {createInquiry && (
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Inquiry
          </Button>
        )}
      </div>

      {createOpen && createInquiry && (
        <CreateInquiryModal
          onClose={() => setCreateOpen(false)}
          onSubmit={async (formData) => {
            await createInquiry(formData);
            router.refresh();
            setCreateOpen(false);
          }}
        />
      )}

      {/* Inquiry cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inquiries.length === 0 ? (
          <p className="col-span-full rounded-xl border border-gray-200 bg-white p-8 text-center font-sans text-gray-600">
            All caught up! No pending inquiries.
          </p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full text-gray-500">No inquiries match this filter.</p>
        ) : (
          filtered.map((inq) => (
            <InquiryCard
              key={inq.id}
              inquiry={inq}
              onStatusChange={handleStatusChange}
              onUpdate={updateInquiry}
              onDelete={deleteInquiry}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CreateInquiryModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    try {
      await onSubmit(new FormData(formRef.current));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold text-[#2F5D50]">
          Create Inquiry
        </h3>
        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="cs_customer">Customer name</Label>
            <Input id="cs_customer" name="customer_name" required placeholder="e.g. Kim" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cs_content">Message</Label>
            <Textarea id="cs_content" name="content" required rows={3} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cs_product">Product (optional)</Label>
            <Input id="cs_product" name="product_name" placeholder="e.g. Shadow jacket" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cs_status">Status</Label>
            <select id="cs_status" name="status" className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90">
              {loading ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InquiryCard({
  inquiry,
  onStatusChange,
  onUpdate,
  onDelete,
}: {
  inquiry: CSInquiry;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onUpdate?: (id: string, formData: FormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const isOpen = inquiry.status === "open";

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === inquiry.status) return;
    setLoading(true);
    try {
      await onStatusChange(inquiry.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm("Delete this inquiry? This cannot be undone.")) return;
    await onDelete(inquiry.id);
    router.refresh();
  };

  const dateStr = new Date(inquiry.created_at).toISOString().slice(0, 10);

  return (
    <>
      <div
        className={cn(
          "flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm",
          isOpen && "border-l-4 border-l-red-500"
        )}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[#2F6652]">
            {inquiry.customer_name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                getStatusColor(inquiry.status)
              )}
            >
              {getStatusLabel(inquiry.status)}
            </span>
            <select
              value={inquiry.status}
              onChange={handleSelectChange}
              disabled={loading}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 focus:border-[#2F5D50] focus:outline-none focus:ring-1 focus:ring-[#2F5D50] disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {onUpdate && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#2F5D50]"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-2 flex flex-1 flex-col gap-1">
          {inquiry.product_name && (
            <p className="text-xs text-gray-500">Product: {inquiry.product_name}</p>
          )}
          <p className="text-sm text-gray-800">{inquiry.content}</p>
          {inquiry.ai_reply && (
            <div className="rounded border border-gray-200 bg-gray-50 p-2">
              <p className="mb-0.5 text-xs font-medium text-gray-500">AI Draft</p>
              <p className="text-sm text-gray-700">{inquiry.ai_reply}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">{dateStr}</p>
      </div>

      {editOpen && onUpdate && (
        <EditInquiryModal
          inquiry={inquiry}
          onClose={() => setEditOpen(false)}
          onSubmit={async (formData) => {
            await onUpdate(inquiry.id, formData);
            router.refresh();
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}

function EditInquiryModal({
  inquiry,
  onClose,
  onSubmit,
}: {
  inquiry: CSInquiry;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    try {
      await onSubmit(new FormData(formRef.current));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold text-[#2F5D50]">Edit Inquiry</h3>
        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="edit_customer">Customer name</Label>
            <Input id="edit_customer" name="customer_name" defaultValue={inquiry.customer_name} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="edit_content">Message</Label>
            <Textarea id="edit_content" name="content" defaultValue={inquiry.content} required rows={3} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="edit_product">Product (optional)</Label>
            <Input id="edit_product" name="product_name" defaultValue={inquiry.product_name ?? ""} className="mt-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
