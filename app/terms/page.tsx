import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Speed.Sales",
  description: "Terms of use for Speed.Sales.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl font-bold text-[#2F5D50] md:text-4xl">
          Terms of Service
        </h1>
        <div className="mt-8 space-y-6 font-sans text-gray-700 leading-relaxed">
          <p>
            Speed.Sales is currently in Beta. Services are provided
            &quot;as is.&quot; Users are responsible for the content they
            generate and publish.
          </p>
          <p>
            We may update these terms as the service evolves. Continued use of
            Speed.Sales constitutes acceptance of the current terms.
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
