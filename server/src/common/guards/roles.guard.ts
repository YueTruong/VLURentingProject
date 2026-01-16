import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Láº¥y danh sÃ¡ch vai trÃ² Ä‘Æ°á»£c phÃ©p (vÃ­ dá»¥: ['owner'])
    // mÃ  chÃºng ta sáº½ Ä‘áº·t á»Ÿ Controller
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Náº¿u khÃ´ng yÃªu cáº§u vai trÃ² nÃ o, cho qua
    if (!requiredRoles) {
      return true;
    }

    // Láº¥y thÃ´ng tin user tá»« request (Ä‘Ã£ Ä‘Æ°á»£c JwtAuthGuard giáº£i mÃ£)
    const { user } = context.switchToHttp().getRequest();
    const normalizedRole =
      typeof user?.role === 'string' ? user.role.toLowerCase() : undefined;

    // So sÃ¡nh vai trÃ² cá»§a user vá»›i cÃ¡c vai trÃ² Ä‘Æ°á»£c phÃ©p
    const hasRole = requiredRoles.some(
      (role) => role.toLowerCase() === normalizedRole,
    );

    if (!hasRole) {
      throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n thá»±c hiá»‡n hÃ nh Ä‘á»™ng nÃ y');
    }

    return true;
  }
}
