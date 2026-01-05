'use client';

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRole } from '@/lib/use-role';

function LogoutButton() {
  const { logout, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">{user?.email}</p>
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Saindo...' : 'Sair'}
      </button>
    </div>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSuperAdmin, isAdmin } = useRole();
  const pathname = usePathname();
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstNavLinkRef = useRef<HTMLAnchorElement | null>(null);
  const previousOverflow = useRef({ body: '', html: '' });
  const hasToggledRef = useRef(false);

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeDrawer, isOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;

    if (isOpen) {
      previousOverflow.current = {
        body: body.style.overflow,
        html: html.style.overflow,
      };
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
    } else {
      body.style.overflow = previousOverflow.current.body;
      html.style.overflow = previousOverflow.current.html;
    }

    return () => {
      body.style.overflow = previousOverflow.current.body;
      html.style.overflow = previousOverflow.current.html;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      firstNavLinkRef.current?.focus();
    } else if (hasToggledRef.current) {
      toggleButtonRef.current?.focus();
    }
    hasToggledRef.current = true;
  }, [isOpen]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        ref={toggleButtonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 rounded-full bg-brand-600 p-2 text-white shadow-soft transition hover:bg-brand-500 md:hidden"
        aria-label="Abrir menu lateral"
        aria-expanded={isOpen}
        aria-controls="sidebar-drawer"
        type="button"
      >
        ☰
      </button>
      {isOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Menu principal"
        id="sidebar-drawer"
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-72 bg-gray-950 text-white shadow-2xl transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          <div className="relative border-b border-gray-800 p-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Bath</h1>
            <p className="mt-1 text-sm text-gray-400">Gestão Petshop</p>
            <button
              type="button"
              onClick={closeDrawer}
              className="md:hidden absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Fechar menu lateral"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4" aria-label="Seções do admin">
            {/* Operacional */}
            <div className="mb-2 mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Operacional</div>
            <NavLink ref={firstNavLinkRef} href="/admin/appointments" label="Agenda" isActive={pathname?.startsWith('/admin/appointments')} onClick={closeDrawer} />
            <NavLink href="/admin/customers" label="Clientes" isActive={pathname?.startsWith('/admin/customers')} onClick={closeDrawer} />
            <NavLink href="/admin/pets" label="Pets" isActive={pathname?.startsWith('/admin/pets')} onClick={closeDrawer} />
            <NavLink href="/admin/services" label="Serviços" isActive={pathname?.startsWith('/admin/services')} onClick={closeDrawer} />
            <NavLink href="/admin/locations" label="Locais" isActive={pathname?.startsWith('/admin/locations')} onClick={closeDrawer} />
            {/* Administrativo */}
            <div className="mb-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administrativo</div>
            <NavLink href="/admin/reports" label="Relatórios" isActive={pathname?.startsWith('/admin/reports') || pathname?.startsWith('/dashboard/reports')} onClick={closeDrawer} />
            {isAdmin && (
              <NavLink href="/admin/billing" label="Billing" isActive={pathname?.startsWith('/admin/billing')} onClick={closeDrawer} />
            )}
            <NavLink href="/admin/notifications" label="Notificações" isActive={pathname?.startsWith('/admin/notifications')} onClick={closeDrawer} />
            {/* Configurações */}
            <div className="mb-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Configurações</div>
            <NavLink href="/admin/settings" label="Configurações" isActive={pathname?.startsWith('/admin/settings')} onClick={closeDrawer} />
            {/* Super Admin */}
            {isSuperAdmin && (
              <>
                <div className="mb-2 mt-4 text-xs font-semibold text-blue-400 uppercase tracking-wider">Super Admin</div>
                <NavLink href="/admin/platform-users" label="Usuários da Plataforma" isActive={pathname?.startsWith('/admin/platform-users')} onClick={closeDrawer} />
              </>
            )}
          </nav>
          <div className="border-t border-gray-700 p-4">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, label, onClick, isActive }, ref) => (
    <Link
      ref={ref}
      href={href}
      onClick={onClick}
      className={`block rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-brand-400 ${
        isActive ? 'bg-white/10 text-white shadow-soft' : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  )
);

NavLink.displayName = 'NavLink';
