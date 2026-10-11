import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet } from '../lib/api-client';
import { createQueryClient } from '../lib/query-client';
import { CatalogPage } from '../routes/catalog-page';

const product = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'Beras Rojolele Super 5kg',
  category: 'Beras',
  selling_unit: 'karung',
  price_idr: 72000,
  image_url: null,
  available_quantity: 14,
  is_available: true,
  ...over,
});

const settings = {
  shop_name: 'Toko',
  address: 'Jl. Raya 1',
  pickup_hours: '08:00 - 17:00',
  whatsapp_number: '62',
  bank_transfer_instructions: '',
};

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

let fetchMock: ReturnType<typeof vi.fn>;

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <CatalogPage />
    </QueryClientProvider>,
  );
}

function mockApi(productsHandler: (url: string) => Promise<Response>) {
  fetchMock.mockImplementation((url: string) =>
    url.includes('/store-settings') ? json(settings) : productsHandler(url),
  );
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('CatalogPage', () => {
  it('shows skeleton, then products with IDR price and header info', async () => {
    mockApi(() => json({ products: [product()] }));
    renderPage();
    expect(screen.getByTestId('product-grid-skeleton')).toBeInTheDocument();
    expect(await screen.findByTestId('product-price-p1')).toHaveTextContent('Rp 72.000');
    expect(screen.getByText('per 1 karung')).toBeInTheDocument();
    expect(await screen.findByText('Jl. Raya 1')).toBeInTheDocument();
  });

  it('shows Habis badge and disables add button when unavailable', async () => {
    mockApi(() => json({ products: [product({ is_available: false, available_quantity: 0 })] }));
    renderPage();
    expect(await screen.findByTestId('product-availability-p1')).toHaveTextContent('Habis');
    expect(screen.getByTestId('product-add-to-cart-btn-p1')).toBeDisabled();
  });

  it('refetches with category param when a chip is clicked', async () => {
    mockApi(() => json({ products: [product()] }));
    renderPage();
    await screen.findByTestId('product-card-p1');
    const chip = screen.getAllByTestId('category-chip').find((c) => c.textContent === 'Beras')!;
    await userEvent.click(chip);
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes('category=Beras'))).toBe(true));
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('debounces search input (300ms) and shows empty state', async () => {
    mockApi((url) => json({ products: url.includes('search=') ? [] : [product()] }));
    renderPage();
    await screen.findByTestId('product-card-p1');
    const before = fetchMock.mock.calls.length;
    await userEvent.type(screen.getByTestId('search-input'), 'xyz');
    expect(fetchMock.mock.calls.length).toBe(before);
    expect(await screen.findByText('Tidak ada produk yang sesuai dengan pencarian Anda')).toBeInTheDocument();
    const searchCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes('search='));
    expect(searchCalls).toHaveLength(1);
    expect(String(searchCalls[0]![0])).toContain('search=xyz');
  });

  it('shows error banner with retry', async () => {
    let fail = true;
    mockApi(() =>
      fail ? json({ success: false, error: { code: 'NOT_FOUND', message: 'x' } }, 404) : json({ products: [product()] }),
    );
    renderPage();
    const retry = await screen.findByRole('button', { name: 'Muat Ulang' });
    fail = false;
    await userEvent.click(retry);
    expect(await screen.findByTestId('product-card-p1')).toBeInTheDocument();
  });
});

describe('apiGet', () => {
  it('extracts typed errors from ApiErrorResponse', async () => {
    fetchMock.mockImplementation(() =>
      json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Bad' } }, 400),
    );
    await expect(apiGet('/products')).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Bad',
    });
    await expect(apiGet('/products')).rejects.toBeInstanceOf(ApiError);
  });
});
