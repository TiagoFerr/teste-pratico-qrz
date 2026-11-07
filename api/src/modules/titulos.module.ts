import { Module } from '@nestjs/common';
import { TitulosController } from '../controllers/titulos.controller';
import { TitulosService } from '../services/titulos.service';
import { TitulosRepository } from '../repositories/titulos.repository';

@Module({
  controllers: [TitulosController],
  providers: [TitulosService, TitulosRepository],
  exports: [TitulosService, TitulosRepository],
})
export class TitulosModule {}
