"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  product_id?: string;
  products: { product_name: string }[] | { product_name: string } | null;
};

type Props = {
  products: ProductRow[];
  orders: OrderRow[];
  createProduct: (formData: FormData) => Promise<void>;
  updateProduct: (id: string, formData: FormData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createOrder: (formData: FormData) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
};

export function OrdersManagement({
  products,
  orders,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  deleteOrder,
}: Props) {
  const router = useRouter();
  const [productsState, setProductsState] = React.useState<ProductRow[]>(products);
  const [productModal, setProductModal] = React.useState<"add" | { type: "edit"; product: ProductRow } | null>(null);
  const [orderModalOpen, setOrderModalOpen] = React.useState(false);

  React.useEffect(() => {
    setProductsState(products);
  }, [products]);

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(productId);
      setProductsState((prev) => prev.filter((p) => p.id !== productId));
      setProductModal(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Failed to delete product: ${message}`);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Delete this order record? This cannot be undone.")) return;
    await deleteOrder(id);
    router.refresh();
  };

  const getProductName = (o: OrderRow) =>
    Array.isArray(o.products) ? o.products[0]?.product_name : (o.products as { product_name?: string } | null)?.product_name;

  return (
    <>
      {/* Section 1: Inventory Status */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#2F5D50]">
            <Package className="h-5 w-5" />
            Inventory Status
          </h2>
          <Button
            type="button"
            onClick={() => setProductModal("add")}
            className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productsState.length === 0 ? (
            <p className="text-muted-foreground col-span-full">No products yet.</p>
          ) : (
            productsState.map((p) => {
              const stock = p.stock_count ?? 0;
              const lowStock = stock < 10;
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{p.product_name}</p>
                      {p.unique_id && (
                        <p className="text-sm text-gray-500">ID: {p.unique_id}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={cn(
                            "text-2xl font-bold",
                            lowStock ? "text-red-600" : "text-[#2F5D50]"
                          )}
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
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setProductModal({ type: "edit", product: p })}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#2F5D50]"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Section 2: Order History */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#2F5D50]">
            <ShoppingCart className="h-5 w-5" />
            Order History
          </h2>
          <Button
            type="button"
            onClick={() => setOrderModalOpen(true)}
            className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Order
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {orders.length === 0 ? (
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
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(o.created_at).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{o.customer_name}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {getProductName(o) || "Unknown Product"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{o.quantity}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#2F5D50]/10 px-2 py-0.5 text-[#2F5D50]">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(o.id)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Product modal (Add / Edit) */}
      {productModal && (
        <ProductModal
          mode={productModal === "add" ? "add" : "edit"}
          product={productModal === "add" ? null : productModal.product}
          onClose={() => setProductModal(null)}
          onSubmit={async (formData) => {
            if (productModal === "add") await createProduct(formData);
            else await updateProduct(productModal.product.id, formData);
            router.refresh();
            setProductModal(null);
          }}
        />
      )}

      {/* Order modal */}
      {orderModalOpen && (
        <OrderModal
          products={productsState}
          onClose={() => setOrderModalOpen(false)}
          onSubmit={async (formData) => {
            await createOrder(formData);
            router.refresh();
            setOrderModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function ProductModal({
  mode,
  product,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit";
  product: ProductRow | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    setLoading(true);
    try {
      await onSubmit(new FormData(form));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold text-[#2F5D50]">
          {mode === "add" ? "Add Product" : "Edit Product"}
        </h3>
        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="product_name">Product name</Label>
            <Input
              id="product_name"
              name="product_name"
              defaultValue={product?.product_name ?? ""}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="unique_id">Product code (optional)</Label>
            <Input
              id="unique_id"
              name="unique_id"
              defaultValue={product?.unique_id ?? ""}
              placeholder="e.g. MUG-001"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="stock_count">Stock count</Label>
            <Input
              id="stock_count"
              name="stock_count"
              type="number"
              min={0}
              defaultValue={product?.stock_count ?? 0}
              required
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90"
            >
              {loading ? "Saving..." : mode === "add" ? "Add" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderModal({
  products,
  onClose,
  onSubmit,
}: {
  products: ProductRow[];
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [loading, setLoading] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    setLoading(true);
    try {
      await onSubmit(new FormData(form));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold text-[#2F5D50]">
          Add Order
        </h3>
        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="order_product_id">Product</Label>
            <select
              id="order_product_id"
              name="product_id"
              required
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} {p.unique_id ? `(${p.unique_id})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="order_quantity">Quantity</Label>
            <Input
              id="order_quantity"
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="order_customer">Customer name</Label>
            <Input
              id="order_customer"
              name="customer_name"
              required
              placeholder="e.g. Kim"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="order_channel">Channel</Label>
            <select
              id="order_channel"
              name="channel"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="Offline">Offline</option>
              <option value="Instagram">Instagram</option>
              <option value="Naver">Naver</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || products.length === 0}
              className="bg-[#2F5D50] text-white hover:bg-[#2F5D50]/90"
            >
              {loading ? "Saving..." : "Add Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
