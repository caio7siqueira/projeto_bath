import Link from 'next/link';

export default function SuperadminHome() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Painel SuperAdmin Efizion</h1>
      <ul className="space-y-4">
        <li><Link href="/superadmin/tenants" className="text-blue-600 hover:underline">Tenants</Link></li>
        <li><Link href="/superadmin/audit-logs" className="text-blue-600 hover:underline">Auditoria</Link></li>
      </ul>
    </div>
  );
}