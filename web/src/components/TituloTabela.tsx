import React from 'react';
import { TituloItem } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface TituloTabelaProps {
  titulos: TituloItem[];
}

export function TituloTabela({ titulos }: TituloTabelaProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3.5 sm:px-6">Nº Título</th>
            <th scope="col" className="px-4 py-3.5 sm:px-6">Espécie</th>
            <th scope="col" className="px-4 py-3.5 text-center sm:px-6">Tipo</th>
            <th scope="col" className="px-4 py-3.5 sm:px-6">Emissão</th>
            <th scope="col" className="px-4 py-3.5 sm:px-6">Vencimento</th>
            <th scope="col" className="px-4 py-3.5 text-right sm:px-6">Valor em aberto</th>
            <th scope="col" className="px-4 py-3.5 text-center sm:px-6">Situação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {titulos.map((t) => (
            <tr key={t.seqtitulo} className="transition hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-4 py-4 font-mono font-medium text-slate-900 sm:px-6">
                {t.seqtitulo}
              </td>
              <td className="px-4 py-4 text-slate-600 sm:px-6">
                {t.especie}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-center sm:px-6">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    t.tipo === 'O'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                  title={
                    t.tipo === 'O'
                      ? 'Obrigação (Queiroz deve ao fornecedor)'
                      : 'Direito (Fornecedor deve ao Queiroz)'
                  }
                >
                  {t.tipo || '?'}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600 sm:px-6">
                {formatDate(t.emissao)}
              </td>
              <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-800 sm:px-6">
                {formatDate(t.vencimento)}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-slate-900 sm:px-6">
                {formatCurrency(t.valorAberto)}
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-center sm:px-6">
                <StatusBadge vencido={t.vencido} dias={t.dias} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
