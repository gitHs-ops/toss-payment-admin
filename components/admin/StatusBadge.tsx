const BADGE_STYLES: Record<string, string> = {
  DONE:                "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  WAITING_FOR_DEPOSIT: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
  CANCELLED:           "bg-red-50 text-red-600 ring-1 ring-red-200",
  PARTIAL_CANCELLED:   "bg-orange-50 text-orange-600 ring-1 ring-orange-200",
  PENDING:             "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  FAILED:              "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  ABORTED:             "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  EXPIRED:             "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
};

const BADGE_LABELS: Record<string, string> = {
  DONE: "완료", WAITING_FOR_DEPOSIT: "입금대기", CANCELLED: "취소",
  PARTIAL_CANCELLED: "부분취소", PENDING: "대기", FAILED: "실패",
  ABORTED: "중단", EXPIRED: "만료",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = BADGE_STYLES[status] ?? "bg-gray-100 text-gray-500 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {BADGE_LABELS[status] ?? status}
    </span>
  );
}
