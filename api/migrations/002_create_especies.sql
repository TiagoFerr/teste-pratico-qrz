-- 002_create_especies.sql

CREATE TABLE IF NOT EXISTS especies (
  codespecie VARCHAR(10) PRIMARY KEY,
  descricao VARCHAR(255) NOT NULL,
  obrigdireito CHAR(1) NOT NULL CHECK (obrigdireito IN ('O', 'D'))
);
