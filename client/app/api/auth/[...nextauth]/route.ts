import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";
import { JWT } from "next-auth/jwt";

// 1. Khuôn mẫu của dữ liệu bên trong Token (khớp với AuthService Backend)
interface BackendJwtPayload {
  userId?: number;
  email?: string;
  role?: string;
  roles?: string;
  sub?: string;
  full_name?: string; 
  name?: string;
  iat?: number;
  exp?: number;
}

// 2. Khuôn mẫu tự chế cho các trường dữ liệu muốn thêm vào
interface CustomUserFields {
  full_name?: string;
  role?: string;
  accessToken?: string;
  id?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const backendUrl =
            process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

          if (!backendUrl) {
            throw new Error("Missing backend URL");
          }

          const res = await fetch(`${backendUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          const data = await res.json();
          console.log("📦 Backend Response:", JSON.stringify(data, null, 2));

          if (!res.ok) {
            throw new Error(data.message || "Đăng nhập thất bại");
          }

          // LOGIC GIẢI MÃ
          if (data && data.access_token) {
            const decoded = jwtDecode<BackendJwtPayload>(data.access_token);
            console.log("🔓 [Frontend] Decoded Token:", decoded);

            const extractedFullName = data.user?.full_name || data.user?.profile?.full_name || decoded.full_name || decoded.name || "";

            // ✅ Tạo object kết hợp User mặc định và các field tự chế
            const customUser: User & CustomUserFields = {
              id: (decoded.userId || decoded.sub || "").toString(),
              email: decoded.email || "",
              role: (decoded.role ?? decoded.roles ?? "student"),
              accessToken: data.access_token as string,
              full_name: extractedFullName,
              name: extractedFullName || decoded.email || "", 
            };
            
            // Trả về ép kiểu User an toàn
            return customUser as User; 
          }

          return null;
        } catch (e) {
          console.error("❌ Login Error:", e);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // 1. Khi đăng nhập thành công, lưu dữ liệu vào JWT
    async jwt({ token, user }) {
      if (user) {
        // ✅ Ép kiểu sang giao diện kết hợp thay vì 'any'
        const u = user as User & CustomUserFields; 
        token.id = u.id;
        token.role = u.role;
        token.accessToken = u.accessToken;
        token.full_name = u.full_name;
      }
      return token;
    },

    // 2. Khi Frontend gọi useSession(), đẩy dữ liệu từ JWT ra Session
    async session({ session, token }) {
      const t = token as JWT & CustomUserFields;
      if (session.user) {
        // ✅ Dùng Object.assign để nhét thêm data vào session.user 
        // Cách này qua mặt được TypeScript mà không vi phạm quy tắc 'no-explicit-any' của ESLint
        Object.assign(session.user, {
          id: t.id,
          role: t.role,
          accessToken: t.accessToken,
          full_name: t.full_name,
        });
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };