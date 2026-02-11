import Link from "next/link";

export const metadata = {
  title: "About | Speed.Sales",
  description: "We help artisans tell their story.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl font-bold text-[#2F5D50] md:text-4xl">
          We help artisans tell their story.
        </h1>
        <div className="mt-8 space-y-6 font-sans text-gray-700 leading-relaxed">
          <p>
            Speed.Sales helps makers overcome language barriers and marketing
            fatigue. Focus on making—we handle the telling.
          </p>
          <p>
            We&apos;re an AI-powered tool for global expansion: generate
            platform-ready, multi-language content so you can spend more time on
            your craft and less on copy.
          </p>
        </div>
        <p className="mt-10">
          <Link
            href="/"
            className="text-sm font-medium text-[#2F5D50] hover:underline"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
