import { Module } from '@nestjs/common';
import { TitulosController } from './titulos.controller';
import { TitulosService } from './titulos.service';
import { TitulosRepository } from './titulos.repository';

@Module({
  controllers: [TitulosController],
  providers: [TitulosService, TitulosRepository],
  exports: [TitulosService, TitulosRepository],
})
export class TitulosModule {}
