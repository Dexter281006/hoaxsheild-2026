import Image from "next/image";
import SiteShell from "../components/site-shell";

export default function FuturePreviewPage() {
  return (
    <SiteShell title="What the future holds" emoji="✨" description="A preview of the calm, polished experience HoaxShield can grow into.">
      <div className="space-y-4">
        <div className="rounded-2xl border border-rose-200 bg-white/80 p-6 text-rose-800">
          <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50">
            <Image src="/ai-hero.svg" alt="Future HoaxShield preview" width={1200} height={700} className="h-auto w-full object-cover" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-rose-900">A softer, more visual experience</h2>
          <p className="mt-3 text-base leading-7 text-rose-700/80">
            HoaxShield can grow into a more visual dashboard with richer illustrations, branded cards, and clearer risk summaries for every scan.
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-white/80 p-6 text-rose-800">
          <h2 className="text-xl font-semibold text-rose-900">What could come next</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-rose-700/80">
            <li>More polished visual reports for each URL, message, file, and image.</li>
            <li>Clearer Google review messages when a result is available or unavailable.</li>
            <li>More illustrations and friendly cards that make safety checks feel calm and approachable.</li>
          </ul>
        </div>
      </div>
    </SiteShell>
  );
}
