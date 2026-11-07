const bcrypt = require('bcryptjs');

/**
 * Migration 005: Fornecedor de Homologação e Testes Manuais de Isolamento Multi-fornecedor.
 *
 * Cria um segundo fornecedor com títulos próprios para permitir que avaliadores e auditores
 * comprovem o isolamento de dados diretamente pelo navegador (alternando o login entre
 * 4827 e 9001).
 *
 * Credenciais:
 * - Código: 9001
 * - Razão Social: FORNECEDOR HOMOLOGACAO LTDA
 * - Senha: queiroz@2026
 *
 * Títulos cadastrados:
 * 1. Seq 900101: R$ 5.000,00 (Espécie DPFORN - DUPLICATA FORNECEDOR - 201, Tipo O, a vencer)
 * 2. Seq 900102: R$ 1.200,00 (Espécie DVFORN - DEVOLUCAO A RECEBER FORNEC - 211, Tipo D, vencido)
 *
 * Posição esperada em 07/11/2026:
 * - A receber (O): R$ 5.000,00 (1 título a vencer)
 * - A pagar (D): R$ 1.200,00 (1 título vencido)
 * - Saldo líquido: R$ 3.800,00
 */
exports.up = async (pgm) => {
  const SEQ_FORNECEDOR = 9001;
  const NOME_RAZAO = 'FORNECEDOR HOMOLOGACAO LTDA';
  const SENHA_PADRAO = 'queiroz@2026';
  const SENHA_HASH = bcrypt.hashSync(SENHA_PADRAO, 10);

  // 1. Cadastra fornecedor de homologação
  await pgm.db.query(
    `INSERT INTO fornecedores (seqpessoa, nomerazao)
     VALUES ($1, $2)
     ON CONFLICT (seqpessoa) DO UPDATE
     SET nomerazao = EXCLUDED.nomerazao`,
    [SEQ_FORNECEDOR, NOME_RAZAO],
  );

  // 2. Cadastra usuário de acesso
  await pgm.db.query(
    `INSERT INTO usuarios (seqpessoa, senha_hash)
     VALUES ($1, $2)
     ON CONFLICT (seqpessoa) DO UPDATE
     SET senha_hash = EXCLUDED.senha_hash`,
    [SEQ_FORNECEDOR, SENHA_HASH],
  );

  // 3. Cadastra 2 títulos próprios para o fornecedor 9001
  // Título 1: Obrigação (O) - Duplicata a receber (a vencer em 20/11/2026)
  await pgm.db.query(
    `INSERT INTO titulos (seqpessoa, seqtitulo, codespecie, dtaemissao, dtavencimento, vlrnominal, vlrpago)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (seqpessoa, seqtitulo) DO NOTHING`,
    [SEQ_FORNECEDOR, 900101, 'DPFORN', '2026-10-15', '2026-11-20', 5000.00, 0.00],
  );

  // Título 2: Direito (D) - Devolução a pagar (vencido em 01/11/2026)
  await pgm.db.query(
    `INSERT INTO titulos (seqpessoa, seqtitulo, codespecie, dtaemissao, dtavencimento, vlrnominal, vlrpago)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (seqpessoa, seqtitulo) DO NOTHING`,
    [SEQ_FORNECEDOR, 900102, 'DVFORN', '2026-10-10', '2026-11-01', 1200.00, 0.00],
  );
};

exports.down = async (pgm) => {
  await pgm.db.query(`DELETE FROM titulos WHERE seqpessoa = 9001`);
  await pgm.db.query(`DELETE FROM usuarios WHERE seqpessoa = 9001`);
  await pgm.db.query(`DELETE FROM fornecedores WHERE seqpessoa = 9001`);
};
