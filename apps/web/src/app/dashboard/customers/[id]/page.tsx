'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchCustomer, fetchCustomerContacts, fetchCustomerPets, Customer, CustomerContact, Pet } from '@/lib/api/customers';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);

  useEffect(() => {
    if (!accessToken) {
      setError('Token não configurado.');
      setLoading(false);
      return;
    }

    if (!customerId) {
      setError('ID do cliente não fornecido.');
      setLoading(false);
      return;
    }

    Promise.all([
      fetchCustomer(accessToken, customerId),
      fetchCustomerContacts(accessToken, customerId),
      fetchCustomerPets(accessToken, customerId),
    ])
      .then(([customerData, contactsData, petsData]) => {
        setCustomer(customerData);
        setContacts(contactsData);
        setPets(petsData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar cliente');
        setLoading(false);
      });
  }, [customerId, accessToken]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Cliente</p>
        <p className="text-slate-300">Carregando...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Cliente</p>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
          <p className="font-semibold">Erro ao carregar cliente</p>
          <p className="text-sm text-rose-200">{error || 'Cliente não encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Cliente</p>
        <h2 className="text-2xl font-semibold text-white">{customer.name}</h2>
        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          <span>📞 {customer.phone}</span>
          {customer.email && <span>📧 {customer.email}</span>}
          {customer.cpf && <span>🆔 {customer.cpf}</span>}
        </div>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md shadow-black/30">
        <h3 className="mb-4 text-lg font-semibold text-white">Pets</h3>
        {pets.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum pet cadastrado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <div key={pet.id} className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{pet.name}</p>
                    <p className="text-xs text-slate-400">{pet.species === 'DOG' ? '🐕 Cachorro' : '🐈 Gato'}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      pet.lifeStatus === 'ALIVE'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {pet.lifeStatus === 'ALIVE' ? 'Vivo' : 'Falecido'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                  <span className={pet.allowNotifications ? 'text-sky-300' : 'text-slate-500'}>
                    {pet.allowNotifications ? '🔔 Notificações ON' : '🔕 Notificações OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md shadow-black/30">
        <h3 className="mb-4 text-lg font-semibold text-white">Contatos Relacionados</h3>
        {contacts.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum contato cadastrado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
                <p className="font-semibold text-white">{contact.name}</p>
                {contact.phone && <p className="text-sm text-slate-300">📞 {contact.phone}</p>}
                {contact.email && <p className="text-sm text-slate-300">📧 {contact.email}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
