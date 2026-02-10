"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Loader2, X } from "lucide-react";
import { HistorySidebar, type HistoryItem } from "@/components/history-sidebar";

const STORAGE_BUCKET = "product-images";

const TONE_OPTIONS = ["Simple", "Warm", "Premium"] as const;
const PLATFORMS = [
  "Instagram",
  "X (Twitter)",
  "Facebook",
  "Product Description",
  "Hashtags",
] as const;

/** Map API result key (canonical) -> display label for result cards */
const RESULT_KEY_TO_LABEL: Record<string, string> = {
  instagram: "Instagram",
  twitter: "X (Twitter)",
  facebook: "Facebook",
  product_description: "Product Description",
  hashtags: "Hashtags",
};

/** One variation (style + intent + content) */
export type ResultOption = { style: string; intent: string; content: string };
/** Per-platform: either legacy string or new shape with 3 options */
export type PlatformResult = string | { options: ResultOption[] };

type Platform = (typeof PLATFORMS)[number];

type ProductRow = {
  id: string;
  product_name: string;
  material: string | null;
  size: string | null;
  handmade: boolean;
  origin: string | null;
  key_features: string | null;
  tone: string | null;
  target_platforms: string[];
  generated_contents: Record<string, PlatformResult> | null;
  created_at: string;
};

export default function Home() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const [productName, setProductName] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [handmade, setHandmade] = useState(false);
  const [origin, setOrigin] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [tone, setTone] = useState<string>("Simple");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, PlatformResult> | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const fetchHistory = useCallback(async () => {
    const client = createClient();
    const { data, error: fetchError } = await client
      .from("products")
      .select("id, product_name, created_at")
      .order("created_at", { ascending: false });
    if (!fetchError && data) {
      setHistoryItems(data as HistoryItem[]);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const loadProduct = useCallback(async (id: string) => {
    const client = createClient();
    const { data, error: fetchError } = await client
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !data) return;
    const row = data as ProductRow;
    setProductName(row.product_name ?? "");
    setMaterial(row.material ?? "");
    setSize(row.size ?? "");
    setHandmade(Boolean(row.handmade));
    setOrigin(row.origin ?? "");
    setKeyFeatures(row.key_features ?? "");
    setTone(row.tone ?? "Simple");
    setPlatforms(
      (Array.isArray(row.target_platforms) ? row.target_platforms : []) as Platform[]
    );
    setResult(
      row.generated_contents && typeof row.generated_contents === "object"
        ? (row.generated_contents as Record<string, PlatformResult>)
        : null
    );
    setSelectedProductId(id);
    setError(null);
    setImageFiles([]);
    setImagePreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  }, []);

  const resetForm = useCallback(() => {
    setProductName("");
    setMaterial("");
    setSize("");
    setHandmade(false);
    setOrigin("");
    setKeyFeatures("");
    setTone("Simple");
    setPlatforms([]);
    setResult(null);
    setSelectedProductId(null);
    setError(null);
    setImageFiles([]);
    setImagePreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const valid = files.filter((f) => f.type.startsWith("image/"));
    setImageFiles((prev) => [...prev, ...valid]);
    valid.forEach((f) => {
      setImagePreviewUrls((prev) => [...prev, URL.createObjectURL(f)]);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index] ?? "");
      return next.filter((_, i) => i !== index);
    });
  };

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError("Product name is required.");
      return;
    }
    if (platforms.length === 0) {
      setError("Select at least one platform.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const client = createClient();
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${Date.now()}-${i}.${ext}`;
          const { error: uploadError } = await client.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, { upsert: true });
          if (uploadError) {
            setError(`Image upload failed: ${uploadError.message}`);
            setLoading(false);
            return;
          }
          const { data: urlData } = client.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          material: material.trim() || undefined,
          size: size.trim() || undefined,
          handmade,
          origin: origin.trim() || undefined,
          keyFeatures: keyFeatures.trim() || undefined,
          tone,
          platforms,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed.");
        setLoading(false);
        return;
      }
      const {
        productId,
        productName: name,
        createdAt,
        ...platformResults
      } = data as {
        productId?: string;
        productName?: string;
        createdAt?: string;
        [k: string]: unknown;
      };
      setResult(platformResults as Record<string, PlatformResult>);
      if (productId && name && createdAt) {
        setHistoryItems((prev) => [
          { id: productId, product_name: name, created_at: createdAt },
          ...prev,
        ]);
        setSelectedProductId(productId);
      }
      setImageFiles([]);
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviewUrls([]);
    } catch {
      setError("Network or server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const resultEntries = result ? Object.entries(result) : [];

  const isOptionsShape = (v: PlatformResult): v is { options: ResultOption[] } =>
    typeof v === "object" && v !== null && Array.isArray((v as { options?: unknown }).options);

  return (
    <div className="flex min-h-full">
      <HistorySidebar
        title="Your Products"
        items={historyItems}
        selectedId={selectedProductId}
        onNewChat={resetForm}
        onSelectItem={loadProduct}
        isMobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
        onMobileToggle={() => setSidebarMobileOpen((o) => !o)}
      />

      {/* Main content: offset by sidebar on desktop; warm ivory bg */}
      <div className="min-h-full flex-1 bg-ivory lg:ml-[260px]">
        <div className="mx-auto w-full max-w-[800px] px-4 py-8 pt-16 lg:pt-8">
          {/* Welcoming prompt – left-aligned with form */}
          <div className="mb-8 space-y-2">
            <h2 className="font-serif text-xl md:text-2xl font-semibold text-charcoal">
              Ready to share your masterpiece?
            </h2>
            <p className="font-sans text-sm text-charcoal/90 leading-relaxed">
              Simply describe your product. We&apos;ll handle the marketing so you can stay focused on your craft.
            </p>
          </div>

          {/* Centered input card – white, soft shadow (fine paper) */}
          <Card className="border-warm-gold/20 bg-white shadow-soft-md">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="productName" className="text-charcoal font-medium">Product Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g. Ceramic Mug"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      placeholder="e.g. Porcelain"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      placeholder="e.g. 350ml"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2">
                  <Label htmlFor="handmade" className="cursor-pointer flex-1">
                    Handmade
                  </Label>
                  <Switch
                    id="handmade"
                    checked={handmade}
                    onCheckedChange={setHandmade}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    placeholder="e.g. Made in Korea"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyFeatures" className="text-charcoal font-medium">Features</Label>
                  <Textarea
                    id="keyFeatures"
                    placeholder="Enter 3–5 bullet points"
                    value={keyFeatures}
                    onChange={(e) => setKeyFeatures(e.target.value)}
                    rows={3}
                    className="resize-none border-warm-gold/30 focus-visible:ring-warm-gold"
                  />
                </div>

                {/* Product Images (Optional) */}
                <div className="space-y-2">
                  <Label className="text-charcoal font-medium">Product Images (Optional)</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-lg border border-warm-gold/40 bg-ivory px-4 py-2 text-sm font-medium text-forest-green hover:bg-forest-green/10 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      Choose images
                    </label>
                    {imagePreviewUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {imagePreviewUrls.map((url, i) => (
                          <div
                            key={url}
                            className="relative h-16 w-16 rounded-lg border border-warm-gold/30 overflow-hidden bg-muted"
                          >
                            <img
                              src={url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute right-0.5 top-0.5 rounded-full bg-charcoal/70 p-0.5 text-white hover:bg-charcoal"
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {imageFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {imageFiles.length} image(s) selected. They will be uploaded when you Generate.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground font-medium">Platforms</Label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {PLATFORMS.map((p) => (
                      <div key={p} className="flex items-center space-x-2">
                        <Checkbox
                          id={p}
                          checked={platforms.includes(p)}
                          onCheckedChange={() => togglePlatform(p)}
                        />
                        <Label
                          htmlFor={p}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {p}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  className="w-full sm:w-auto bg-forest-green hover:bg-forest-green/90 text-white focus-visible:ring-warm-gold"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output stream below – chat-style blocks */}
          <div className="mt-8 space-y-6">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating content...</span>
              </div>
            )}
            {resultEntries.length > 0 &&
              resultEntries.map(([key, value]) => {
                const platformLabel = RESULT_KEY_TO_LABEL[key] ?? key;
                if (isOptionsShape(value)) {
                  return (
                    <div key={key} className="space-y-4">
                      <h3 className="font-serif text-lg font-semibold text-forest-green">
                        {platformLabel}
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {value.options.map((opt, idx) => (
                          <Card
                            key={`${key}-${idx}`}
                            className="border-warm-gold/20 bg-white shadow-soft flex flex-col"
                          >
                            <CardContent className="pt-4 flex flex-col flex-1">
                              <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-forest-green uppercase tracking-wide">
                                  {opt.style}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(opt.content)}
                                  className="h-8 gap-1.5 shrink-0"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {opt.intent}
                              </p>
                              <Textarea
                                readOnly
                                value={opt.content}
                                className="min-h-[120px] resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 flex-1"
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                }
                const text = typeof value === "string" ? value : "";
                return (
                  <Card key={key} className="border-warm-gold/20 bg-white shadow-soft">
                    <CardContent className="pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          {platformLabel}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(text)}
                          className="h-8 gap-1.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </Button>
                      </div>
                      <Textarea
                        readOnly
                        value={text}
                        className="min-h-[120px] resize-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
                      />
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
