import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database.module';
import { UsuariosModule } from './usuarios.module';
import { AuthModule } from './auth.module';
import { TitulosModule } from './titulos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    DatabaseModule,
    UsuariosModule,
    AuthModule,
    TitulosModule,
  ],
})
export class AppModule {}
