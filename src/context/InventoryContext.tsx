import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductFolder, FolderType, StockTransaction, AdminUser } from '../types/inventory';
import { INITIAL_FOLDERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, calculateStatus } from '../data/initialData';

interface InventoryContextType {
  products: Product[];
  folders: ProductFolder[];
  transactions: StockTransaction[];
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addProduct: (data: {
    product_name_eng: string;
    product_name_jp: string;
    weight_unit: string;
    tax_rate: number;
    price_without_tax: number;
    price_with_tax: number;
    origin: string;
    folderId: string;
    category?: string;
    stockQuantity?: number;
    reorderPoint?: number;
    location?: string;
    supplier?: string;
  }) => Product;
  updateProduct: (id: string, updates: Partial<Product>, auditReason?: string) => void;
  batchUpdateProducts: (
    updates: { id: string; changes: Partial<Product> }[],
    auditReason?: string
  ) => void;
  deleteProduct: (id: string) => void;
  batchDeleteProducts: (ids: string[]) => void;
  batchAssignFolder: (ids: string[], folderId: string) => void;
  adjustStock: (id: string, delta: number, reason: string) => void;
  addFolder: (folderData: {
    name: string;
    code: string;
    description: string;
    color: string;
    type?: FolderType;
    storeLocation?: string;
    markupPercent?: number;
  }) => ProductFolder;
  updateFolder: (id: string, updates: Partial<ProductFolder>) => void;
  deleteFolder: (id: string, fallbackFolderId?: string) => void;
  bulkImportProducts: (
    items: Array<{
      serial?: number;
      sku?: string;
      product_name_eng: string;
      product_name_jp?: string;
      weight_unit?: string;
      tax_rate?: number;
      price_without_tax: number;
      price_with_tax?: number;
      origin?: string;
      folderId?: string;
      category?: string;
      stockQuantity?: number;
      barcode?: string;
      location?: string;
      supplier?: string;
    }>,
    options?: {
      updateExisting?: boolean;
      defaultFolderId?: string;
    }
  ) => { imported: number; updated: number; total: number };
  duplicateProductToFolder: (
    productId: string,
    targetFolderId: string,
    customPriceWithoutTax?: number,
    customTaxRate?: number
  ) => Product | null;
  batchDuplicateToFolder: (
    productIds: string[],
    targetFolderId: string,
    priceMultiplier?: number
  ) => number;
  clearAllData: () => void;
  resetToDemo: () => void;
  exportCSV: (itemsToExport?: Product[], customFilename?: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'card_studio_products_catalog_v2',
  FOLDERS: 'card_studio_folders_catalog_v2',
  TRANSACTIONS: 'card_studio_transactions_catalog_v2',
  AUTH: 'card_studio_admin_auth_v2',
};

// Purge any legacy sample/demo data from browser storage
try {
  localStorage.removeItem('bimi_tag_pro_products_catalog_exact_367');
  localStorage.removeItem('bimi_tag_pro_folders_catalog_exact_367');
  localStorage.removeItem('bimi_tag_pro_transactions_catalog_exact_367');
  localStorage.removeItem('bimi_tag_pro_admin_auth_exact_367');
} catch {
  // Ignore in SSR/restricted environments
}

const DEFAULT_ADMIN: AdminUser = {
  id: 'usr-admin-01',
  email: 'admin@apex-systems.io',
  name: 'Alex Vance',
  role: 'Store Manager & Price Tag Controller',
  lastLogin: new Date().toISOString(),
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((p: any) => {
            let tr = typeof p.tax_rate === 'number' ? p.tax_rate : parseFloat(p.tax_rate);
            if (isNaN(tr) || tr <= 0) tr = 8.0;
            // Excel decimal fraction correction: 0.1 -> 10.0%, 0.08 -> 8.0%
            if (tr > 0 && tr <= 1.0) {
              tr = Math.round(tr * 100 * 10) / 10;
            }
            const priceEx = typeof p.price_without_tax === 'number' ? p.price_without_tax : 0;
            const recalcInc = Math.round(priceEx * (1 + tr / 100));
            // If previous price_with_tax was computed with 0.1% tax, recalculate to correct 8% or 10%
            const needsRecalc = !p.price_with_tax || Math.abs(p.price_with_tax - priceEx) <= 2;
            return {
              ...p,
              tax_rate: tr,
              price_with_tax: needsRecalc ? recalcInc : p.price_with_tax,
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load products from storage', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [folders, setFolders] = useState<ProductFolder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load folders from storage', e);
    }
    return INITIAL_FOLDERS;
  });

  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load transactions from storage', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load auth from storage', e);
    }
    return DEFAULT_ADMIN;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.error('Error saving folders', e);
    }
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      if (adminUser) {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(adminUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    } catch (e) {
      console.error('Error saving auth', e);
    }
  }, [adminUser]);

  const login = (email: string, pass: string): boolean => {
    if (email.trim() && pass.length >= 4) {
      const user: AdminUser = {
        id: 'usr-admin-01',
        email: email.trim().toLowerCase(),
        name: email.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: 'Store Manager & Price Tag Controller',
        lastLogin: new Date().toISOString(),
      };
      setAdminUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setAdminUser(null);
  };

  const addProduct = (data: {
    product_name_eng: string;
    product_name_jp: string;
    weight_unit: string;
    tax_rate: number;
    price_without_tax: number;
    price_with_tax: number;
    origin: string;
    folderId: string;
    category?: string;
    stockQuantity?: number;
    reorderPoint?: number;
    location?: string;
    supplier?: string;
  }): Product => {
    const today = new Date().toISOString().split('T')[0];
    const maxSerial = products.reduce((max, p) => Math.max(max, p.serial || 0), 0);
    const serial = maxSerial + 1;

    const code = data.product_name_eng.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'ITEM';
    const sku = `${code}-${String(serial).padStart(3, '0')}`;
    const stock = data.stockQuantity !== undefined ? data.stockQuantity : 50;
    const reorder = data.reorderPoint !== undefined ? data.reorderPoint : 15;
    const status = calculateStatus(stock, reorder, 300);

    const newProduct: Product = {
      id: `prod-tag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serial,
      sku,
      name: data.product_name_eng.trim(),
      product_name_eng: data.product_name_eng.trim(),
      product_name_jp: data.product_name_jp.trim(),
      weight_unit: data.weight_unit.trim() || '1pc',
      tax_rate: data.tax_rate || 8.0,
      price_without_tax: data.price_without_tax,
      price_with_tax: data.price_with_tax,
      origin: data.origin.trim().toUpperCase() || 'UNKNOWN',
      folderId: data.folderId,
      category: data.category?.trim() || 'General Food',
      description: `${data.product_name_jp} (${data.origin})`,
      unitCost: Math.round(data.price_without_tax * 0.7),
      sellingPrice: data.price_with_tax,
      stockQuantity: stock,
      reorderPoint: reorder,
      maxCapacity: 300,
      unit: 'pcs',
      location: data.location || 'Aisle 1 · Shelf A',
      supplier: data.supplier || `${data.origin} Direct Supplier`,
      leadTimeDays: data.origin === 'JAPAN' ? 3 : 14,
      lastRestocked: today,
      updatedAt: today,
      status,
    };

    setProducts(prev => [newProduct, ...prev]);

    const tx: StockTransaction = {
      id: `tx-${Date.now()}`,
      productId: newProduct.id,
      productSku: newProduct.sku,
      productName: newProduct.product_name_eng,
      type: 'inflow',
      quantity: stock,
      previousStock: 0,
      newStock: stock,
      reason: `New SKU Tag created: ${newProduct.product_name_eng}`,
      timestamp: new Date().toISOString(),
      performedBy: adminUser?.name || 'Admin',
    };
    setTransactions(prev => [tx, ...prev]);

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>, auditReason?: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;

        const updated: Product = { ...p, ...updates };

        // Keep name synchronized with product_name_eng
        if (updates.product_name_eng) {
          updated.name = updates.product_name_eng;
        }

        // Recalculate price with tax if only price_without_tax changed
        if (updates.price_without_tax !== undefined && updates.price_with_tax === undefined) {
          const rate = updates.tax_rate !== undefined ? updates.tax_rate : p.tax_rate;
          updated.price_with_tax = Math.round(updates.price_without_tax * (1 + rate / 100));
          updated.sellingPrice = updated.price_with_tax;
        }

        // Recalculate without tax if with_tax was directly typed
        if (updates.price_with_tax !== undefined) {
          updated.sellingPrice = updates.price_with_tax;
        }

        const newStock = updates.stockQuantity !== undefined ? updates.stockQuantity : p.stockQuantity;
        const newReorder = updates.reorderPoint !== undefined ? updates.reorderPoint : p.reorderPoint;
        const newMax = updates.maxCapacity !== undefined ? updates.maxCapacity : p.maxCapacity;

        updated.status = calculateStatus(newStock, newReorder, newMax);
        updated.updatedAt = new Date().toISOString().split('T')[0];

        if (updates.stockQuantity !== undefined && updates.stockQuantity !== p.stockQuantity) {
          const delta = updates.stockQuantity - p.stockQuantity;
          const tx: StockTransaction = {
            id: `tx-${Date.now()}`,
            productId: p.id,
            productSku: p.sku,
            productName: p.product_name_eng,
            type: delta > 0 ? 'inflow' : 'outflow',
            quantity: Math.abs(delta),
            previousStock: p.stockQuantity,
            newStock: updates.stockQuantity,
            reason: auditReason || 'Master Product Tag Record Update',
            timestamp: new Date().toISOString(),
            performedBy: adminUser?.name || 'Admin',
          };
          setTransactions(tPrev => [tx, ...tPrev]);
        }

        return updated;
      })
    );
  };

  const deleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    if (target) {
      const tx: StockTransaction = {
        id: `tx-${Date.now()}`,
        productId: target.id,
        productSku: target.sku,
        productName: target.product_name_eng,
        type: 'adjustment',
        quantity: -target.stockQuantity,
        previousStock: target.stockQuantity,
        newStock: 0,
        reason: `Price Tag / SKU Deleted (#${target.serial} ${target.product_name_eng})`,
        timestamp: new Date().toISOString(),
        performedBy: adminUser?.name || 'Admin',
      };
      setTransactions(prev => [tx, ...prev]);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const batchDeleteProducts = (ids: string[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
  };

  const batchUpdateProducts = (
    updates: { id: string; changes: Partial<Product> }[],
    auditReason?: string
  ) => {
    const updateMap = new Map(updates.map(u => [u.id, u.changes]));
    const today = new Date().toISOString().split('T')[0];
    const newTransactions: StockTransaction[] = [];

    setProducts(prev =>
      prev.map(p => {
        const changes = updateMap.get(p.id);
        if (!changes) return p;

        const updated: Product = { ...p, ...changes };

        if (changes.product_name_eng) {
          updated.name = changes.product_name_eng;
        }

        // Recalculate price with tax if price_without_tax changed without price_with_tax
        if (changes.price_without_tax !== undefined && changes.price_with_tax === undefined) {
          const rate = changes.tax_rate !== undefined ? changes.tax_rate : p.tax_rate;
          updated.price_with_tax = Math.round(changes.price_without_tax * (1 + rate / 100));
          updated.sellingPrice = updated.price_with_tax;
        }

        if (changes.price_with_tax !== undefined) {
          updated.sellingPrice = changes.price_with_tax;
        }

        const newStock = changes.stockQuantity !== undefined ? changes.stockQuantity : p.stockQuantity;
        const newReorder = changes.reorderPoint !== undefined ? changes.reorderPoint : p.reorderPoint;
        const newMax = changes.maxCapacity !== undefined ? changes.maxCapacity : p.maxCapacity;
        updated.status = calculateStatus(newStock, newReorder, newMax);
        updated.updatedAt = today;

        // Audit logging for price or tax adjustments
        if (
          (changes.price_without_tax !== undefined && changes.price_without_tax !== p.price_without_tax) ||
          (changes.price_with_tax !== undefined && changes.price_with_tax !== p.price_with_tax) ||
          (changes.tax_rate !== undefined && changes.tax_rate !== p.tax_rate)
        ) {
          newTransactions.push({
            id: `tx-${Date.now()}-${p.id.substring(p.id.length - 4)}`,
            productId: p.id,
            productSku: p.sku,
            productName: p.product_name_eng,
            type: 'adjustment',
            quantity: 0,
            previousStock: p.stockQuantity,
            newStock: p.stockQuantity,
            reason:
              auditReason ||
              `Bulk Update: 税抜 ¥${p.price_without_tax}→¥${updated.price_without_tax}, 税込 ¥${p.price_with_tax}→¥${updated.price_with_tax}, 税率 ${p.tax_rate}%→${updated.tax_rate}%`,
            timestamp: new Date().toISOString(),
            performedBy: adminUser?.name || 'Admin',
          });
        }

        return updated;
      })
    );

    if (newTransactions.length > 0) {
      setTransactions(tPrev => [...newTransactions, ...tPrev]);
    }
  };

  const batchAssignFolder = (ids: string[], folderId: string) => {
    setProducts(prev =>
      prev.map(p => (ids.includes(p.id) ? { ...p, folderId, updatedAt: new Date().toISOString().split('T')[0] } : p))
    );
  };

  const adjustStock = (id: string, delta: number, reason: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const newStock = Math.max(0, p.stockQuantity + delta);
        const updatedStatus = calculateStatus(newStock, p.reorderPoint, p.maxCapacity);

        const tx: StockTransaction = {
          id: `tx-${Date.now()}`,
          productId: p.id,
          productSku: p.sku,
          productName: p.product_name_eng,
          type: delta >= 0 ? 'inflow' : 'outflow',
          quantity: Math.abs(delta),
          previousStock: p.stockQuantity,
          newStock,
          reason,
          timestamp: new Date().toISOString(),
          performedBy: adminUser?.name || 'Admin',
        };
        setTransactions(tPrev => [tx, ...tPrev]);

        return {
          ...p,
          stockQuantity: newStock,
          status: updatedStatus,
          lastRestocked: delta > 0 ? new Date().toISOString().split('T')[0] : p.lastRestocked,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const addFolder = (folderData: {
    name: string;
    code: string;
    description: string;
    color: string;
    type?: FolderType;
    storeLocation?: string;
    markupPercent?: number;
  }): ProductFolder => {
    const newFolder: ProductFolder = {
      id: `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: folderData.name.trim(),
      code: folderData.code.trim().toUpperCase(),
      description: folderData.description.trim(),
      color: folderData.color || '#3b82f6',
      type: folderData.type || 'shop',
      storeLocation: folderData.storeLocation?.trim(),
      markupPercent: folderData.markupPercent || 0,
      createdAt: new Date().toISOString(),
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  };

  const updateFolder = (id: string, updates: Partial<ProductFolder>) => {
    setFolders(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteFolder = (id: string, fallbackFolderId?: string) => {
    const targetFolder = fallbackFolderId || folders.find(f => f.id !== id)?.id || '';
    if (targetFolder) {
      setProducts(prev =>
        prev.map(p => (p.folderId === id ? { ...p, folderId: targetFolder } : p))
      );
    }
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  const duplicateProductToFolder = (
    productId: string,
    targetFolderId: string,
    customPriceWithoutTax?: number,
    customTaxRate?: number
  ): Product | null => {
    const source = products.find(p => p.id === productId);
    if (!source) return null;

    const targetFolder = folders.find(f => f.id === targetFolderId);
    const today = new Date().toISOString().split('T')[0];
    const maxSerial = products.reduce((max, p) => Math.max(max, p.serial || 0), 0);
    const serial = maxSerial + 1;

    let priceEx = customPriceWithoutTax !== undefined ? customPriceWithoutTax : source.price_without_tax;
    if (customPriceWithoutTax === undefined && targetFolder?.markupPercent) {
      priceEx = Math.round(source.price_without_tax * (1 + targetFolder.markupPercent / 100));
    }
    const taxRate = customTaxRate !== undefined ? customTaxRate : (source.tax_rate ?? 8.0);
    const priceInc = Math.round(priceEx * (1 + taxRate / 100));

    const masterSku = source.masterSku || source.sku;
    const shopCode = targetFolder?.code?.replace(/[^A-Za-z0-9]/g, '').slice(0, 4) || 'SHP';
    const newSku = `${masterSku}-${shopCode}`;

    const newProduct: Product = {
      ...source,
      id: `prod-shop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serial,
      sku: newSku,
      masterSku,
      folderId: targetFolderId,
      price_without_tax: priceEx,
      price_with_tax: priceInc,
      tax_rate: taxRate,
      sellingPrice: priceInc,
      unitCost: Math.round(priceEx * 0.7),
      lastRestocked: today,
      updatedAt: today,
    };

    setProducts(prev => [newProduct, ...prev]);

    const tx: StockTransaction = {
      id: `tx-clone-${Date.now()}`,
      productId: newProduct.id,
      productSku: newProduct.sku,
      productName: newProduct.product_name_eng,
      type: 'adjustment',
      quantity: newProduct.stockQuantity,
      previousStock: 0,
      newStock: newProduct.stockQuantity,
      reason: `Multi-Shop Clone: Duplicated into ${targetFolder?.name || 'Shop'} with price ¥${priceEx.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      performedBy: adminUser?.name || 'Admin',
    };
    setTransactions(tPrev => [tx, ...tPrev]);

    return newProduct;
  };

  const batchDuplicateToFolder = (
    productIds: string[],
    targetFolderId: string,
    priceMultiplier = 1.0
  ): number => {
    let count = 0;
    productIds.forEach(id => {
      const source = products.find(p => p.id === id);
      if (source && source.folderId !== targetFolderId) {
        const customPrice = Math.round(source.price_without_tax * priceMultiplier);
        duplicateProductToFolder(id, targetFolderId, customPrice);
        count++;
      }
    });
    return count;
  };

  const bulkImportProducts = (
    items: Array<{
      serial?: number;
      sku?: string;
      product_name_eng: string;
      product_name_jp?: string;
      weight_unit?: string;
      tax_rate?: number;
      price_without_tax: number;
      price_with_tax?: number;
      origin?: string;
      folderId?: string;
      category?: string;
      stockQuantity?: number;
      barcode?: string;
      location?: string;
      supplier?: string;
    }>,
    options?: {
      updateExisting?: boolean;
      defaultFolderId?: string;
    }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    let maxSerial = products.reduce((max, p) => Math.max(max, p.serial || 0), 0);
    let imported = 0;
    let updated = 0;

    const existingSkuMap = new Map(products.map(p => [p.sku.toLowerCase(), p]));
    const existingSerialMap = new Map(products.map(p => [p.serial, p]));
    const fallbackFolderId = options?.defaultFolderId || folders[0]?.id || 'fld-shop-tokyo';

    const newProductsList: Product[] = [];
    const updatedMap = new Map<string, Partial<Product>>();

    items.forEach(item => {
      let taxRate = item.tax_rate !== undefined && !isNaN(Number(item.tax_rate)) ? Number(item.tax_rate) : 8.0;
      if (taxRate > 0 && taxRate <= 1.0) {
        // Excel stores 10% as 0.1 and 8% as 0.08
        taxRate = Math.round(taxRate * 100 * 10) / 10;
      }
      const priceEx = Math.max(0, Math.round(Number(item.price_without_tax) || 0));
      const priceInc = item.price_with_tax && !isNaN(Number(item.price_with_tax))
        ? Math.round(Number(item.price_with_tax))
        : Math.round(priceEx * (1 + taxRate / 100));

      const matchedExisting =
        (options?.updateExisting && item.sku && existingSkuMap.get(item.sku.toLowerCase())) ||
        (options?.updateExisting && item.serial && existingSerialMap.get(item.serial));

      if (matchedExisting) {
        updatedMap.set(matchedExisting.id, {
          product_name_eng: item.product_name_eng || matchedExisting.product_name_eng,
          product_name_jp: item.product_name_jp ?? matchedExisting.product_name_jp,
          price_without_tax: priceEx,
          price_with_tax: priceInc,
          tax_rate: taxRate,
          sellingPrice: priceInc,
          weight_unit: item.weight_unit || matchedExisting.weight_unit,
          origin: (item.origin || matchedExisting.origin).toUpperCase(),
          folderId: item.folderId || matchedExisting.folderId,
          stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : matchedExisting.stockQuantity,
          updatedAt: today,
        });
        updated++;
      } else {
        maxSerial++;
        const serial = item.serial && !existingSerialMap.has(item.serial) ? item.serial : maxSerial;
        const code = (item.product_name_eng || 'ITEM').replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
        const sku = item.sku || `${code}-${String(serial).padStart(3, '0')}`;
        const stock = item.stockQuantity !== undefined ? item.stockQuantity : 50;

        const newP: Product = {
          id: `prod-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          serial,
          sku,
          barcode: item.barcode,
          masterSku: sku,
          name: item.product_name_eng.trim(),
          product_name_eng: item.product_name_eng.trim(),
          product_name_jp: (item.product_name_jp || item.product_name_eng).trim(),
          weight_unit: (item.weight_unit || '1 pc').trim(),
          tax_rate: taxRate,
          price_without_tax: priceEx,
          price_with_tax: priceInc,
          origin: (item.origin || 'UNKNOWN').trim().toUpperCase(),
          folderId: item.folderId || fallbackFolderId,
          category: item.category || 'General Halal Food',
          description: `${item.product_name_jp || item.product_name_eng} (${item.origin || 'Imported'})`,
          unitCost: Math.round(priceEx * 0.7),
          sellingPrice: priceInc,
          stockQuantity: stock,
          reorderPoint: 15,
          maxCapacity: 300,
          unit: 'pcs',
          location: item.location || 'Store Floor',
          supplier: item.supplier || `${item.origin || 'General'} Wholesale`,
          leadTimeDays: 7,
          lastRestocked: today,
          updatedAt: today,
          status: calculateStatus(stock, 15, 300),
        };
        newProductsList.push(newP);
        imported++;
      }
    });

    if (newProductsList.length > 0 || updatedMap.size > 0) {
      setProducts(prev => {
        let list = prev.map(p => {
          const upd = updatedMap.get(p.id);
          return upd ? { ...p, ...upd } : p;
        });
        return [...newProductsList, ...list];
      });

      const tx: StockTransaction = {
        id: `tx-imp-${Date.now()}`,
        productId: 'bulk-batch',
        productSku: 'EXCEL-IMPORT',
        productName: `Bulk Excel Import (${imported} new, ${updated} updated)`,
        type: 'inflow',
        quantity: imported,
        previousStock: products.length,
        newStock: products.length + imported,
        reason: `Bulk Excel/CSV Import: Added ${imported} products, updated ${updated} records.`,
        timestamp: new Date().toISOString(),
        performedBy: adminUser?.name || 'Admin',
      };
      setTransactions(tPrev => [tx, ...tPrev]);
    }

    return { imported, updated, total: items.length };
  };

  const clearAllData = () => {
    setProducts([]);
    setFolders([]);
    setTransactions([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.FOLDERS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem('bimi_tag_pro_products_catalog_exact_367');
      localStorage.removeItem('bimi_tag_pro_folders_catalog_exact_367');
      localStorage.removeItem('bimi_tag_pro_transactions_catalog_exact_367');
    } catch (e) {
      console.error('Error clearing data', e);
    }
  };

  const resetToDemo = () => {
    clearAllData();
  };

  const exportCSV = (itemsToExport?: Product[], customFilename?: string) => {
    const list = itemsToExport && itemsToExport.length > 0 ? itemsToExport : products;
    const headers = [
      'serial',
      'sku',
      'product_name_eng',
      'product_name_jp',
      'origin',
      'category_folder',
      'weight_unit',
      'tax_rate_percent',
      'price_without_tax_jpy',
      'price_with_tax_jpy',
      'stock_quantity',
      'stock_status',
      'reorder_point',
      'max_capacity',
      'unit_cost_jpy',
      'total_valuation_without_tax_jpy',
      'total_valuation_with_tax_jpy',
      'storage_location',
      'supplier',
      'last_restocked',
      'last_updated',
    ];

    const folderMap = new Map(folders.map(f => [f.id, f.name]));

    const escapeCSV = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = list.map(p => {
      const folderName = folderMap.get(p.folderId) || 'Unassigned';
      const valNoTax = Math.round((p.stockQuantity || 0) * (p.price_without_tax || 0));
      const valWithTax = Math.round((p.stockQuantity || 0) * (p.price_with_tax || 0));

      return [
        p.serial,
        escapeCSV(p.sku),
        escapeCSV(p.product_name_eng),
        escapeCSV(p.product_name_jp),
        escapeCSV(p.origin),
        escapeCSV(folderName),
        escapeCSV(p.weight_unit),
        `${(p.tax_rate ?? 8.0).toFixed(1)}%`,
        p.price_without_tax ?? 0,
        p.price_with_tax ?? 0,
        p.stockQuantity ?? 0,
        escapeCSV(p.status),
        p.reorderPoint ?? 0,
        p.maxCapacity ?? 0,
        p.unitCost ?? 0,
        valNoTax,
        valWithTax,
        escapeCSV(p.location || 'Store Floor'),
        escapeCSV(p.supplier || 'Standard Sourcing'),
        escapeCSV(p.lastRestocked || '-'),
        escapeCSV(p.updatedAt || '-'),
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = customFilename || `bimi_tag_pro_inventory_catalog_${dateStr}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        folders,
        transactions,
        adminUser,
        isAuthenticated: !!adminUser,
        login,
        logout,
        addProduct,
        updateProduct,
        batchUpdateProducts,
        deleteProduct,
        batchDeleteProducts,
        batchAssignFolder,
        adjustStock,
        addFolder,
        updateFolder,
        deleteFolder,
        bulkImportProducts,
        duplicateProductToFolder,
        batchDuplicateToFolder,
        clearAllData,
        resetToDemo,
        exportCSV,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
