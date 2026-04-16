// lib/toss.ts
// 토스페이먼츠 서버사이드 API 클라이언트
// TOSS_SECRET_KEY 는 절대 클라이언트에 노출되면 안 됩니다.

const TOSS_BASE_URL = "https://api.tosspayments.com";

function getAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  // 토스페이먼츠는 Basic 인증: base64("secretKey:")
  return "Basic " + Buffer.from(secretKey + ":").toString("base64");
}

// ── 타입 ──────────────────────────────────────────────────────────────────────
export interface TossPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossCancelRequest {
  cancelReason: string;
  cancelAmount?: number;   // 미입력 시 전액 취소
  taxFreeAmount?: number;
}

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  approvedAt: string;
  method: string;
  totalAmount: number;
  balanceAmount: number;
  // 필요에 따라 확장 (카드, 가상계좌 등)
  [key: string]: unknown;
}

// ── 결제 승인 ─────────────────────────────────────────────────────────────────
export async function confirmPayment(
  body: TossPaymentConfirmRequest
): Promise<TossPaymentResponse> {
  const res = await fetch(`${TOSS_BASE_URL}/v1/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw { code: data.code, message: data.message, status: res.status };
  }
  return data as TossPaymentResponse;
}

// ── 결제 단건 조회 ─────────────────────────────────────────────────────────────
export async function getPayment(paymentKey: string): Promise<TossPaymentResponse> {
  const res = await fetch(`${TOSS_BASE_URL}/v1/payments/${paymentKey}`, {
    headers: { Authorization: getAuthHeader() },
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw { code: data.code, message: data.message, status: res.status };
  }
  return data as TossPaymentResponse;
}

// ── orderId로 결제 조회 ────────────────────────────────────────────────────────
export async function getPaymentByOrderId(
  orderId: string
): Promise<TossPaymentResponse> {
  const res = await fetch(
    `${TOSS_BASE_URL}/v1/payments/orders/${orderId}`,
    {
      headers: { Authorization: getAuthHeader() },
      cache: "no-store",
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw { code: data.code, message: data.message, status: res.status };
  }
  return data as TossPaymentResponse;
}

// ── 결제 취소(환불) ────────────────────────────────────────────────────────────
export async function cancelPayment(
  paymentKey: string,
  body: TossCancelRequest
): Promise<TossPaymentResponse> {
  const res = await fetch(`${TOSS_BASE_URL}/v1/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw { code: data.code, message: data.message, status: res.status };
  }
  return data as TossPaymentResponse;
}
