"use client";

/**
 * Interactive form for the first-run admin setup wizard.
 * Separated into a Client Component so it can use useActionState.
 */
import { useActionState } from "react";
import { setupAdminAction, type SetupAdminState } from "./actions";

const INITIAL: SetupAdminState = { status: "idle" };

export function SetupAdminForm() {
  const [state, formAction, isPending] = useActionState<
    SetupAdminState,
    FormData
  >(
    setupAdminAction as (
      state: SetupAdminState,
      payload: FormData,
    ) => Promise<SetupAdminState>,
    INITIAL,
  );

  if (state.status === "success") {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h2 className="text-xl font-bold text-gray-900">
          Admin Hesabı Oluşturuldu
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-medium">{state.email}</span> adresine bir davet
          e-postası gönderildi.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Admin, e-posta bağlantısını tıklayarak kendi şifresini oluşturacak ve
          sisteme giriş yapacak.
        </p>
        <a
          href="/auth/login"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Giriş Sayfasına Git
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
      <h2 className="mb-1 text-xl font-bold text-gray-900">
        İlk Admin Hesabı
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        E-posta adresini girin. Şifrelerini belirleyebilmeleri için bir davet
        bağlantısı gönderilecek.
      </p>

      {state.status === "error" && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Admin E-posta Adresi
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isPending}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            placeholder="admin@sestakibris.com"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Davet gönderiliyor..." : "Admin Hesabı Oluştur"}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-400">
        Bu işlem yalnızca bir kez çalışır. Admin oluşturulduktan sonra bu sayfa
        devre dışı kalır.
      </p>
    </div>
  );
}
