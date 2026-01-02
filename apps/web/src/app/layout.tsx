import './globals.css';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'Efizion Bath',
  description: 'SaaS multi-tenant para petshop, banho & tosa e clínica veterinária',
};

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <header role="banner" className="sr-only">
              Efizion Bath – Painel administrativo
            </header>
            <main id="main-content" role="main" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <footer role="contentinfo" className="sr-only">
              Efizion Bath
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
