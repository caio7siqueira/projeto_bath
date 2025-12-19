import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TenantLimits() {
  const { data: limits } = useSWR('/v1/tenant/limits', fetcher);
  const { data: usage } = useSWR('/v1/tenant/usage', fetcher);

  if (!limits || !usage) return (
    <div className="flex items-center gap-2 text-gray-500 animate-pulse">
      <span className="loading loading-spinner loading-sm" /> Carregando limites do plano...
    </div>
  );

  const overLimitKeys = Object.keys(limits).filter(key => usage[key] > limits[key]);
  const overLimit = overLimitKeys.length > 0;

  return (
    <div className="bg-white rounded shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-2 text-secondary">Limites do Plano</h2>
      <table className="table-auto w-full mb-4">
        <thead>
          <tr>
            <th>Recurso</th>
            <th>Usado</th>
            <th>Limite</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(limits).map(key => (
            <tr key={key} className={usage[key] > limits[key] ? 'bg-red-50' : ''}>
              <td className="font-semibold">{key}</td>
              <td>{usage[key]}</td>
              <td>{limits[key]}</td>
              <td>
                {usage[key] > limits[key] ? (
                  <span className="text-red-600 font-bold">Excedido</span>
                ) : (
                  <span className="text-green-600">OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {overLimit && (
        <div className="text-red-600 font-semibold mb-2 flex items-center gap-2">
          <span className="icon-warning" />
          Limite excedido em: {overLimitKeys.join(', ')}. Algumas funcionalidades podem ser restritas.
          <button className="btn btn-primary ml-2">Upgrade de plano</button>
        </div>
      )}
      {!overLimit && (
        <div className="text-green-600 font-semibold flex items-center gap-2">
          <span className="icon-check" /> Tudo dentro dos limites do plano.
        </div>
      )}
      <div className="mt-4 text-xs text-gray-400">Limites são aplicados de forma progressiva e transparente. Para mais recursos, faça upgrade de plano.</div>
    </div>
  );
}
