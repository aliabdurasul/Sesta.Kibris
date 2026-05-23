"use client";
/**
 * SuggestionQueue — interactive admin review UI for product suggestions.
 * Tasks 0.0.16 (approve modal) and 0.0.17 (reject modal).
 */
import { useState } from "react";
import { adminApproveSuggestion, adminRejectSuggestion } from "@/lib/catalog/suggestion-admin-actions";
import type { ProductSuggestion, ProductCategory } from "@/types/catalog";

type SuggestionWithMerchant = ProductSuggestion & { merchant_name?: string };

const STATUS_COLORS: Record<string, string> = {
  PENDING:      "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED:     "bg-green-100 text-green-700",
  REJECTED:     "bg-red-100 text-red-700",
  DUPLICATE:    "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekleyen", UNDER_REVIEW: "İnceleniyor",
  APPROVED: "Onaylandı", REJECTED: "Reddedildi", DUPLICATE: "Kopya",
};

interface Props {
  suggestions: SuggestionWithMerchant[];
  categories: ProductCategory[];
}

export function SuggestionQueue({ suggestions: initial, categories }: Props) {
  const [suggestions, setSuggestions] = useState(initial);
  const [approveModal, setApproveModal] = useState<SuggestionWithMerchant | null>(null);
  const [rejectModal, setRejectModal] = useState<SuggestionWithMerchant | null>(null);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Approve form state
  const [appName, setAppName] = useState("");
  const [appUnit, setAppUnit] = useState("");
  const [appBrand, setAppBrand] = useState("");
  const [appCat, setAppCat] = useState("");
  const [appDesc, setAppDesc] = useState("");
  const [appNotes, setAppNotes] = useState("");

  // Reject form state
  const [rejectNotes, setRejectNotes] = useState("");

  const openApprove = (s: SuggestionWithMerchant) => {
    setAppName(s.name);
    setAppUnit(s.unit);
    setAppBrand(s.brand ?? "");
    setAppDesc(s.description ?? "");
    setAppCat("");
    setAppNotes("");
    setApproveModal(s);
    setFeedback(null);
  };

  const openReject = (s: SuggestionWithMerchant) => {
    setRejectNotes("");
    setRejectModal(s);
    setFeedback(null);
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    setWorking(true);
    const result = await adminApproveSuggestion(approveModal.id, {
      name: appName, unit: appUnit, brand: appBrand || undefined,
      description: appDesc || undefined, category_id: appCat || undefined,
      adminNotes: appNotes || undefined,
    });
    setWorking(false);
    if (result.success) {
      setSuggestions((prev) =>
        prev.map((s) => s.id === approveModal.id ? { ...s, status: "APPROVED" } : s),
      );
      setApproveModal(null);
      setFeedback({ type: "ok", msg: "Öneri onaylandı ve ürün oluşturuldu." });
    } else {
      setFeedback({ type: "err", msg: result.error ?? "Hata." });
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectNotes.trim() || rejectNotes.trim().length < 10) {
      setFeedback({ type: "err", msg: "Red gerekçesi en az 10 karakter olmalı." });
      return;
    }
    setWorking(true);
    const result = await adminRejectSuggestion(rejectModal.id, rejectNotes);
    setWorking(false);
    if (result.success) {
      setSuggestions((prev) =>
        prev.map((s) => s.id === rejectModal.id ? { ...s, status: "REJECTED" } : s),
      );
      setRejectModal(null);
      setFeedback({ type: "ok", msg: "Öneri reddedildi." });
    } else {
      setFeedback({ type: "err", msg: result.error ?? "Hata." });
    }
  };

  return (
    <div>
      {feedback && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            feedback.type === "ok"
              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {suggestions.length === 0 && (
        <div className="rounded-2xl bg-white py-16 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          <p className="text-4xl mb-3">✅</p>
          <p>İncelenecek öneri yok.</p>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[s.status] ?? ""}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  {s.similarity_score != null && s.similarity_score >= 0.6 && (
                    <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {Math.round(s.similarity_score * 100)}% benzerlik
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900">{s.name}</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {s.brand && <span className="mr-2">{s.brand}</span>}
                  <span className="rounded bg-gray-100 px-1.5 py-0.5">{s.unit}</span>
                  {s.category_hint && (
                    <span className="ml-2 text-gray-400">Kategori: {s.category_hint}</span>
                  )}
                </p>
                {s.description && (
                  <p className="mt-1 text-sm text-gray-600">{s.description}</p>
                )}
                {s.merchant_notes && (
                  <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <span className="font-medium">Market notu:</span> {s.merchant_notes}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {s.merchant_name && <span>Market: {s.merchant_name} · </span>}
                  {new Date(s.created_at).toLocaleDateString("tr-TR")}
                </p>
                {s.admin_notes && (
                  <p className="mt-1 text-xs text-gray-500 italic">Admin notu: {s.admin_notes}</p>
                )}
              </div>

              {(s.status === "PENDING" || s.status === "UNDER_REVIEW") && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openApprove(s)}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => openReject(s)}
                    className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-100"
                  >
                    Reddet
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Approve modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Öneriyi Onayla</h3>
            {feedback?.type === "err" && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{feedback.msg}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Ürün Adı *</label>
                <input value={appName} onChange={(e) => setAppName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500">Birim *</label>
                  <input value={appUnit} onChange={(e) => setAppUnit(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500">Marka</label>
                  <input value={appBrand} onChange={(e) => setAppBrand(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Kategori</label>
                <select value={appCat} onChange={(e) => setAppCat(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                  <option value="">Seçin...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Admin Notu (opsiyonel)</label>
                <textarea value={appNotes} onChange={(e) => setAppNotes(e.target.value)} rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleApprove} disabled={working}
                className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-green-700">
                {working ? "İşleniyor..." : "Onayla & Ürün Oluştur"}
              </button>
              <button onClick={() => { setApproveModal(null); setFeedback(null); }}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Öneriyi Reddet</h3>
            <p className="mb-4 text-sm text-gray-500">
              <span className="font-medium">{rejectModal.name}</span> — markete bildirilecek.
            </p>
            {feedback?.type === "err" && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{feedback.msg}</div>
            )}
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={4}
              placeholder="Red gerekçesi (min. 10 karakter)..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-300 focus:outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={handleReject} disabled={working}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-red-700">
                {working ? "İşleniyor..." : "Reddet"}
              </button>
              <button onClick={() => { setRejectModal(null); setFeedback(null); }}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
