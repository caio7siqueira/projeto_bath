'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  const { isAdmin } = useRole();

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-blue-600 p-2 text-white md:hidden"
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-gray-700 p-6">
            <h1 className="text-2xl font-bold">Bath</h1>
            <p className="mt-1 text-sm text-gray-400">Gerenciador</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <NavLink
              href="/admin/dashboard"
              label="Dashboard"
              onClick={() => setIsOpen(false)}
            />
            <NavLink
              href="/admin/customers"
              label="Clientes"
              onClick={() => setIsOpen(false)}
            />
            <NavLink
              href="/admin/pets"
              label="Pets"
              onClick={() => setIsOpen(false)}
            />
            <NavLink
              href="/admin/appointments"
              label="Agendamentos"
              onClick={() => setIsOpen(false)}
            />
            <NavLink
              href="/admin/locations"
              label="Locais"
              onClick={() => setIsOpen(false)}
            />
            {isAdmin && (
              <>
                {/* Operacional */}
                <div className="mb-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Operacional</div>
                <NavLink
                  href="/admin/appointments"
                  label="Agenda"
                  onClick={() => setIsOpen(false)}
                />
                <NavLink
                  href="/admin/customers"
                  label="Clientes"
                  onClick={() => setIsOpen(false)}
                />
                <NavLink
                  href="/admin/pets"
                  label="Pets"
                  onClick={() => setIsOpen(false)}
                />
                {/* Administrativo */}
                <div className="mb-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administrativo</div>
                <NavLink
                  href="/dashboard/reports"
                  label="Relatórios"
                  onClick={() => setIsOpen(false)}
                />
                <NavLink
                  href="/admin/notifications"
                  label="Notificações"
                  onClick={() => setIsOpen(false)}
                />
                <NavLink
                  href="/admin/billing"
                  label="Financeiro"
                  onClick={() => setIsOpen(false)}
                />
                {/* Configurações */}
                <div className="mb-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Configurações</div>
                <NavLink
                  href="/admin/settings"
                  label="Configurações"
                  onClick={() => setIsOpen(false)}
                />
              </>
            )}
          </nav>

          {/* Footer */}
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

function NavLink({ href, label, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-lg px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
    >
      {label}
    </Link>
  );
}
