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
    // Lấy danh sách vai trò được phép (ví dụ: ['owner'])
    // mà chúng ta sẽ đặt ở Controller
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không yêu cầu vai trò nào, cho qua
    if (!requiredRoles) {
      return true;
    }

    // Lấy thông tin user từ request (đã được JwtAuthGuard giải mã)
    const { user } = context.switchToHttp().getRequest();

    // So sánh vai trò của user với các vai trò được phép
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    return true;
  }
}
