import { UserProfileEntity } from 'src/database/entities/user-profile.entity';

export interface JwtPayload {
  sub: number;
  username: string | null;
  email: string | null;
  role: string;
  full_name: string | null;
}

export interface AuthenticatedRequestUser {
  id: number;
  userId: number;
  email?: string | null;
  username?: string | null;
  role?: string;
}

export interface ValidatedUser {
  id: number;
  email: string;
  username: string | null;
  role: {
    id?: number;
    name?: string;
  };
  profile?: Pick<
    UserProfileEntity,
    'full_name' | 'phone_number' | 'avatar_url' | 'address'
  > | null;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string | null;
    username: string | null;
    role: string;
    full_name: string | null;
  };
}
