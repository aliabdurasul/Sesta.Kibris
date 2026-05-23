/**
 * Merchant Panel - Products & Inventory wrapper.
 * Replaces old products page (Task 0.0.18).
 */
import { getSession } from "@/lib/auth";
import { getMerchantInventory } from "@/lib/catalog/merchant-actions";
import { MerchantInventoryClient } from "./MerchantInventoryClient";

export const dynamic = "force-dynamic";

export default async function MerchantProductsPage() {
  const session = await getSession();
  if (!session?.merchantId) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p>Market kaydınız bulunamadı.</p>
      </div>
    );
  }

  const inventory = await getMerchantInventory(session.merchantId);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Envanter Yönetimi</h2>
        <div className="flex items-center gap-2">
          <a
            href="/merchant/products/suggestions"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Önerilerim
          </a>
        </div>
      </div>

      <MerchantInventoryClient initialInventory={inventory} merchantId={session.merchantId} />
    </div>
  );
}
