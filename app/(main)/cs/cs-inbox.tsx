"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
}: {
  inquiries: CSInquiry[];
  updateStatus: (inquiryId: string, newStatus: string) => Promise<void>;
}) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<TabValue>("all");

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
      {/* Status filter tabs */}
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
            />
          ))
        )}
      </div>
    </div>
  );
}

function InquiryCard({
  inquiry,
  onStatusChange,
}: {
  inquiry: CSInquiry;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [loading, setLoading] = React.useState(false);
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

  const dateStr = new Date(inquiry.created_at).toISOString().slice(0, 10);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm",
        isOpen && "border-l-4 border-l-red-500"
      )}
    >
      {/* Header: Name + Badge + Status Select */}
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
        </div>
      </div>

      {/* Body: Product (if exists), Message, AI Draft */}
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

      {/* Footer: Date */}
      <p className="text-xs text-gray-500">{dateStr}</p>
    </div>
  );
}
