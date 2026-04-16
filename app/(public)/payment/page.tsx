"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { loadPaymentWidget, ANONYMOUS } from "@tosspayments/payment-widget-sdk";
import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";

const AMOUNT = 10000;
const ORDER_NAME = "테스트 상품";

export default function PaymentPage() {
  const { data: session } = useSession();
  const [widgetReady, setWidgetReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        setError("클라이언트 키가 설정되지 않았습니다.");
        return;
      }
      try {
        const customerKey = session?.user?.id ?? ANONYMOUS;
        const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

        const methodsWidget = paymentWidget.renderPaymentMethods(
          "#payment-widget",
          { value: AMOUNT }
        );

        paymentWidget.renderAgreement("#agreement");

        paymentWidgetRef.current = paymentWidget;

        // SDK ready 이벤트 대기 (최대 8초 fallback)
        await Promise.race([
          new Promise<void>((resolve) => methodsWidget.on("ready", resolve)),
          new Promise<void>((resolve) => setTimeout(resolve, 8000)),
        ]);

        setWidgetReady(true);
      } catch {
        setError("결제 위젯 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    })();
  }, []);

  const handlePayment = async () => {
    const paymentWidget = paymentWidgetRef.current;
    if (!paymentWidget || !widgetReady) return;

    setLoading(true);
    setError(null);

    try {
      const orderId = crypto.randomUUID();

      const registerRes = await fetch("/api/payments/confirm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderName: ORDER_NAME, amount: AMOUNT }),
      });
      if (!registerRes.ok) throw new Error("주문 등록에 실패했습니다.");

      await paymentWidget.requestPayment({
        orderId,
        orderName: ORDER_NAME,
        customerName: session?.user?.name ?? "고객",
        customerEmail: session?.user?.email ?? undefined,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "결제 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4">
      <div className="w-full max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">결제하기</h1>
          <p className="text-sm text-gray-400 mt-0.5">토스페이먼츠 간편결제</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/80 p-6">
          {/* 주문 요약 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="flex justify-between items-center text-sm mb-2.5">
              <span className="text-gray-400">상품명</span>
              <span className="font-medium text-gray-700">{ORDER_NAME}</span>
            </div>
            <div className="border-t border-gray-100 my-2.5" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">결제 금액</span>
              <span className="text-lg font-semibold text-gray-900">
                {AMOUNT.toLocaleString()}
                <span className="text-sm font-normal text-gray-400 ml-0.5">원</span>
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 px-3.5 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* 토스페이먼츠 결제 위젯 */}
          <div id="payment-widget" className="mb-1" />
          <div id="agreement" className="mb-4" />

          {/* 결제 버튼 */}
          <button
            onClick={handlePayment}
            disabled={loading || !widgetReady}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!widgetReady ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                결제 UI 불러오는 중...
              </span>
            ) : loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                결제 처리 중...
              </span>
            ) : (
              `${AMOUNT.toLocaleString()}원 결제하기`
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-5">
          안전한 결제는 토스페이먼츠가 보호합니다
        </p>
      </div>
    </main>
  );
}
