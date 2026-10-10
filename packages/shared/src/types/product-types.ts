export type ProductCategory =
  | 'Beras'
  | 'Minyak Goreng'
  | 'Gula Pasir'
  | 'Telur Ayam'
  | 'Tepung Terigu'
  | 'Bumbu Dapur'
  | 'Mie & Pasta'
  | 'Lainnya';

export type SellingUnit = 'kg' | 'liter' | 'pcs' | 'ikat' | 'karung' | 'butir' | 'bungkus' | 'dus';

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: ProductCategory | string;
  readonly selling_unit: SellingUnit | string;
  readonly price_idr: number;
  readonly image_url: string | null;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ProductCatalogItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly selling_unit: string;
  readonly price_idr: number;
  readonly image_url: string | null;
  readonly available_quantity: number;
  readonly is_available: boolean;
}
