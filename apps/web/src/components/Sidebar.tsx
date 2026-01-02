'use client';

import { useState } from 'react';
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
  const { isSuperAdmin } = useRole();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-full bg-brand-600 p-2 text-white shadow-soft transition hover:bg-brand-500 md:hidden"
        aria-label="Abrir menu lateral"
        aria-expanded={isOpen}
      >
        ☰
      </button>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
      <aside
        aria-label="Menu principal"
        className={`$
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-72 bg-gray-950 text-white shadow-2xl transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          <div className="border-b border-gray-800 p-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Bath</h1>
            <p className="mt-1 text-sm text-gray-400">Gestão Petshop</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-4" aria-label="Seções do admin">
            {/* Operacional */}
            <div className="mb-2 mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Operacional</div>
            <NavLink href="/admin/appointments" label="Agenda" isActive={pathname?.startsWith('/admin/appointments')} onClick={() => setIsOpen(false)} />
            <NavLink href="/admin/customers" label="Clientes" isActive={pathname?.startsWith('/admin/customers')} onClick={() => setIsOpen(false)} />
            <NavLink href="/admin/pets" label="Pets" isActive={pathname?.startsWith('/admin/pets')} onClick={() => setIsOpen(false)} />
            <NavLink href="/admin/services" label="Serviços" isActive={pathname?.startsWith('/admin/services')} onClick={() => setIsOpen(false)} />
            <NavLink href="/admin/locations" label="Locais" isActive={pathname?.startsWith('/admin/locations')} onClick={() => setIsOpen(false)} />
            {/* Administrativo */}
            <div className="mb-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administrativo</div>
            <NavLink href="/admin/reports" label="Relatórios" isActive={pathname?.startsWith('/admin/reports') || pathname?.startsWith('/dashboard/reports')} onClick={() => setIsOpen(false)} />
            <NavLink href="/admin/notifications" label="Notificações" isActive={pathname?.startsWith('/admin/notifications')} onClick={() => setIsOpen(false)} />
            {/* Configurações */}
            <div className="mb-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Configurações</div>
            <NavLink href="/admin/settings" label="Configurações" isActive={pathname?.startsWith('/admin/settings')} onClick={() => setIsOpen(false)} />
            {/* Super Admin */}
            {isSuperAdmin && (
              <>
                <div className="mb-2 mt-4 text-xs font-semibold text-blue-400 uppercase tracking-wider">Super Admin</div>
                <NavLink href="/admin/platform-users" label="Usuários da Plataforma" isActive={pathname?.startsWith('/admin/platform-users')} onClick={() => setIsOpen(false)} />
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
}

function NavLink({ href, label, onClick, isActive }: NavLinkProps & { isActive?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-brand-400 ${
        isActive ? 'bg-white/10 text-white shadow-soft' : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}
