import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { PaymentStatus } from "@prisma/client";
import StatusBadge from "@/components/admin/StatusBadge";

const STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "DONE", label: "완료" },
  { value: "WAITING_FOR_DEPOSIT", label: "입금대기" },
  { value: "CANCELLED", label: "취소" },
  { value: "PARTIAL_CANCELLED", label: "부분취소" },
  { value: "PENDING", label: "대기" },
  { value: "FAILED", label: "실패" },
];

interface PageProps {
  searchParams: { page?: string; status?: string; search?: string; startDate?: string; endDate?: string };
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const status = searchParams.status as PaymentStatus | undefined;
  const { search, startDate, endDate } = searchParams;

  const where = {
    ...(status ? { status } : {}),
    ...(startDate || endDate ? { createdAt: {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate + "T23:59:59.999Z") } : {}),
    }} : {}),
    ...(search ? { OR: [
      { orderId: { contains: search, mode: "insensitive" as const } },
      { orderName: { contains: search, mode: "insensitive" as const } },
    ]} : {}),
  };

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  function buildUrl(params: Record<string, string | undefined>) {
    const merged = { page: "1", status, search, startDate, endDate, ...params };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
    return `/admin/payments?${qs.toString()}`;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">결제 내역</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          총 <strong className="text-gray-700">{total.toLocaleString()}</strong>건
        </p>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 mb-5">
        <form method="GET" action="/admin/payments" className="flex flex-wrap gap-2.5 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">검색</label>
            <input
              name="search"
              defaultValue={search}
              placeholder="주문 ID, 주문명 검색"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">상태</label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="w-32 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">시작일</label>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate}
              className="w-36 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">종료일</label>
            <input
              type="date"
              name="endDate"
              defaultValue={endDate}
              className="w-36 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all disabled:opacity-50"
          >
            검색
          </button>
          <a
            href="/admin/payments"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          >
            초기화
          </a>
        </form>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["결제일시", "주문 ID", "주문명", "결제자", "수단", "금액", "상태", ""].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="relative border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  {/* 행 전체를 클릭할 수 있는 오버레이 링크 */}
                  <td className="absolute inset-0 p-0">
                    <Link href={`/admin/payments/${p.id}`} className="absolute inset-0" aria-label={`${p.orderName} 상세 보기`} />
                  </td>

                  <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {p.approvedAt ? new Date(p.approvedAt).toLocaleString("ko-KR") : "—"}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs text-gray-400">{p.orderId.slice(0, 10)}…</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-800 max-w-[160px] truncate whitespace-nowrap">
                    {p.orderName}
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {p.user?.name ?? p.user?.email ?? "비회원"}
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {p.method ?? "—"}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 text-right whitespace-nowrap">
                    {p.amount.toLocaleString()}원
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-xs text-gray-300 group-hover:text-blue-500 transition-colors">→</span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-gray-300 text-sm">
                    결제 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          {page > 1 && (
            <Link
              href={buildUrl({ page: String(page - 1) })}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              ← 이전
            </Link>
          )}
          <span className="text-sm text-gray-400 px-2">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={buildUrl({ page: String(page + 1) })}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              다음 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
