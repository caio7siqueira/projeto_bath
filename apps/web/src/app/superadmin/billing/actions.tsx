import React from 'react';

export function SuspendButton({ id }: { id: string }) {
  const handleSuspend = async () => {
    await fetch(`/v1/superadmin/billing/subscriptions/${id}/suspend`, { method: 'POST' });
    alert('Assinatura suspensa!');
  };
  return <button className="btn btn-warning" onClick={handleSuspend}>Suspender</button>;
}

export function ReactivateButton({ id }: { id: string }) {
  const handleReactivate = async () => {
    await fetch(`/v1/superadmin/billing/subscriptions/${id}/reactivate`, { method: 'POST' });
    alert('Assinatura reativada!');
  };
  return <button className="btn btn-success" onClick={handleReactivate}>Reativar</button>;
}
