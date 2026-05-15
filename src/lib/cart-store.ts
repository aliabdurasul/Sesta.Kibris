/**
 * Cart store — zustand, persisted to sessionStorage.
 *
 * Rules:
 * - Cart belongs to a single merchant at a time.
 * - Adding a product from a different merchant clears the cart.
 * - Prices stored in kuruş (lowest unit), matching the DB.
 * - Cart total is computed client-side ONLY for display.
 *   The server ALWAYS recalculates the final total from product prices.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number; // kuruş
  quantity: number;
  imageUrl: string | null;
}

interface CartState {
  merchantId: string | null;
  merchantSlug: string | null;
  items: CartItem[];
}

interface CartActions {
  addItem: (
    item: Omit<CartItem, "quantity">,
    merchantId: string,
    merchantSlug: string,
  ) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number; // kuruş — display only
  getItemCount: () => number;
}

const EMPTY: CartState = {
  merchantId: null,
  merchantSlug: null,
  items: [],
};

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      addItem(item, merchantId, merchantSlug) {
        const state = get();

        // Different merchant — clear cart first
        const isNewMerchant =
          state.merchantId !== null && state.merchantId !== merchantId;

        set((prev) => {
          const base = isNewMerchant ? EMPTY : prev;
          const existing = base.items.find((i) => i.productId === item.productId);

          if (existing) {
            return {
              items: base.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }

          return {
            merchantId,
            merchantSlug,
            items: [...base.items, { ...item, quantity: 1 }],
          };
        });
      },

      removeItem(productId) {
        set((prev) => {
          const items = prev.items.filter((i) => i.productId !== productId);
          return items.length === 0 ? EMPTY : { items };
        });
      },

      updateQuantity(productId, quantity) {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((prev) => ({
          items: prev.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        }));
      },

      clearCart() {
        set(EMPTY);
      },

      getTotal() {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
      },

      getItemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "sesta-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage,
      ),
      partialize: (state) => ({
        merchantId: state.merchantId,
        merchantSlug: state.merchantSlug,
        items: state.items,
      }),
    },
  ),
);
