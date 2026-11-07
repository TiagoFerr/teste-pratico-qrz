import { Test, TestingModule } from '@nestjs/testing';
import { TitulosService } from './titulos.service';
import { TitulosRepository } from './titulos.repository';

describe('TitulosService', () => {
  let service: TitulosService;
  let repository: TitulosRepository;

  const mockRepository = {
    findDataReferencia: jest.fn(),
    findTitulosAbertos: jest.fn(),
    findTotaisAbertos: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TitulosService,
        {
          provide: TitulosRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TitulosService>(TitulosService);
    repository = module.get<TitulosRepository>(TitulosRepository);
  });

  it('deve calcular corretamente o saldo líquido (O - D) e mapear os totais', async () => {
    mockRepository.findDataReferencia.mockResolvedValue('2026-11-07');
    mockRepository.findTotaisAbertos.mockResolvedValue([
      {
        tipo: 'O',
        qtd: 58,
        total: '498411.01',
        vencido: '97845.61',
        a_vencer: '400565.40',
      },
      {
        tipo: 'D',
        qtd: 34,
        total: '7767.83',
        vencido: '4851.85',
        a_vencer: '2915.98',
      },
    ]);
    mockRepository.findTitulosAbertos.mockResolvedValue([
      {
        seqtitulo: '76531362',
        especie: 'DUPLICATA FORNECEDOR - 201',
        tipo: 'O',
        dtaemissao: '2026-10-17',
        dtavencimento: '2026-12-03',
        vlraberto: '8737.82',
        vencido: false,
        dias_para_vencer: 26,
      },
    ]);

    const result = await service.getTitulosAbertos(4827, '2026-11-07');

    expect(result.referencia).toBe('2026-11-07');
    expect(result.resumo.receber.total).toBe('498411.01');
    expect(result.resumo.pagar.total).toBe('7767.83');
    expect(result.resumo.saldo).toBe('490643.18');
    expect(result.titulos).toHaveLength(1);
    expect(result.titulos[0].seqtitulo).toBe('76531362');
    expect(result.titulos[0].vencido).toBe(false);
  });

  it('deve retornar valores zerados quando o fornecedor não possuir pendências', async () => {
    mockRepository.findDataReferencia.mockResolvedValue('2026-11-07');
    mockRepository.findTotaisAbertos.mockResolvedValue([]);
    mockRepository.findTitulosAbertos.mockResolvedValue([]);

    const result = await service.getTitulosAbertos(9999, '2026-11-07');

    expect(result.resumo.receber.total).toBe('0.00');
    expect(result.resumo.pagar.total).toBe('0.00');
    expect(result.resumo.saldo).toBe('0.00');
    expect(result.titulos).toHaveLength(0);
  });
});
