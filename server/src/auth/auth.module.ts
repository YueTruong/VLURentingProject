import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRequiredConfig } from 'src/common/config/env.utils';
import { PostEntity } from 'src/database/entities/post.entity';
import { RoleEntity } from 'src/database/entities/role.entity';
import { UserOauthAccountEntity } from 'src/database/entities/user-oauth-account.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { UserSettingsEntity } from 'src/database/entities/user-settings.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MeController } from './me.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      UserProfileEntity,
      UserOauthAccountEntity,
      UserSettingsEntity,
      PostEntity,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: getRequiredConfig(configService, 'JWT_SECRET'),
        signOptions: {
          expiresIn: parseInt(
            configService.get<string>('JWT_EXPIRES_IN') || '3600',
            10,
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController, MeController],
  exports: [JwtModule],
})
export class AuthModule {}
