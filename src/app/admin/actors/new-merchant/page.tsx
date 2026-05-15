/**
 * /admin/actors/new-merchant
 * Admin creates a new merchant account.
 */
"use client";

import { useActionState } from "react";
import { createMerchantAction } from "./actions";

type ActionState = { error: string } | null;

export default function NewMerchantPage() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createMerchantAction as (state: ActionState, payload: FormData) => Promise<ActionState>,
    null,
  );

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center gap-3">
        <a href="/admin/actors" className="text-sm text-blue-600 hover:underline">
          ← Aktörler
        </a>
        <h2 className="text-lg font-bold text-gray-900">Yeni İşletme Ekle</h2>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        {state?.error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              İşletme Adı *
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Örn: Döner King"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              E-posta *
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="merchant@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Şifre *
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="En az 8 karakter"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Telefon
            </label>
            <input
              name="phone"
              type="tel"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="+90 5XX XXX XXXX"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "Oluşturuluyor..." : "İşletme Hesabı Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}
