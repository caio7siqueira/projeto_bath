'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField, SelectField } from '@/components/FormField';

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'SUPER_ADMIN';
  tenant?: string;
};

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'STAFF', label: 'Equipe' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PlatformUser, 'id'>>({
    name: '',
    email: '',
    role: 'ADMIN',
    tenant: '',
  });

  useEffect(() => {
    // TODO: integrar com endpoint real de usuários da plataforma
    setTimeout(() => {
      setUsers([
        { id: '1', name: 'Admin Master', email: 'admin@demo.com', role: 'SUPER_ADMIN', tenant: 'Global' },
        { id: '2', name: 'Gestor Petshop', email: 'gestor@pet.com', role: 'ADMIN', tenant: 'Petshop Fofuxo' },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || !form.email.trim()) {
      setError('Preencha nome e email.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Informe um email válido.');
      return;
    }

    setSaving(true);
    // Simula criação otimista
    setTimeout(() => {
      setUsers((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...form,
        },
      ]);
      setForm({ name: '', email: '', role: 'ADMIN', tenant: '' });
      setSuccess('Usuário criado com sucesso.');
      setSaving(false);
    }, 250);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários da Plataforma</h1>
          <p className="mt-2 text-gray-600">
            Gestão global de acessos e permissões da plataforma para todos os tenants.
          </p>
        </div>
        <Link href="/admin/dashboard">
          <Button variant="secondary">Voltar para dashboard</Button>
        </Link>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-4 text-green-800">{success}</div>}

      <Card>
        <CardHeader title="Criar novo usuário" description="Convide um gestor, membro da equipe ou outro super admin." />
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            label="Nome"
            id="name"
            name="name"
            placeholder="Nome completo"
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
            required
          />
          <FormField
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="email@exemplo.com"
            value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
            required
          />
          <SelectField
            label="Role"
            id="role"
            name="role"
            value={form.role}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('role', e.target.value)}
            options={ROLE_OPTIONS}
          />
          <FormField
            label="Tenant (opcional)"
            id="tenant"
            name="tenant"
            placeholder="Tenant vinculado"
            value={form.tenant}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('tenant', e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={saving}>
              Criar Usuário
            </Button>
            <Button type="button" variant="secondary" onClick={() => setForm({ name: '', email: '', role: 'ADMIN', tenant: '' })}>
              Limpar
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Usuários cadastrados" description="Visão rápida dos usuários com acesso à plataforma." />
        {loading ? (
          <div className="text-gray-600">Carregando...</div>
        ) : users.length === 0 ? (
          <p className="text-gray-600">Nenhum usuário cadastrado ainda.</p>
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
                    <td className="px-4 py-3 text-sm text-gray-700">{user.tenant || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
