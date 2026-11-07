import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { ResumoGrupo } from '../types';
import { formatCurrency } from '../lib/format';

interface ResumoCardsProps {
  receber: ResumoGrupo;
  pagar: ResumoGrupo;
  saldo: string;
}

export function ResumoCards({ receber, pagar, saldo }: ResumoCardsProps) {
  const saldoNum = parseFloat(saldo);
  const saldoPositivo = saldoNum >= 0;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Scale className="h-4 w-4 text-emerald-600" />
              <span>Saldo líquido em aberto com o Grupo Queiroz</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Calculado como total a receber (O) subtraído dos débitos e devoluções (D)
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div
              className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${
                saldoPositivo ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(saldo)}
            </div>
            <span className="text-xs font-medium text-slate-500">
              {saldoPositivo ? 'Valor a favor do fornecedor' : 'Valor a favor do Queiroz'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                  O
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    A receber do Queiroz
                  </h3>
                  <p className="text-xs text-slate-500">
                    Duplicatas e adiantamentos de fornecimento
                  </p>
                </div>
              </div>
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="mt-6">
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(receber.total)}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {receber.qtd} {receber.qtd === 1 ? 'título em aberto' : 'títulos em aberto'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="block text-xs font-medium text-slate-500">A vencer</span>
              <span className="mt-1 block text-sm font-semibold text-slate-800">
                {formatCurrency(receber.aVencer)}
              </span>
            </div>
            <div className="rounded-xl bg-rose-50/60 p-3">
              <span className="block text-xs font-medium text-rose-600">Vencidos</span>
              <span className="mt-1 block text-sm font-semibold text-rose-700">
                {formatCurrency(receber.vencido)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                  D
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Você deve ao Queiroz
                  </h3>
                  <p className="text-xs text-slate-500">
                    Devoluções, verbas comerciais e descontos
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-600" />
            </div>

            <div className="mt-6">
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(pagar.total)}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {pagar.qtd} {pagar.qtd === 1 ? 'título em aberto' : 'títulos em aberto'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="block text-xs font-medium text-slate-500">A vencer</span>
              <span className="mt-1 block text-sm font-semibold text-slate-800">
                {formatCurrency(pagar.aVencer)}
              </span>
            </div>
            <div className="rounded-xl bg-rose-50/60 p-3">
              <span className="block text-xs font-medium text-rose-600">Vencidos</span>
              <span className="mt-1 block text-sm font-semibold text-rose-700">
                {formatCurrency(pagar.vencido)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
