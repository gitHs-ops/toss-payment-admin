import Link from "next/link";

export default function PaymentFailPage({ searchParams }: { searchParams: { message?: string; code?: string } }) {
  const message = searchParams.message ?? "결제가 취소되었습니다.";
  const code = searchParams.code;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50">
      <div className="w-full max-w-sm px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/80 p-8 text-center">
          {/* 아이콘 */}
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 ring-4 ring-red-100">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-1">결제 실패</h1>
          <p className="text-sm text-gray-400 mb-1">{decodeURIComponent(message)}</p>
          {code && <p className="text-xs text-gray-300 mb-6">오류 코드: {code}</p>}
          {!code && <div className="mb-6" />}

          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-xl bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              홈으로
            </Link>
            <Link
              href="/payment"
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 transition-all"
            >
              다시 시도
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
