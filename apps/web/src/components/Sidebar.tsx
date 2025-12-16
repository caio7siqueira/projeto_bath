'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-blue-600 p-2 text-white md:hidden"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white transition-transform md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold">Bath</h1>
            <p className="text-sm text-gray-400">Gerenciador</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
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
              href="/dashboard/reports"
              label="Relatórios"
              onClick={() => setIsOpen(false)}
            />
          </nav>

          <div className="border-t border-gray-700 p-4">
            <p className="text-xs text-gray-400">Demo • admin@demo.com</p>
          </div>
        </div>
      </aside>

      {/* Close sidebar on mobile when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}
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
      className="block rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mb-2"
    >
      {label}
    </Link>
  );
}
