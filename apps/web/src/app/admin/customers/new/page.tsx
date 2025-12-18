"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCustomers } from "@/lib/hooks";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { customerSchema, type CustomerFormData } from "@/lib/schemas";
import { useState } from "react";

export default function NewCustomerPage() {
  const router = useRouter();
  const { createNewCustomer } = useCustomers();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitted },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      cpf: "",
      optInGlobal: false,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

          {/* UX degradável para pets */}
          {petsError ? (
            <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-yellow-800">
              Não foi possível carregar pets. Você pode cadastrar depois.
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-800 flex items-center justify-between">
              Nenhum pet cadastrado ainda.
              <span className="ml-2 text-xs">Você pode cadastrar depois.</span>
            </div>
          ) : (
            <FormField
              label="Pet"
              id="petId"
              error={errors.petId?.message}
              touched={touchedFields.petId || isSubmitted}
              {...register("petId")}
              options={filteredPets.map((p) => ({ value: p.id, label: p.name }))}
            />
          )}
        phone: data.phone,
      };
      if (data.email) submitData.email = data.email;
      if (data.cpf) submitData.cpf = data.cpf;
      if (data.optInGlobal !== undefined) submitData.optInGlobal = data.optInGlobal;
      await createNewCustomer(submitData);
      setSuccess('Cliente criado com sucesso!');
      setTimeout(() => router.push("/admin/customers"), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Novo Cliente</h1>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800 animate-fade-in">{success}</div>
      )}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Nome"
            id="name"
            placeholder="João Silva"
            required
            error={errors.name?.message}
            touched={touchedFields.name || isSubmitted}
            {...register("name")}
          />
          <FormField
            label="Telefone"
            id="phone"
            placeholder="(11) 98765-4321"
            required
            error={errors.phone?.message}
            touched={touchedFields.phone || isSubmitted}
            {...register("phone")}
          />
          <FormField
            label="Email"
            id="email"
            type="email"
            placeholder="joao@example.com"
            error={errors.email?.message}
            touched={touchedFields.email || isSubmitted}
            {...register("email")}
          />
          <FormField
            label="CPF"
            id="cpf"
            placeholder="123.456.789-00"
            error={errors.cpf?.message}
            touched={touchedFields.cpf || isSubmitted}
            {...register("cpf")}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={isSaving}>
              Criar Cliente
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/customers")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
