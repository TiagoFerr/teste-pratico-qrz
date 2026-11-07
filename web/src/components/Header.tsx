'use client';

import React from 'react';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  nomerazao: string;
  seqpessoa: number;
  onLogout: () => void;
  loadingLogout?: boolean;
}

export function Header({
  nomerazao,
  seqpessoa,
  onLogout,
  loadingLogout = false,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-sm">
            GQ
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Grupo Queiroz
            </span>
            <h1 className="text-base font-bold text-slate-900 sm:text-lg">
              Portal do Fornecedor
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-slate-800">{nomerazao}</div>
            <div className="text-xs text-slate-500">Cód. {seqpessoa}</div>
          </div>

          <button
            onClick={onLogout}
            disabled={loadingLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">
              {loadingLogout ? 'Saindo...' : 'Sair'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
