import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackMetaEvent } from '@/lib/metaTracking';

interface CartItem {
  product: any;
  quantity: number;
  variants?: {
    color?: string;
    size?: string;
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (product: any, quantity: number, variants?: {color?: string, size?: string}) => void;
  removeItem: (productId: string, variants?: {color?: string, size?: string}) => void;
  updateQuantity: (productId: string, quantity: number, variants?: {color?: string, size?: string}) => void;
  clearCart: () => void;
  total: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      
      addItem: (product, quantity, variants) => {
        const items = get().items;
        const existingItem = items.find(item => 
          item.product.id === product.id &&
          item.variants?.color === variants?.color &&
          item.variants?.size === variants?.size
        );
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.product.id === product.id &&
              item.variants?.color === variants?.color &&
              item.variants?.size === variants?.size
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity, variants }] });
        }
        
        const newItems = get().items;
        const total = newItems.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );
        set({ total });

        // Track AddToCart event with Meta
        trackMetaEvent('AddToCart', {
          content_ids: [product.id],
          content_name: product.name,
          value: parseFloat(product.price) * quantity,
          currency: 'BDT',
          num_items: quantity,
        });
      },
      
      removeItem: (productId, variants) => {
        set({ items: get().items.filter(item => 
          !(item.product.id === productId &&
            item.variants?.color === variants?.color &&
            item.variants?.size === variants?.size)
        )});
        const newItems = get().items;
        const total = newItems.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );
        set({ total });
      },
      
      updateQuantity: (productId, quantity, variants) => {
        if (quantity === 0) {
          get().removeItem(productId, variants);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.product.id === productId &&
            item.variants?.color === variants?.color &&
            item.variants?.size === variants?.size
              ? { ...item, quantity }
              : item
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
