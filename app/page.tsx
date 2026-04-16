import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="w-full max-w-sm px-6 text-center">
        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">TossPayments</h1>
        <p className="text-sm text-gray-400 mb-10">결제 관리 시스템</p>

        <div className="space-y-3">
          <Link
            href="/payment"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-100 transition-all"
          >
            결제 테스트
          </Link>
          <Link
            href="/admin/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          >
            어드민 대시보드
          </Link>
        </div>

        <p className="text-xs text-gray-300 mt-10">
          Powered by TossPayments · Next.js
        </p>
      </div>
    </main>
  );
}
