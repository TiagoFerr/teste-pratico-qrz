import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { LoginDto } from './dto/login.dto';

// Hash dummy para manter o tempo de resposta uniforme contra enumeração
const DUMMY_HASH = '$2a$10$e8O0BwK6W8bF9H0uP6vQge7O9bH5k6a7L8uP9q0w1e2r3t4y5u6i.';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const seqpessoa = Number(loginDto.usuario);
    if (isNaN(seqpessoa)) {
      await bcrypt.compare(loginDto.senha, DUMMY_HASH);
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const usuario = await this.usuariosRepository.findBySeqpessoa(seqpessoa);
    if (!usuario) {
      await bcrypt.compare(loginDto.senha, DUMMY_HASH);
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(loginDto.senha, usuario.senha_hash);
    if (!senhaValida) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    return {
      seqpessoa: usuario.seqpessoa,
      nomerazao: usuario.nomerazao,
    };
  }

  generateToken(user: { seqpessoa: number; nomerazao: string }) {
    const payload = {
      sub: user.seqpessoa,
      nomerazao: user.nomerazao,
    };
    return this.jwtService.sign(payload);
  }
}
