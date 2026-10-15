import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CartProvider } from '../context/cart-context';
import { QuantityStepper } from '../components/quantity-stepper';
import { useCart } from '../hooks/use-cart';

const product = {
  id: 'p-1',
  name: 'Beras Rojolele',
  category: 'Beras',
  selling_unit: 'kg',
  price_idr: 15000,
  image_url: null,
  available_quantity: 8,
  is_available: true,
};

function CartProbe() {
  const cart = useCart();
  return (
    <div>
      <output data-testid="cart-count">{cart.totalItemsCount}</output>
      <output data-testid="cart-subtotal">{cart.subtotalAmountIdr}</output>
      <button onClick={() => cart.addItem(product)}>Add</button>
      <button onClick={() => cart.updateQuantity('p-1', 0)}>Invalid quantity</button>
    </div>
  );
}

describe('shopping cart', () => {
  beforeEach(() => localStorage.clear());

  it('persists added items and ignores non-positive quantities', () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'Invalid quantity' }));

    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('15000');
    expect(JSON.parse(localStorage.getItem('santo_cart_items') ?? '[]')).toEqual([
      { ...product, quantity: 1 },
    ]);
  });

  it('restores persisted cart items on initial render', () => {
    localStorage.setItem('santo_cart_items', JSON.stringify([{ ...product, quantity: 3 }]));

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('45000');
  });

  it('uses the decrement control as item removal when quantity is one', () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    render(<QuantityStepper quantity={1} onChange={onChange} onRemove={onRemove} />);

    expect(screen.getByTestId('quantity-stepper')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus item' }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
  });
});