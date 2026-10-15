import { createContext, useEffect, useReducer, type ReactNode } from 'react';
import { addIdr, asIdr, multiplyIdr, type IdrAmount, type ProductCatalogItem } from '@santo/shared';

export interface CartItem extends ProductCatalogItem {
  readonly quantity: number;
}

interface CartState {
  readonly items: readonly CartItem[];
}

type CartAction =
  | { type: 'add'; product: ProductCatalogItem }
  | { type: 'remove'; productId: string }
  | { type: 'quantity'; productId: string; quantity: number }
  | { type: 'clear' };

export interface CartContextValue extends CartState {
  readonly totalItemsCount: number;
  readonly subtotalAmountIdr: IdrAmount;
  addItem(product: ProductCatalogItem): void;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  clearCart(): void;
}

const STORAGE_KEY = 'santo_cart_items';
const CartContext = createContext<CartContextValue | undefined>(undefined);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    Number.isSafeInteger(item.price_idr) &&
    (item.price_idr ?? -1) >= 0 &&
    Number.isInteger(item.quantity) &&
    (item.quantity ?? 0) > 0
  );
}

function loadCart(): CartState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [] };
    const items: unknown = JSON.parse(stored);
    return { items: Array.isArray(items) ? items.filter(isCartItem) : [] };
  } catch {
    return { items: [] };
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'clear') return { items: [] };
  if (action.type === 'remove') {
    return { items: state.items.filter((item) => item.id !== action.productId) };
  }
  if (action.type === 'add') {
    if (!action.product.is_available || action.product.available_quantity < 1) return state;
    const existing = state.items.find((item) => item.id === action.product.id);
    if (!existing) return { items: [...state.items, { ...action.product, quantity: 1 }] };
    return {
      items: state.items.map((item) =>
        item.id === action.product.id
          ? {
              ...action.product,
              quantity: Math.min(item.quantity + 1, action.product.available_quantity),
            }
          : item,
      ),
    };
  }
  if (!Number.isInteger(action.quantity) || action.quantity < 1) return state;
  return {
    items: state.items.map((item) =>
      item.id === action.productId
        ? { ...item, quantity: action.quantity }
        : item,
    ),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const value: CartContextValue = {
    ...state,
    totalItemsCount: state.items.reduce((total, item) => total + item.quantity, 0),
    subtotalAmountIdr: state.items.reduce(
      (total, item) => addIdr(total, multiplyIdr(item.price_idr, item.quantity)),
      asIdr(0),
    ),
    addItem: (product) => dispatch({ type: 'add', product }),
    removeItem: (productId) => dispatch({ type: 'remove', productId }),
    updateQuantity: (productId, quantity) => dispatch({ type: 'quantity', productId, quantity }),
    clearCart: () => dispatch({ type: 'clear' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export { CartContext };