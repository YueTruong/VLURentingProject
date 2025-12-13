import { Repository } from 'typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { RoleEntity } from 'src/database/entities/role.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly userRepository;
    private readonly roleRepository;
    private readonly profileRepository;
    private readonly jwtService;
    constructor(userRepository: Repository<UserEntity>, roleRepository: Repository<RoleEntity>, profileRepository: Repository<UserProfileEntity>, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<UserEntity>;
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
    }>;
    getProfile(userId: number): Promise<{
        userId: number;
        full_name: string;
        phone_number: string;
        avatar_url: string;
        address: string;
        user: UserEntity;
        email: string;
        role: string;
    }>;
}
