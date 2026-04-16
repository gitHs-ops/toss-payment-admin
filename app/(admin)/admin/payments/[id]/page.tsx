import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CancelButton from "@/components/admin/CancelButton";
import StatusBadge from "@/components/admin/StatusBadge";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex py-3 border-b border-gray-50 last:border-0">
      <dt className="w-32 shrink-0 text-xs text-gray-400 pt-0.5">{label}</dt>
      <dd className="flex-1 text-sm font-medium text-gray-800">{value ?? "—"}</dd>
    </div>
  );
}

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!payment) notFound();

  const canCancel = payment.status === "DONE";

  return (
    <div className="max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-7">
        <Link
          href="/admin/payments"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-gray-900">{payment.orderName}</h1>
          <p className="text-xs text-gray-300 font-mono mt-0.5">{payment.orderId}</p>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      {/* 결제 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">결제 정보</h2>
        <dl>
          <Row label="결제 금액" value={
            <span className="text-blue-600 font-semibold">{payment.amount.toLocaleString()}원</span>
          } />
          <Row label="결제 수단" value={payment.method} />
          <Row label="결제 키" value={
            <span className="font-mono text-xs text-gray-500">{payment.paymentKey}</span>
          } />
          <Row label="결제 요청" value={payment.requestedAt?.toLocaleString("ko-KR")} />
          <Row label="결제 승인" value={payment.approvedAt?.toLocaleString("ko-KR")} />
        </dl>
      </div>

      {/* 가상계좌 정보 */}
      {payment.status === "WAITING_FOR_DEPOSIT" && payment.virtualAccountNumber && (
        <div className="bg-blue-50/40 rounded-xl border border-blue-200 shadow-md p-6 mb-4">
          <h2 className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-3">가상계좌 입금 정보</h2>
          <dl>
            <Row label="은행" value={payment.virtualAccountBank} />
            <Row label="계좌번호" value={
              <span className="font-mono text-sm tracking-wider">{payment.virtualAccountNumber}</span>
            } />
            <Row label="예금주" value={payment.virtualAccountHolder} />
            <Row label="입금 금액" value={
              <span className="text-blue-600 font-semibold">{payment.amount.toLocaleString()}원</span>
            } />
            <Row label="입금 기한" value={
              payment.virtualAccountDueDate
                ? <span className="text-orange-600 font-medium">
                    {payment.virtualAccountDueDate.toLocaleString("ko-KR")}까지
                  </span>
                : null
            } />
          </dl>
        </div>
      )}

      {/* 취소 정보 */}
      {(payment.status === "CANCELLED" || payment.status === "PARTIAL_CANCELLED") && (
        <div className="bg-red-50/30 rounded-xl border border-red-200 shadow-md p-6 mb-4">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">취소 정보</h2>
          <dl>
            <Row label="취소일시" value={payment.cancelledAt?.toLocaleString("ko-KR")} />
            <Row label="취소 금액" value={payment.cancelAmount ? `${payment.cancelAmount.toLocaleString()}원` : null} />
            <Row label="취소 사유" value={payment.cancelReason} />
          </dl>
        </div>
      )}

      {/* 결제자 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">결제자</h2>
        <dl>
          <Row label="이름" value={payment.user?.name} />
          <Row label="이메일" value={payment.user?.email} />
          <Row label="사용자 ID" value={
            payment.user?.id
              ? <span className="font-mono text-xs text-gray-400">{payment.user.id}</span>
              : "비회원"
          } />
        </dl>
      </div>

      {/* 환불 */}
      {canCancel && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-md p-6">
          <h2 className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">결제 취소</h2>
          <p className="text-xs text-gray-400 mb-4">취소 처리 후에는 되돌릴 수 없습니다.</p>
          <CancelButton paymentId={payment.id} maxAmount={payment.amount} />
        </div>
      )}
    </div>
  );
}
