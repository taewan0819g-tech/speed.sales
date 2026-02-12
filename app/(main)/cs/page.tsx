import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { CSInbox } from "./cs-inbox";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;

export default async function CSPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  const { data: inquiries } = await supabase
    .from("cs_inquiries")
    .select("id, created_at, customer_name, content, product_name, status, ai_reply")
    .eq("user_id", user.id)
    .neq("status", "closed")
    .order("created_at", { ascending: false });

  async function updateInquiryStatus(inquiryId: string, newStatus: string) {
    "use server";
    if (!VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])) {
      return;
    }
    const supabaseServer = await createClient();
    const {
      data: { user: u },
    } = await supabaseServer.auth.getUser();
    if (!u) return;
    await supabaseServer
      .from("cs_inquiries")
      .update({ status: newStatus })
      .eq("id", inquiryId)
      .eq("user_id", u.id);
  }

  async function createInquiry(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    const customer_name = String(formData.get("customer_name") ?? "").trim() || "Unknown";
    const content = String(formData.get("content") ?? "").trim();
    const product_name = formData.get("product_name") ? String(formData.get("product_name")).trim() || null : null;
    const status = VALID_STATUSES.includes(String(formData.get("status")) as (typeof VALID_STATUSES)[number]) ? formData.get("status") : "open";
    if (!content) return;
    await supabaseServer.from("cs_inquiries").insert({
      user_id: u.id,
      customer_name,
      content,
      product_name,
      status,
    });
  }

  async function updateInquiry(id: string, formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    const customer_name = String(formData.get("customer_name") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const product_name = formData.get("product_name") ? String(formData.get("product_name")).trim() || null : null;
    if (!customer_name || !content) return;
    await supabaseServer.from("cs_inquiries").update({ customer_name, content, product_name }).eq("id", id).eq("user_id", u.id);
  }

  async function deleteInquiry(id: string) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    await supabaseServer.from("cs_inquiries").delete().eq("id", id).eq("user_id", u.id);
  }

  const list = (inquiries ?? []).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    customer_name: r.customer_name,
    content: r.content,
    product_name: r.product_name ?? null,
    status: r.status,
    ai_reply: r.ai_reply ?? null,
  }));

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8 bg-gray-50 min-h-screen">
      <header>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-[#2F5D50] md:text-3xl">
          <Inbox className="h-8 w-8" />
          CS Master
        </h1>
        <p className="mt-2 font-sans text-gray-600">
          Customer Inquiry Inbox
        </p>
      </header>

      <CSInbox
        inquiries={list}
        updateStatus={updateInquiryStatus}
        createInquiry={createInquiry}
        updateInquiry={updateInquiry}
        deleteInquiry={deleteInquiry}
      />
    </div>
  );
}
