import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;           // cart item id (server-side) or temp id
  product_id: string;
  variant_id: string;
  store_id: string;
  store_name: string;
  name: string;
  image_url: string;
  size: string;
  color: string;
  price: number;
  mrp: number;
  quantity: number;
  max_qty: number;      // stock limit
  in_stock: boolean;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  setLoading: (loading: boolean) => void;

  // Computed
  total: () => number;
  subtotal: () => number;
  itemCount: () => number;
  deliveryFee: () => number;
  platformFee: () => number;
  grandTotal: () => number;
}

const DELIVERY_FEE = 49;
const PLATFORM_FEE = 5;
const FREE_DELIVERY_THRESHOLD = 499;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.variant_id === item.variant_id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.variant_id === item.variant_id
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.max_qty) }
                : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variant_id !== variantId) });
      },

      updateQty: (variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variant_id === variantId ? { ...i, quantity: Math.min(qty, i.max_qty) } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      setLoading: (loading) => set({ isLoading: loading }),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      total: () => get().subtotal(),

      deliveryFee: () => {
        const sub = get().subtotal();
        return sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      },

      platformFee: () => (get().items.length > 0 ? PLATFORM_FEE : 0),

      grandTotal: () => get().subtotal() + get().deliveryFee() + get().platformFee(),

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'lf_cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
