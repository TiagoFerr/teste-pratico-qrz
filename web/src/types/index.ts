export interface CurrentUser {
  seqpessoa: number;
  nomerazao: string;
}

export interface ResumoGrupo {
  qtd: number;
  total: string;
  vencido: string;
  aVencer: string;
}

export interface TituloItem {
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
  titulos: TituloItem[];
}
