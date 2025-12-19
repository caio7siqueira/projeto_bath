"use client";
import React, { useState } from 'react';
import useSWR from 'swr';
import { SuspendButton, ReactivateButton } from './actions';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SuperadminBillingPage() {
  const [status, setStatus] = useState('');
  const { data: subscriptions } = useSWR('/v1/superadmin/billing/subscriptions', fetcher);

  const filtered = status ? subscriptions?.filter((s: any) => s.status === status) : subscriptions;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Assinaturas (SuperAdmin)</h1>
      <div className="mb-4">
        <label>Status: </label>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="TRIAL">TRIAL</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PAST_DUE">PAST_DUE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="CANCELED">CANCELED</option>
        </select>
      </div>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered?.map((sub: any) => (
            <tr key={sub.id}>
              <td>{sub.tenant?.name}</td>
              <td>{sub.plan?.name}</td>
              <td>{sub.status}</td>
              <td>
                {sub.status !== 'SUSPENDED' ? (
                  <SuspendButton id={sub.id} />
                ) : (
                  <ReactivateButton id={sub.id} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
