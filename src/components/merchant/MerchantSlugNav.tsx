"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/auth/signout/actions";

interface Props {
  slug: string;
}

export function MerchantSlugNav({ slug }: Props) {
  const pathname = usePathname();
  const ordersHref = `/market/${slug}`;
  const productsHref = "/merchant/products";

  const onOrders =
    pathname === ordersHref || pathname.startsWith(`${ordersHref}/`);
  const onProducts = pathname.startsWith(productsHref);

  return (
    <nav className="mb-4 flex gap-2 border-b border-gray-100 pb-3">
      <Link
        href={ordersHref}
        className={`rounded-lg px-4 py-2 text-sm font-medium ${
          onOrders
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        📋 Siparişler
      </Link>
      <Link
        href={productsHref}
        className={`rounded-lg px-4 py-2 text-sm font-medium ${
          onProducts
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        🍽️ Ürünler
      </Link>
      <form action={signOutAction} method="post" className="ml-auto">
        <button
          type="submit"
          className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          Çıkış
        </button>
      </form>
    </nav>
  );
}
