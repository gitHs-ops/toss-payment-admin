export const dynamic = "force-dynamic";

// app/api/payments/confirm/route.ts
// 토스페이먼츠 결제 최종 승인 처리

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmPayment } from "@/lib/toss";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { paymentKey, orderId, amount } = await req.json();

    // ── 입력값 검증 ──────────────────────────────────────────────────────────
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "paymentKey, orderId, amount 는 필수입니다." },
        { status: 400 }
      );
    }

    // ── 금액 변조 방지: DB에 사전 저장된 금액과 비교 ─────────────────────────
    const pendingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!pendingPayment) {
      return NextResponse.json(
        { error: "주문 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (pendingPayment.amount !== amount) {
      return NextResponse.json(
        { error: "결제 금액이 주문 금액과 일치하지 않습니다." },
        { status: 400 }
      );
    }

    if (pendingPayment.status !== "PENDING" && pendingPayment.status !== "WAITING_FOR_DEPOSIT") {
      return NextResponse.json(
        { error: "이미 처리된 주문입니다." },
        { status: 409 }
      );
    }

    // ── 토스페이먼츠 승인 요청 ───────────────────────────────────────────────
    const tossResult = await confirmPayment({ paymentKey, orderId, amount });

    // ── 가상계좌 여부 판단 ────────────────────────────────────────────────────
    console.log("[confirm] method:", tossResult.method, "| status:", tossResult.status);
    console.log("[confirm] virtualAccount:", JSON.stringify((tossResult as any).virtualAccount));
    const isVirtualAccount = tossResult.method === "가상계좌";
    const va = (tossResult as { virtualAccount?: {
      accountNumber?: string;
      bank?: string;
      customerName?: string;
      dueDate?: string;
    } }).virtualAccount;

    // ── DB 업데이트 ──────────────────────────────────────────────────────────
    await prisma.payment.update({
      where: { orderId },
      data: {
        paymentKey,
        status: isVirtualAccount ? "WAITING_FOR_DEPOSIT" : "DONE",
        method: tossResult.method,
        approvedAt: isVirtualAccount ? null : (tossResult.approvedAt ? new Date(tossResult.approvedAt) : new Date()),
        rawResponse: tossResult as object,
        // 가상계좌 정보 저장
        ...(isVirtualAccount && va ? {
          virtualAccountNumber: va.accountNumber ?? null,
          virtualAccountBank:   va.bank ?? null,
          virtualAccountHolder: va.customerName ?? null,
          virtualAccountDueDate: va.dueDate ? new Date(va.dueDate) : null,
        } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      payment: tossResult,
      isVirtualAccount,
      virtualAccount: isVirtualAccount ? va : undefined,
    });
  } catch (error: unknown) {
    console.error("[/api/payments/confirm] Error:", error);

    // 토스페이먼츠 에러 응답 처리
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
      { error: "결제 승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 결제 전 주문 사전 등록 (금액 변조 방지용)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { orderId, orderName, amount } = await req.json();

    if (!orderId || !orderName || !amount) {
      return NextResponse.json(
        { error: "orderId, orderName, amount 는 필수입니다." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        orderName,
        amount,
        status: "PENDING",
        requestedAt: new Date(),
        userId: session?.user?.id ?? null,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("[/api/payments/confirm PUT] Error:", error);
    return NextResponse.json(
      { error: "주문 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
