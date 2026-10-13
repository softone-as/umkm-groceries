import type { ProductCatalogItem } from '@santo/shared';
import { ProductRepository, type ProductFilters } from './product-repository.js';

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async getProducts(filters: ProductFilters = {}): Promise<ProductCatalogItem[]> {
    const products = await this.repository.listActive(filters);
    return products.map((product) => {
      const availableQuantity = Number(product.available_quantity);
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        selling_unit: product.selling_unit,
        price_idr: Number(product.price_idr),
        image_url: product.image_url,
        available_quantity: availableQuantity,
        is_available: availableQuantity > 0,
      };
    });
  }
}