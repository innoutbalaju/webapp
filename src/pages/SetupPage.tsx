import { Cog, ExternalLink } from 'lucide-react';

import { env } from '@/lib/env';

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
        <div className="flex items-center gap-3 text-amber-200">
          <Cog className="h-5 w-5" />
          <span className="text-sm uppercase tracking-[0.25em]">
            Configuration Required
          </span>
        </div>
        <h1 className="mt-4 font-serif text-3xl text-amber-50">
          Connect Supabase before launching the hotel service app
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your local
          environment or GitHub Pages build secrets, then restart the app.
          Until those values are provided, authentication, realtime updates, and
          ordering remain disabled.
        </p>
        <div className="mt-8 space-y-3 rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-200 ring-1 ring-white/10">
          <div>
            <span className="text-slate-400">Hotel name</span>
            <div className="mt-1 font-medium">{env.hotelName}</div>
          </div>
          <div>
            <span className="text-slate-400">Support contact</span>
            <div className="mt-1 font-medium">{env.adminSupportEmail}</div>
          </div>
        </div>
        <a
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-200"
          href="https://supabase.com/docs"
          target="_blank"
          rel="noreferrer"
        >
          Open Supabase setup guide
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </main>
  );
}
