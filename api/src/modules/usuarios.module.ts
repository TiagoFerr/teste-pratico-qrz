import { Module } from '@nestjs/common';
import { UsuariosRepository } from '../repositories/usuarios.repository';

@Module({
  providers: [UsuariosRepository],
  exports: [UsuariosRepository],
})
export class UsuariosModule {}
