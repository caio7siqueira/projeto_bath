export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Projeto Bath</p>
            <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          </div>
          <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200 border border-white/10">
            Ambiente demo
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
