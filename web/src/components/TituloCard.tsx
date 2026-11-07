import React from 'react';
import { TituloItem } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface TituloCardProps {
  titulo: TituloItem;
}

export function TituloCard({ titulo }: TituloCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-sm font-bold text-slate-900">
            #{titulo.seqtitulo}
          </span>
          <p className="mt-0.5 text-xs text-slate-500">{titulo.especie}</p>
        </div>
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            titulo.tipo === 'O'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-700'
          }`}
          title={
            titulo.tipo === 'O'
              ? 'Obrigação (Queiroz deve ao fornecedor)'
              : 'Direito (Fornecedor deve ao Queiroz)'
          }
        >
          {titulo.tipo || '?'}
        </span>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-3">
        <div>
          <span className="block text-[11px] text-slate-400">Emissão</span>
          <span className="text-xs text-slate-600">{formatDate(titulo.emissao)}</span>
        </div>
        <div>
          <span className="block text-[11px] text-slate-400">Vencimento</span>
          <span className="text-xs font-medium text-slate-800">
            {formatDate(titulo.vencimento)}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[11px] text-slate-400">Valor em aberto</span>
          <span className="text-sm font-bold text-slate-900">
            {formatCurrency(titulo.valorAberto)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <StatusBadge vencido={titulo.vencido} dias={titulo.dias} />
      </div>
    </div>
  );
}
