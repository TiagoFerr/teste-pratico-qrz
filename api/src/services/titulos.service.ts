import { Injectable } from '@nestjs/common';
import { TitulosRepository } from '../repositories/titulos.repository';
import { ResumoGrupo, TitulosAbertosResponse } from '../interfaces/titulos.interface';

export { ResumoGrupo, TitulosAbertosResponse };

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
