"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField, SelectField } from "@/components/FormField";

// TODO: importar hooks e API reais de users, tenants, etc.

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export default function SuperadminUsersPage() {
  // Mock de dados e estados
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", name: "", role: "ADMIN", tenant: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // TODO: fetch real users
    setTimeout(() => {
      setUsers([
        { id: 1, email: "admin@demo.com", name: "Admin Demo", role: "SUPER_ADMIN", tenant: "global" },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: chamada real de criação
    setTimeout(() => {
      setUsers((prev) => [...prev, { ...form, id: Date.now() }]);
      setForm({ email: "", name: "", role: "ADMIN", tenant: "" });
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usuários da Plataforma</h1>
        <p className="mt-2 text-gray-600">Gerencie usuários, permissões e tenants.</p>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Nome"
            id="name"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
          />
          <FormField
            label="Email"
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
          />
          <SelectField
            label="Role"
            id="role"
            name="role"
            required
            value={form.role}
            onChange={handleChange}
            options={ROLES}
          />
          <FormField
            label="Tenant"
            id="tenant"
            name="tenant"
            placeholder="ID do tenant (opcional)"
            value={form.tenant}
            onChange={handleChange}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={isSaving}>
              Criar Usuário
            </Button>
          </div>
        </form>
      </Card>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Usuários Existentes</h2>
        {isLoading ? (
          <div className="text-gray-600">Carregando...</div>
        ) : users.length === 0 ? (
          <Card>
            <CardHeader title="Nenhum usuário encontrado" />
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tenant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.tenant || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
