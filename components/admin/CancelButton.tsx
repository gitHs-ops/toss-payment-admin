"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props { paymentId: string; maxAmount: number; }

export default function CancelButton({ paymentId, maxAmount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = amount.trim() ? Number(amount) : undefined;
  const isPartial = parsed !== undefined && parsed < maxAmount;

  const close = () => { setOpen(false); setStep("form"); setError(null); };

  async function confirm() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/payments/${paymentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: reason, ...(parsed !== undefined ? { cancelAmount: parsed } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); setStep("form"); return; }
      close();
      router.refresh();
    } catch { setError("네트워크 오류가 발생했습니다."); setStep("form"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setStep("form"); }}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 shadow-sm transition-all disabled:opacity-50"
      >
        결제 취소 (환불)
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !loading && close()} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {step === "form" ? (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">결제 취소</h3>
                <p className="text-xs text-gray-400 mb-5">
                  최대 <span className="font-medium text-gray-600">{maxAmount.toLocaleString()}원</span> 취소 가능
                </p>

                {error && (
                  <div className="mb-4 px-3.5 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      취소 사유 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="취소 사유를 입력해주세요."
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      취소 금액
                      <span className="text-gray-300 font-normal ml-1">(미입력 시 전액)</span>
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`최대 ${maxAmount.toLocaleString()}원`}
                      min={1}
                      max={maxAmount}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                    {isPartial && (
                      <p className="text-xs text-orange-500 mt-1.5">
                        부분 취소: {parsed!.toLocaleString()}원만 환불됩니다.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 mt-6">
                  <button
                    onClick={close}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    disabled={!reason.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-50 ring-4 ring-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">정말 취소하시겠습니까?</h3>
                  <p className="text-xs text-gray-400 mt-1">이 작업은 되돌릴 수 없습니다.</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-sm mb-6 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">취소 유형</span>
                    <span className="font-medium text-xs">{isPartial ? "부분 취소" : "전액 취소"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">취소 금액</span>
                    <span className="font-semibold text-red-500 text-sm">
                      {(parsed ?? maxAmount).toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400 text-xs shrink-0">취소 사유</span>
                    <span className="font-medium text-xs text-right ml-4 text-gray-700">{reason}</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setStep("form")}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    돌아가기
                  </button>
                  <button
                    onClick={confirm}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        처리 중...
                      </span>
                    ) : "취소 확정"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
