import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

describe('Portal do Fornecedor API (E2E)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let authCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    db = app.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Autenticação', () => {
    it('POST /auth/login - rejeita credenciais incorretas com 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ usuario: '4827', senha: 'senha_errada' })
        .expect(401);

      expect(response.body.message).toBe('Usuário ou senha inválidos');
    });

    it('POST /auth/login - rejeita usuário inexistente com 401 mantendo mensagem genérica', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ usuario: '0000', senha: 'qualquer_senha' })
        .expect(401);

      expect(response.body.message).toBe('Usuário ou senha inválidos');
    });

    it('POST /auth/login - autentica fornecedor 4827 e emite cookie httpOnly', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ usuario: '4827', senha: 'queiroz@2026' })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const accessCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
        (c: string) => c.startsWith('access_token='),
      );
      expect(accessCookie).toBeDefined();
      expect(accessCookie).toContain('HttpOnly');
      authCookie = accessCookie.split(';')[0];

      expect(response.body).toEqual({
        seqpessoa: 4827,
        nomerazao: 'DISTRIBUIDORA EXEMPLO ALIMENTOS LTDA',
      });
    });

    it('GET /auth/me - rejeita requisição sem cookie com 401', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('GET /auth/me - retorna o perfil autenticado via cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [authCookie])
        .expect(200);

      expect(response.body).toEqual({
        seqpessoa: 4827,
        nomerazao: 'DISTRIBUIDORA EXEMPLO ALIMENTOS LTDA',
      });
    });
  });

  describe('2. Regras de Negócio e Totais de Referência (PLANO.md Seção 2.3)', () => {
    it('GET /titulos/abertos?ref=2026-11-07 - retorna valores exatos da especificação', async () => {
      const response = await request(app.getHttpServer())
        .get('/titulos/abertos?ref=2026-11-07')
        .set('Cookie', [authCookie])
        .expect(200);

      const { referencia, resumo, titulos } = response.body;

      expect(referencia).toBe('2026-11-07');

      // 58 títulos O: Total 498.411,01 (Vencidos: 97.845,61 / A vencer: 400.565,40)
      expect(resumo.receber.qtd).toBe(58);
      expect(resumo.receber.total).toBe('498411.01');
      expect(resumo.receber.vencido).toBe('97845.61');
      expect(resumo.receber.aVencer).toBe('400565.40');

      // 34 títulos D: Total 7.767,83 (Vencidos: 4.851,85 / A vencer: 2.915,98)
      expect(resumo.pagar.qtd).toBe(34);
      expect(resumo.pagar.total).toBe('7767.83');
      expect(resumo.pagar.vencido).toBe('4851.85');
      expect(resumo.pagar.aVencer).toBe('2915.98');

      // Saldo Líquido (O - D): 490.643,18
      expect(resumo.saldo).toBe('490643.18');

      // Quantidade total de títulos
      expect(titulos).toHaveLength(92);
    });

    it('Caso limite: títulos que vencem em 07/11/2026 são considerados "a vencer" (vencido: false, dias: 0)', async () => {
      const response = await request(app.getHttpServer())
        .get('/titulos/abertos?ref=2026-11-07')
        .set('Cookie', [authCookie])
        .expect(200);

      const titulosHoje = response.body.titulos.filter(
        (t: any) => t.vencimento === '2026-11-07',
      );

      // No dataset há exatamente 3 títulos que vencem hoje (78455686, 84634864, 83078845)
      expect(titulosHoje).toHaveLength(3);
      titulosHoje.forEach((t: any) => {
        expect(t.vencido).toBe(false);
        expect(t.dias).toBe(0);
      });
    });

    it('Pagamentos parciais: o valor em aberto subtrai corretamente o valor pago', async () => {
      const response = await request(app.getHttpServer())
        .get('/titulos/abertos?ref=2026-11-07')
        .set('Cookie', [authCookie])
        .expect(200);

      // Título 85277710: nominal 8005.51, pago 60.86 -> aberto 7944.65
      const tituloParcial = response.body.titulos.find(
        (t: any) => t.seqtitulo === '85277710',
      );
      expect(tituloParcial).toBeDefined();
      expect(tituloParcial.valorAberto).toBe('7944.65');
    });
  });

  describe('3. Isolamento entre Fornecedores (Prevenção a IDOR)', () => {
    const FORNECEDOR_TESTE = 9999;

    beforeAll(async () => {
      // Cria fornecedor e usuário fictício para o teste de isolamento
      await db.query(
        `INSERT INTO fornecedores (seqpessoa, nomerazao)
         VALUES ($1, 'FORNECEDOR ISOLAMENTO TESTE LTDA')
         ON CONFLICT (seqpessoa) DO NOTHING`,
        [FORNECEDOR_TESTE],
      );

      const hash = bcrypt.hashSync('senha@teste123', 10);
      await db.query(
        `INSERT INTO usuarios (seqpessoa, senha_hash)
         VALUES ($1, $2)
         ON CONFLICT (seqpessoa) DO NOTHING`,
        [FORNECEDOR_TESTE, hash],
      );

      // Cria título exclusivo para o fornecedor 9999
      await db.query(
        `INSERT INTO titulos (seqpessoa, seqtitulo, codespecie, dtaemissao, dtavencimento, vlrnominal, vlrpago)
         VALUES ($1, 99990001, 'DPFORN', '2026-11-01', '2026-11-30', 5000.00, 0.00)
         ON CONFLICT (seqpessoa, seqtitulo) DO NOTHING`,
        [FORNECEDOR_TESTE],
      );
    });

    afterAll(async () => {
      // Limpeza dos dados de teste
      await db.query(`DELETE FROM titulos WHERE seqpessoa = $1`, [FORNECEDOR_TESTE]);
      await db.query(`DELETE FROM usuarios WHERE seqpessoa = $1`, [FORNECEDOR_TESTE]);
      await db.query(`DELETE FROM fornecedores WHERE seqpessoa = $1`, [FORNECEDOR_TESTE]);
    });

    it('Fornecedor 4827 não deve enxergar os títulos do fornecedor 9999', async () => {
      const response = await request(app.getHttpServer())
        .get('/titulos/abertos?ref=2026-11-07')
        .set('Cookie', [authCookie])
        .expect(200);

      const encontrouOutro = response.body.titulos.some(
        (t: any) => t.seqtitulo === '99990001',
      );
      expect(encontrouOutro).toBe(false);
      expect(response.body.titulos).toHaveLength(92);
    });

    it('Fornecedor 9999 autenticado enxerga exclusivamente seus próprios títulos', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ usuario: '9999', senha: 'senha@teste123' })
        .expect(200);

      const cookie9999 = loginRes.headers['set-cookie'][0].split(';')[0];

      const titulosRes = await request(app.getHttpServer())
        .get('/titulos/abertos?ref=2026-11-07')
        .set('Cookie', [cookie9999])
        .expect(200);

      expect(titulosRes.body.titulos).toHaveLength(1);
      expect(titulosRes.body.titulos[0].seqtitulo).toBe('99990001');
      expect(titulosRes.body.resumo.receber.total).toBe('5000.00');
      expect(titulosRes.body.resumo.pagar.total).toBe('0.00');
      expect(titulosRes.body.resumo.saldo).toBe('5000.00');
    });
  });

  describe('4. Logout', () => {
    it('POST /auth/logout - limpa o cookie de acesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [authCookie])
        .expect(200);

      expect(response.body.message).toBe('Sessão encerrada com sucesso');

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const accessCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
        (c: string) => c.startsWith('access_token='),
      );
      expect(accessCookie).toMatch(/access_token=;|Max-Age=0|expires=/i);
    });
  });
});
