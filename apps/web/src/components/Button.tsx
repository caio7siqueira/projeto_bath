'use client';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  icon,
  ...props
}: ButtonProps & { type?: 'button' | 'submit' }) {
  const baseClass =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  const variantClass = {
    primary: 'bg-brand-600 text-white shadow-soft hover:bg-brand-500 focus-visible:ring-brand-300',
    secondary: 'bg-white text-brand-700 border border-surface-divider hover:bg-brand-50 focus-visible:ring-brand-300',
    danger: 'bg-rose-600 text-white shadow-soft hover:bg-rose-500 focus-visible:ring-rose-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
  }[variant];

  const sizeClass = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }[size];

  return (
    <button
      type={props.type || 'button'}
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
    >
      {isLoading ? (
        <>
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          <span className="text-sm">Carregando</span>
        </>
      ) : (
        <>
          {icon && <span aria-hidden>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
