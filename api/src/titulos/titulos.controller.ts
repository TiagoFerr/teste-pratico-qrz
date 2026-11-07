import { Controller, Get, Query } from '@nestjs/common';
import { TitulosService, TitulosAbertosResponse } from './titulos.service';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

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
