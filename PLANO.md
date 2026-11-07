# Plano de Aplicação – Portal do Fornecedor (Grupo Queiroz)

Teste prático – Desenvolvedor Full-Stack Pleno
**Prazo de entrega:** segunda-feira, 09/11/2026, até 12h (Fortaleza)
**Stack:** PostgreSQL · NestJS (TypeScript) · Next.js (App Router, TypeScript)

---

## 1. Objetivo

Portal onde o fornecedor faz login e vê, sem acionar o financeiro, seus títulos em aberto com o Grupo Queiroz: total, o que está vencido e o que está a vencer.

Escopo: **tela de login + tela de pendências + logout**, com isolamento de dados por fornecedor.

---

## 2. Análise dos dados (CSVs fornecidos)

### 2.1 Formato

| Item | Achado | Tratamento na carga |
|---|---|---|
| Separador | `;` | Parser configurado com `delimiter: ';'` |
| Codificação | UTF-8 **com BOM** | Remover BOM na leitura (`bom: true`) |
| Decimal | vírgula (`8737,82`) | Converter para `NUMERIC(14,2)` |
| Datas | `dd/mm/aaaa` | `TO_DATE(x, 'DD/MM/YYYY')` |
| Volume | 92 títulos / 30 espécies | Carga simples, cabe em migration |

### 2.2 Qualidade

- Sem nulos, sem datas inválidas, sem `seqtitulo` duplicado.
- Todos os `codespecie` dos títulos existem no cadastro (mesmo assim, usar `LEFT JOIN`).
- Nenhum título totalmente quitado e nenhum com `vlrpago > vlrnominal`.
- **3 títulos com pagamento parcial** → valida o cálculo `vlrnominal − vlrpago`.
- **3 títulos vencem em 07/11/2026** → caso limite do "vencido vs a vencer".
- **Há somente 1 fornecedor: 4827** (`DISTRIBUIDORA EXEMPLO ALIMENTOS LTDA`), com os 92 títulos.
- Espécies usadas: `DPFORN` (54), `DPCDEV` (3), `ADTREC` (1) → tipo **O**; `DVFORN` (18), `VBSELL` (15), `VBQUEB` (1) → tipo **D**.

### 2.3 Valores de referência (hoje = 07/11/2026, fornecedor 4827)

| | Títulos | Valor em aberto |
|---|---:|---:|
| **O** – a vencer | 47 | R$ 400.565,40 |
| **O** – vencidos | 11 | R$ 97.845,61 |
| **Total O** (Queiroz deve ao fornecedor) | 58 | **R$ 498.411,01** |
| **D** – a vencer | 17 | R$ 2.915,98 |
| **D** – vencidos | 17 | R$ 4.851,85 |
| **Total D** (fornecedor deve ao Queiroz) | 34 | **R$ 7.767,83** |
| **Saldo líquido (O − D)** | | **R$ 490.643,18** |

> Esses números viram teste automatizado de regressão. Se a tela divergir, há erro de regra, de fuso ou de carga.

---

## 3. Interpretações e decisões de negócio

Todas devem ir para o README ("Decisões e interpretações").

| # | Ponto | Decisão | Motivo |
|---|---|---|---|
| 1 | **Direção da dívida (O vs D)** | Exibir **os dois lados**, separados e rotulados, mais o **saldo líquido (O − D)** | O contexto diz "quanto deve ao Queiroz", mas o requisito 5 fala em "total em aberto com o Grupo Queiroz". Os tipos D são devoluções e verbas (abatimentos), então o que importa ao fornecedor é o saldo. |
| 2 | **Valor em aberto** | `vlrnominal − COALESCE(vlrpago, 0)`; só entram títulos com saldo > 0 | Há pagamentos parciais. |
| 3 | **Vencido vs a vencer** | Vencido se `dtavencimento < hoje`; vencimento **hoje = a vencer** | Título só atrasa após o dia de vencimento. |
| 4 | **Data de "hoje"** | Calculada no banco em `America/Fortaleza` | Evita que, em servidor UTC, após 21h os títulos de hoje apareçam como vencidos. |
| 5 | **Espécie sem cadastro** | `LEFT JOIN` e exibir "Espécie não cadastrada" | Nunca esconder título do fornecedor. Se não vier tipo O/D, o título entra como "Não classificado" e fora do saldo, com aviso. |
| 6 | **Usuários** | Um usuário por `seqpessoa` presente nos títulos. Login = `seqpessoa`, senha padrão `queiroz@2026` (com hash) | Atende "usuários já criados" e a senha padrão obrigatória. |
| 7 | **Dinheiro** | `NUMERIC(14,2)` no banco; API devolve **string decimal**; soma no SQL; formatação só no front | Evita erro de ponto flutuante. |
| 8 | **Troca de senha** | Fora do escopo; citada em "o que faria a mais" | Escopo do teste. |
| 9 | **Títulos futuros muito distantes** | Todos os em aberto aparecem, sem limite de data | O contexto pede "vencido ou para vencer". |

**Dúvida ao avaliador (enviar hoje, prazo até sábado):**

> Olá! O contexto diz que o fornecedor deve ver "quanto deve ao Queiroz", mas o campo `obrigdireito` distingue títulos **O** (Queiroz deve ao fornecedor) e **D** (fornecedor deve ao Queiroz). A tela deve mostrar só um desses lados ou ambos? Se não houver retorno, vou exibir os dois separadamente, com o saldo líquido, e registrar no README.

---

## 4. Arquitetura

```
┌────────────┐   HTTPS    ┌───────────────┐   SQL    ┌────────────┐
│  Next.js   │ ─────────► │   NestJS API  │ ───────► │ PostgreSQL │
│  (web)     │  /api/*    │   (api)       │          │            │
└────────────┘  (proxy)   └───────────────┘          └────────────┘
```

- **Três camadas separadas**: `web/`, `api/` e banco (migrations dentro de `api/`).
- O Next.js faz **proxy de `/api/*` para o Nest** (`rewrites` no `next.config`). O navegador fala só com uma origem, o que elimina CORS e simplifica o cookie.
- API em **camadas simples** (controller → service → repository). Sem DDD nem hexagonal: o domínio é pequeno e a abstração extra não se paga.

### 4.1 Decisões técnicas

| Decisão | Escolha | Alternativa descartada | Trade-off |
|---|---|---|---|
| Banco | PostgreSQL via Docker Compose | SQLite | Exige Docker, mas mostra modelagem e fuso horário reais. |
| Acesso a dados | **SQL puro** com `pg` | TypeORM/Prisma | O teste pede SQL explícito com JOIN; ORM esconderia a consulta. Perde-se conveniência de mapeamento. |
| Migrations | `node-pg-migrate` | Migrations do TypeORM | Leve, aceita SQL e JS, e roda sem ORM. |
| Auth | **JWT em cookie `httpOnly`** | JWT em `localStorage` | Cookie resiste a roubo por XSS. É stateless, então o logout só limpa o cookie. Mitigação: expiração curta. |
| Hash de senha | `argon2` (ou `bcrypt`) | SHA/MD5 | Algoritmo lento e próprio para senhas. |
| Front | Next.js App Router + Tailwind | CSS modules | Responsividade rápida e consistente. |
| Validação | `class-validator` + `ValidationPipe` global | Validação manual | Padrão do Nest. |
| Rate limit | `@nestjs/throttler` no login | Nenhum | Dificulta força bruta. |

---

## 5. Banco de dados

### 5.1 Modelo

```
fornecedores (seqpessoa PK, nomerazao)
usuarios     (seqpessoa PK/FK → fornecedores, senha_hash, criado_em)
especies     (codespecie PK, descricao, obrigdireito CHECK IN ('O','D'))
titulos      (id PK, seqpessoa FK, seqtitulo, codespecie FK, dtaemissao DATE,
              dtavencimento DATE, vlrnominal NUMERIC(14,2), vlrpago NUMERIC(14,2),
              UNIQUE (seqpessoa, seqtitulo),
              CHECK (vlrnominal >= 0), CHECK (vlrpago >= 0))
índice: titulos (seqpessoa, dtavencimento)
```

`fornecedores` é normalizada a partir de `nomerazao`, que se repete em todas as linhas do CSV.

### 5.2 Migrations (`api/migrations/`)

| Arquivo | Conteúdo |
|---|---|
| `001_create_fornecedores_usuarios.sql` | Tabelas `fornecedores` e `usuarios` |
| `002_create_especies.sql` | Tabela `especies` com CHECK em `obrigdireito` |
| `003_create_titulos.sql` | Tabela `titulos`, FKs, constraints e índice |
| `004_seed_dados.js` | Carga dos CSVs e criação dos usuários (ver abaixo) |

**Carga (`004`)**, tudo em uma transação:
1. Ler os CSVs (sem BOM, `;` como separador).
2. Inserir em **tabelas temporárias com colunas `TEXT`**.
3. `INSERT ... SELECT` convertendo vírgula decimal e datas (`TO_DATE`).
4. Inserir `fornecedores` a partir dos `seqpessoa`/`nomerazao` distintos.
5. Criar um `usuario` por fornecedor com o hash de `queiroz@2026`.
6. **Validar contagens** (92 títulos, 30 espécies, 1 fornecedor) e abortar se divergirem.

### 5.3 Consulta principal

```sql
SELECT
  t.seqtitulo,
  COALESCE(e.descricao, 'Espécie não cadastrada')            AS especie,
  e.obrigdireito                                              AS tipo,
  t.dtaemissao,
  t.dtavencimento,
  (t.vlrnominal - COALESCE(t.vlrpago, 0))                     AS vlraberto,
  (t.dtavencimento < hoje.d)                                  AS vencido,
  (t.dtavencimento - hoje.d)                                  AS dias_para_vencer  -- negativo = dias de atraso
FROM titulos t
LEFT JOIN especies e ON e.codespecie = t.codespecie
CROSS JOIN (SELECT (NOW() AT TIME ZONE 'America/Fortaleza')::date AS d) hoje
WHERE t.seqpessoa = $1                                        -- sempre vem do token
  AND t.vlrnominal - COALESCE(t.vlrpago, 0) > 0
ORDER BY t.dtavencimento, t.seqtitulo;
```

### 5.4 Totais (calculados no SQL, não no JS)

```sql
SELECT
  e.obrigdireito AS tipo,
  COUNT(*)                                                         AS qtd,
  SUM(aberto)                                                      AS total,
  SUM(aberto) FILTER (WHERE t.dtavencimento <  hoje.d)             AS vencido,
  SUM(aberto) FILTER (WHERE t.dtavencimento >= hoje.d)             AS a_vencer
FROM ... -- mesma base da consulta principal
GROUP BY e.obrigdireito;
```

A "data de hoje" deve ser **injetável** no repository (parâmetro opcional) para os testes não dependerem do relógio.

---

## 6. API (NestJS)

### 6.1 Estrutura

```
api/
├── migrations/
├── db/data/                       # consulta1_titulos.csv, consulta2_especies.csv
├── src/
│   ├── main.ts                    # helmet, cookie-parser, ValidationPipe global
│   ├── app.module.ts
│   ├── config/                    # validação das variáveis de ambiente
│   ├── database/                  # DatabaseModule (pool do pg)
│   ├── auth/
│   │   ├── auth.controller.ts     # login, logout, me
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts        # extrai o JWT do cookie
│   │   ├── jwt-auth.guard.ts      # guard global
│   │   ├── public.decorator.ts    # @Public() para o login
│   │   └── current-user.decorator.ts
│   ├── titulos/
│   │   ├── titulos.controller.ts
│   │   ├── titulos.service.ts     # regra de negócio (saldo, classificação)
│   │   └── titulos.repository.ts  # SQL
│   └── usuarios/
│       └── usuarios.repository.ts
└── test/                          # e2e
```

### 6.2 Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/login` | pública | `{ usuario, senha }` → define cookie `httpOnly` |
| POST | `/auth/logout` | sim | Limpa o cookie |
| GET | `/auth/me` | sim | `{ seqpessoa, nomerazao }` |
| GET | `/titulos/abertos` | sim | Resumo + lista de títulos em aberto |

**Resposta de `GET /titulos/abertos` (valores como string decimal):**

```json
{
  "referencia": "2026-11-07",
  "resumo": {
    "receber": { "qtd": 58, "total": "498411.01", "vencido": "97845.61", "aVencer": "400565.40" },
    "pagar":   { "qtd": 34, "total": "7767.83",  "vencido": "4851.85",  "aVencer": "2915.98" },
    "saldo":   "490643.18"
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

### 6.3 Segurança

- **Isolamento:** o `seqpessoa` vem **somente do token** (`@CurrentUser()`). Nenhum endpoint aceita `seqpessoa` por parâmetro, query ou body. Isso elimina IDOR.
- **Guard global JWT**, com `@Public()` explícito apenas no login (seguro por padrão).
- **Cookie:** `httpOnly`, `SameSite=Lax`, `Secure` em produção, expiração curta (ex.: 1 h).
- **Login:** mensagem genérica ("usuário ou senha inválidos"). Comparar com hash dummy quando o usuário não existe, para evitar enumeração por tempo. Rate limit (ex.: 5 tentativas/min por IP).
- `helmet`, `ValidationPipe` com `whitelist` e `forbidNonWhitelisted`, queries 100% parametrizadas.
- Segredos em `.env` (com `.env.example` versionado, sem valores reais).
- **Limitação assumida:** JWT stateless não é revogado no servidor ao fazer logout (só o cookie é limpo). Documentar e listar refresh token e blocklist em "o que faria a mais".

---

## 7. Front-end (Next.js)

### 7.1 Estrutura

```
web/
├── next.config.ts                  # rewrites: /api/* → API Nest
├── middleware.ts                   # redireciona sem cookie → /login (e logado em /login → /)
└── src/
    ├── app/
    │   ├── login/page.tsx
    │   ├── (protegido)/page.tsx    # pendências
    │   └── layout.tsx
    ├── components/
    │   ├── ResumoCards.tsx
    │   ├── TituloTabela.tsx        # desktop
    │   ├── TituloCard.tsx          # mobile
    │   ├── StatusBadge.tsx
    │   └── Header.tsx              # razão social + Sair
    ├── lib/
    │   ├── api.ts                  # fetch com credentials; 401 → login
    │   └── format.ts               # moeda e data pt-BR
    └── types/
```

### 7.2 Tela de login
- Campos "Código do fornecedor" e "Senha", com mostrar/ocultar senha.
- Mensagem de erro clara, estado de carregamento no botão, foco automático no primeiro campo.

### 7.3 Tela de pendências (UX para usuário não técnico)
1. **Cabeçalho:** razão social e botão **Sair**.
2. **Destaque:** saldo em aberto com o Grupo Queiroz.
3. **Cards de resumo:**
   - "A receber do Queiroz" (tipo O)
   - "Você deve ao Queiroz" (tipo D, com legenda "devoluções, verbas e descontos")
   - Em cada um: total, quanto está **vencido** e quanto está **a vencer**.
4. **Lista de títulos** com: número, espécie, emissão, vencimento, valor em aberto e **selo de situação**:
   - "Vencido há X dias" / "Vence hoje" / "Vence em X dias"
   - Cor **mais** ícone e texto, nunca só cor (acessibilidade).
5. **Filtros simples:** Todos · Vencidos · A vencer (e por tipo).
6. **Estados:** carregando (skeleton), vazio ("Você não possui pendências"), erro com botão "Tentar novamente".
7. **Mobile:** tabela vira **lista de cards empilhados** (design mobile-first, breakpoint por CSS).

### 7.3.1 Formatação
- Moeda com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` → `R$ 1.234,56`.
- Datas `YYYY-MM-DD` formatadas **sem passar por `new Date()`** (evita deslocamento de fuso), saída `dd/mm/aaaa`.

---

## 8. Estratégia de testes

| Nível | O que cobre |
|---|---|
| **Unitário (service)** | Cálculo de saldo, classificação vencido / a vencer, vencimento hoje, pagamento parcial, título quitado oculto |
| **E2E da API (supertest + banco de teste)** | Login válido/inválido, rota sem cookie → 401, logout, **totais da seção 2.3**, os 3 vencendo hoje |
| **Isolamento** | Criar fornecedor fictício no teste e provar que o 4827 não acessa seus títulos (e vice-versa) |
| **Front (opcional)** | Testes de `format.ts` (moeda e data) |

---

## 9. Estrutura do repositório

```
portal-fornecedor/
├── docker-compose.yml        # postgres (+ api e web, opcional)
├── .env.example
├── README.md
├── PLANO.md
├── api/                      # NestJS
└── web/                      # Next.js
```

---

## 10. Plano de execução (commits incrementais)

| Fase | Entrega | Mensagem de commit |
|---|---|---|
| 0 | Repositório, docker-compose com Postgres, `.env.example`, esqueleto Nest e Next | `chore: setup inicial do monorepo` |
| 1 | Migrations de schema (001–003) | `feat(db): cria schema relacional` |
| 2 | Migration de carga dos CSVs + usuários + validação de contagem | `feat(db): carga dos CSVs e usuários` |
| 3 | Auth: login, logout, me, guard global, throttler | `feat(api): autenticação com JWT em cookie` |
| 4 | Endpoint de títulos em aberto (SQL, totais) | `feat(api): endpoint de títulos em aberto` |
| 5 | Testes unitários e e2e (incluindo isolamento) | `test(api): regra de negócio e isolamento` |
| 6 | Front: login, middleware, logout | `feat(web): login e rota protegida` |
| 7 | Front: pendências, formatação pt-BR | `feat(web): tela de pendências` |
| 8 | Responsividade e polimento de UX | `feat(web): layout responsivo` |
| 9 | README e teste "do zero" em ambiente limpo | `docs: README` |

**Cronograma sugerido**

| Quando | Foco |
|---|---|
| Sábado | Fases 0–4 (banco e API) |
| Domingo | Fases 5–8 (testes e front) |
| Segunda, até 10h | Fase 9, revisão, teste do zero e envio (folga de 2 h) |

---

## 10.1 Pontos de atenção

- Rodar o projeto **do zero** seguindo só o README antes de entregar (clone limpo).
- Conferir os totais da tela com os da seção 2.3.
- Confirmar `Secure`/`SameSite` do cookie atrás do proxy do Next.
- Não versionar `.env`.
- Commits pequenos e descritivos ao longo do desenvolvimento, não um só no final.
- Ser capaz de explicar cada decisão (a avaliação valoriza o entendimento).

---

## 11. Esqueleto do README (entrega)

1. **Visão geral** e screenshots
2. **Pré-requisitos** (Node, Docker)
3. **Como rodar do zero** (`cp .env.example .env` → `docker compose up -d db` → instalar dependências → migrations → `npm run start:dev` na API → `npm run dev` no web)
4. **Como rodar as migrations** (criação e carga) e como recriar o banco
5. **Credenciais de teste:** `4827` / `queiroz@2026`
6. **Endpoints** da API
7. **Decisões técnicas e porquê** (seção 4.1)
8. **Interpretações de negócio** (seção 3)
9. **Como rodar os testes**
10. **O que faria a mais**

---

## 12. O que faria a mais (para o README)

- Troca obrigatória da senha padrão no primeiro acesso e fluxo "esqueci minha senha"
- Refresh token e revogação de sessão no servidor
- Paginação, ordenação e busca nos títulos
- Exportar a posição em PDF/Excel
- Detalhe do título (histórico de pagamentos)
- Testes E2E do front (Playwright) e pipeline de CI
- Logs estruturados, auditoria de acessos e observabilidade
- Cache do resumo e atualização periódica da base a partir do ERP
- Internacionalização e modo escuro
