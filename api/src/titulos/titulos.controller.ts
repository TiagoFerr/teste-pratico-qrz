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
    return this.titulosService.getTitulosAbertos(user.seqpessoa, dataRef);
  }
}
