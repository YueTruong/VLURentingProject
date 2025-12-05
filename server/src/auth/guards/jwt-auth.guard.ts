import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// 'jwt' là tên mặc định của JwtStrategy (do passport-jwt cung cấp)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
