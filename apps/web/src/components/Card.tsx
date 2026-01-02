'use client';

import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  header?: string;
}

export function Card({ children, className = '', header, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={`surface-card p-6 ${className}`}
    >
      {header && <h3 className="text-lg font-semibold mb-4 text-slate-900">{header}</h3>}
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
}

export function CardHeader({ title, description }: CardHeaderProps) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}
