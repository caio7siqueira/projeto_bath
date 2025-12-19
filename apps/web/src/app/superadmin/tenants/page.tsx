"use client";
import useSWR from 'swr/immutable';
import Link from 'next/link';

export default function TenantsListPage() {
  const { data, error } = useSWR('/v1/superadmin/tenants', (url: string) => fetch(url).then(r => r.json()));
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Tenants</h2>
      {error && <div className="text-red-600">Erro ao carregar tenants</div>}
      <table className="w-full border rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Nome</th>
            <th className="p-2">Slug</th>
            <th className="p-2">Status</th>
            <th className="p-2">Criado em</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((t: any) => (
            <tr key={t.id} className="border-t">
              <td className="p-2 font-semibold">{t.name}</td>
              <td className="p-2">{t.slug}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.isActive ? 'Ativo' : 'Suspenso'}</span>
              </td>
              <td className="p-2">{new Date(t.createdAt).toLocaleDateString()}</td>
              <td className="p-2">
                <Link href={`/superadmin/tenants/${t.id}`} className="text-blue-600 hover:underline">Visualizar</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}