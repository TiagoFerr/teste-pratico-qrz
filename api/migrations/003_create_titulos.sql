-- 003_create_titulos.sql

CREATE TABLE IF NOT EXISTS titulos (
  id BIGSERIAL PRIMARY KEY,
  seqpessoa BIGINT NOT NULL REFERENCES fornecedores(seqpessoa) ON DELETE CASCADE,
  seqtitulo BIGINT NOT NULL,
  codespecie VARCHAR(10) REFERENCES especies(codespecie) ON DELETE RESTRICT,
  dtaemissao DATE NOT NULL,
  dtavencimento DATE NOT NULL,
  vlrnominal NUMERIC(14,2) NOT NULL CHECK (vlrnominal >= 0),
  vlrpago NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (vlrpago >= 0),
  CONSTRAINT uq_titulos_pessoa_titulo UNIQUE (seqpessoa, seqtitulo)
);

CREATE INDEX IF NOT EXISTS idx_titulos_pessoa_vencimento ON titulos (seqpessoa, dtavencimento);
