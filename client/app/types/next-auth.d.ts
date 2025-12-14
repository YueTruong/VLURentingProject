import NextAuth, { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    provider?: string;
    user: {
      id?: string;
      role?: "STUDENT" | "LANDLORD" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    role?: "STUDENT" | "LANDLORD" | "ADMIN";
  }
}