import { redirect } from "next/navigation";
import Link from "next/link";

interface SearchParams { paymentKey: string; orderId: string; amount: string; }

interface VirtualAccountInfo {
  accountNumber?: string;
  bank?: string;
  customerName?: string;
  dueDate?: string;
}

export default async function PaymentSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { paymentKey, orderId, amount } = searchParams;
  if (!paymentKey || !orderId || !amount) redirect("/payment/fail?message=잘못된_접근");

  let success = false;
  let errorMessage = "";
  let isVirtualAccount = false;
  let virtualAccount: VirtualAccountInfo | undefined;

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/payments/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });

    if (res.ok) {
      const data = await res.json();
      success = true;
      isVirtualAccount = !!data.isVirtualAccount;
      virtualAccount = data.virtualAccount;
    } else {
      const d = await res.json();
      errorMessage = d.error ?? "알 수 없는 오류";
    }
  } catch { errorMessage = "서버 오류가 발생했습니다."; }

  if (!success) redirect(`/payment/fail?message=${encodeURIComponent(errorMessage)}`);

  // ── 가상계좌 입금 대기 화면 ────────────────────────────────────────────────
  if (isVirtualAccount && virtualAccount) {
    const dueDate = virtualAccount.dueDate
      ? new Date(virtualAccount.dueDate).toLocaleString("ko-KR", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        })
      : null;

    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="w-full max-w-sm px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/80 p-8 text-center">
            {/* 아이콘 */}
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5 ring-4 ring-blue-100">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-1">가상계좌 발급 완료</h1>
            <p className="text-sm text-gray-400 mb-6">아래 계좌로 입금하시면 결제가 완료됩니다.</p>

            {/* 가상계좌 정보 */}
            <div className="bg-blue-50 rounded-xl p-4 text-left mb-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">은행</span>
                <span className="font-semibold text-gray-900">{virtualAccount.bank ?? "—"}</span>
              </div>
              <div className="border-t border-blue-100" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">계좌번호</span>
                <span className="font-mono font-semibold text-gray-900 tracking-wider">
                  {virtualAccount.accountNumber ?? "—"}
                </span>
              </div>
              <div className="border-t border-blue-100" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">예금주</span>
                <span className="font-semibold text-gray-900">{virtualAccount.customerName ?? "—"}</span>
              </div>
              <div className="border-t border-blue-100" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">입금 금액</span>
                <span className="font-semibold text-blue-700 text-base">{Number(amount).toLocaleString()}원</span>
              </div>
              {dueDate && (
                <>
                  <div className="border-t border-blue-100" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">입금 기한</span>
                    <span className="font-medium text-orange-600">{dueDate}까지</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-6">
              입금 기한 내 미입금 시 자동으로 취소됩니다.
            </p>

            <div className="flex gap-2">
              <Link
                href="/payment"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-xl bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                다시 결제
              </Link>
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 transition-all"
              >
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── 일반 결제 완료 화면 ────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-gray-50">
      <div className="w-full max-w-sm px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/80 p-8 text-center">
          {/* 아이콘 */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5 ring-4 ring-emerald-100">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-1">결제 완료</h1>
          <p className="text-sm text-gray-400 mb-6">결제가 성공적으로 처리되었습니다.</p>

          {/* 요약 */}
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">주문 ID</span>
              <span className="font-mono text-xs text-gray-600">{orderId.slice(0, 16)}…</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">결제 금액</span>
              <span className="font-semibold text-gray-900">{Number(amount).toLocaleString()}원</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/payment"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-xl bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              다시 결제
            </Link>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 transition-all"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
