import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  eventId: number;
  eventTitle: string;
  ticketTypeId: number;
  ticketTypeName: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (eventId: number, ticketTypeId: number) => void;
  updateQuantity: (
    eventId: number,
    ticketTypeId: number,
    quantity: number
  ) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.eventId === item.eventId && i.ticketTypeId === item.ticketTypeId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.eventId === item.eventId &&
                i.ticketTypeId === item.ticketTypeId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (eventId, ticketTypeId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.eventId === eventId && i.ticketTypeId === ticketTypeId)
          ),
        })),
      updateQuantity: (eventId, ticketTypeId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.eventId === eventId && i.ticketTypeId === ticketTypeId
              ? { ...i, quantity }
              : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
