import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type SiteShellProps = {
  children: ReactNode;
  title: string;
  emoji: string;
  description?: string;
};

const navigation = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/scan-url", label: "URL", emoji: "🔗" },
  { href: "/scan-message", label: "Message", emoji: "💬" },
  { href: "/scan-file", label: "File", emoji: "📁" },
  { href: "/scan-image", label: "Image", emoji: "🖼️" },
];

export default function SiteShell({ children, title, emoji, description }: SiteShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,207,232,0.4),_transparent_30%),linear-gradient(120deg,_#fff7fb_0%,_#ffe9f2_45%,_#fde8f5_100%)] px-4 py-6 text-rose-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="animate-[fadeIn_0.6s_ease-out] rounded-[1.25rem] border border-rose-200 bg-white/80 px-4 py-4 shadow-lg shadow-rose-100/70 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 transition duration-300 hover:scale-[1.02]">
              <Image src="/hoaxshield-logo.svg" alt="HoaxShield logo" width={44} height={44} priority />
              <div>
                <p className="text-lg font-semibold text-rose-900">HoaxShield</p>
                <p className="text-xs uppercase tracking-[0.25em] text-rose-500">Threat scanner</p>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition duration-300 hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-100 hover:text-rose-900"
                >
                  <span className="mr-2">{item.emoji}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="animate-[fadeInUp_0.8s_ease-out] rounded-[1.5rem] border border-rose-200 bg-white/80 p-6 shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-500">{emoji}</p>
              <h1 className="mt-2 text-3xl font-semibold text-rose-900 sm:text-4xl">{title}</h1>
              {description ? <p className="mt-3 max-w-2xl text-base leading-7 text-rose-700/80">{description}</p> : null}
            </div>
            <Link href="/" className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition duration-300 hover:-translate-y-0.5 hover:bg-rose-100">
              🏠 Back to home
            </Link>
          </div>

          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
