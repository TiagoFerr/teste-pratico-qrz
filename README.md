# Portal do Fornecedor - Grupo Queiroz

Aplicação desenvolvida para o teste prático de Desenvolvedor Full-Stack Pleno. O portal permite que fornecedores consultem sua posição financeira em aberto com o Grupo Queiroz, identificando valores a receber, débitos e o saldo líquido resultante.

---

## 1. Visão geral

O projeto é um monorepo dividido em duas aplicações principais e o banco de dados:

- **Banco de dados**: PostgreSQL 16 executado em container Docker com fuso horário `America/Fortaleza`.
- **API backend**: NestJS em TypeScript, com consultas SQL diretas via driver `pg` e controle de versões do esquema com `node-pg-migrate`.
- **Frontend web**: Next.js 15 (App Router) com React 19, TypeScript e Tailwind CSS, consumindo a API através de proxy reverso interno.

### Estrutura do repositório

```
teste-pratico-qrz/
├── docker-compose.yml          # Orquestração completa (db, api e web)
├── .dockerignore               # Otimização de contexto de build Docker
├── package.json                # Gerenciamento de workspaces npm (api e web)
├── .env.example                # Modelo de variáveis de ambiente
├── README.md                   # Documentação técnica e instruções
├── api/                        # Aplicação NestJS (Backend)
│   ├── Dockerfile              # Build multi-stage e execução de migrations
│   ├── tsconfig.build.json     # Configuração de build de produção
│   ├── db/data/                # Arquivos CSV originais da carga
│   ├── migrations/             # Migrações DDL e script de carga dos dados
│   ├── src/
│   │   ├── auth/               # Autenticação, JWT, cookies e guards
│   │   ├── database/           # Pool do PostgreSQL via driver nativo
│   │   ├── titulos/            # Consulta de pendências e cálculo de saldo
│   │   └── usuarios/           # Acesso ao cadastro de usuários
│   └── test/                   # Testes de integração E2E com Supertest
└── web/                        # Aplicação Next.js (Frontend)
    ├── Dockerfile              # Build multi-stage otimizado Next.js 15
    ├── middleware.ts           # Proteção de rotas e controle de sessão
    ├── next.config.ts          # Proxy reverso interno (/api/* -> http://api:3001)
    └── src/
        ├── app/                # Rotas (login e dashboard de pendências)
        ├── components/         # Resumo, tabela, cards mobile e paginação
        └── lib/                # Cliente HTTP e utilitários de formatação
```

---

## 2. Pré-requisitos

Para rodar via container (recomendado):
- **Docker e Docker Compose** (via Docker Desktop ativo)

Caso opte por rodar em modo desenvolvimento local fora de containers:
- **Node.js**: versão 20 ou superior (testado no **Node.js v22.13.0** em ambiente Windows 11)
- **npm**: versão 10 ou superior
- **Docker** (para subir o container do PostgreSQL)

---

## 3. Configuração de variáveis de ambiente

Copie o arquivo `.env.example` para `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Também é mantida uma cópia em `api/.env` para execução direta das migrações e testes isolados da API.

### Descrição das variáveis

| Variável | Padrão no .env.example | Descrição |
|---|---|---|
| `DB_HOST` | `localhost` | Endereço do host do banco de dados |
| `DB_PORT` | `5432` | Porta mapeada do PostgreSQL |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `DB_NAME` | `portal_fornecedor` | Nome da base de dados |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/portal_fornecedor` | URL completa de conexão utilizada pelo `node-pg-migrate` e pelo pool |
| `PORT` | `3001` | Porta HTTP da API NestJS |
| `JWT_SECRET` | `super-secret-jwt-key-for-development` | Chave secreta de assinatura do JWT (deve ser alterada fora do ambiente de desenvolvimento) |
| `JWT_EXPIRES_IN` | `1h` | Tempo de expiração do token |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Rota base de chamadas no navegador |
| `API_INTERNAL_URL` | `http://localhost:3001` | Destino do proxy reverso configurado no Next.js |

---

## 4. Como rodar o projeto

### Método 1: Execução completa via Docker Compose (Recomendado)

É o caminho mais rápido para avaliar a aplicação. Um único comando compila as imagens, inicia o PostgreSQL 16 (com timezone `America/Fortaleza`), executa as migrações, valida a carga dos 92 títulos e inicializa o backend e o frontend:

```bash
docker compose up --build -d
```

Após o build e a inicialização (cerca de 30 a 50 segundos no primeiro build):
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)
- **Banco de Dados**: `localhost:5432`

Para acompanhar os logs de inicialização e carga em tempo real:
```bash
docker compose logs -f
```

Para encerrar os serviços:
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

#### Passo 4: Iniciar as aplicações em terminais separados
- **Terminal 1 (API NestJS):**
  ```bash
  npm run dev:api
  ```
- **Terminal 2 (Frontend Next.js):**
  ```bash
  npm run dev:web
  ```

---

## 5. Carga de dados e CSVs

A migração `004_seed_dados.js` processa os dois arquivos fornecidos no teste:

1. **`consulta2_especies.csv`** (30 registros):
   - Colunas: `codespecie`, `descricao`, `obrigdireito` (`O` ou `D`).
   - Carregado na tabela `especies`.

2. **`consulta1_titulos.csv`** (92 registros):
   - Colunas: `seqpessoa`, `nomerazao`, `seqtitulo`, `codespecie`, `dtaemissao`, `dtavencimento`, `vlrnominal`, `vlrpago`.
   - Há um único fornecedor nos dados: código `4827` (`DISTRIBUIDORA EXEMPLO ALIMENTOS LTDA`).
   - O parser trata a codificação UTF-8 removendo o caractere BOM inicial (`\uFEFF`), converte o separador `;`, transforma decimais com vírgula em números de ponto flutuante e converte datas `DD/MM/AAAA` para o formato ISO `AAAA-MM-DD`.
   - Gera o registro do fornecedor na tabela `fornecedores` e cria seu usuário na tabela `usuarios` com o hash da senha padrão.

### Validação de contagem
Ao final da carga, a migração faz uma conferência das contagens no banco:
- 30 espécies
- 1 fornecedor
- 92 títulos

Se houver qualquer divergência em relação a esses números, a transação sofre rollback imediato.

---

## 6. Credenciais de teste

- **Código do fornecedor**: `4827`
- **Senha padrão**: `queiroz@2026`

---

## 7. Endpoints da API

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Pública | Recebe `{ usuario, senha }`. Aplica rate limit (5 req/min por IP). Em caso de sucesso, emite o cookie HTTP-only `access_token`. |
| POST | `/auth/logout` | Autenticada | Limpa o cookie de sessão no cliente. Como o JWT é stateless, o token não é revogado no servidor antes de expirar; a mitigação adotada é a expiração curta (1 hora). |
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
   O teste exige manipulação explícita de junções (`LEFT JOIN`), agrupamentos condicionais e regras de fuso horário. O uso de queries SQL parametrizadas dispensa o peso de ORMs, mantendo a regra de negócio acessível e fácil de inspecionar.

2. **Prevenção a IDOR (isolamento de dados)**:
   O código do fornecedor (`seqpessoa`) é extraído exclusivamente do token JWT no backend (`@CurrentUser()`). Nenhum endpoint permite receber `seqpessoa` por parâmetro de URL, query string ou corpo da requisição.

3. **Autenticação em cookie HTTP-only**:
   O token JWT trafega no cookie `access_token` configurado com `httpOnly: true`, `sameSite: 'lax'` e `path: '/'`. Isso impede que scripts maliciosos injetados no cliente acessem a credencial via JavaScript.

4. **Proxy reverso no Next.js**:
   Configurado no `next.config.ts` através de `rewrites`. O navegador requisita `/api/*` diretamente na origem `http://localhost:3000`, evitando erros de CORS e facilitando o gerenciamento de cookies entre portas distintas.

5. **Mitigação contra enumeração de usuários por tempo**:
   Quando um código de fornecedor inexistente tenta realizar login, a API executa uma checagem de hash fictícia contra uma constante antes de responder o erro 401 ("Usuário ou senha inválidos"). Isso iguala a latência em relação a usuários válidos com senha incorreta.

6. **Segurança de borda na API**:
   - `helmet` configurado para aplicação de cabeçalhos de proteção HTTP.
   - `@nestjs/throttler` configurado para limitar tentativas sucessivas de força bruta na rota `/auth/login`.
   - `ValidationPipe` global com `whitelist: true` e `forbidNonWhitelisted: true`, rejeitando campos não declarados no DTO.

7. **Tratamento de valores monetários**:
   O banco utiliza o tipo `NUMERIC(14,2)`. A API converte esses valores para strings decimais (`"498411.01"`), evitando os erros comuns de arredondamento de ponto flutuante em JavaScript. A formatação no padrão `R$ 1.234,56` ocorre exclusivamente na interface visual via `Intl.NumberFormat('pt-BR')`.

8. **Design de interface e experiência do usuário (UX)**:
   - **Responsividade**: a tabela completa para desktop converte-se em cards individuais empilhados em telas menores (`TituloCard`), facilitando a leitura em dispositivos móveis.
   - **Paginação integrada**: componente com seletor de quantidade (10, 20, 50, 100 itens por página), evitando listas longas e rolagem excessiva.
   - **Acessibilidade nos status**: os selos de situação combinam cores contrastantes, ícones semânticos e texto descritivo ("Vencido há X dias", "Vence hoje", "Vence em X dias"), atendendo diretrizes de acessibilidade visual.
   - **Estados da tela**: a interface possui skeletons durante o carregamento, aviso amigável quando nenhum registro atende aos filtros e card de erro com botão para repetição da consulta.

---

## 9. Interpretações e regras de negócio

1. **Direção da dívida (Obrigações O vs Direitos D)**:
   O enunciado menciona "quanto deve ao Queiroz", mas o requisito 5 pede o "total em aberto com o Grupo Queiroz". O campo `obrigdireito` separa obrigações (`O`, onde o Queiroz deve ao fornecedor) de direitos (`D`, onde o fornecedor deve ao Queiroz por devoluções ou verbas comerciais). Como não houve retorno sobre a dúvida até o prazo de sábado (07/11/2026), a interface exibe os dois blocos separadamente e calcula o **saldo líquido (`O - D`)**, informando com clareza o montante final favorável ao fornecedor.

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

A suíte de testes utiliza o banco de dados iniciado pelo Docker e é executada diretamente via Jest.

### Testes unitários (regras de cálculo do serviço)
```bash
npm run test:api
```
Cobre o cálculo do saldo líquido, classificação dos grupos de resumo e tratamento de fornecedores sem títulos em aberto.

### Testes de integração E2E (comportamento de ponta a ponta)
```bash
npm --workspace=api run test:e2e
```
Os testes E2E executam contra o banco de dados configurado no `.env`:
- Rejeição de logins inválidos e login bem-sucedido com emissão de cookie.
- Bloqueio de rotas protegidas sem autenticação.
- Conferência exata dos totais de referência em `2026-11-07` (R$ 498.411,01 em O, R$ 7.767,83 em D e R$ 490.643,18 de saldo).
- Caso limite dos 3 títulos que vencem na data de referência (`vencido: false`, `dias: 0`).
- Abatimento de pagamentos parciais (ex.: título 85277710).
- **Isolamento de dados**: o teste cria temporariamente um fornecedor fictício (`9999`) com título próprio, autentica ambos os usuários de forma independente, comprova que um fornecedor não tem acesso aos dados do outro e remove os registros de teste no bloco `afterAll`.

---

## 11. O que faria com mais tempo

- **Fluxo de primeiro acesso**: tela obrigatória para troca da senha padrão no primeiro login do fornecedor.
- **Recuperação de acesso**: fluxo de "esqueci minha senha" com envio de token temporário por e-mail ou SMS.
- **Revogação ativa de sessão**: armazenamento de sessões ativas ou lista de bloqueio de tokens em memória compartilhada (Redis), permitindo revogar sessões no momento do logout.
- **Exportação de relatórios**: botões para download da posição financeira em formato PDF e planilha Excel.
- **Detalhamento do título**: modal ou página interna exibindo histórico de notas fiscais associadas e parcelas pagas.
- **Pipeline de Integração Contínua (CI)**: workflow no GitHub Actions para validação automatizada de lint, build e testes a cada pull request.
