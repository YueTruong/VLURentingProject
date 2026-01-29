import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";

// 1. Định nghĩa khuôn mẫu của dữ liệu bên trong Token (khớp với AuthService Backend)
interface BackendJwtPayload {
  userId?: number; // Thêm dấu ?
  email?: string;
  role?: string;
  roles?: string;
  sub?: string;    // Token chuẩn thường có sub
  iat?: number;
  exp?: number;
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
        // Kiểm tra xem user có nhập gì không
        if (!credentials?.username || !credentials?.password) return null;

        try {
          // 2. Gọi API Backend (Nhớ dùng port 3001)
          const backendUrl =
            process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

          if (!backendUrl) {
            throw new Error("Missing backend URL");
          }

          const res = await fetch(`${backendUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username, // Gửi key 'username' (chứa email hoặc username)
              password: credentials.password,
            }),
          });

          const data = await res.json();

          // In ra xem Backend trả về cái gì (để debug nếu lỗi)
          console.log("📦 Backend Response:", JSON.stringify(data, null, 2));

          if (!res.ok) {
            throw new Error(data.message || "Đăng nhập thất bại");
          }

          // 3. LOGIC GIẢI MÃ
          // Backend trả về: { access_token: "..." }
          if (data && data.access_token) {
            
            // Dùng jwtDecode để mở hộp Token ra
            const decoded = jwtDecode<BackendJwtPayload>(data.access_token);

            console.log("🔓 [Frontend] Decoded Token:", decoded);

            // Trả về object User đầy đủ để NextAuth lưu lại
            return {
              id: (decoded.userId || decoded.sub || "").toString(),
              
              email: decoded.email || "",
              
              // ⚠️ Fix lỗi: Ép kiểu 'as string' để đảm bảo không bao giờ là undefined
              role: (decoded.role ?? decoded.roles ?? "student") as "student" | "landlord" | "admin",
              
              // ⚠️ Fix lỗi: Ép kiểu 'as string'
              accessToken: data.access_token as string, 
              
              name: decoded.email || "", 
            };
          }

          return null;
        } catch (e) {
          console.error("❌ Login Error:", e);
          return null;
        }
      },
    }),
  ],

  // 4. Cấu hình để lưu dữ liệu vào Session
  callbacks: {
    // 1. Khi đăng nhập thành công, lưu token backend trả về vào JWT của NextAuth
    async jwt({ token, user }) {
      if (user) {
        // user này là object trả về từ hàm authorize (chứa accessToken, role...)
        return { ...token, ...user };
      }
      return token;
    },

    // 2. Mỗi khi FE gọi useSession(), lấy dữ liệu từ JWT bỏ vào Session
    async session({ session, token }) {
      session.user = {
        ...session.user,
        // 👇 Quan trọng: Gán accessToken và id từ token vào session
        accessToken: token.accessToken as string, 
        id: token.id as string,
        role: token.role as "student" | "landlord" | "admin",
      };
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
