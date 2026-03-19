import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../dto/register.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách role được phép truy cập từ Decorator @Roles
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu API không yêu cầu role cụ thể nào (Public) -> Cho qua
    if (!requiredRoles) {
      return true;
    }

    // 2. Lấy thông tin User từ Request (đã được JwtAuthGuard gán vào)
    const { user } = context.switchToHttp().getRequest();

    // 3. Kiểm tra User có tồn tại và có Role hợp lệ không
    if (!user || !user.role) {
      throw new ForbiddenException(
        'Bạn chưa đăng nhập hoặc không có quyền truy cập',
      );
    }

    // 4. So sánh Role của User với Role yêu cầu
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Chỉ có quyền ${requiredRoles.join(', ')} mới được thực hiện thao tác này`,
      );
    }

    return true;
  }
}
