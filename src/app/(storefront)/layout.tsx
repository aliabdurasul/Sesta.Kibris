/**
 * Public storefront layout — home uses full mobile chrome; sub-pages get padding via CSS.
 */
import { CartBar } from "@/components/cart/CartBar";
import { HomeBottomNav } from "@/components/landing/HomeBottomNav";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getSession();

  return (
    <div className="min-h-screen bg-app-bg font-sans text-text-primary">
      <main>{children}</main>
      <HomeBottomNav />
      <CartBar hideOnHome />
    </div>
  );
}
