import { Injectable } from '@nestjs/common';
import { TitulosRepository } from './titulos.repository';

export interface ResumoGrupo {
  qtd: number;
  total: string;
  vencido: string;
  aVencer: string;
}

export interface TitulosAbertosResponse {
  referencia: string;
  resumo: {
    receber: ResumoGrupo;
    pagar: ResumoGrupo;
    saldo: string;
  };
  titulos: Array<{
    seqtitulo: string;
    especie: string;
    tipo: 'O' | 'D' | null;
    emissao: string;
    vencimento: string;
    valorAberto: string;
    vencido: boolean;
    dias: number;
  }>;
}

@Injectable()
export class TitulosService {
  constructor(private readonly titulosRepository: TitulosRepository) {}

  async getTitulosAbertos(
    seqpessoa: number,
    dataRef?: string,
  ): Promise<TitulosAbertosResponse> {
    const [referencia, rowsTitulos, rowsTotais] = await Promise.all([
      this.titulosRepository.findDataReferencia(dataRef),
      this.titulosRepository.findTitulosAbertos(seqpessoa, dataRef),
      this.titulosRepository.findTotaisAbertos(seqpessoa, dataRef),
    ]);

    const defaultGrupo = (): ResumoGrupo => ({
      qtd: 0,
      total: '0.00',
      vencido: '0.00',
      aVencer: '0.00',
    });

    const receber = defaultGrupo();
    const pagar = defaultGrupo();

    for (const row of rowsTotais) {
      if (row.tipo === 'O') {
        receber.qtd = row.qtd;
        receber.total = row.total;
        receber.vencido = row.vencido;
        receber.aVencer = row.a_vencer;
      } else if (row.tipo === 'D') {
        pagar.qtd = row.qtd;
        pagar.total = row.total;
        pagar.vencido = row.vencido;
        pagar.aVencer = row.a_vencer;
      }
    }

    const valorReceber = parseFloat(receber.total);
    const valorPagar = parseFloat(pagar.total);
    const saldoLiquido = (valorReceber - valorPagar).toFixed(2);

    const titulos = rowsTitulos.map((t) => ({
      seqtitulo: t.seqtitulo,
      especie: t.especie,
      tipo: t.tipo,
      emissao: t.dtaemissao,
      vencimento: t.dtavencimento,
      valorAberto: t.vlraberto,
      vencido: t.vencido,
      dias: t.dias_para_vencer,
    }));

    return {
      referencia,
      resumo: {
        receber,
        pagar,
        saldo: saldoLiquido,
      },
      titulos,
    };
  }
}
