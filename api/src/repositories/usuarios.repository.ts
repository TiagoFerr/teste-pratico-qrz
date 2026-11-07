import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../services/database.service';
import { UsuarioComFornecedor } from '../interfaces/usuario.interface';

export { UsuarioComFornecedor };

@Injectable()
export class UsuariosRepository {
  constructor(private readonly db: DatabaseService) {}

  async findBySeqpessoa(
    seqpessoa: number,
  ): Promise<UsuarioComFornecedor | null> {
    const res = await this.db.query(
      `SELECT u.seqpessoa, f.nomerazao, u.senha_hash
       FROM usuarios u
       INNER JOIN fornecedores f ON f.seqpessoa = u.seqpessoa
       WHERE u.seqpessoa = $1`,
      [seqpessoa],
    );

    if (!res.rows[0]) {
      return null;
    }

    return {
      seqpessoa: Number(res.rows[0].seqpessoa),
      nomerazao: res.rows[0].nomerazao,
      senha_hash: res.rows[0].senha_hash,
    };
  }
}
