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

  const onSubmit = async (data: CustomerFormData) => {
    setIsSaving(true);
    setError(null);
    try {
      const submitData: any = {
        name: data.name,
        phone: data.phone,
      };
      if (data.email) submitData.email = data.email;
      if (data.cpf) submitData.cpf = data.cpf;
      if (data.optInGlobal !== undefined) submitData.optInGlobal = data.optInGlobal;
      await createNewCustomer(submitData);
      router.push("/admin/customers");
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
