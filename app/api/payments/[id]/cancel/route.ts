export const dynamic = "force-dynamic";

// app/api/payments/[id]/cancel/route.ts
// 결제 취소(환불) — Admin 전용

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelPayment } from "@/lib/toss";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ── Admin 권한 검증 ──────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { cancelReason, cancelAmount, taxFreeAmount } = await req.json();

    if (!cancelReason || cancelReason.trim().length === 0) {
      return NextResponse.json(
        { error: "취소 사유는 필수입니다." },
        { status: 400 }
      );
    }

    // ── 결제 정보 조회 ───────────────────────────────────────────────────────
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "결제 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!payment.paymentKey) {
      return NextResponse.json(
        { error: "유효하지 않은 결제입니다. (paymentKey 없음)" },
        { status: 400 }
      );
    }

    if (payment.status !== "DONE") {
      return NextResponse.json(
        { error: "취소 가능한 상태가 아닙니다. (현재 상태: " + payment.status + ")" },
        { status: 400 }
      );
    }

    // 부분 취소 시 금액 검증
    if (cancelAmount !== undefined && cancelAmount > payment.amount) {
      return NextResponse.json(
        { error: "취소 금액이 결제 금액을 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // ── 토스페이먼츠 취소 API 호출 ───────────────────────────────────────────
    const tossResult = await cancelPayment(payment.paymentKey, {
      cancelReason,
      ...(cancelAmount !== undefined && { cancelAmount }),
      ...(taxFreeAmount !== undefined && { taxFreeAmount }),
    });

    // ── DB 업데이트 ──────────────────────────────────────────────────────────
    const isPartial =
      cancelAmount !== undefined && cancelAmount < payment.amount;

    await prisma.payment.update({
      where: { id: params.id },
      data: {
        status: isPartial ? "PARTIAL_CANCELLED" : "CANCELLED",
        cancelledAt: new Date(),
        cancelReason,
        cancelAmount: cancelAmount ?? payment.amount,
        rawResponse: tossResult as object,
      },
    });

    return NextResponse.json({ success: true, payment: tossResult });
  } catch (error: unknown) {
    console.error("[/api/payments/[id]/cancel] Error:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error
    ) {
      return NextResponse.json(
        { error: (error as { message: string }).message, code: (error as { code: string }).code },
        { status: (error as { status?: number }).status ?? 400 }
      );
    }

    return NextResponse.json(
      { error: "결제 취소 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
