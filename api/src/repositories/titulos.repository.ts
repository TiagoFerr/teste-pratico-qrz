import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../services/database.service';

export interface TituloRow {
  seqtitulo: string;
  especie: string;
  tipo: 'O' | 'D' | null;
  dtaemissao: string;
  dtavencimento: string;
  vlraberto: string;
  vencido: boolean;
  dias_para_vencer: number;
}

export interface TotaisRow {
  tipo: string;
  qtd: number;
  total: string;
  vencido: string;
  a_vencer: string;
}

@Injectable()
export class TitulosRepository {
  constructor(private readonly db: DatabaseService) {}

  async findDataReferencia(dataRef?: string): Promise<string> {
    const res = await this.db.query<{ referencia: string }>(
      `SELECT (COALESCE($1::date, (NOW() AT TIME ZONE 'America/Fortaleza')::date))::text AS referencia`,
      [dataRef || null],
    );
    return res.rows[0].referencia;
  }

  async findTitulosAbertos(
    seqpessoa: number,
    dataRef?: string,
  ): Promise<TituloRow[]> {
    const res = await this.db.query<TituloRow>(
      `SELECT
        t.seqtitulo::text,
        COALESCE(e.descricao, 'Espécie não cadastrada') AS especie,
        e.obrigdireito AS tipo,
        TO_CHAR(t.dtaemissao, 'YYYY-MM-DD') AS dtaemissao,
        TO_CHAR(t.dtavencimento, 'YYYY-MM-DD') AS dtavencimento,
        (t.vlrnominal - COALESCE(t.vlrpago, 0))::numeric(14,2)::text AS vlraberto,
        (t.dtavencimento < hoje.d) AS vencido,
        (t.dtavencimento - hoje.d)::int AS dias_para_vencer
      FROM titulos t
      LEFT JOIN especies e ON e.codespecie = t.codespecie
      CROSS JOIN (
        SELECT COALESCE($2::date, (NOW() AT TIME ZONE 'America/Fortaleza')::date) AS d
      ) hoje
      WHERE t.seqpessoa = $1
        AND (t.vlrnominal - COALESCE(t.vlrpago, 0)) > 0
      ORDER BY t.dtavencimento, t.seqtitulo`,
      [seqpessoa, dataRef || null],
    );
    return res.rows;
  }

  async findTotaisAbertos(
    seqpessoa: number,
    dataRef?: string,
  ): Promise<TotaisRow[]> {
    const res = await this.db.query<TotaisRow>(
      `SELECT
        COALESCE(e.obrigdireito, 'OUTROS') AS tipo,
        COUNT(*)::int AS qtd,
        COALESCE(SUM(t.vlrnominal - COALESCE(t.vlrpago, 0)), 0)::numeric(14,2)::text AS total,
        COALESCE(SUM(CASE WHEN t.dtavencimento < hoje.d THEN t.vlrnominal - COALESCE(t.vlrpago, 0) ELSE 0 END), 0)::numeric(14,2)::text AS vencido,
        COALESCE(SUM(CASE WHEN t.dtavencimento >= hoje.d THEN t.vlrnominal - COALESCE(t.vlrpago, 0) ELSE 0 END), 0)::numeric(14,2)::text AS a_vencer
      FROM titulos t
      LEFT JOIN especies e ON e.codespecie = t.codespecie
      CROSS JOIN (
        SELECT COALESCE($2::date, (NOW() AT TIME ZONE 'America/Fortaleza')::date) AS d
      ) hoje
      WHERE t.seqpessoa = $1
        AND (t.vlrnominal - COALESCE(t.vlrpago, 0)) > 0
      GROUP BY e.obrigdireito`,
      [seqpessoa, dataRef || null],
    );
    return res.rows;
  }
}
