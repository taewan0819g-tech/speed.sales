import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createApiClient } from "@/lib/supabase/api";

const SYSTEM_PROMPT = `You are helping the maker write content. You are NOT a marketing bot. Keep strict constraints: never use "Premium", "Elegant", "Luxurious", "Discover", "Masterpiece", or "Elevate". Use simple, honest, everyday English. Fact-based only—no exaggeration.

**TASK:** For each platform you are asked to generate for, return exactly **3 variations** so the user can choose the best tone. Each variation must be in this JSON shape:

{
  "options": [
    { "style": "Honest Artisan", "intent": "Focuses on the handmade process and sincerity.", "content": "..." },
    { "style": "Benefit-Driven", "intent": "Highlights practical utility and daily convenience.", "content": "..." },
    { "style": "Sensory & Emotional", "intent": "Focuses on atmosphere, texture, and specific usage scenes.", "content": "..." }
  ]
}

**THE 3 STYLES (use these exact style names):**

1. **Honest Artisan** (Process-Focused)
   - Intent: Focus on the making process, materials, and sincerity.
   - Tone: Humble, calm, trustworthy.

2. **Benefit-Driven** (Utility-Focused)
   - Intent: Focus on how it helps the user in daily life (solving problems).
   - Tone: Direct, clear, practical.

3. **Sensory & Emotional** (Vibe-Focused)
   - Intent: Focus on atmosphere, texture, and specific usage scenes.
   - Tone: Poetic but simple, warm, inviting.

**PLATFORM RULES (apply to each variation):**
- instagram: 1-line hook → usage scenario → fact info → 4–8 hashtags. Short sentences.
- twitter: Product name → key benefit → short use case → 1–3 hashtags. Max 1–2 sentences.
- facebook: Intro → key features → detailed usage → closing. Paragraph form, informative.
- product_description: Plain, factual. Materials, size, use cases.
- hashtags: Lifestyle-oriented tags. Avoid generic #Handmade/#Japan unless specified.

**OUTPUT:** Return only valid JSON. For each requested platform key (e.g. instagram, twitter, facebook, product_description, hashtags), the value must be an object with an "options" array containing exactly 3 objects, each with "style", "intent", and "content". Use the exact style names above. Do not invent features.`;

/** User-facing labels (UI) */
const PLATFORM_KEYS = [
  "Instagram",
  "X (Twitter)",
  "Facebook",
  "Product Description",
  "Hashtags",
] as const;

type PlatformKey = (typeof PLATFORM_KEYS)[number];

/** Map UI label -> canonical JSON key for OpenAI and API response */
const PLATFORM_TO_CANONICAL: Record<string, string> = {
  Instagram: "instagram",
  "X (Twitter)": "twitter",
  Facebook: "facebook",
  "Product Description": "product_description",
  Hashtags: "hashtags",
};

function buildUserPrompt(body: {
  productName: string;
  material?: string;
  size?: string;
  handmade: boolean;
  origin?: string;
  keyFeatures?: string;
  tone: string;
  canonicalKeys: string[];
}): string {
  const lines: string[] = [
    `Product name: ${body.productName}`,
    body.material ? `Material: ${body.material}` : "",
    body.size ? `Size: ${body.size}` : "",
    `Handmade: ${body.handmade ? "Yes" : "No"}`,
    body.origin ? `Origin: ${body.origin}` : "",
    body.keyFeatures
      ? `Key features (use only these, do not add):\n${body.keyFeatures}`
      : "",
    `Tone: ${body.tone}`,
    `Generate content for these platforms. Return a JSON object with exactly these keys (use these key names verbatim): ${body.canonicalKeys.join(", ")}. For EACH key, the value must be an object with an "options" array of exactly 3 items: { "style": "Honest Artisan" | "Benefit-Driven" | "Sensory & Emotional", "intent": "short description", "content": "the generated text" }.`,
  ];
  return lines.filter(Boolean).join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured. Set OPENAI_API_KEY in .env.local.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      productName,
      material,
      size,
      handmade = false,
      origin,
      keyFeatures,
      tone = "Simple",
      platforms,
      imageUrls = [],
    } = body;

    if (!productName || typeof productName !== "string" || !productName.trim()) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    const platformList = Array.isArray(platforms)
      ? platforms.filter((p: string) =>
          PLATFORM_KEYS.includes(p as PlatformKey)
        )
      : [];
    if (platformList.length === 0) {
      return NextResponse.json(
        { error: "At least one target platform must be selected." },
        { status: 400 }
      );
    }

    const supabase = createApiClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to generate content." },
        { status: 401 }
      );
    }

    const productNameTrimmed = productName.trim();
    const imageUrlList = Array.isArray(imageUrls)
      ? imageUrls.filter((u): u is string => typeof u === "string")
      : [];
    const { data: insertedRow, error: insertError } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        product_name: productNameTrimmed,
        material: material?.trim() || null,
        size: size?.trim() || null,
        handmade: Boolean(handmade),
        origin: origin?.trim() || null,
        key_features: keyFeatures?.trim() || null,
        tone: tone?.trim() || null,
        target_platforms: platformList,
        image_urls: imageUrlList.length > 0 ? imageUrlList : null,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save product. Please try again." },
        { status: 500 }
      );
    }

    const canonicalKeys = platformList.map(
      (p) => PLATFORM_TO_CANONICAL[p] ?? p.toLowerCase().replace(/\s+/g, "_")
    );

    const openai = new OpenAI({ apiKey });
    const userPrompt = buildUserPrompt({
      productName: productName.trim(),
      material: material?.trim(),
      size: size?.trim(),
      handmade: Boolean(handmade),
      origin: origin?.trim(),
      keyFeatures: keyFeatures?.trim(),
      tone: String(tone),
      canonicalKeys,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "No content returned from OpenAI." },
        { status: 502 }
      );
    }

    type OptionItem = { style: string; intent: string; content: string };
    type PlatformOptions = { options: OptionItem[] };

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from OpenAI.", raw },
        { status: 502 }
      );
    }

    const result: Record<string, PlatformOptions> = {};
    const defaultOptions: OptionItem[] = [
      { style: "Honest Artisan", intent: "Focuses on the handmade process and sincerity.", content: "" },
      { style: "Benefit-Driven", intent: "Highlights practical utility and daily convenience.", content: "" },
      { style: "Sensory & Emotional", intent: "Focuses on atmosphere, texture, and usage scenes.", content: "" },
    ];

    for (let i = 0; i < platformList.length; i++) {
      const canonicalKey = canonicalKeys[i];
      const rawValue = parsed[canonicalKey];
      if (rawValue && typeof rawValue === "object" && Array.isArray((rawValue as { options?: unknown }).options)) {
        const arr = (rawValue as { options: unknown[] }).options;
        result[canonicalKey] = {
          options: arr.slice(0, 3).map((item: unknown) => {
            const o = item as Record<string, unknown>;
            return {
              style: typeof o?.style === "string" ? o.style : defaultOptions[0]!.style,
              intent: typeof o?.intent === "string" ? o.intent : "",
              content: typeof o?.content === "string" ? o.content : String(o?.content ?? ""),
            };
          }),
        };
        while (result[canonicalKey]!.options.length < 3) {
          result[canonicalKey]!.options.push(defaultOptions[result[canonicalKey]!.options.length]!);
        }
      } else {
        result[canonicalKey] = { options: defaultOptions.map((opt) => ({ ...opt, content: String(rawValue ?? "") })) };
      }
    }

    if (insertedRow?.id) {
      await supabase
        .from("products")
        .update({ generated_contents: result })
        .eq("id", insertedRow.id);
      await supabase.from("generated_contents").upsert(
        { product_id: insertedRow.id, contents: result },
        { onConflict: "product_id" }
      );
    }

    const createdAt =
      insertedRow?.created_at != null
        ? new Date(insertedRow.created_at).toISOString()
        : new Date().toISOString();

    return NextResponse.json({
      productId: insertedRow?.id,
      productName: productNameTrimmed,
      createdAt,
      ...result,
    });
  } catch (err) {
    console.error("Generate API error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: "Content generation failed.", details: message },
      { status: 500 }
    );
  }
}
