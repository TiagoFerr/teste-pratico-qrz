'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
  CalendarDays,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { CurrentUser, TitulosAbertosResponse, TituloItem } from '@/types';
import { Header } from '@/components/Header';
import { ResumoCards } from '@/components/ResumoCards';
import { TituloTabela } from '@/components/TituloTabela';
import { TituloCard } from '@/components/TituloCard';
import { formatDate } from '@/lib/format';

export default function DashboardPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<CurrentUser | null>(null);
  const [dados, setDados] = useState<TitulosAbertosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | 'vencidos' | 'avencer'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'O' | 'D'>('todos');
  const [busca, setBusca] = useState('');

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, titulosRes] = await Promise.all([
        apiFetch<CurrentUser>('/auth/me'),
        apiFetch<TitulosAbertosResponse>('/titulos/abertos'),
      ]);
      setUsuario(userRes);
      setDados(titulosRes);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar os dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignora erro no logout para forçar redirecionamento
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  // Filtragem dos títulos
  const titulosFiltrados = useMemo(() => {
    if (!dados?.titulos) return [];

    return dados.titulos.filter((t) => {
      // Filtro de situação
      if (filtroSituacao === 'vencidos' && !t.vencido) return false;
      if (filtroSituacao === 'avencer' && t.vencido) return false;

      // Filtro de tipo
      if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;

      // Busca textual por número ou espécie
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const numMatch = t.seqtitulo.toLowerCase().includes(termo);
        const espMatch = t.especie.toLowerCase().includes(termo);
        if (!numMatch && !espMatch) return false;
      }

      return true;
    });
  }, [dados?.titulos, filtroSituacao, filtroTipo, busca]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho */}
      <Header
        nomerazao={usuario?.nomerazao || 'Fornecedor'}
        seqpessoa={usuario?.seqpessoa || 0}
        onLogout={handleLogout}
        loadingLogout={logoutLoading}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Estado de Carregamento (Skeleton) */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-28 rounded-2xl bg-slate-200" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="h-44 rounded-2xl bg-slate-200" />
              <div className="h-44 rounded-2xl bg-slate-200" />
            </div>
            <div className="h-64 rounded-2xl bg-slate-200" />
          </div>
        )}

        {/* Estado de Erro */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Falha ao carregar pendências
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={carregarDados}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Estado com Dados */}
        {!loading && !error && dados && (
          <div className="space-y-8">
            {/* Informação da data de referência */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Posição de Pendências
                </h2>
                <p className="text-xs text-slate-500">
                  Visão consolidada de títulos em aberto e compensações
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                <span>Base de referência: {formatDate(dados.referencia)} (Fortaleza)</span>
              </div>
            </div>

            {/* Cards de Resumo e Saldo Líquido */}
            <ResumoCards
              receber={dados.resumo.receber}
              pagar={dados.resumo.pagar}
              saldo={dados.resumo.saldo}
            />

            {/* Seção da Lista de Títulos */}
            <section className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Detalhamento dos Títulos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mostrando {titulosFiltrados.length} de {dados.titulos.length} títulos
                  </p>
                </div>

                {/* Filtros e Busca */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Campo de Busca */}
                  <div className="relative min-w-[200px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nº ou espécie..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Filtro por Situação */}
                  <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-medium">
                    <button
                      onClick={() => setFiltroSituacao('todos')}
                      className={`rounded-lg px-2.5 py-1.5 transition ${
                        filtroSituacao === 'todos'
                          ? 'bg-white font-semibold text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFiltroSituacao('vencidos')}
                      className={`rounded-lg px-2.5 py-1.5 transition ${
                        filtroSituacao === 'vencidos'
                          ? 'bg-white font-semibold text-rose-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Vencidos
                    </button>
                    <button
                      onClick={() => setFiltroSituacao('avencer')}
                      className={`rounded-lg px-2.5 py-1.5 transition ${
                        filtroSituacao === 'avencer'
                          ? 'bg-white font-semibold text-emerald-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      A vencer
                    </button>
                  </div>

                  {/* Filtro por Tipo (O vs D) */}
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value as any)}
                    aria-label="Filtrar por tipo de obrigação ou direito"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="todos">Todos os tipos (O e D)</option>
                    <option value="O">Apenas a receber (O)</option>
                    <option value="D">Apenas a pagar (D)</option>
                  </select>
                </div>
              </div>

              {/* Lista Vazia */}
              {titulosFiltrados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <FileCheck2 className="mx-auto h-10 w-10 text-slate-400" />
                  <h4 className="mt-3 text-sm font-semibold text-slate-900">
                    Nenhum título encontrado
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Nenhum registro corresponde aos critérios e filtros selecionados.
                  </p>
                  {(filtroSituacao !== 'todos' || filtroTipo !== 'todos' || busca) && (
                    <button
                      onClick={() => {
                        setFiltroSituacao('todos');
                        setFiltroTipo('todos');
                        setBusca('');
                      }}
                      className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Tabela para Desktop */}
                  <div className="hidden md:block">
                    <TituloTabela titulos={titulosFiltrados} />
                  </div>

                  {/* Cards Empilhados para Mobile */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {titulosFiltrados.map((t) => (
                      <TituloCard key={t.seqtitulo} titulo={t} />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
