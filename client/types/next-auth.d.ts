import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Mở rộng interface Session mặc định
   * Để thêm accessToken, id, role, ...
   */
  interface Session {
    user: {
      accessToken?: string;
      id?: string | number;
      role?: string;
      // Giữ lại các trường mặc định (name, email, image)
    } & DefaultSession["user"];
  }

  /**
   * Mở rộng interface User mặc định (nếu cần dùng ở chỗ khác)
   */
  interface User {
    accessToken?: string;
    id?: string | number;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Mở rộng interface JWT để chứa token và role
   */
  interface JWT {
    accessToken?: string;
    id?: string | number;
    role?: string;
  }
}