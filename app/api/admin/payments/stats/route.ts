export const dynamic = "force-dynamic";

// app/api/admin/payments/stats/route.ts
// 대시보드 KPI 통계 — Admin 전용

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── 집계 쿼리 병렬 실행 ───────────────────────────────────────────────────
    const [
      totalDone,
      totalCancelled,
      todayDone,
      monthDone,
      recentPayments,
    ] = await Promise.all([
      // 전체 완료 결제
      prisma.payment.aggregate({
        where: { status: "DONE" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 전체 취소 결제
      prisma.payment.aggregate({
        where: { status: { in: ["CANCELLED", "PARTIAL_CANCELLED"] } },
        _sum: { cancelAmount: true },
        _count: { id: true },
      }),
      // 오늘 완료 결제
      prisma.payment.aggregate({
        where: { status: "DONE", approvedAt: { gte: todayStart } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 이번 달 완료 결제
      prisma.payment.aggregate({
        where: { status: "DONE", approvedAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 최근 10건
      prisma.payment.findMany({
        where: { status: { in: ["DONE", "CANCELLED", "PARTIAL_CANCELLED"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { email: true, name: true } } },
      }),
    ]);

    // ── 최근 7일 일별 결제 데이터 (차트용) ────────────────────────────────────
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRaw = await prisma.payment.findMany({
      where: {
        status: "DONE",
        approvedAt: { gte: sevenDaysAgo },
      },
      select: { approvedAt: true, amount: true },
    });

    // 날짜별 그룹핑
    const dailyMap = new Map<string, { count: number; amount: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { count: 0, amount: 0 });
    }
    for (const p of dailyRaw) {
      if (!p.approvedAt) continue;
      const key = p.approvedAt.toISOString().slice(0, 10);
      const existing = dailyMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.amount += p.amount;
      }
    }

    const dailyChart = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      count: v.count,
      amount: v.amount,
    }));

    return NextResponse.json({
      kpi: {
        totalAmount: totalDone._sum.amount ?? 0,
        totalCount: totalDone._count.id,
        cancelAmount: totalCancelled._sum.cancelAmount ?? 0,
        cancelCount: totalCancelled._count.id,
        todayAmount: todayDone._sum.amount ?? 0,
        todayCount: todayDone._count.id,
        monthAmount: monthDone._sum.amount ?? 0,
        monthCount: monthDone._count.id,
      },
      dailyChart,
      recentPayments,
    });
  } catch (error) {
    console.error("[/api/admin/payments/stats] Error:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
