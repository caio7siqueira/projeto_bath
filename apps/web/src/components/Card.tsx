'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: string;
}

export function Card({ children, className = '', header }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      {header && <h3 className="text-lg font-semibold mb-4 text-gray-900">{header}</h3>}
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
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
    </div>
  );
}
