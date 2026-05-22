/**
 * /merchant — resolver only. Redirects to the merchant's canonical storefront slug.
 * Operational dashboard UI lives at /market/[slug] for owners.
 */
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getMerchantSlugForUser } from "@/lib/merchant/resolve-slug";

export default async function MerchantRootPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const merchant = await getMerchantSlugForUser(user.id);

  if (!merchant?.slug) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p>Market kaydınız bulunamadı.</p>
        <p className="mt-2 text-sm">
          Yöneticinizden işletme kaydının oluşturulmasını isteyin.
        </p>
      </div>
    );
  }

  redirect(`/market/${merchant.slug}`);
}
