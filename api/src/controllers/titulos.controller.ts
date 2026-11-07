import { Controller, Get, Query } from '@nestjs/common';
import { TitulosService } from '../services/titulos.service';
import { TitulosAbertosResponse } from '../interfaces/titulos.interface';
import { CurrentUser, CurrentUserPayload } from '../decorators/current-user.decorator';

@Controller('titulos')
export class TitulosController {
  constructor(private readonly titulosService: TitulosService) {}

  @Get('abertos')
  async getTitulosAbertos(
    @CurrentUser() user: CurrentUserPayload,
    @Query('ref') dataRef?: string,
  ): Promise<TitulosAbertosResponse> {
    // Parâmetro de corte de data restrito aos ambientes de teste e desenvolvimento
    const allowCustomRef = process.env.NODE_ENV !== 'production';
    const effectiveRef = allowCustomRef ? dataRef : undefined;

    return this.titulosService.getTitulosAbertos(user.seqpessoa, effectiveRef);
  }
}
