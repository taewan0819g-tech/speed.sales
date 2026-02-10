import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-warm-gold/30 bg-ivory text-charcoal">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand & links */}
          <div className="space-y-4">
            <p className="font-serif text-lg font-bold text-[#2F5D50]">
              Speed.Sales
            </p>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-60">
              <Link
                href="/about"
                className="hover:opacity-100 transition-opacity"
              >
                About
              </Link>
              <span className="text-[#2C2C2C]/40">|</span>
              <Link
                href="/privacy"
                className="hover:opacity-100 transition-opacity"
              >
                Privacy
              </Link>
              <span className="text-[#2C2C2C]/40">|</span>
              <Link
                href="/terms"
                className="hover:opacity-100 transition-opacity"
              >
                Terms
              </Link>
              <span className="text-[#2C2C2C]/40">|</span>
              <Link
                href="/notice"
                className="hover:opacity-100 transition-opacity"
              >
                Notice
              </Link>
            </nav>
          </div>

          {/* Representative info */}
          <div className="space-y-1 text-sm opacity-60 font-sans">
            <p>Representative: Hwang Taewan</p>
            <p>DPO (Data Protection Officer): Hwang Taewan</p>
            <p>Address: Icheon-si, Gyeonggi-do</p>
            <p>
              <a
                href="mailto:taewan0819g@gmail.com"
                className="hover:opacity-100 transition-opacity underline"
              >
                taewan0819g@gmail.com
              </a>
            </p>
            <p className="italic mt-2">*Beta. Full service coming soon.*</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#2C2C2C]/10 text-center text-sm opacity-60 font-sans">
          Copyright © 2026 SPEED.SALES. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
