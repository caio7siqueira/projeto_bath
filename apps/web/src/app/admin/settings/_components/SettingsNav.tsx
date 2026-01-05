'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Tenant', description: 'Preferências gerais e lembretes', href: '/admin/settings' },
  { label: 'Integrações (Omie)', description: 'Credenciais e eventos sincronizados', href: '/admin/settings/omie' },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href === '/admin/settings' && pathname === '/admin/settings/tenant');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`group rounded-2xl border px-5 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              isActive
                ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-200/40'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900/40 hover:text-gray-900'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="text-sm font-semibold">{tab.label}</div>
            <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 group-hover:text-gray-600'}`}>{tab.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
