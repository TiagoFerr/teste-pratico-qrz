export interface ResumoGrupo {
  qtd: number;
  total: string;
  vencido: string;
  aVencer: string;
}

export interface TituloItemResponse {
  seqtitulo: string;
  especie: string;
  tipo: 'O' | 'D' | null;
  emissao: string;
  vencimento: string;
  valorAberto: string;
  vencido: boolean;
  dias: number;
}

export interface TitulosAbertosResponse {
  referencia: string;
  resumo: {
    receber: ResumoGrupo;
    pagar: ResumoGrupo;
    saldo: string;
  };
  titulos: TituloItemResponse[];
}

export interface TituloAbertoRow {
  seqtitulo: string;
  codespecie: string | null;
  descricao_especie: string | null;
  obrigdireito: 'O' | 'D' | null;
  dtaemissao: string;
  dtavencimento: string;
  valor_aberto: string;
  vencido: boolean;
  dias: number;
}

export interface TotalAbertoRow {
  tipo: 'O' | 'D' | null;
  qtd: number;
  total: string;
  vencido: string;
  a_vencer: string;
}
