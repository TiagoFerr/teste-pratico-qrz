import React from 'react';
import { AlertCircle, Clock, Calendar } from 'lucide-react';

interface StatusBadgeProps {
  vencido: boolean;
  dias: number;
}

export function StatusBadge({ vencido, dias }: StatusBadgeProps) {
  if (vencido) {
    const absDias = Math.abs(dias);
    const texto = absDias === 1 ? 'Vencido há 1 dia' : `Vencido há ${absDias} dias`;
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{texto}</span>
      </span>
    );
  }

  if (dias === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Vence hoje</span>
      </span>
    );
  }

  const texto = dias === 1 ? 'Vence em 1 dia' : `Vence em ${dias} dias`;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{texto}</span>
    </span>
  );
}
