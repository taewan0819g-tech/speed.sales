import Link from "next/link";

export const metadata = {
  title: "Announcements | Speed.Sales",
  description: "Updates and announcements.",
};

export default function NoticePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl font-bold text-[#2F5D50] md:text-4xl">
          Announcements
        </h1>
        <div className="mt-8 space-y-6 font-sans text-gray-700 leading-relaxed">
          <ul className="list-none space-y-4">
            <li className="border-l-2 border-[#2F5D50]/30 pl-4">
              <span className="font-medium text-gray-900">2026-02-11:</span>{" "}
              Speed.Sales Beta Launch! Multi-language support (EN, JP, CN) and
              platform-specific AI writing features are now live.
            </li>
          </ul>
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
