/**
 * /admin/actors/new-courier
 * Admin (or merchant) creates a new courier account.
 */
"use client";

import { useActionState } from "react";
import { createCourierAction } from "./actions";

type ActionState = { error: string } | null;

export default function NewCourierPage() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createCourierAction as (state: ActionState, payload: FormData) => Promise<ActionState>,
    null,
  );

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center gap-3">
        <a href="/admin/actors" className="text-sm text-blue-600 hover:underline">
          ← Aktörler
        </a>
        <h2 className="text-lg font-bold text-gray-900">Yeni Kurye Ekle</h2>
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
              Ad Soyad *
            </label>
            <input
              name="fullName"
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ahmet Yılmaz"
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
              placeholder="kurye@example.com"
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Araç Tipi
            </label>
            <select
              name="vehicle"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seçiniz</option>
              <option value="motosiklet">Motosiklet</option>
              <option value="bisiklet">Bisiklet</option>
              <option value="araba">Araba</option>
              <option value="yaya">Yaya</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
          >
            {pending ? "Oluşturuluyor..." : "Kurye Hesabı Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}
