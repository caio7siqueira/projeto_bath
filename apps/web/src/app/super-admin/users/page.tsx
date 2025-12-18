"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import Link from "next/link";

// Placeholder para integração real
const mockUsers = [
  { id: "1", name: "Admin Master", email: "admin@demo.com", role: "SUPER_ADMIN", tenant: "Global" },
  { id: "2", name: "Gestor Petshop", email: "gestor@pet.com", role: "ADMIN", tenant: "Petshop Fofuxo" },
];

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'ADMIN', tenant: '' });
  const [formError, setFormError] = useState<string | null>(null);

  // TODO: Integrar com API real e proteger por role SUPER_ADMIN

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários da Plataforma</h1>
          <p className="mt-2 text-gray-600">Gestão global de usuários e permissões.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Novo Usuário</Button>
      </div>
      {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-2 text-gray-700">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === "SUPER_ADMIN" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{user.tenant}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="secondary">Editar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Modal/Drawer de criação de usuário */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md animate-fade-in">
            <h2 className="text-xl font-bold mb-4">Novo Usuário</h2>
            <form className="space-y-4" onSubmit={e => {
              e.preventDefault();
              setFormError(null);
              // Validação
              if (!form.name.trim()) {
                setFormError('Nome é obrigatório.');
                return;
              }
              if (!form.email.trim()) {
                setFormError('Email é obrigatório.');
                return;
              }
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
                setFormError('Email inválido.');
                return;
              }
              // Simula criação
              setUsers(prev => [...prev, { id: Date.now().toString(), ...form }]);
              setShowCreate(false);
              setForm({ name: '', email: '', role: 'ADMIN', tenant: '' });
            }}>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Nome"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Tenant (opcional)"
                value={form.tenant}
                onChange={e => setForm(f => ({ ...f, tenant: e.target.value }))}
              />
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <div className="flex gap-2 pt-2">
                <Button type="submit">Criar</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setFormError(null); }}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
