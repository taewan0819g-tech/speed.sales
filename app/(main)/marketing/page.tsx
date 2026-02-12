"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import {
  Copy,
  Loader2,
  Lock,
  X,
  Instagram,
  Twitter,
  Facebook,
  Video,
  FileText,
  Hash,
  Sparkles,
  Globe,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const STORAGE_BUCKET = "product-images";

const TONE_OPTIONS = ["Simple", "Warm", "Premium"] as const;
const TONE_CARDS: {
  value: (typeof TONE_OPTIONS)[number];
  title: string;
  description: string;
}[] = [
  {
    value: "Simple",
    title: "Simple",
    description: "Clear and straightforward copy",
  },
  {
    value: "Warm",
    title: "Warm",
    description: "Friendly and approachable tone",
  },
  {
    value: "Premium",
    title: "Premium",
    description: "Refined and elevated voice",
  },
];
const PLATFORMS = [
  "Instagram",
  "X (Twitter)",
  "Facebook",
  "TikTok",
  "Product Description",
  "Hashtags",
] as const;

const PLATFORM_ICONS: Record<
  (typeof PLATFORMS)[number],
  ComponentType<{ className?: string }>
> = {
  Instagram,
  "X (Twitter)": Twitter,
  Facebook,
  TikTok: Video,
  "Product Description": FileText,
  Hashtags: Hash,
};

const LANGUAGE_OPTIONS = ["KO", "EN", "JP", "CN"] as const;
type Language = (typeof LANGUAGE_OPTIONS)[number];

const RESULT_KEY_TO_LABEL: Record<string, string> = {
  instagram: "Instagram",
  twitter: "X (Twitter)",
  facebook: "Facebook",
  tiktok: "TikTok",
  product_description: "Product Description",
  hashtags: "Hashtags",
};

export type ResultOption = { style: string; intent: string; content: string };
export type PlatformResult = string | { options: ResultOption[] };

type Platform = (typeof PLATFORMS)[number];

export default function MarketingPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("hasVisited") == null) {
      setWelcomeModalOpen(true);
    }
  }, []);

  const closeWelcomeModal = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasVisited", "true");
    }
    setWelcomeModalOpen(false);
  };

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const [productName, setProductName] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [handmade, setHandmade] = useState(false);
  const [origin, setOrigin] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [tone, setTone] = useState<string>("Simple");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [language, setLanguage] = useState<Language>("KO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, PlatformResult> | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const list = Array.from(files);
    setImageFiles((prev) => [...prev, ...list]);
    list.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImagePreviewUrls((prev) => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index] ?? "");
      next.splice(index, 1);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    const productNameTrimmed = productName.trim();
    if (!productNameTrimmed) {
      setError("Product name is required.");
      return;
    }
    if (platforms.length === 0) {
      setError("Select at least one platform.");
      return;
    }

    setLoading(true);
    let imageUrlList: string[] = [];

    try {
      if (imageFiles.length > 0) {
        const client = createClient();
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${user.id}/${Date.now()}-${i}.${ext}`;
          const { error: uploadError } = await client.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: urlData } = client.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);
          imageUrlList.push(urlData.publicUrl);
        }
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productNameTrimmed,
          material: material.trim() || undefined,
          size: size.trim() || undefined,
          handmade,
          origin: origin.trim() || undefined,
          keyFeatures: keyFeatures.trim() || undefined,
          tone,
          platforms,
          language,
          imageUrls: imageUrlList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
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

  const resultEntries = result
    ? Object.entries(result).filter(([key]) => key in RESULT_KEY_TO_LABEL)
    : [];

  const isOptionsShape = (v: PlatformResult): v is { options: ResultOption[] } =>
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Array.isArray((v as { options?: unknown }).options);

  const getContentString = (opt: ResultOption): string => {
    const c = opt?.content;
    if (typeof c === "string") return c;
    if (c == null) return "";
    return String(c);
  };

  return (
    <>
      {welcomeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          aria-modal="true"
          role="dialog"
          aria-labelledby="welcome-modal-title"
        >
          <div
            className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeWelcomeModal}
              className="absolute right-4 top-4 rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2
              id="welcome-modal-title"
              className="pr-8 text-xl font-bold text-charcoal"
            >
              Welcome to Speed.Sales
            </h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              Built through extensive learning, we generate optimized,
              platform-tailored content for every channel — Instagram, X,
              Facebook, and TikTok.
            </p>
            <Button
              onClick={closeWelcomeModal}
              className="mt-6 w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-full bg-ivory">
        <div className="mx-auto max-w-7xl px-4 py-8 pt-16 lg:pt-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <div>
                <h2 className="font-serif text-xl font-semibold text-charcoal md:text-2xl">
                  Create content
                </h2>
                <p className="mt-1 text-sm text-charcoal/80">
                  Describe your product. We&apos;ll generate copy for every
                  channel.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="productName"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Product name
                </Label>
                <Input
                  id="productName"
                  placeholder="e.g. Ceramic Mug"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="rounded-none border-0 border-b border-gray-200 bg-transparent px-0 shadow-none focus-visible:border-forest-green focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Tone
                </span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {TONE_CARDS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-1 ${
                        tone === t.value
                          ? "border-forest-green bg-forest-green/10 text-forest-green"
                          : "border-gray-200 bg-white text-charcoal hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium">{t.title}</span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="material"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Material
                  </Label>
                  <Input
                    id="material"
                    placeholder="e.g. Porcelain"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50/80 focus-visible:ring-forest-green"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="size"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Size
                  </Label>
                  <Input
                    id="size"
                    placeholder="e.g. 350ml"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50/80 focus-visible:ring-forest-green"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="handmade"
                    checked={handmade}
                    onCheckedChange={setHandmade}
                  />
                  <Label
                    htmlFor="handmade"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Handmade
                  </Label>
                </div>
                <div className="min-w-[140px] flex-1">
                  <Input
                    id="origin"
                    placeholder="Origin (e.g. Made in Korea)"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="rounded-none border-0 border-b border-gray-200 bg-transparent px-0 shadow-none focus-visible:border-forest-green focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="keyFeatures"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Features
                </Label>
                <Textarea
                  id="keyFeatures"
                  placeholder="3–5 bullet points or short description"
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  rows={3}
                  className="resize-none rounded-lg border border-gray-200 bg-gray-50/80 focus-visible:ring-forest-green"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Product images (optional)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-forest-green transition-colors hover:bg-forest-green/10">
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
                          className="relative h-14 w-14 overflow-hidden rounded-lg border border-gray-200 bg-muted"
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
                    {imageFiles.length} image(s) will be uploaded when you
                    generate.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Platforms
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PLATFORMS.map((p) => {
                    const Icon = PLATFORM_ICONS[p];
                    const selected = platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                          selected
                            ? "border-forest-green bg-forest-green/10 text-forest-green"
                            : "border-gray-200 bg-white text-charcoal hover:border-gray-300"
                        }`}
                      >
                        {Icon && <Icon className="h-5 w-5 shrink-0" />}
                        <span className="truncate text-sm font-medium">{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Target Market Language
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-1">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = language === lang;
                    const label = lang === "KO" ? "KO (Default)" : lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-forest-green text-white shadow-sm"
                            : "text-charcoal hover:bg-gray-200/80"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                className="w-full bg-gradient-to-r from-forest-green to-emerald-700 py-6 text-base font-medium text-white shadow-lg hover:opacity-95 hover:shadow-xl"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : !user ? (
                  <>
                    <Lock className="h-5 w-5" />
                    Generate
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            </div>

            <div className="lg:col-span-7">
              <div className="sticky top-24 min-h-[360px] rounded-2xl border border-gray-200 bg-gray-50/80 p-6 shadow-sm lg:min-h-[480px]">
                {loading && (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <span className="text-sm">Generating content...</span>
                  </div>
                )}
                {!loading && resultEntries.length === 0 && (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-gray-200/80 p-4">
                      <Sparkles className="h-10 w-10 text-gray-500" />
                    </div>
                    <p className="font-medium text-charcoal">
                      Ready to create magic
                    </p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Fill in your product details and pick platforms. Your
                      copy will appear here.
                    </p>
                  </div>
                )}
                {!loading && resultEntries.length > 0 && (
                  <div className="space-y-6">
                    {resultEntries.map(([key, value]) => {
                      const platformLabel = RESULT_KEY_TO_LABEL[key] ?? key;
                      if (isOptionsShape(value)) {
                        const options = value?.options ?? [];
                        return (
                          <div key={key} className="space-y-3">
                            <h3 className="text-sm font-semibold text-forest-green">
                              {platformLabel}
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {options.map((opt: ResultOption, idx: number) => {
                                const content = getContentString(opt);
                                const styleLabel =
                                  typeof opt?.style === "string"
                                    ? opt.style
                                    : `Variation ${idx + 1}`;
                                const intentLabel =
                                  typeof opt?.intent === "string"
                                    ? opt.intent
                                    : "";
                                return (
                                  <Card
                                    key={`${key}-${idx}`}
                                    className="border border-gray-200 bg-white shadow-sm"
                                  >
                                    <CardContent className="p-4">
                                      <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-forest-green">
                                          {styleLabel}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            copyToClipboard(content)
                                          }
                                          className="h-7 gap-1 text-xs"
                                        >
                                          <Copy className="h-3 w-3" />
                                          Copy
                                        </Button>
                                      </div>
                                      {intentLabel ? (
                                        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                                          {intentLabel}
                                        </p>
                                      ) : null}
                                      <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-charcoal">
                                        {content}
                                      </p>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      const text =
                        typeof value === "string" ? value : "";
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              {platformLabel}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(text)}
                              className="h-7 gap-1 text-xs"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </Button>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="whitespace-pre-wrap font-mono text-sm text-charcoal">
                              {text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
