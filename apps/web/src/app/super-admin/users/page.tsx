"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUPER_ADMIN";
  tenantId?: string;
}

export default function SuperAdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "SUPER_ADMIN") {
      router.replace("/");
      return;
    }
    setIsLoading(true);
    apiFetch("/admin/users")
      .then(setUsers)
      .catch(() => setError("Erro ao carregar usuários"))
      .finally(() => setIsLoading(false));
  }, [session, router]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Usuários da Plataforma</h1>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8">Carregando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">Nenhum usuário encontrado.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2">{u.tenantId || "Global"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Modal/Drawer para criação de usuário pode ser implementado aqui */}
    </div>
  );
}
