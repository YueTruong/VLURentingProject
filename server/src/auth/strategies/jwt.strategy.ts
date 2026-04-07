import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getRequiredConfig } from 'src/common/config/env.utils';
import { UserEntity } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import {
  AuthenticatedRequestUser,
  JwtPayload,
} from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getRequiredConfig(configService, 'JWT_SECRET'),
    });
  }

  async validate(
    payload: JwtPayload & {
      id?: number;
      userId?: number;
      roles?: string;
    },
  ): Promise<AuthenticatedRequestUser> {
    const userId = payload.sub || payload.id || payload.userId;

    if (!userId) {
      throw new UnauthorizedException(
        'Token khong hop le (khong tim thay User ID)',
      );
    }

    const activeUser = await this.userRepository.findOne({
      where: {
        id: Number(userId),
        is_active: true,
      },
      select: ['id'],
    });

    if (!activeUser) {
      throw new UnauthorizedException('Tai khoan khong con hoat dong');
    }

    const normalizedRole =
      typeof payload.role === 'string'
        ? payload.role.toLowerCase()
        : typeof payload.roles === 'string'
          ? payload.roles.toLowerCase()
          : undefined;

    return {
      id: Number(userId),
      userId: Number(userId),
      email: payload.email,
      username: payload.username,
      role: normalizedRole,
    };
  }
}
