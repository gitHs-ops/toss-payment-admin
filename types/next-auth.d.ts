// types/next-auth.d.ts
// NextAuth 기본 타입에 role 필드 추가

import "next-auth";
import "next-auth/jwt";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
