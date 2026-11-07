# Portal do Fornecedor - Grupo Queiroz

Aplicação desenvolvida para o teste prático de Desenvolvedor Full-Stack Pleno. O portal permite que fornecedores consultem sua posição financeira em aberto com o Grupo Queiroz, identificando valores a receber, débitos e o saldo líquido consolidado.

---

## 1. Visão geral

O projeto é estruturado em um monorepo dividido em duas aplicações principais e o banco de dados:

- **Banco de dados**: PostgreSQL 16 Alpine executado em container Docker com fuso horário fixado em `America/Fortaleza`.
- **API backend**: NestJS 11 em TypeScript, com consultas SQL diretas via driver nativo `pg` e controle de migrações com `node-pg-migrate`.
- **Frontend web**: Next.js 15 (App Router) com React 19, TypeScript e Tailwind CSS, consumindo a API por meio de proxy reverso interno.

### Estrutura do repositório

```
teste-pratico-qrz/
├── docker-compose.yml          # Orquestração dos serviços (db, api e web)
├── .dockerignore               # Otimização de contexto de build Docker
├── .gitattributes              # Normalização de finais de linha (LF para Linux)
├── package.json                # Gerenciamento de workspaces npm (api e web)
├── .env.example                # Modelo de variáveis de ambiente
├── README.md                   # Documentação técnica e instruções
├── docs/screenshots/           # Capturas de tela (desktop e mobile)
├── api/                        # Aplicação NestJS (Backend)
│   ├── Dockerfile              # Build multi-stage e runner com migrações automáticas
│   ├── tsconfig.build.json     # Configuração de compilação para produção
│   ├── db/data/                # Arquivos CSV originais da carga
│   ├── migrations/             # Migrações DDL e script de carga dos dados
│   ├── src/
│   │   ├── auth/               # Autenticação JWT, cookies HttpOnly e guards
│   │   ├── database/           # Pool do PostgreSQL via driver nativo pg
│   │   ├── titulos/            # Consulta de pendências e cálculo de saldo
│   │   └── usuarios/           # Acesso ao cadastro de usuários e hash
│   └── test/                   # Testes de integração E2E com Supertest
└── web/                        # Aplicação Next.js (Frontend)
    ├── Dockerfile              # Build multi-stage do Next.js 15
    ├── middleware.ts           # Proteção de rotas e controle de sessão
    ├── next.config.mjs         # Proxy reverso interno (/api/* -> backend)
    └── src/
        ├── app/                # Rotas (login e dashboard de pendências)
        ├── components/         # Resumo, tabela desktop, cards mobile e paginação
        └── lib/                # Cliente HTTP e utilitários de formatação
```

### Demonstração visual da aplicação

| Login (Desktop) | Pendências (Desktop) |
|:---:|:---:|
| ![Login Desktop](docs/screenshots/login-desktop.png) | ![Pendências Desktop](docs/screenshots/titulos-desktop.png) |

| Login (Mobile) | Pendências (Mobile) |
|:---:|:---:|
| ![Login Mobile](docs/screenshots/login-mobile.png) | ![Pendências Mobile](docs/screenshots/titulos-mobile.png) |

---

## 2. Pré-requisitos

Para rodar via container (recomendado):
- **Docker e Docker Compose** (via Docker Desktop ativo)

Caso opte por rodar em modo desenvolvimento local fora de containers:
- **Node.js**: versão 20 ou superior (desenvolvido e testado no **Node.js v22.13.0** em ambiente Windows 11)
- **npm**: versão 10 ou superior
- **Docker** (para subir o container do PostgreSQL)

---

## 3. Configuração de variáveis de ambiente

Copie o arquivo `.env.example` para `.env` na raiz do projeto:

**Linux / macOS (Bash):**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Todas as aplicações do monorepo (API, Frontend e comandos de migração) utilizam exclusivamente o arquivo `.env` localizado na raiz.

### Descrição das variáveis

| Variável | Padrão no .env.example | Descrição |
|---|---|---|
| `DB_HOST` | `localhost` | Endereço do host do banco de dados |
| `DB_PORT` | `5432` | Porta mapeada do PostgreSQL *(altere para 5433 se a 5432 já estiver em uso localmente)* |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `DB_NAME` | `portal_fornecedor` | Nome da base de dados |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/portal_fornecedor` | URL de conexão utilizada pelo `node-pg-migrate` e pelo pool da API |
| `PORT` | `3001` | Porta HTTP da API NestJS |
| `JWT_SECRET` | `super-secret-jwt-key-for-development` | Chave secreta de assinatura do JWT (deve ser alterada fora do ambiente de desenvolvimento) |
| `JWT_EXPIRES_IN` | `1h` | Tempo de expiração do token de sessão |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Rota base de chamadas no navegador |
| `API_INTERNAL_URL` | `http://localhost:3001` | Destino do proxy reverso (`http://localhost:3001` localmente; `http://api:3001` no Docker) |

> **Observação sobre Docker vs Execução Local:** O arquivo `.env` da raiz define `localhost` por padrão para suportar a execução direta no host (Método 2). Ao subir o ambiente via Docker Compose (Método 1), o `docker-compose.yml` sobrescreve explicitamente essas variáveis dentro dos containers: `DATABASE_URL` utiliza o host `db` (`db:5432`) e `API_INTERNAL_URL` aponta para `http://api:3001`, viabilizando a resolução interna pela rede virtual do Compose.

---

## 4. Como rodar o projeto

### Método 1: Execução completa via Docker Compose (Recomendado)

É a forma mais rápida e determinística para avaliar a aplicação. Um único comando compila as imagens, inicia o PostgreSQL 16 (com timezone `America/Fortaleza`), executa as migrações, valida a carga dos 92 títulos e inicializa o backend e o frontend:

```bash
docker compose up --build -d
```

#### Como saber que está pronto
Aguarde o término do build (cerca de 30 a 50 segundos na primeira execução). Você pode acompanhar os logs do backend:
```bash
docker compose logs -f api
```
Assim que a mensagem `Migrations complete!` e `API running on http://localhost:3001` for exibida, o ambiente está 100% pronto.

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)
- **Credenciais para login imediato**: Fornecedor `4827` / Senha `queiroz@2026`

Para encerrar todos os serviços:
```bash
docker compose down
```

---

### Método 2: Desenvolvimento local (com hot-reload)

Caso deseje executar o código localmente na máquina com hot-reload ativo:

#### Passo 1: Iniciar apenas o banco de dados
```bash
docker compose up -d db
```

#### Passo 2: Instalar as dependências
Na raiz do monorepo:
```bash
npm install
```

#### Passo 3: Executar as migrações e carga dos CSVs
```bash
npm run migrate:up
```
O comando executa `node-pg-migrate` apontando para o `.env` da raiz e processa as tabelas e o seed oficial.

#### Passo 4: Iniciar as aplicações em terminais separados
- **Terminal 1 (API NestJS):**
  ```bash
  npm run dev:api
  ```
- **Terminal 2 (Frontend Next.js):**
  ```bash
  npm run dev:web
  ```
Acesse [http://localhost:3000](http://localhost:3000).

---

## 5. Carga de dados e CSVs

A migração `004_seed_dados.js` processa os arquivos oficiais fornecidos para o teste:

1. **`consulta2_especies.csv`** (30 registros):
   - Colunas: `codespecie`, `descricao`, `obrigdireito` (`O` ou `D`).
   - Carregado na tabela `especies`.

2. **`consulta1_titulos.csv`** (92 registros):
   - Colunas: `seqpessoa`, `nomerazao`, `seqtitulo`, `codespecie`, `dtaemissao`, `dtavencimento`, `vlrnominal`, `vlrpago`.
   - Há um único fornecedor nos dados: código `4827` (`DISTRIBUIDORA EXEMPLO ALIMENTOS LTDA`).
   - **Tratamento rigoroso**: o parser remove o caractere BOM UTF-8 (`\uFEFF`), processa o delimitador `;`, normaliza valores decimais com vírgula diretamente para strings (`"11968,90"` -> `"11968.90"`) para inserção em colunas `NUMERIC(14,2)` sem conversão por ponto flutuante binário do JavaScript, e converte datas `DD/MM/AAAA` para o formato ISO `AAAA-MM-DD`.
   - Cria o registro na tabela `fornecedores` e o usuário correspondente na tabela `usuarios` com o hash bcrypt da senha padrão.

### Validação de contagem
Ao final da carga, a transação executa uma validação estrita de contagem:
- 30 espécies
- 1 fornecedor
- 92 títulos

Se houver qualquer divergência em relação a esses números, a migração sofre rollback imediato.

---

## 6. Credenciais de acesso

Conforme os dados do CSV fornecido pelo Grupo Queiroz:

| Campo | Valor |
|---|---|
| **Código do Fornecedor** | `4827` |
| **Razão Social** | `DISTRIBUIDORA EXEMPLO ALIMENTOS LTDA` |
| **Senha Padrão** | `queiroz@2026` |
| **Títulos em Aberto** | 92 (58 a receber, 34 a pagar) |
| **Saldo Líquido (em 07/11/2026)** | **R$ 490.643,18** |

> O isolamento multi-fornecedor (prevenção a IDOR) é comprovado na suíte automatizada de testes E2E (`npm run test:e2e`), que cria dinamicamente um fornecedor temporário (`9999`) com títulos próprios, comprova que um usuário não tem acesso aos dados do outro e remove os registros de forma idempotente ao final.

---

## 7. Endpoints da API

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Pública | Recebe `{ usuario, senha }`. Aplica rate limit (30 req/min por IP). Em caso de sucesso, emite o cookie HttpOnly `access_token`. |
| POST | `/auth/logout` | Autenticada | Limpa o cookie de sessão no cliente. Como o JWT é stateless, o token permanece válido até a expiração se interceptado; a mitigação imediata é o TTL curto de 1 hora. |
| GET | `/auth/me` | Autenticada | Retorna os dados do fornecedor autenticado (`seqpessoa` e `nomerazao`). |
| GET | `/titulos/abertos` | Autenticada | Retorna o resumo consolidado e a lista detalhada de títulos em aberto. O parâmetro opcional `?ref=AAAA-MM-DD` é aceito apenas fora do ambiente de produção (`NODE_ENV !== 'production'`) para fins de testes. |

### Exemplo de resposta da listagem (`GET /titulos/abertos`):

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

---

## 8. Decisões técnicas e arquitetura

1. **SQL direto via driver `pg`**:
   O teste exige manipulação explícita de junções (`LEFT JOIN`), agrupamentos condicionais e regras de fuso horário. O uso de queries SQL parametrizadas dispensa o peso de ORMs, mantendo as regras de negócio transparentes e fáceis de auditar.

2. **Prevenção a IDOR (isolamento estrito de dados)**:
   O código do fornecedor (`seqpessoa`) é extraído exclusivamente do token JWT no backend (`@CurrentUser()`). Nenhum endpoint aceita `seqpessoa` vindo de parâmetros de URL, query string ou corpo da requisição.

3. **Armazenamento de senhas com `bcrypt`**:
   As senhas dos fornecedores são armazenadas exclusivamente em formato de hash criptográfico gerado com `bcrypt` (10 rounds de salt). O algoritmo foi adotado por ser padrão consagrado para proteção contra ataques de dicionário, rainbow tables e vazamentos de banco, oferecendo resistência a força bruta com custo de CPU equilibrado.

4. **Autenticação em cookie HttpOnly**:
   O token JWT trafega no cookie `access_token` configurado com `httpOnly: true`, `sameSite: 'lax'` e `path: '/'`. Em produção utiliza `secure: true`, operando com `secure: false` em ambiente de desenvolvimento local para suportar HTTP em `localhost`.

5. **Proxy reverso no Next.js**:
   Configurado no `next.config.mjs` através de `rewrites`. O navegador requisita `/api/*` diretamente na origem `http://localhost:3000`, eliminando atritos de CORS e simplificando o tráfego do cookie de sessão.

6. **Proteção contra enumeração de usuários por tempo**:
   Quando um código de fornecedor inexistente tenta realizar login, a API executa uma checagem de hash fictícia contra uma constante antes de responder o erro 401 ("Usuário ou senha inválidos"). Isso iguala o tempo de resposta em relação a usuários válidos com senha incorreta.

7. **Segurança de borda e Rate Limiting**:
   - `helmet` configurado para aplicação de cabeçalhos de proteção HTTP.
   - `app.set('trust proxy', 1)` configurado no Express para extrair o IP real através dos cabeçalhos `X-Forwarded-For` do proxy do Next.js.
   - `@nestjs/throttler` configurado com limite de 30 requisições por minuto por IP na rota de login, retornando HTTP 429 em caso de abuso sem prejudicar testes manuais de avaliação.
   - `ValidationPipe` global com `whitelist: true` e `forbidNonWhitelisted: true`, rejeitando campos não declarados no DTO.

8. **Tratamento de valores monetários sem ponto flutuante**:
   O banco de dados utiliza colunas `NUMERIC(14,2)`. A carga e a API trafegam esses valores como strings decimais formatadas (`"498411.01"`), evitando os erros clássicos de arredondamento IEEE-754 do JavaScript. A conversão para `R$ 1.234,56` ocorre exclusivamente na camada de apresentação via `Intl.NumberFormat('pt-BR')`.

9. **Design de interface, UX e Paginação**:
   - **Responsividade total**: a tabela desktop converte-se em cards individuais empilhados em telas menores (`TituloCard`), proporcionando leitura confortável em dispositivos móveis.
   - **Paginação no cliente**: como o dataset de 92 títulos representa um payload leve, a paginação (10, 20, 50 ou 100 itens por página) ocorre no cliente. Isso permite trocas de página instantâneas sem novas requisições de rede.
   - **Totais sempre globais**: os cartões de resumo superior (A Receber, A Pagar e Saldo Líquido) são calculados no banco de dados sobre a totalidade dos títulos do fornecedor, nunca restritos à página exibida.
   - **Acessibilidade nos status**: os badges combinam cores contrastantes, ícones semânticos e texto descritivo ("Vencido há X dias", "Vence hoje", "Vence em X dias").
   - **Estados da tela**: a interface conta com skeletons durante o carregamento e card de erro com botão para repetição da consulta.

---

## 9. Interpretações e regras de negócio

1. **Direção da dívida (Obrigações O vs Direitos D)**:
   O enunciado traz uma ambiguidade conceitual ao citar tanto "quanto deve ao Queiroz" quanto o "total em aberto com o Grupo Queiroz". O campo `obrigdireito` separa obrigações (`O`, onde o Queiroz deve ao fornecedor) de direitos (`D`, onde o fornecedor deve ao Queiroz por devoluções ou verbas comerciais). Diante dessa duplicidade, a interface não restringe a consulta a apenas um lado: exibe os dois blocos separadamente e calcula o **saldo líquido (`O - D`)**, informando o saldo a favor do fornecedor (ou do Grupo Queiroz, se negativo).

2. **Critério de vencimento e data atual**:
   Um título é considerado vencido quando `dtavencimento < data_referencia`. Títulos que vencem no mesmo dia da referência são considerados **a vencer**, pois o pagamento pode ocorrer até o encerramento do expediente bancário.

3. **Cálculo da data no fuso de Fortaleza**:
   A query principal calcula a data atual diretamente no PostgreSQL através de `(NOW() AT TIME ZONE 'America/Fortaleza')::date`. Isso impede que, a partir das 21h em servidores com relógio em UTC, títulos que vencem no dia atual sejam classificados incorretamente como vencidos.

4. **Pagamentos parciais e títulos quitados**:
   O valor em aberto é determinado pela subtração `vlrnominal - COALESCE(vlrpago, 0)`. Títulos quitados integralmente (saldo igual a zero) são omitidos da listagem pelo filtro `WHERE vlrnominal - COALESCE(vlrpago, 0) > 0`.

5. **Tratamento de espécies não cadastradas**:
   A junção entre títulos e espécies utiliza `LEFT JOIN`. Caso algum título possua código não mapeado na tabela `especies`, ele continua visível para o fornecedor, recebendo a descrição "Espécie não cadastrada".

6. **Campo `dias` na API**:
   Representa a diferença em dias entre o vencimento e a data de referência (`dtavencimento - hoje`). Números positivos indicam dias restantes para o vencimento; zero indica vencimento na data corrente; números negativos indicam dias de atraso.

---

## 10. Como rodar os testes

A suíte de testes utiliza o banco de dados iniciado pelo Docker e é executada diretamente via Jest. Certifique-se de que o banco está ativo e as migrações foram executadas (`npm run migrate:up`).

### Testes unitários (regras de cálculo do serviço)
```bash
npm run test:api
```
Cobre o cálculo do saldo líquido, agrupamento dos resumos e tratamento de fornecedores sem pendências.

### Testes de integração E2E (comportamento de ponta a ponta)
```bash
npm run test:e2e
```
Os testes E2E executam contra o banco de dados configurado no `.env`:
- Rejeição de logins inválidos e login bem-sucedido com emissão de cookie HttpOnly.
- Bloqueio de rotas protegidas sem autenticação.
- Conferência exata dos totais de referência em `2026-11-07` (R$ 498.411,01 em O, R$ 7.767,83 em D e R$ 490.643,18 de saldo).
- Caso limite dos 3 títulos que vencem na data de referência (`vencido: false`, `dias: 0`).
- Abatimento de pagamentos parciais (ex.: título 85277710).
- **Isolamento de dados (Prevenção a IDOR)**: o teste cria temporariamente um fornecedor fictício (`9999`) com título próprio, autentica ambos os usuários de forma independente, comprova que um fornecedor não tem acesso aos dados do outro e remove os registros de teste de forma idempotente em `beforeAll` e `afterAll`.

---

## 11. O que faria com mais tempo

- Troca obrigatória da senha padrão no primeiro acesso e fluxo "esqueci minha senha".
- Revogação de sessão no servidor (Redis ou blocklist), para o logout invalidar o token.
- Exportação da posição financeira em PDF e Excel.
- Detalhe do título (histórico de pagamentos).
- Notificações em tempo real via SSE (Server-Sent Events) para alertar sobre novos títulos ou liquidações.
- Paginação no servidor, se o volume por fornecedor crescer.
- CI com GitHub Actions (lint, build e testes) e testes E2E do front (Playwright).
- Logs estruturados e auditoria de acessos.

