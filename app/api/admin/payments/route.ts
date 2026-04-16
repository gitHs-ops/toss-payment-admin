// app/api/admin/payments/route.ts
// 어드민 결제 목록 조회 — Admin 전용

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PaymentStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const status = searchParams.get("status") as PaymentStatus | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // ── 필터 조건 구성 ────────────────────────────────────────────────────────
    const where = {
      ...(status && { status }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate + "T23:59:59.999Z") }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { orderId: { contains: search, mode: "insensitive" as const } },
          { orderName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // ── 총 건수 + 목록 병렬 조회 ──────────────────────────────────────────────
    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("[/api/admin/payments] Error:", error);
    return NextResponse.json(
      { error: "결제 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
