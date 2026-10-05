import { Product, ProductFolder, StockStatus, StockTransaction } from '../types/inventory';

export const calculateStatus = (stock: number, reorderPoint: number, maxCapacity: number): StockStatus => {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= reorderPoint) return 'low_stock';
  if (stock >= maxCapacity * 0.95) return 'overstocked';
  return 'in_stock';
};

export const INITIAL_FOLDERS: ProductFolder[] = [];

export const RAW_PRODUCTS_DATA: Array<{
  serial: number;
  product_name_eng: string;
  product_name_jp: string;
  weight_unit: string;
  tax_rate: number;
  price_without_tax: number;
  price_with_tax: number;
  origin: string;
  folderId: string;
  category: string;
  stock: number;
  reorder: number;
}> = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_TRANSACTIONS: StockTransaction[] = [];

export const INITIAL_TREND_DATA: { date: string; inflow: number; outflow: number; netBalance: number; inventoryValue: number }[] = [];
