import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrdersManagement } from "./orders-management";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  product_name: string;
  unique_id: string | null;
  stock_count: number | null;
};

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string;
  quantity: number;
  status: string;
  products: { product_name: string }[] | { product_name: string } | null;
};

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, product_name, unique_id, stock_count")
    .eq("user_id", user.id)
    .order("product_name", { ascending: true });

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, customer_name, quantity, status, products(product_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const productList = (products ?? []) as ProductRow[];
  const orderList = (orders ?? []) as OrderRow[];

  async function createProduct(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    const product_name = String(formData.get("product_name") ?? "").trim();
    const unique_id = formData.get("unique_id") ? String(formData.get("unique_id")).trim() || null : null;
    const stock_count = Math.max(0, Number(formData.get("stock_count")) || 0);
    if (!product_name) return;
    await supabaseServer.from("products").insert({
      user_id: u.id,
      product_name,
      unique_id,
      stock_count,
    });
  }

  async function updateProduct(id: string, formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    const product_name = String(formData.get("product_name") ?? "").trim();
    const unique_id = formData.get("unique_id") ? String(formData.get("unique_id")).trim() || null : null;
    const stock_count = Math.max(0, Number(formData.get("stock_count")) || 0);
    if (!product_name) return;
    await supabaseServer.from("products").update({ product_name, unique_id, stock_count }).eq("id", id).eq("user_id", u.id);
  }

  async function deleteProduct(id: string) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    await supabaseServer.from("products").delete().eq("id", id).eq("user_id", u.id);
  }

  async function createOrder(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    const product_id = String(formData.get("product_id") ?? "").trim();
    const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
    const customer_name = String(formData.get("customer_name") ?? "").trim();
    const channel = ["Instagram", "Naver", "Offline"].includes(String(formData.get("channel"))) ? formData.get("channel") : "Offline";
    if (!product_id || !customer_name) return;
    await supabaseServer.from("orders").insert({
      user_id: u.id,
      product_id,
      quantity,
      customer_name,
      channel,
      total_price: 0,
      status: "paid",
    });
  }

  async function deleteOrder(id: string) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user: u } } = await supabaseServer.auth.getUser();
    if (!u) return;
    await supabaseServer.from("orders").delete().eq("id", id).eq("user_id", u.id);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8 bg-gray-50 min-h-screen">
      <h1 className="font-serif text-2xl font-bold text-[#2F5D50] md:text-3xl">
        Orders & Stock
      </h1>

      <OrdersManagement
        products={productList}
        orders={orderList}
        createProduct={createProduct}
        updateProduct={updateProduct}
        deleteProduct={deleteProduct}
        createOrder={createOrder}
        deleteOrder={deleteOrder}
      />
    </div>
  );
}
