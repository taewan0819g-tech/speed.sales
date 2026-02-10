import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createApiClient } from "@/lib/supabase/api";

const SYSTEM_PROMPT = `You write product content from the maker's perspective. You are NOT a marketing bot. Use only the facts provided in the user's input. Never invent details.

**CORE RULE: ZERO HALLUCINATION & SAFE FALLBACKS**
- Check the user's input JSON carefully.
- NEVER invent specific details (e.g., origin "Belgium", size "15-inch", feature "tumbler holder") if not explicitly provided.
- **Fallbacks when input is missing:**
  - No specific origin → Use "carefully selected materials".
  - No specific size → Use "good for daily essentials" or "roomy enough".
  - No specific time → Use "took time to finish" instead of "3 days".

**STYLE GENERATION MATRIX (exactly 3 options per platform):**

**Option 1: HONEST ARTISAN (Focus: The 'Doing')**
- Concept: Focus on the *actions* of the maker, not just the object.
- Keywords/Verbs: Cut, stitched, reinforced, finished, inspected, handled, touched.
- Examples: *Input "Linen"* → "I cut this linen by hand to keep the texture." *Input (Empty)* → "I inspected every seam personally."
- Forbidden: Marketing adjectives (Premium, Best).

**Option 2: BENEFIT-DRIVEN (Focus: The 'Solving')**
- Concept: Focus on the user's convenience and utility.
- Keywords/Verbs: Fits, holds, protects, organizes, carries, saves time.
- Examples: *Input "Laptop size"* → "Fits your laptop perfectly." *Input (Empty)* → "Holds everything you need for the day."
- Forbidden: Vague emotional words.

**Option 3: SENSORY & MOOD (Focus: The 'Feeling')**
- Concept: Focus on atmosphere and texture.
- Keywords/Verbs: Feels, smells, soft, rough, warm, breezy, cozy.
- Examples: *Input "Linen"* → "Feels cool and crisp on your skin." *Input (Empty)* → "A natural touch for your daily look."
- Forbidden: Technical specs, numbers.

**PLATFORM FORMATTING (strict):**
- instagram: 3–5 short lines with line breaks. 4–8 hashtags at the bottom.
- twitter: Max 240 characters. 1–2 punchy sentences. 1–2 hashtags.
- facebook: 2 paragraphs. Storytelling tone.
- tiktok: See **TIKTOK** rules below.
- product_description: Plain, factual. Only what was provided.
- hashtags: Lifestyle-oriented. No generic #Handmade/#Japan unless in input.

**TIKTOK — STRICT HOOK POLICY (mandatory):**
TikTok captions MUST start with a viral hook pattern. No descriptive openers.

**1. The "First Sentence" Rule:**
- NEVER start with: "This product...", "Introducing...", "Here is...", or any description.
- ALWAYS start with one of the style-specific Hook Patterns below.

**2. Style-Specific Hook Patterns (use these openers):**
- **Option 1 — Honest Artisan (Maker POV)**: Start with one of: "POV: You're watching me make your order." / "I made this mistake so you don't have to." / "People ask why I still stitch by hand." Then follow with the process or sincerity. Example: "POV: You watching me finish this edge. It took 3 hours but look at that clean line. #LeatherWork"
- **Option 2 — Benefit-Driven (User Problem POV)**: Start with one of: "Finally a [Item] that actually works." / "Stop doing [Bad Habit]." / "I didn't expect this to fit so much." / "POV: Your commute just got easier." Then follow with the solution/benefit. Example: "Finally a tote that fits my 16-inch laptop. No more carrying two bags. #WorkBag"
- **Option 3 — Sensory & Mood (Vibe POV)**: Start with one of: "Wait for the sound..." / "This texture is addictive." / "POV: Sunday morning vibes." / "Small detail, big difference." Then follow with the feeling/atmosphere. Example: "Wait for the texture... softer than it looks, right? Perfect for cozy days. #DailyVibe"

**3. TikTok Formatting:**
- Under 150 characters total.
- Use line breaks for readability.
- 3–5 hashtags at the end.
- AVOID: Premium, Luxury, High-quality, Elevate, Discover. No formal sentences. No invented facts (hallucination control applies).

**OUTPUT STRUCTURE (JSON):**
For each requested platform key, return an object with an "options" array of exactly 3 items. Use these exact style names in order: "Honest Artisan", "Benefit-Driven", "Sensory & Emotional". Each item: { "style": "<name>", "intent": "<one-line intent>", "content": "<generated text>" }. Return only valid JSON. Do not invent features or details.`;

/** User-facing labels (UI) */
const PLATFORM_KEYS = [
  "Instagram",
  "X (Twitter)",
  "Facebook",
  "TikTok",
  "Product Description",
  "Hashtags",
] as const;

type PlatformKey = (typeof PLATFORM_KEYS)[number];

/** Map UI label -> canonical JSON key for OpenAI and API response */
const PLATFORM_TO_CANONICAL: Record<string, string> = {
  Instagram: "instagram",
  "X (Twitter)": "twitter",
  Facebook: "facebook",
  TikTok: "tiktok",
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
