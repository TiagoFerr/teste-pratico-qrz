const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function readCsvLines(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const clean = raw.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(';');
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(';');
    const obj = {};
    header.forEach((h, i) => {
      obj[h.trim()] = cols[i] !== undefined ? cols[i].trim() : '';
    });
    return obj;
  });
  return rows;
}

function parseDecimal(val) {
  if (!val || typeof val !== 'string' || val.trim() === '') return '0.00';
  return val.replace(/\./g, '').replace(',', '.').trim();
}

function parseDate(val) {
  // DD/MM/YYYY -> YYYY-MM-DD
  const parts = val.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return val;
}

exports.up = async (pgm) => {
  const especiesPath = fs.existsSync(path.join(__dirname, '../db/data/consulta2_especies.csv'))
    ? path.join(__dirname, '../db/data/consulta2_especies.csv')
    : path.join(__dirname, '../../consulta2_especies.csv');

  const titulosPath = fs.existsSync(path.join(__dirname, '../db/data/consulta1_titulos.csv'))
    ? path.join(__dirname, '../db/data/consulta1_titulos.csv')
    : path.join(__dirname, '../../consulta1_titulos.csv');

  const especies = readCsvLines(especiesPath);
  const titulos = readCsvLines(titulosPath);

  // 1. Carga de espécies
  for (const esp of especies) {
    await pgm.db.query(
      `INSERT INTO especies (codespecie, descricao, obrigdireito)
       VALUES ($1, $2, $3)
       ON CONFLICT (codespecie) DO UPDATE
       SET descricao = EXCLUDED.descricao, obrigdireito = EXCLUDED.obrigdireito`,
      [esp.codespecie, esp.descricao, esp.obrigdireito],
    );
  }

  // 2. Extrair fornecedores únicos
  const fornecedoresMap = new Map();
  for (const tit of titulos) {
    const seq = parseInt(tit.seqpessoa, 10);
    if (!fornecedoresMap.has(seq)) {
      fornecedoresMap.set(seq, tit.nomerazao);
    }
  }

  // 3. Inserir fornecedores e usuários iniciais
  const defaultHash = bcrypt.hashSync('queiroz@2026', 10);
  for (const [seqpessoa, nomerazao] of fornecedoresMap.entries()) {
    await pgm.db.query(
      `INSERT INTO fornecedores (seqpessoa, nomerazao)
       VALUES ($1, $2)
       ON CONFLICT (seqpessoa) DO UPDATE
       SET nomerazao = EXCLUDED.nomerazao`,
      [seqpessoa, nomerazao],
    );

    await pgm.db.query(
      `INSERT INTO usuarios (seqpessoa, senha_hash)
       VALUES ($1, $2)
       ON CONFLICT (seqpessoa) DO NOTHING`,
      [seqpessoa, defaultHash],
    );
  }

  // 4. Inserir títulos
  for (const tit of titulos) {
    await pgm.db.query(
      `INSERT INTO titulos (seqpessoa, seqtitulo, codespecie, dtaemissao, dtavencimento, vlrnominal, vlrpago)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (seqpessoa, seqtitulo) DO UPDATE
       SET codespecie = EXCLUDED.codespecie,
           dtaemissao = EXCLUDED.dtaemissao,
           dtavencimento = EXCLUDED.dtavencimento,
           vlrnominal = EXCLUDED.vlrnominal,
           vlrpago = EXCLUDED.vlrpago`,
      [
        parseInt(tit.seqpessoa, 10),
        parseInt(tit.seqtitulo, 10),
        tit.codespecie,
        parseDate(tit.dtaemissao),
        parseDate(tit.dtavencimento),
        parseDecimal(tit.vlrnominal),
        parseDecimal(tit.vlrpago),
      ],
    );
  }

  // 5. Validação rigorosa de integridade e contagem (PLANO.md seção 5.2)
  const countEsp = await pgm.db.query(`SELECT COUNT(*)::int AS total FROM especies`);
  const countForn = await pgm.db.query(`SELECT COUNT(*)::int AS total FROM fornecedores`);
  const countTit = await pgm.db.query(`SELECT COUNT(*)::int AS total FROM titulos`);

  if (countEsp.rows[0].total !== 30) {
    throw new Error(`Validação falhou: esperado 30 espécies, encontrado ${countEsp.rows[0].total}`);
  }
  if (countForn.rows[0].total !== 1) {
    throw new Error(`Validação falhou: esperado 1 fornecedor, encontrado ${countForn.rows[0].total}`);
  }
  if (countTit.rows[0].total !== 92) {
    throw new Error(`Validação falhou: esperado 92 títulos, encontrado ${countTit.rows[0].total}`);
  }
};

exports.down = async (pgm) => {
  await pgm.db.query(`DELETE FROM titulos`);
  await pgm.db.query(`DELETE FROM usuarios`);
  await pgm.db.query(`DELETE FROM fornecedores`);
  await pgm.db.query(`DELETE FROM especies`);
};
