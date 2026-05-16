"use client";

/**
 * Password setup after bootstrap (temporary password) or Supabase recovery session.
 * Calls supabase.auth.updateUser({ password, data }) — clears password_change_required.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { userMustChangePassword } from "@/lib/auth/password-change";

export function SetupPasswordClient() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [noSession, setNoSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setNoSession(true);
        setReady(true);
        return;
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setNoSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setPending(true);
    const supabase = createBrowserClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setPending(false);
      setError("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      setNoSession(true);
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password,
      data: { password_change_required: false },
    });

    setPending(false);

    if (updateErr) {
      const msg = updateErr.message.toLowerCase();
      if (msg.includes("expired") || msg.includes("invalid")) {
        setError(
          "Bağlantının süresi dolmuş veya geçersiz. Giriş yapıp tekrar deneyin veya şifre sıfırlama kullanın.",
        );
      } else {
        setError(updateErr.message ?? "Şifre güncellenemedi.");
      }
      return;
    }

    router.refresh();

    const meta = user.app_metadata as Record<string, string> | undefined;
    const role = meta?.["role"];
    if (role === "admin") {
      router.push("/admin");
    } else if (role === "merchant") {
      router.push("/merchant");
    } else if (role === "courier") {
      router.push("/courier");
    } else {
      router.push("/customer/orders");
    }
  }

  if (!ready) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm ring-1 ring-gray-100">
        Yükleniyor…
      </div>
    );
  }

  if (noSession) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Oturum gerekli</h2>
        <p className="mt-2 text-sm text-gray-600">
          Şifre belirlemek için önce giriş yapın veya e-postanızdaki güvenli bağlantıyı
          kullanın.
        </p>
        <a
          href="/auth/login"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Giriş sayfası
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-lg font-bold text-gray-900">Kalıcı şifre belirleyin</h2>
      <p className="mt-2 text-sm text-gray-500">
        İlk giriş veya kurtarma akışından sonra güçlü bir şifre seçin.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error}
        </div>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="pw" className="block text-sm font-medium text-gray-700">
            Yeni şifre
          </label>
          <input
            id="pw"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor="pw2"
            className="block text-sm font-medium text-gray-700"
          >
            Şifre tekrar
          </label>
          <input
            id="pw2"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Şifreyi kaydet"}
        </button>
      </form>
    </div>
  );
}
