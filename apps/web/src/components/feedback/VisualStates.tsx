'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Card } from '@/components/Card';

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface SkeletonBlockProps {
  className?: string;
  style?: CSSProperties;
}

export function SkeletonBlock({ className = '', style }: SkeletonBlockProps) {
  return (
    <div
      style={style}
      className={cx(
        'animate-pulse rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100',
        className,
      )}
    />
  );
}

export function HeroSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="h-9 w-48" />
      <SkeletonBlock className="h-4 w-64" />
      <SkeletonBlock className="h-4 w-40" />
    </div>
  );
}

interface ListSkeletonProps {
  rows?: number;
  hasActions?: boolean;
}

export function ListSkeleton({ rows = 3, hasActions = false }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full space-y-3">
            <SkeletonBlock className="h-5 w-2/5" />
            <SkeletonBlock className="h-4 w-1/3" />
          </div>
          {hasActions && <SkeletonBlock className="h-10 w-28" />}
        </Card>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index}>
          <div className="space-y-4 text-center">
            <SkeletonBlock className="h-4 w-1/2 mx-auto" />
            <SkeletonBlock className="h-10 w-20 mx-auto" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-4 w-40" />
      <div className="grid h-40 grid-cols-12 gap-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="flex flex-col justify-end">
            <SkeletonBlock className="w-full" style={{ height: `${20 + (index % 5) * 12}px` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'card' | 'inline';
  mood?: 'neutral' | 'positive' | 'warning';
}

const moodClass: Record<NonNullable<EmptyStateProps['mood']>, string> = {
  neutral: 'text-gray-600',
  positive: 'text-emerald-700',
  warning: 'text-amber-700',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'card',
  mood = 'neutral',
}: EmptyStateProps) {
  const content = (
    <div className={cx('space-y-3 text-center', moodClass[mood])}>
      {icon && <div className="text-3xl" aria-hidden>{icon}</div>}
      <div>
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6">
        {content}
      </div>
    );
  }

  return <Card className="bg-gradient-to-br from-white to-gray-50">{content}</Card>;
}

interface ErrorBannerProps {
  title?: string;
  message: string;
  details?: string[];
  action?: ReactNode;
  scenario?: string;
}

export function ErrorBanner({ title, message, details, action, scenario }: ErrorBannerProps) {
  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 shadow-sm"
      role="alert"
      aria-live="assertive"
      data-error-scenario={scenario}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg" aria-hidden>
          ⚠️
        </span>
        <div className="flex-1 space-y-2">
          {title && <p className="text-base font-semibold text-red-900">{title}</p>}
          <p>{message}</p>
          {details && details.length > 0 && (
            <ul className="list-disc space-y-1 pl-4">
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
          {action}
        </div>
      </div>
    </div>
  );
}
