'use client';

import { Sidebar } from '@/components/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="relative flex min-h-screen bg-surface-muted text-slate-900">
        <a href="#conteudo-principal" className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-full focus-visible:bg-white focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:shadow-soft">
          Pular para o conteúdo principal
        </a>
        <Sidebar />
        <main
          id="conteudo-principal"
          role="main"
          className="flex-1 overflow-y-auto overflow-x-hidden bg-[var(--background)] pt-20 md:pt-0"
        >
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
