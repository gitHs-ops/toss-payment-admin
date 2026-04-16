import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  accent: string;
}

function KpiCard({ label, value, sub, icon, iconBg, accent }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </span>
      </div>
      <p className={`text-2xl font-semibold mb-1 ${accent}`}>{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalDone, totalCancelled, todayDone, monthDone, recent] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "DONE" }, _sum: { amount: true }, _count: { id: true } }),
    prisma.payment.aggregate({ where: { status: { in: ["CANCELLED", "PARTIAL_CANCELLED"] } }, _sum: { cancelAmount: true }, _count: { id: true } }),
    prisma.payment.aggregate({ where: { status: "DONE", approvedAt: { gte: todayStart } }, _sum: { amount: true }, _count: { id: true } }),
    prisma.payment.aggregate({ where: { status: "DONE", approvedAt: { gte: monthStart } }, _sum: { amount: true }, _count: { id: true } }),
    prisma.payment.findMany({
      where: { status: { in: ["DONE", "CANCELLED", "PARTIAL_CANCELLED", "FAILED"] } },
      orderBy: { createdAt: "desc" }, take: 8,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  const fmt = (n: number) => n.toLocaleString("ko-KR") + "원";

  const kpis: KpiCardProps[] = [
    {
      label: "전체 결제",
      value: fmt(totalDone._sum.amount ?? 0),
      sub: `총 ${totalDone._count.id.toLocaleString()}건`,
      iconBg: "bg-blue-50",
      accent: "text-blue-700",
      icon: (
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
    {
      label: "오늘 결제",
      value: fmt(todayDone._sum.amount ?? 0),
      sub: `오늘 ${todayDone._count.id}건`,
      iconBg: "bg-emerald-50",
      accent: "text-emerald-700",
      icon: (
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      ),
    },
    {
      label: "이번 달 결제",
      value: fmt(monthDone._sum.amount ?? 0),
      sub: `이번 달 ${monthDone._count.id.toLocaleString()}건`,
      iconBg: "bg-violet-50",
      accent: "text-violet-700",
      icon: (
        <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ),
    },
    {
      label: "전체 취소",
      value: fmt(totalCancelled._sum.cancelAmount ?? 0),
      sub: `총 ${totalCancelled._count.id}건`,
      iconBg: "bg-rose-50",
      accent: "text-rose-600",
      icon: (
        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-400 mt-0.5">결제 현황을 한눈에 확인하세요.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* 최근 결제 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">최근 결제</h2>
          <Link href="/admin/payments"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
            전체 보기 →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["결제일시", "주문명", "결제자", "금액", "상태"].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {p.approvedAt
                      ? new Date(p.approvedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-800 whitespace-nowrap">{p.orderName}</td>
                  <td className="py-3.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                    {p.user?.name ?? p.user?.email ?? "비회원"}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 text-right whitespace-nowrap">
                    {p.amount.toLocaleString()}원
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-300 text-sm">
                    결제 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
