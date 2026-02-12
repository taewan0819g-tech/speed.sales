import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Package, ShoppingCart } from "lucide-react";

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
    .order("product_name", { ascending: true });

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, customer_name, quantity, status, products(product_name)")
    .order("created_at", { ascending: false });

  const productList = (products ?? []) as ProductRow[];
  const orderList = (orders ?? []) as OrderRow[];

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8 bg-gray-50 min-h-screen">
      <h1 className="font-serif text-2xl font-bold text-[#2F5D50] md:text-3xl">
        Orders & Stock
      </h1>

      {/* Section 1: Inventory Status */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#2F5D50]">
          <Package className="h-5 w-5" />
          Inventory Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productList.length === 0 ? (
            <p className="text-muted-foreground col-span-full">No products yet.</p>
          ) : (
            productList.map((p) => {
              const stock = p.stock_count ?? 0;
              const lowStock = stock < 10;
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-gray-900">{p.product_name}</p>
                  {p.unique_id && (
                    <p className="text-sm text-gray-500">ID: {p.unique_id}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-2xl font-bold ${lowStock ? "text-red-600" : "text-[#2F5D50]"}`}
                    >
                      {stock}
                    </span>
                    {lowStock && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Section 2: Order History */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#2F5D50]">
          <ShoppingCart className="h-5 w-5" />
          Order History
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {orderList.length === 0 ? (
            <p className="p-6 text-muted-foreground">No orders yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(o.created_at).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {o.customer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {(Array.isArray(o.products)
                        ? o.products[0]?.product_name
                        : o.products?.product_name) || "Unknown Product"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{o.quantity}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#2F5D50]/10 px-2 py-0.5 text-[#2F5D50]">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
