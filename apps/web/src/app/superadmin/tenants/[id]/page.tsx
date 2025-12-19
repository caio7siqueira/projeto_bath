"use client";
import useSWR from 'swr';
import { useRouter, useParams } from 'next/navigation';

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data, error, mutate } = useSWR(`/v1/superadmin/tenants/${id}`, url => fetch(url).then(r => r.json()));

  const handleAction = async (action: 'suspend' | 'activate') => {
    if (!id) return;
    if (!window.confirm(`Tem certeza que deseja ${action === 'suspend' ? 'suspender' : 'reativar'} este tenant?`)) return;
    await fetch(`/v1/superadmin/tenants/${id}/${action}`, { method: 'POST' });
    mutate();
  };

  if (error) return <div className="text-red-600">Erro ao carregar tenant</div>;
  if (!data) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Tenant: {data.name}</h2>
      <div className="mb-4">
        <span className={`px-2 py-1 rounded text-xs font-bold ${data.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{data.isActive ? 'Ativo' : 'Suspenso'}</span>
        <span className="ml-4 text-gray-500">Criado em {new Date(data.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="mb-4 space-y-1">
        <div>Número de clientes: <span className="font-semibold">{data.numCustomers}</span></div>
        <div>Número de pets: <span className="font-semibold">{data.numPets}</span></div>
        <div>Número de agendamentos: <span className="font-semibold">{data.numAppointments}</span></div>
      </div>
      <div className="flex gap-4 mt-6">
        {data.isActive ? (
          <button className="px-4 py-2 rounded bg-yellow-600 text-white" onClick={() => handleAction('suspend')}>Suspender</button>
        ) : (
          <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={() => handleAction('activate')}>Reativar</button>
        )}
      </div>
    </div>
  );
}