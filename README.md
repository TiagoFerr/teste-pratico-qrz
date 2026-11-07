# Portal do Fornecedor - Grupo Queiroz

Aplicação desenvolvida para o teste prático de Desenvolvedor Full-Stack Pleno. O portal permite que fornecedores consultem sua posição financeira em aberto com o Grupo Queiroz, identificando valores a receber, débitos e o saldo líquido resultante.

## 1. Visão geral

O sistema é composto por:
- **Banco de dados**: PostgreSQL 16 com fuso horário fixado em `America/Fortaleza`.
- **API backend**: NestJS em TypeScript, utilizando consultas SQL parametrizadas via `pg` e controle de esquema com `node-pg-migrate`.
- **Frontend web**: Next.js (App Router) com Tailwind CSS e proxy reverso para a API.

## 2. Pré-requisitos

- Node.js 20 ou superior (testado no Node.js v22.13.0)
- npm 10 ou superior
- Docker e Docker Compose (ou PostgreSQL 16 instalado localmente)

## 3. Como rodar do zero

### Passo 1: Configurar variáveis de ambiente
Copie o arquivo de exemplo para `.env`:
```bash
cp .env.example .env
```

### Passo 2: Iniciar o banco de dados
Suba o container do PostgreSQL via Docker Compose:
```bash
docker compose up -d db
```
O container configura o fuso horário padrão do PostgreSQL para `America/Fortaleza`.

### Passo 3: Instalar as dependências
Na raiz do monorepo, execute:
```bash
npm install
```

### Passo 4: Executar as migrações e a carga de dados
Execute as migrações que criam as tabelas e realizam a carga dos arquivos CSV:
```bash
npm run migrate:up
```

### Passo 5: Iniciar as aplicações
Em terminais separados (ou usando os scripts do workspace):

**API (NestJS):**
```bash
npm run dev:api
```
A API responde em `http://localhost:3001`.

**Web (Next.js):**
```bash
npm run dev:web
```
O frontend responde em `http://localhost:3000`.

## 4. Como gerenciar o banco e as migrações

As migrações ficam localizadas em `api/migrations/`.

- Executar migrações pendentes:
  ```bash
  npm run migrate:up
  ```
- Reverter migrações:
  ```bash
  npm run migrate:down
  ```
- Para recriar o banco do zero via Docker:
  ```bash
  docker compose down -v
  docker compose up -d db
  npm run migrate:up
  ```

## 5. Credenciais de teste

O script de migração inicial cria automaticamente o usuário correspondente ao fornecedor presente no arquivo CSV:

- **Código do fornecedor**: `4827`
- **Senha padrão**: `queiroz@2026`

## 6. Endpoints da API

Todas as rotas da API (exceto `/auth/login`) exigem o cookie `access_token` gerado na autenticação.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Pública (com rate limit) | Recebe `{ usuario, senha }` e define o cookie HTTP-only `access_token`. |
| POST | `/auth/logout` | Autenticada | Invalida e limpa o cookie de sessão. |
| GET | `/auth/me` | Autenticada | Retorna os dados do fornecedor logado (`seqpessoa`, `nomerazao`). |
| GET | `/titulos/abertos` | Autenticada | Retorna os totais consolidados e a lista de títulos em aberto. Aceita o parâmetro opcional `?ref=AAAA-MM-DD` para testes de corte de data. |

### Exemplo de resposta de `GET /titulos/abertos`:
```json
{
  "referencia": "2026-11-07",
  "resumo": {
    "receber": {
      "qtd": 58,
      "total": "498411.01",
      "vencido": "97845.61",
      "aVencer": "400565.40"
    },
    "pagar": {
      "qtd": 34,
      "total": "7767.83",
      "vencido": "4851.85",
      "aVencer": "2915.98"
    },
    "saldo": "490643.18"
  },
  "titulos": [
    {
      "seqtitulo": "76531362",
      "especie": "DUPLICATA FORNECEDOR - 201",
      "tipo": "O",
      "emissao": "2026-10-17",
      "vencimento": "2026-12-03",
      "valorAberto": "8737.82",
      "vencido": false,
      "dias": 26
    }
  ]
}
```

## 7. Decisões técnicas

1. **SQL puro com `pg`**:
   O teste exige consultas explícitas e agrupamentos com cálculos de vencimento. O uso do driver nativo com queries parametrizadas mantém o SQL visível, auditável e sem abstrações desnecessárias de ORMs.

2. **Isolamento de dados (prevenção contra IDOR)**:
   O identificador do fornecedor (`seqpessoa`) é extraído exclusivamente do token JWT validado no backend. Nenhum endpoint aceita `seqpessoa` por parâmetro de rota, query ou corpo de requisição.

3. **Autenticação com cookie HTTP-only**:
   O token JWT é armazenado em cookie com flags `httpOnly` e `sameSite: 'lax'`, prevenindo acesso via JavaScript no navegador (mitigação contra XSS).

4. **Proxy reverso no Next.js**:
   Configurado via `rewrites` no `next.config.ts`. O navegador realiza requisições para `/api/*` sob a mesma origem da aplicação web, eliminando problemas de CORS e simplificando o compartilhamento de cookies entre as portas.

5. **Proteção contra enumeração por tempo no login**:
   Caso o código do fornecedor informado não exista na base, a API executa uma comparação de hash fictícia antes de retornar erro genérico ("Usuário ou senha inválidos"), uniformizando o tempo de resposta da rota.

6. **Tipos monetários**:
   No banco de dados é utilizado `NUMERIC(14,2)`. A API trafega os valores como strings com duas casas decimais, evitando imprecisão de ponto flutuante em JavaScript. A formatação para `pt-BR` ocorre apenas na camada de exibição.

## 8. Interpretações de negócio

1. **Direção da dívida (Obrigações vs Direitos)**:
   O campo `obrigdireito` categoriza os títulos em obrigações (`O`, onde o Queiroz deve ao fornecedor) e direitos (`D`, onde o fornecedor deve ao Queiroz, referente a devoluções e verbas). O portal apresenta ambos os lados de forma discriminada e calcula o saldo líquido (`O - D`).

2. **Critério de vencimento**:
   Um título é considerado vencido quando `dtavencimento < data_referencia`. Títulos com vencimento igual à data de referência são classificados como a vencer.

3. **Fuso horário de referência**:
   A data atual de comparação é calculada sob a timezone `America/Fortaleza`. Isso impede que títulos que vencem na data corrente sejam marcados como vencidos após as 21h em servidores rodando em UTC.

4. **Pagamentos parciais**:
   O valor em aberto é calculado por `vlrnominal - COALESCE(vlrpago, 0)`. Somente títulos com saldo restante maior que zero entram na listagem.

## 9. Como rodar os testes

A suíte cobre cálculos de saldo, classificação de datas, caso limite de vencimento na data base e isolamento entre fornecedores.

- Executar testes unitários:
  ```bash
  npm run test:api
  ```
- Executar testes ponta a ponta (E2E):
  ```bash
  npm --workspace=api run test:e2e
  ```

## 10. O que faria com mais tempo

- **Fluxo de primeiro acesso**: tela para troca obrigatória da senha padrão no primeiro login.
- **Recuperação de conta**: fluxo de redefinição de senha com envio de código por e-mail ou SMS.
- **Revogação de sessão**: armazenamento de identificadores de sessão em cache (Redis) para permitir logout com invalidação imediata no servidor.
- **Exportação de relatórios**: geração de extrato de pendências em PDF e planilha Excel.
- **Paginação no servidor**: paginação por cursor ou offset caso a quantidade de títulos de um fornecedor ultrapasse centenas de registros.
