import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal do Fornecedor | Grupo Queiroz',
  description: 'Consulta de títulos em aberto e pendências financeiras',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
