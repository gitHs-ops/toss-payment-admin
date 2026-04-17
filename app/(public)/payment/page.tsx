"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { loadPaymentWidget, ANONYMOUS } from "@tosspayments/payment-widget-sdk";
import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";

const AMOUNT = 10000;
const ORDER_NAME = "테스트 상품";

const BANKS = [
  { code: "신한", label: "신한" },
  { code: "국민", label: "국민" },
  { code: "하나", label: "하나" },
  { code: "우리", label: "우리" },
  { code: "기업", label: "기업" },
  { code: "농협", label: "농협" },
  { code: "카카오뱅크", label: "카카오" },
  { code: "토스뱅크", label: "토스뱅크" },
];

type Tab = "widget" | "virtual";

export default function PaymentPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("widget");

  // ── 위젯 상태 ──────────────────────────────────────────────────
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const initialized = useRef(false);

  // ── 가상계좌 상태 ───────────────────────────────────────────────
  const [selectedBank, setSelectedBank] = useState("신한");
  const [validHours, setValidHours] = useState(24);
  const [vaLoading, setVaLoading] = useState(false);
  const [vaError, setVaError] = useState<string | null>(null);

  // ── 위젯 초기화 ────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) { setWidgetError("클라이언트 키가 설정되지 않았습니다."); return; }
      try {
        const customerKey = session?.user?.id ?? ANONYMOUS;
        const paymentWidget = await loadPaymentWidget(clientKey, customerKey);
        const methodsWidget = paymentWidget.renderPaymentMethods("#payment-widget", { value: AMOUNT });
        paymentWidget.renderAgreement("#agreement");
        paymentWidgetRef.current = paymentWidget;
        await Promise.race([
          new Promise<void>((resolve) => methodsWidget.on("ready", resolve)),
          new Promise<void>((resolve) => setTimeout(resolve, 8000)),
        ]);
        setWidgetReady(true);
      } catch {
        setWidgetError("결제 위젯 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    })();
  }, []);

  // ── 위젯 결제 실행 ─────────────────────────────────────────────
  const handleWidgetPayment = async () => {
    const paymentWidget = paymentWidgetRef.current;
    if (!paymentWidget || !widgetReady) return;
    setWidgetLoading(true);
    setWidgetError(null);
    try {
      const orderId = crypto.randomUUID();
      const res = await fetch("/api/payments/confirm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderName: ORDER_NAME, amount: AMOUNT }),
      });
      if (!res.ok) throw new Error("주문 등록에 실패했습니다.");
      await paymentWidget.requestPayment({
        orderId,
        orderName: ORDER_NAME,
        customerName: session?.user?.name ?? "고객",
        customerEmail: session?.user?.email ?? undefined,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (e: unknown) {
      setWidgetError(e instanceof Error ? e.message : "결제 중 오류가 발생했습니다.");
      setWidgetLoading(false);
    }
  };

  // ── 가상계좌 결제 실행 (TossPayments SDK v2) ──────────────────
  const handleVirtualAccountPayment = async () => {
    setVaLoading(true);
    setVaError(null);
    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) throw new Error("클라이언트 키가 설정되지 않았습니다.");

      const orderId = crypto.randomUUID();

      // 주문 사전 등록
      const res = await fetch("/api/payments/confirm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderName: ORDER_NAME, amount: AMOUNT }),
      });
      if (!res.ok) throw new Error("주문 등록에 실패했습니다.");

      // TossPayments SDK v2로 가상계좌 직접 요청 (동적 import)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { loadTossPayments } = (await import("@tosspayments/tosspayments-sdk")) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tossPayments: any = await loadTossPayments(clientKey);
      const customerKey = session?.user?.id ?? `ANON_${crypto.randomUUID()}`;
      const payment = tossPayments.payment({ customerKey });

      await payment.requestPayment({
        method: "VIRTUAL_ACCOUNT",
        amount: { currency: "KRW", value: AMOUNT },
        orderId,
        orderName: ORDER_NAME,
        customerName: session?.user?.name ?? "고객",
        customerEmail: session?.user?.email ?? "guest@test.com",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        virtualAccount: {
          cashReceipt: { type: "소득공제" },
          useEscrow: false,
          validHours,
          bank: selectedBank as "경남" | "광주" | "국민" | "기업" | "농협" | "대구" | "부산" | "새마을" | "수협" | "신한" | "씨티" | "우리" | "전북" | "제주" | "카카오뱅크" | "토스뱅크" | "하나" | "한국" | "SC제일" | "케이뱅크",
        },
      });
    } catch (e: unknown) {
      setVaError(e instanceof Error ? e.message : "가상계좌 발급 중 오류가 발생했습니다.");
      setVaLoading(false);
    }
  };

  return (
    <>
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

            {/* 결제수단 탭 */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
              <button
                onClick={() => setActiveTab("widget")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === "widget"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                카드 · 계좌이체
              </button>
              <button
                onClick={() => setActiveTab("virtual")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === "virtual"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                가상계좌 (무통장)
              </button>
            </div>

            {/* ── 카드/계좌이체 탭 ── */}
            <div className={activeTab === "widget" ? "block" : "hidden"}>
              {widgetError && (
                <div className="mb-4 px-3.5 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {widgetError}
                </div>
              )}
              <div id="payment-widget" className="mb-1" />
              <div id="agreement" className="mb-4" />
              <button
                onClick={handleWidgetPayment}
                disabled={widgetLoading || !widgetReady}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-100 transition-all"
              >
                {!widgetReady ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    결제 UI 불러오는 중...
                  </span>
                ) : widgetLoading ? (
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

            {/* ── 가상계좌 탭 ── */}
            <div className={activeTab === "virtual" ? "block" : "hidden"}>
              {vaError && (
                <div className="mb-4 px-3.5 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {vaError}
                </div>
              )}

              {/* 안내 배너 */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4 flex gap-3">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-700 leading-relaxed">
                  선택한 은행의 가상계좌 번호를 발급해드립니다.
                  발급된 계좌로 입금하면 결제가 완료됩니다.
                </p>
              </div>

              {/* 은행 선택 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">입금 은행 선택</label>
                <div className="grid grid-cols-4 gap-2">
                  {BANKS.map((bank) => (
                    <button
                      key={bank.code}
                      onClick={() => setSelectedBank(bank.code)}
                      className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                        selectedBank === bank.code
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {bank.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 입금 기한 */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-2">입금 기한</label>
                <div className="flex gap-2">
                  {[{ hours: 24, label: "24시간" }, { hours: 48, label: "48시간" }, { hours: 72, label: "72시간" }].map((opt) => (
                    <button
                      key={opt.hours}
                      onClick={() => setValidHours(opt.hours)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                        validHours === opt.hours
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 선택 요약 */}
              <div className="bg-gray-50 rounded-xl p-3.5 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">입금 은행</span>
                  <span className="font-medium text-gray-700">
                    {BANKS.find(b => b.code === selectedBank)?.label}은행
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">입금 금액</span>
                  <span className="font-semibold text-gray-900">{AMOUNT.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">입금 기한</span>
                  <span className="font-medium text-orange-600">발급 후 {validHours}시간 이내</span>
                </div>
              </div>

              <button
                onClick={handleVirtualAccountPayment}
                disabled={vaLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-100 transition-all"
              >
                {vaLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    가상계좌 발급 중...
                  </span>
                ) : false ? (
                  <span className="flex items-center gap-2">
                    로딩 중...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    가상계좌 발급받기
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-5">
            안전한 결제는 토스페이먼츠가 보호합니다
          </p>
        </div>
      </main>
    </>
  );
}
