import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface UsuarioComFornecedor {
  seqpessoa: number;
  nomerazao: string;
  senha_hash: string;
}

@Injectable()
export class UsuariosRepository {
  constructor(private readonly db: DatabaseService) {}

  async findBySeqpessoa(seqpessoa: number): Promise<UsuarioComFornecedor | null> {
    const res = await this.db.query<UsuarioComFornecedor>(
      `SELECT u.seqpessoa, f.nomerazao, u.senha_hash
       FROM usuarios u
       INNER JOIN fornecedores f ON f.seqpessoa = u.seqpessoa
       WHERE u.seqpessoa = $1`,
      [seqpessoa],
    );
    return res.rows[0] || null;
  }
}
