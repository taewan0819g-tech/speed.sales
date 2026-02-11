import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Speed.Sales",
  description: "How we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl font-bold text-[#2F5D50] md:text-4xl">
          Privacy Policy
        </h1>
        <div className="mt-8 space-y-6 font-sans text-gray-700 leading-relaxed">
          <p>
            We respect your data. Your product inputs are used solely to
            generate content. We do not share personal information with third
            parties.
          </p>
          <p>
            For more details or questions, please contact us using the
            information in the footer.
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
