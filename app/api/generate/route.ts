import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createApiClient } from "@/lib/supabase/api";

const SYSTEM_PROMPT = `You are a professional copywriter. Generate content strictly based on provided facts. Do NOT invent features. Do NOT exaggerate. Return JSON only. Use exactly the key names you are given for each platform (lowercase, snake_case where specified).`;

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
    `Generate content for these platforms. Return a JSON object with exactly these keys (use these key names verbatim): ${body.canonicalKeys.join(", ")}. Each key's value must be the generated text for that platform.`,
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

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(raw) as Record<string, string>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from OpenAI.", raw },
        { status: 502 }
      );
    }

    const result: Record<string, string> = {};
    for (let i = 0; i < platformList.length; i++) {
      const displayName = platformList[i];
      const canonicalKey = canonicalKeys[i];
      const value =
        parsed[canonicalKey] ?? parsed[displayName] ?? parsed[displayName.toLowerCase()];
      result[canonicalKey] =
        typeof value === "string" ? value : String(value ?? "");
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
