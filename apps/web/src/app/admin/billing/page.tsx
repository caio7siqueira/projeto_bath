"use client";

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRole } from '@/lib/use-role';

export default function BillingAdminPage() {
  const { isAdmin } = useRole();

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Card>
          <p className="text-red-700">Apenas administradores podem acessar esta página.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Billing e Assinatura</h1>
        <p className="text-gray-600">
          Este módulo estará disponível em breve. Nenhuma cobrança é feita por aqui no momento.
        </p>
      </div>

      <Card>
        <p className="text-gray-700 mb-4">
          A integração de billing ainda não está exposta na API. Assim que estiver ativa, você poderá
          gerenciar plano, status de cobrança e histórico de pagamentos diretamente aqui.
        </p>
        <Button variant="secondary" disabled>
          Em desenvolvimento
        </Button>
      </Card>
    </div>
  );
}
