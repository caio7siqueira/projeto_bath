"use client";

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  note?: string;
}

export function Breadcrumbs({ items, note }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Trilha de navegação" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !item.isCurrent ? (
              <Link href={item.href} className="text-brand-600 underline-offset-4 hover:text-brand-500 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={item.isCurrent ? 'font-semibold text-slate-900' : undefined}>{item.label}</span>
            )}
            {index < items.length - 1 && <span className="text-slate-300">/</span>}
          </li>
        ))}
      </ol>
      {note && <p className="mt-1 text-xs text-slate-400 italic">{note}</p>}
    </nav>
  );
}
