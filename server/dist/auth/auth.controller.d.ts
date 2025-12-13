import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        data: import("../database/entities/user.entity").UserEntity;
    }>;
    login(req: any, loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    getProfile(req: any): Promise<{
        userId: number;
        full_name: string;
        phone_number: string;
        avatar_url: string;
        address: string;
        user: import("../database/entities/user.entity").UserEntity;
        email: string;
        role: string;
    }>;
}
