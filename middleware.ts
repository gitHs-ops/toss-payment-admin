// middleware.ts
// /admin/** 및 /api/admin/** 경로를 ADMIN 롤 사용자만 접근 가능하도록 보호

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminPath =
      req.nextUrl.pathname.startsWith("/admin") ||
      req.nextUrl.pathname.startsWith("/api/admin");

    if (isAdminPath && token?.role !== "ADMIN") {
      // API 요청이면 403, 페이지 요청이면 로그인 페이지로
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login?error=access_denied", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // 로그인 여부 확인 (미로그인 시 /login 리디렉션)
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
