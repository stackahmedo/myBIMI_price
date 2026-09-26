export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

export type UnitOfMeasure = 'pcs' | 'kg' | 'liters' | 'boxes' | 'meters' | 'rolls' | 'sets';

export interface ProductFolder {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  iconName?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  serial: number; // 1, 2, 3...
  sku: string;
  name: string; // product_name_eng
  product_name_eng: string;
  product_name_jp: string;
  weight_unit: string; // weight/pc/unit e.g. "60gm", "1kg", "1", "200ml"
  tax_rate: number; // tax % e.g. 8.0
  price_without_tax: number; // without tax e.g. 120, 231
  price_with_tax: number; // with tax e.g. 130, 250
  origin: string; // VIETNAM, PAKISTAN, BANGLADESH, JAPAN, UNKNOWN, etc.

  folderId: string;
  category: string;
  description: string;
  unitCost: number; // cost basis
  sellingPrice: number; // retail price (= price_with_tax)
  stockQuantity: number;
  reorderPoint: number;
  maxCapacity: number;
  unit: UnitOfMeasure;
  location: string;
  supplier: string;
  leadTimeDays: number;
  lastRestocked: string;
  updatedAt: string;
  status: StockStatus;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  type: 'inflow' | 'outflow' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
  performedBy: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  lastLogin: string;
}

export interface StockTrendDataPoint {
  date: string;
  inflow: number;
  outflow: number;
  netChange: number;
  totalStockLevel: number;
}
