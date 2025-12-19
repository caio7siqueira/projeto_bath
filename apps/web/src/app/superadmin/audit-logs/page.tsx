"use client";
import useSWR from 'swr/immutable';

export default function AuditLogsPage() {
  const { data, error } = useSWR('/v1/superadmin/audit-logs', (url: string) => fetch(url).then(r => r.json()));
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>
      {error && <div className="text-red-600">Erro ao carregar logs</div>}
      <table className="w-full border rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Ação</th>
            <th className="p-2">Tenant</th>
            <th className="p-2">Data</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((log: any) => (
            <tr key={log.id} className="border-t">
              <td className="p-2 font-semibold">{log.action}</td>
              <td className="p-2">{log.tenantId}</td>
              <td className="p-2">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}