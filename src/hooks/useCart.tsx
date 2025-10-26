import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  product: any;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: any, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      
      addItem: (product, quantity) => {
        const items = get().items;
        const existingItem = items.find(item => item.product.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
        
        const newItems = get().items;
        const total = newItems.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );
        set({ total });
      },
      
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.product.id !== productId) });
        const newItems = get().items;
        const total = newItems.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );
        set({ total });
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity === 0) {
          get().removeItem(productId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
        
        const newItems = get().items;
        const total = newItems.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );
        set({ total });
      },
      
      clearCart: () => set({ items: [], total: 0 }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
