import "next-auth";
import "next-auth/jwt";

type Role = "STUDENT" | "LANDLORD" | "ADMIN";

declare module "next-auth" {
  interface Session {
    backendToken?: string;
    username?: string;
    role?: Role;
  }

  interface User {
    backendToken?: string;
    username?: string;
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    username?: string;
    role?: Role;
  }
}
