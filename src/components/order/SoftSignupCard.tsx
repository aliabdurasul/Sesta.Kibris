import Link from "next/link";

/**
 * Non-blocking invitation to create an account after guest checkout.
 */
export function SoftSignupCard() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-left">
      <p className="text-sm font-semibold text-gray-900">Hesap oluşturun</p>
      <ul className="mt-2 space-y-1 text-sm text-gray-600">
        <li>• Tüm siparişlerinizi tek yerden takip edin</li>
        <li>• Daha hızlı tekrar sipariş verin</li>
        <li>• Adreslerinizi kaydedin</li>
      </ul>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/auth/login?redirectTo=/customer/orders"
          className="flex-1 rounded-xl bg-white py-2.5 text-center text-sm font-medium text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Google ile devam et
        </Link>
        <Link
          href="/auth/register"
          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          Hesap Oluştur
        </Link>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Sipariş takibiniz hesap oluşturmadan da çalışmaya devam eder.
      </p>
    </div>
  );
}
