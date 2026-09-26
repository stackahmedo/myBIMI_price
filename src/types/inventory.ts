export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

export type UnitOfMeasure = 'pcs' | 'kg' | 'liters' | 'boxes' | 'meters' | 'rolls' | 'sets';

export type FolderType = 'shop' | 'category';

export interface ProductFolder {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  iconName?: string;
  createdAt: string;
  type?: FolderType; // 'shop' represents retail store/branch (Tokyo, Yokohama), 'category' represents product grouping
  storeLocation?: string;
  markupPercent?: number; // Default price markup % for this shop (e.g. +10% for airport branch)
}

export interface Product {
  id: string;
  serial: number; // 1, 2, 3...
  sku: string;
  barcode?: string;
  masterSku?: string; // Connects the same base product across two or more shops/folders with shop-specific prices
  name: string; // product_name_eng
  product_name_eng: string;
  product_name_jp: string;
  weight_unit: string; // weight/pc/unit e.g. "60gm", "1kg", "1", "200ml"
  tax_rate: number; // tax % e.g. 8.0
  price_without_tax: number; // without tax e.g. 120, 231 (shop-specific price)
  price_with_tax: number; // with tax e.g. 130, 250 (shop-specific price)
  origin: string; // VIETNAM, PAKISTAN, BANGLADESH, JAPAN, UNKNOWN, etc.

  folderId: string; // Which Shop or Category folder this product belongs to
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

export interface PriceCardTypographyConfig {
  jpFont: string;
  jpSubFont: string;
  jpFontSizeScale: number; // 0.70 to 1.50 (1.0 = 100%)

  enFont: string;
  enSubFont: string;
  enFontSizeScale: number; // 0.70 to 1.50 (1.0 = 100%)

  priceFont: string;
  priceSubFont: string;
  priceFontSizeScale: number; // 0.70 to 1.50 (1.0 = 100%)
}

export const DEFAULT_TYPOGRAPHY_CONFIG: PriceCardTypographyConfig = {
  jpFont: 'Noto Sans JP',
  jpSubFont: 'Hiragino Sans, Meiryo, sans-serif',
  jpFontSizeScale: 1.0,

  enFont: 'Outfit',
  enSubFont: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  enFontSizeScale: 1.0,

  priceFont: 'Outfit',
  priceSubFont: '-apple-system, BlinkMacSystemFont, Arial Black, Impact, sans-serif',
  priceFontSizeScale: 1.0,
};

export const AVAILABLE_JP_FONTS = [
  { id: 'Noto Sans JP', label: 'Noto Sans JP (Standard Modern Gothic)' },
  { id: 'Zen Kaku Gothic New', label: 'Zen Kaku Gothic New (Crisp Retail Standard)' },
  { id: 'Dela Gothic One', label: 'Dela Gothic One (Bold Supermarket POP)' },
  { id: 'M PLUS 1p', label: 'M PLUS 1p (Rounded Friendly POP)' },
  { id: 'Shippori Mincho', label: 'Shippori Mincho (Gourmet / Premium Serif)' },
  { id: 'Hiragino Sans', label: 'Hiragino Sans (Apple Native Japanese)' },
  { id: 'Yu Gothic', label: 'Yu Gothic (Windows Modern Clean)' },
  { id: 'Meiryo', label: 'Meiryo (Clear Bold Japanese)' },
];

export const AVAILABLE_JP_SUBFONTS = [
  { id: 'Hiragino Sans, Meiryo, sans-serif', label: 'Hiragino Sans / Meiryo / sans-serif (Universal Japanese)' },
  { id: 'Hiragino Kaku Gothic ProN, Yu Gothic, sans-serif', label: 'Hiragino Kaku Gothic ProN / Yu Gothic' },
  { id: 'Meiryo, MS Gothic, sans-serif', label: 'Meiryo / MS Gothic (Windows Native)' },
  { id: 'Yu Mincho, Georgia, serif', label: 'Yu Mincho / Serif (Traditional Gourmet)' },
  { id: 'sans-serif', label: 'System Default Sans-Serif' },
];

export const AVAILABLE_EN_FONTS = [
  { id: 'Outfit', label: 'Outfit (Modern Geometric Sans - Recommended)' },
  { id: 'Inter', label: 'Inter (High-legibility Display Sans)' },
  { id: 'Montserrat', label: 'Montserrat (Bold Retail Headline)' },
  { id: 'Oswald', label: 'Oswald (Strong Condensed)' },
  { id: 'Roboto Condensed', label: 'Roboto Condensed (Clean Narrow Headline)' },
  { id: 'Bebas Neue', label: 'Bebas Neue (High-Impact Poster)' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Contemporary Clean)' },
  { id: 'JetBrains Mono', label: 'JetBrains Mono (Technical / Monospace)' },
];

export const AVAILABLE_EN_SUBFONTS = [
  { id: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', label: 'Modern System UI (-apple-system / Segoe UI)' },
  { id: 'Helvetica Neue, Arial, sans-serif', label: 'Helvetica Neue / Arial' },
  { id: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS / Dynamic' },
  { id: 'Georgia, Times New Roman, serif', label: 'Georgia / Times Serif' },
  { id: 'sans-serif', label: 'Generic Sans-Serif' },
];

export const AVAILABLE_PRICE_FONTS = [
  { id: 'Outfit', label: 'Outfit (Clean Bold Modern Numerals - Recommended)' },
  { id: 'Oswald', label: 'Oswald (Tall Impactful Grocery Price)' },
  { id: 'Bebas Neue', label: 'Bebas Neue (Ultra Bold Discount POP)' },
  { id: 'Anton', label: 'Anton (Solid Heavy Supermarket Price)' },
  { id: 'Roboto Condensed', label: 'Roboto Condensed (Tall Clean Numerals)' },
  { id: 'Montserrat', label: 'Montserrat (Modern Bold Numerals)' },
  { id: 'JetBrains Mono', label: 'JetBrains Mono (Tabular Monospace Numerals)' },
];

export const AVAILABLE_PRICE_SUBFONTS = [
  { id: '-apple-system, BlinkMacSystemFont, Arial Black, Impact, sans-serif', label: 'System Heavy (-apple-system / Arial Black / Impact)' },
  { id: 'Arial Black, Impact, sans-serif', label: 'Arial Black / Impact' },
  { id: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
  { id: 'Courier New, monospace', label: 'Monospace Tabular' },
  { id: 'sans-serif', label: 'System Sans-Serif' },
];
