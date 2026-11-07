import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  itensPorPagina: number;
  totalItens: number;
  onPageChange: (pagina: number) => void;
  onItensPorPaginaChange: (itens: number) => void;
}

export function Pagination({
  paginaAtual,
  totalPaginas,
  itensPorPagina,
  totalItens,
  onPageChange,
  onItensPorPaginaChange,
}: PaginationProps) {
  if (totalItens === 0) return null;

  const inicio = (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaAtual * itensPorPagina, totalItens);

  const getPaginas = () => {
    const paginas: (number | string)[] = [];
    const maxBotoes = 5;

    if (totalPaginas <= maxBotoes) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      if (paginaAtual <= 3) {
        paginas.push(1, 2, 3, 4, '...', totalPaginas);
      } else if (paginaAtual >= totalPaginas - 2) {
        paginas.push(
          1,
          '...',
          totalPaginas - 3,
          totalPaginas - 2,
          totalPaginas - 1,
          totalPaginas,
        );
      } else {
        paginas.push(
          1,
          '...',
          paginaAtual - 1,
          paginaAtual,
          paginaAtual + 1,
          '...',
          totalPaginas,
        );
      }
    }
    return paginas;
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:px-6">
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <span>
          Exibindo <span className="font-semibold text-slate-900">{inicio}</span> a{' '}
          <span className="font-semibold text-slate-900">{fim}</span> de{' '}
          <span className="font-semibold text-slate-900">{totalItens}</span> títulos
        </span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="itensPorPagina" className="hidden sm:inline">
            Por página:
          </label>
          <select
            id="itensPorPagina"
            value={itensPorPagina}
            onChange={(e) => onItensPorPaginaChange(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={paginaAtual === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Primeira página"
          aria-label="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => onPageChange(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Página anterior"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPaginas().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                  p === paginaAtual
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-xs text-slate-400">
                ...
              </span>
            ),
          )}
        </div>

        <button
          onClick={() => onPageChange(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Próxima página"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPaginas)}
          disabled={paginaAtual === totalPaginas}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Última página"
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
