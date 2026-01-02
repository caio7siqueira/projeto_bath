'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { ErrorBanner } from '@/components/feedback/VisualStates';
import { createFieldErrorMap, normalizeApiError } from '@/lib/api/errors';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bannerError, setBannerError] = useState<{ title?: string; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setBannerError(null);
    setFieldErrors({});

    try {
      await login({ email, password });
    } catch (err) {
      const parsed = normalizeApiError(err, 'Não foi possível fazer login.');
      setBannerError({ title: parsed.title, message: parsed.message });
      setFieldErrors(createFieldErrorMap(parsed.details));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Efizion Bath</h1>
          <p className="mt-2 text-gray-600">Entre com suas credenciais</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {bannerError && (
              <ErrorBanner
                title={bannerError.title}
                message={bannerError.message}
                scenario="login-invalid-credentials"
              />
            )}

            <FormField
              label="Email"
              id="email"
              type="email"
              placeholder="admin@demo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
            />

            <FormField
              label="Senha"
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
            />

            <Button type="submit" isLoading={isLoading} className="w-full">
              Entrar
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Demo: admin@demo.com / Admin123!</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
