'use client';

import { useEffect, useState } from 'react';
import { useLocations } from '@/lib/hooks';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';

export default function LocationsPage() {
  const { locations, isLoading, error, fetchLocations, createNewLocation } = useLocations();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await createNewLocation({ name: name.trim() });
      setName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Locais</h1>
        <p className="mt-2 text-gray-600">Cadastre e visualize os locais de atendimento.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}

      <Card>
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField
            label="Nome do local"
            id="name"
            placeholder="Unidade Centro"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" isLoading={isSaving} disabled={!name.trim()}>
            Adicionar local
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        {isLoading ? (
          <div className="text-gray-600">Carregando...</div>
        ) : locations.length === 0 ? (
          <Card>
            <CardHeader title="Nenhum local cadastrado" />
            <p className="text-gray-600">Adicione o primeiro local para começar.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {locations.map((location) => (
              <Card key={location.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-600">ID: {location.id}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Ativo
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
