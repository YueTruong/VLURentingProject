import NextAuth, { type NextAuthOptions, type User, type Account, type Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import type { JWT } from "next-auth/jwt";

type OAuthProvider = "google" | "facebook" | "apple";
const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "facebook", "apple"];

interface BackendJwtPayload {
  userId?: number;
  email?: string;
  role?: string;
  roles?: string;
  sub?: string;
  full_name?: string;
  name?: string;
}

interface CustomUserFields {
  full_name?: string;
  role?: string;
  accessToken?: string;
  id?: string;
}

type OAuthBridgeResponse = {
  access_token?: string;
  user?: {
    id?: number | string;
    email?: string | null;
    role?: string | null;
    full_name?: string | null;
  };
};

const getBackendUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

const isOAuthProvider = (provider?: string): provider is OAuthProvider =>
  Boolean(provider && OAUTH_PROVIDERS.includes(provider as OAuthProvider));

const getProviderAccountId = (account?: Account | null, profile?: Profile) => {
  if (!account) return "";
  if (account.providerAccountId) return String(account.providerAccountId);
  const profileAny = profile as { sub?: string; id?: string | number } | undefined;
  if (profileAny?.sub) return String(profileAny.sub);
  if (profileAny?.id !== undefined && profileAny?.id !== null) return String(profileAny.id);
  return "";
};

const getOAuthProfile = (user: User, profile?: Profile) => {
  const profileAny = profile as {
    email?: string;
    name?: string;
    picture?: string;
    avatar_url?: string;
  };

  return {
    email: user.email ?? profileAny?.email,
    fullName: user.name ?? profileAny?.name,
    avatarUrl: user.image ?? profileAny?.picture ?? profileAny?.avatar_url,
  };
};

const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    username: { label: "Username", type: "text" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.username || !credentials?.password) return null;

    try {
      const res = await fetch(`${getBackendUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.access_token) return null;

      const decoded = jwtDecode<BackendJwtPayload>(data.access_token);
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
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  );
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    }),
  );
}

const bridgeOAuthLogin = async (
  provider: OAuthProvider,
  providerAccountId: string,
  user: User,
  profile?: Profile,
) => {
  const bridgeSecret = process.env.OAUTH_BRIDGE_SECRET;
  const payload = getOAuthProfile(user, profile);
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (bridgeSecret) {
    headers["x-oauth-bridge-secret"] = bridgeSecret;
  }

  const res = await fetch(`${getBackendUrl()}/auth/oauth-login`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider,
      providerAccountId,
      email: payload.email,
      fullName: payload.fullName,
      avatarUrl: payload.avatarUrl,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as OAuthBridgeResponse;
  if (!data?.access_token) return null;
  return data;
};

const bridgeOAuthLink = async (
  provider: OAuthProvider,
  providerAccountId: string,
  linkToken: string,
  user: User,
  profile?: Profile,
) => {
  const payload = getOAuthProfile(user, profile);
  const res = await fetch(`${getBackendUrl()}/auth/link/${provider}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${linkToken}`,
    },
    body: JSON.stringify({
      providerAccountId,
      email: payload.email,
      fullName: payload.fullName,
      avatarUrl: payload.avatarUrl,
    }),
  });
  return res.ok;
};

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.type !== "oauth") return true;
      if (!isOAuthProvider(account.provider)) return true;

      const provider = account.provider;
      const providerAccountId = getProviderAccountId(account, profile);
      if (!providerAccountId) {
        return "/login?error=OAuthMissingAccountId";
      }

      const cookieStore = await cookies();
      const linkModeProvider = cookieStore.get("oauth_link_mode")?.value;
      const linkTokenRaw = cookieStore.get("oauth_link_token")?.value;
      const linkToken = linkTokenRaw ? decodeURIComponent(linkTokenRaw) : "";

      const isLinkMode = linkModeProvider === provider && Boolean(linkToken);
      if (isLinkMode) {
        const linked = await bridgeOAuthLink(provider, providerAccountId, linkToken, user, profile);
        return linked
          ? "/settings?tab=login-security&linked=1"
          : "/settings?tab=login-security&linkError=1";
      }

      const oauthLoginData = await bridgeOAuthLogin(provider, providerAccountId, user, profile);
      if (!oauthLoginData?.access_token) {
        return "/login?error=OAuthLoginFailed";
      }

      const customUser = user as User & CustomUserFields;
      customUser.id = String(oauthLoginData.user?.id ?? "");
      customUser.role = oauthLoginData.user?.role ?? "student";
      customUser.accessToken = oauthLoginData.access_token;
      customUser.full_name =
        oauthLoginData.user?.full_name ??
        customUser.full_name ??
        customUser.name ??
        "";
      customUser.email = oauthLoginData.user?.email ?? customUser.email;

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as User & CustomUserFields;
        token.id = (u.id ?? token.id ?? token.sub ?? "").toString();
        token.role = u.role ?? token.role ?? "student";
        token.accessToken = u.accessToken ?? token.accessToken;
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
