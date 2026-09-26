import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';
import { X, Tag, Calculator, AlertCircle, Sparkles } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  defaultFolderId?: string;
}

const COMMON_ORIGINS = [
  'JAPAN',
  'BANGLADESH',
  'PAKISTAN',
  'VIETNAM',
  'THAILAND',
  'INDIA',
  'NEPAL',
  'AUSTRALIA',
  'BRAZIL',
  'TURKEY',
  'USA',
  'UNKNOWN',
];

const COMMON_WEIGHT_UNITS = [
  '1kg',
  '500gm',
  '200gm',
  '100gm',
  '50gm',
  '40gm',
  '1pc',
  '1packet',
  '1l',
  '500ml',
  '200ml',
  '5kg',
  '10kg',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  defaultFolderId,
}) => {
  const { folders, addProduct, updateProduct, adminUser } = useInventory();

  // Form states matching user's exact specification
  const [productNameEng, setProductNameEng] = useState('');
  const [productNameJp, setProductNameJp] = useState('');
  const [weightUnit, setWeightUnit] = useState('100gm');
  const [taxRate, setTaxRate] = useState<number>(8.0);
  const [priceWithoutTax, setPriceWithoutTax] = useState<string>('300');
  const [priceWithTax, setPriceWithTax] = useState<string>('324');
  const [origin, setOrigin] = useState('BANGLADESH');
  const [folderId, setFolderId] = useState('');
  const [category, setCategory] = useState('');
  const [stockQuantity, setStockQuantity] = useState<string>('50');
  const [reorderPoint, setReorderPoint] = useState<string>('15');
  const [location, setLocation] = useState('Aisle 1 · Shelf A');
  const [error, setError] = useState('');

  // Mode tracker to prevent recursive price recalculation loops
  const [lastEditedField, setLastEditedField] = useState<'without_tax' | 'with_tax'>('without_tax');

  useEffect(() => {
    if (productToEdit) {
      setProductNameEng(productToEdit.product_name_eng || productToEdit.name);
      setProductNameJp(productToEdit.product_name_jp || '');
      setWeightUnit(productToEdit.weight_unit || '1pc');
      setTaxRate(productToEdit.tax_rate ?? 8.0);
      setPriceWithoutTax(String(productToEdit.price_without_tax ?? 0));
      setPriceWithTax(String(productToEdit.price_with_tax ?? 0));
      setOrigin(productToEdit.origin || 'UNKNOWN');
      setFolderId(productToEdit.folderId);
      setCategory(productToEdit.category || '');
      setStockQuantity(String(productToEdit.stockQuantity ?? 50));
      setReorderPoint(String(productToEdit.reorderPoint ?? 15));
      setLocation(productToEdit.location || 'Aisle 1 · Shelf A');
    } else {
      const chosen = defaultFolderId && folders.some(f => f.id === defaultFolderId)
        ? defaultFolderId
        : folders[0]?.id || '';
      setProductNameEng('');
      setProductNameJp('');
      setWeightUnit('100gm');
      setTaxRate(8.0);
      setPriceWithoutTax('324');
      setPriceWithTax('350');
      setOrigin('BANGLADESH');
      setFolderId(chosen);
      setCategory('Spices & Food');
      setStockQuantity('60');
      setReorderPoint('20');
      setLocation('Aisle 2 · Shelf B');
    }
    setError('');
  }, [productToEdit, defaultFolderId, folders, isOpen]);

  if (!isOpen) return null;

  // Handle price without tax change
  const handlePriceWithoutTaxChange = (val: string) => {
    setPriceWithoutTax(val);
    setLastEditedField('without_tax');
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const calculated = Math.round(num * (1 + taxRate / 100));
      setPriceWithTax(String(calculated));
    }
  };

  // Handle price with tax change
  const handlePriceWithTaxChange = (val: string) => {
    setPriceWithTax(val);
    setLastEditedField('with_tax');
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const calculated = Math.round(num / (1 + taxRate / 100));
      setPriceWithoutTax(String(calculated));
    }
  };

  // Recalculate if tax % toggle changes
  const handleTaxRateChange = (newRate: number) => {
    setTaxRate(newRate);
    if (lastEditedField === 'without_tax') {
      const num = parseFloat(priceWithoutTax);
      if (!isNaN(num) && num >= 0) {
        setPriceWithTax(String(Math.round(num * (1 + newRate / 100))));
      }
    } else {
      const num = parseFloat(priceWithTax);
      if (!isNaN(num) && num >= 0) {
        setPriceWithoutTax(String(Math.round(num / (1 + newRate / 100))));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productNameEng.trim()) {
      setError('Product English Name is required.');
      return;
    }

    const withoutTax = parseFloat(priceWithoutTax);
    const withTax = parseFloat(priceWithTax);
    const stock = parseInt(stockQuantity, 10);
    const reorder = parseInt(reorderPoint, 10);

    if (isNaN(withoutTax) || isNaN(withTax) || withoutTax < 0 || withTax < 0) {
      setError('Please provide valid pricing amounts.');
      return;
    }

    if (productToEdit) {
      updateProduct(
        productToEdit.id,
        {
          name: productNameEng.trim(),
          product_name_eng: productNameEng.trim(),
          product_name_jp: productNameJp.trim(),
          weight_unit: weightUnit.trim() || '1pc',
          tax_rate: taxRate,
          price_without_tax: withoutTax,
          price_with_tax: withTax,
          sellingPrice: withTax,
          unitCost: Math.round(withoutTax * 0.7),
          origin: origin.trim().toUpperCase() || 'UNKNOWN',
          folderId,
          category: category.trim() || 'Food',
          stockQuantity: isNaN(stock) ? 50 : stock,
          reorderPoint: isNaN(reorder) ? 15 : reorder,
          location: location.trim(),
        },
        'Price tag / product specifications revised'
      );
    } else {
      addProduct({
        product_name_eng: productNameEng.trim(),
        product_name_jp: productNameJp.trim(),
        weight_unit: weightUnit.trim() || '1pc',
        tax_rate: taxRate,
        price_without_tax: withoutTax,
        price_with_tax: withTax,
        origin: origin.trim().toUpperCase() || 'UNKNOWN',
        folderId: folderId || folders[0]?.id || '',
        category: category.trim() || 'Food',
        stockQuantity: isNaN(stock) ? 50 : stock,
        reorderPoint: isNaN(reorder) ? 15 : reorder,
        location: location.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-2xl my-4 sm:my-8 max-h-[96vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <Tag className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-stone-900">
            {productToEdit ? `Edit Price Tag #${productToEdit.serial}` : 'Create New Product Price Tag'}
          </h2>
        </div>
        <p className="text-xs text-stone-500 mb-5">
          Configure bilingual titles, weight unit, consumption tax calculation, and country of origin
        </p>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: English & Japanese Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Product Name (English) *
              </label>
              <input
                type="text"
                value={productNameEng}
                onChange={e => setProductNameEng(e.target.value)}
                required
                placeholder="e.g. AHMED BIRYANI MASALA 60G"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Product Name (Japanese / 日本語)
              </label>
              <input
                type="text"
                value={productNameJp}
                onChange={e => setProductNameJp(e.target.value)}
                placeholder="e.g. アーメド ビリヤニマサラ"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Section 2: Weight / Unit and Country of Origin */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Weight / Unit (weight/pc/unit)
              </label>
              <input
                type="text"
                value={weightUnit}
                onChange={e => setWeightUnit(e.target.value)}
                placeholder="e.g. 60gm, 1kg, 200ml, 1"
                className="w-full px-3 py-1.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white font-bold"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_WEIGHT_UNITS.slice(0, 5).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setWeightUnit(u)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 font-mono font-medium"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Country of Origin
              </label>
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value.toUpperCase())}
                placeholder="e.g. BANGLADESH, JAPAN"
                className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white font-bold"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['JAPAN', 'BANGLADESH', 'PAKISTAN', 'VIETNAM'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setOrigin(c)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100 font-mono font-medium"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Folder / Category Group *
              </label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white font-medium"
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Pricing & Tax Engine Card (White Card with Red / Green / Orange accents) */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>Price & Japanese Consumption Tax Calculation</span>
              </div>

              {/* Tax Rate Toggle */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-300 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleTaxRateChange(8.0)}
                  className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-md transition-colors ${
                    taxRate === 8.0 ? 'bg-red-600 text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  8.0% (Reduced Food)
                </button>
                <button
                  type="button"
                  onClick={() => handleTaxRateChange(10.0)}
                  className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-md transition-colors ${
                    taxRate === 10.0 ? 'bg-red-600 text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  10.0% (Standard)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Without Tax */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Price Without Tax (税抜価格)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-stone-500">¥</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={priceWithoutTax}
                    onChange={e => handlePriceWithoutTaxChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono font-bold bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-stone-500 shadow-xs"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Base product unit price before tax
                </span>
              </div>

              {/* With Tax */}
              <div>
                <label className="block text-xs font-bold text-red-600 mb-1">
                  Price With Tax (税込価格 · Tag Display)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-red-600">¥</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={priceWithTax}
                    onChange={e => handlePriceWithTaxChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono font-black bg-white border-2 border-red-500 rounded-lg text-red-600 focus:outline-none focus:ring-1 focus:ring-red-500 shadow-xs"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Includes {taxRate.toFixed(1)}% tax (Auto-calculated, rounded)
                </span>
              </div>
            </div>

            {/* Live Tag Preview Snippet */}
            <div className="mt-2 p-3 bg-white text-stone-900 rounded-lg border-2 border-dashed border-red-300 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[10px] font-black text-red-600 uppercase tracking-wider">
                  Price Tag Live Preview
                </div>
                <div className="text-xs font-black truncate max-w-[260px] text-stone-900">
                  {productNameEng || 'PRODUCT NAME'}
                </div>
                <div className="text-[11px] text-stone-600 font-semibold">{productNameJp || '商品名日本語'}</div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  Origin: {origin} · Net: {weightUnit}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-stone-500 font-mono">
                  税抜 ¥{Number(priceWithoutTax || 0).toLocaleString()} (+税{taxRate}%)
                </div>
                <div className="text-xl font-black text-red-600 font-mono tracking-tight leading-none">
                  ¥{Number(priceWithTax || 0).toLocaleString()}
                </div>
                <div className="text-[9px] text-stone-600 font-bold uppercase mt-0.5">税込価格 (Tax Incl.)</div>
              </div>
            </div>
          </div>

          {/* Section 4: Inventory & Stock Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Stock on Hand</label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={e => setStockQuantity(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Reorder Point</label>
              <input
                type="number"
                min="0"
                value={reorderPoint}
                onChange={e => setReorderPoint(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Store Shelf / Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Aisle 1 · Shelf A"
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-stone-200">
            <span className="text-[11px] text-stone-400 font-mono">
              Authorized: {adminUser?.name || 'Administrator'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
              >
                {productToEdit ? 'Save Price Tag Updates' : 'Add Price Tag to Catalog'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
