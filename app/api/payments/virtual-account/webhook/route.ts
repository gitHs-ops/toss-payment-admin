export const dynamic = "force-dynamic";

// app/api/payments/virtual-account/webhook/route.ts
// 토스페이먼츠 가상계좌 입금 완료 웹훅 수신

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 토스페이먼츠 가상계좌 웹훅 payload 예시:
 * {
 *   createdAt:  "2024-01-01T00:00:00+09:00",
 *   secret:     "YOUR_WEBHOOK_SECRET",
 *   status:     "DONE",          // "DONE" | "CANCELED" | "PARTIAL_CANCELED"
 *   orderId:    "order-uuid",
 *   paymentKey: "toss_payment_key"
 * }
 */
interface TossWebhookPayload {
  createdAt:  string;
  secret:     string;
  status:     string;
  orderId:    string;
  paymentKey: string;
}

export async function POST(req: Request) {
  try {
    const body: TossWebhookPayload = await req.json();
    const { secret, status, orderId, paymentKey } = body;

    // ── 시크릿 검증 ────────────────────────────────────────────────────────
    const webhookSecret = process.env.TOSS_VIRTUAL_ACCOUNT_SECRET;
    if (webhookSecret && secret !== webhookSecret) {
      console.warn("[VA Webhook] Invalid secret — 요청 거부");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 주문 조회 ──────────────────────────────────────────────────────────
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) {
      console.error("[VA Webhook] 주문을 찾을 수 없음:", orderId);
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    // ── 상태 매핑 및 DB 업데이트 ────────────────────────────────────────────
    if (status === "DONE") {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status:     "DONE",
          paymentKey: paymentKey ?? payment.paymentKey,
          approvedAt: new Date(),
        },
      });
      console.log("[VA Webhook] 입금 확인 완료 — orderId:", orderId);
    } else if (status === "CANCELED") {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status:      "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: "가상계좌 입금 취소",
          cancelAmount: payment.amount,
        },
      });
      console.log("[VA Webhook] 가상계좌 취소 — orderId:", orderId);
    } else {
      console.log("[VA Webhook] 처리하지 않는 상태:", status, orderId);
    }

    // 토스페이먼츠는 200 응답을 기대함
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VA Webhook] Error:", error);
    return NextResponse.json(
      { error: "웹훅 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
