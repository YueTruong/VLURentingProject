import NextAuth, { type NextAuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { jwtDecode } from "jwt-decode";
import type { JWT } from "next-auth/jwt";

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

interface CustomUserFields {
  full_name?: string;
  role?: string;
  accessToken?: string;
  id?: string;
}

const credentialsProvider = CredentialsProvider({
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
      console.log("[Auth] Backend Response:", JSON.stringify(data, null, 2));

      if (!res.ok) {
        throw new Error(data.message || "Dang nhap that bai");
      }

      if (!data?.access_token) {
        return null;
      }

      const decoded = jwtDecode<BackendJwtPayload>(data.access_token);
      console.log("[Auth] Decoded backend token:", decoded);

      const extractedFullName =
        data.user?.full_name ||
        data.user?.profile?.full_name ||
        decoded.full_name ||
        decoded.name ||
        "";

      const customUser: User & CustomUserFields = {
        id: (decoded.userId || decoded.sub || "").toString(),
        email: decoded.email || "",
        role: decoded.role ?? decoded.roles ?? "student",
        accessToken: data.access_token as string,
        full_name: extractedFullName,
        name: extractedFullName || decoded.email || "",
      };

      return customUser as User;
    } catch (error) {
      console.error("[Auth] Credentials login error:", error);
      return null;
    }
  },
});

const providers: NextAuthOptions["providers"] = [credentialsProvider];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
} else {
  console.warn("[Auth] Google OAuth is disabled: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET");
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as User & CustomUserFields;

        token.id = (u.id ?? token.id ?? token.sub ?? "").toString();
        token.role = u.role ?? token.role ?? "student";
        token.accessToken = u.accessToken;
        token.full_name = u.full_name ?? u.name ?? token.full_name;
      }

      return token;
    },

    async session({ session, token }) {
      const t = token as JWT & CustomUserFields;

      if (session.user) {
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
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
