import SiteShell from "../components/site-shell";

export default function FuturePreviewPage() {
  return (
    <SiteShell title="What the future holds" emoji="✨" description="A preview of the branded domain-based scanning experience you can unlock later.">
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-slate-300">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <img src="/yourimage.png" alt="Future HoaxShield preview" className="h-auto w-full object-cover" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">Branded scan pages</h2>
          <p className="mt-3 text-base leading-7 text-slate-400">
            In the future, HoaxShield will let you use your own domain so every scan link looks like a trusted internal tool instead of a generic placeholder.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-slate-300">
          <h2 className="text-xl font-semibold text-white">How it will work</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-slate-400">
            <li>Visitors will open a branded scan URL that can later be connected to your own domain.</li>
            <li>The site will display a trust-focused analysis page with a clear risk result and explanation.</li>
            <li>You can later add images, screenshots, and visual walkthroughs to make the experience more engaging.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-slate-300">
          <h2 className="text-xl font-semibold text-white">Use this feature later</h2>
          <p className="mt-3 text-base leading-7 text-slate-400">
            Once you own a domain, you can connect it here and publish a professional scan experience for your users.
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
