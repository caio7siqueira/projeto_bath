import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'Efizion Bath',
  description: 'SaaS multi-tenant para petshop, banho & tosa e clínica veterinária',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
