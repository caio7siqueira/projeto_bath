'use client';

import { Sidebar } from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}
