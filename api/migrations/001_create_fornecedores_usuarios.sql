-- 001_create_fornecedores_usuarios.sql

CREATE TABLE IF NOT EXISTS fornecedores (
  seqpessoa BIGINT PRIMARY KEY,
  nomerazao VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  seqpessoa BIGINT PRIMARY KEY REFERENCES fornecedores(seqpessoa) ON DELETE CASCADE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
