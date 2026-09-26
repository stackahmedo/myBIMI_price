import React, { useState, useMemo } from 'react';
import { Product } from '../types/inventory';
import {
  X,
  Percent,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Check,
  RefreshCw,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Tag,
  Search,
  Trash2
} from 'lucide-react';

interface BulkPriceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProductIds: string[];
  onApplyBulkUpdate: (
    updates: { id: string; changes: Partial<Product> }[],
    auditReason: string
  ) => void;
}

type PriceAdjustmentMode = 'percentage' | 'fixed_amount' | 'set_base' | 'set_with_tax';
type RoundingOption = 'integer' | 'nearest_5' | 'nearest_10';

export const BulkPriceEditModal: React.FC<BulkPriceEditModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProductIds,
  onApplyBulkUpdate,
}) => {
  // Local active target selection (allows removing items without closing)
  const [activeSelectedIds, setActiveSelectedIds] = useState<string[]>(selectedProductIds);

  // Sync if selectedProductIds changes while opening
  React.useEffect(() => {
    setActiveSelectedIds(selectedProductIds);
  }, [selectedProductIds]);

  // Search in preview
  const [previewSearch, setPreviewSearch] = useState('');

  // Tax Rate Settings
  const [enableTaxUpdate, setEnableTaxUpdate] = useState(true);
  const [selectedTaxPreset, setSelectedTaxPreset] = useState<'8' | '10' | '0' | 'custom'>('8');
  const [customTaxRate, setCustomTaxRate] = useState<string>('8.0');
  const [taxRecalcMode, setTaxRecalcMode] = useState<'recalc_with_tax' | 'recalc_base'>('recalc_with_tax');

  // Price Settings
  const [enablePriceUpdate, setEnablePriceUpdate] = useState(false);
  const [priceAdjustmentMode, setPriceAdjustmentMode] = useState<PriceAdjustmentMode>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('10'); // +10% or +50 yen
  const [priceAdjustmentTarget, setPriceAdjustmentTarget] = useState<'base' | 'with_tax'>('base');
  const [roundingOption, setRoundingOption] = useState<RoundingOption>('integer');

  // Audit Reason
  const [auditReason, setAuditReason] = useState('Bulk Price & Tax Update');
  const [formError, setFormError] = useState('');

  // Get active products to edit
  const targetProducts = useMemo(() => {
    const set = new Set(activeSelectedIds);
    return products.filter(p => set.has(p.id));
  }, [products, activeSelectedIds]);

  // Compute active target tax rate
  const resolvedTaxRate = useMemo(() => {
    if (!enableTaxUpdate) return null;
    if (selectedTaxPreset === '8') return 8.0;
    if (selectedTaxPreset === '10') return 10.0;
    if (selectedTaxPreset === '0') return 0.0;
    const parsed = parseFloat(customTaxRate);
    return isNaN(parsed) ? 8.0 : Math.max(0, parsed);
  }, [enableTaxUpdate, selectedTaxPreset, customTaxRate]);

  // Rounding helper
  const applyRounding = (val: number, option: RoundingOption): number => {
    const base = Math.round(val);
    if (option === 'nearest_5') {
      return Math.round(base / 5) * 5;
    }
    if (option === 'nearest_10') {
      return Math.round(base / 10) * 10;
    }
    return Math.max(0, base);
  };

  // Preview calculations for each product
  const previewData = useMemo(() => {
    const numAdj = parseFloat(adjustmentValue) || 0;

    return targetProducts.map(p => {
      const origTax = p.tax_rate;
      const origBase = p.price_without_tax;
      const origWithTax = p.price_with_tax;

      const newTaxRate = resolvedTaxRate !== null ? resolvedTaxRate : origTax;

      let newBase = origBase;
      let newWithTax = origWithTax;

      if (enablePriceUpdate) {
        if (priceAdjustmentMode === 'percentage') {
          // Adjust by %
          const factor = 1 + numAdj / 100;
          if (priceAdjustmentTarget === 'base') {
            newBase = applyRounding(origBase * factor, roundingOption);
            newWithTax = applyRounding(newBase * (1 + newTaxRate / 100), 'integer');
          } else {
            newWithTax = applyRounding(origWithTax * factor, roundingOption);
            newBase = applyRounding(newWithTax / (1 + newTaxRate / 100), 'integer');
          }
        } else if (priceAdjustmentMode === 'fixed_amount') {
          // Adjust by flat yen
          if (priceAdjustmentTarget === 'base') {
            newBase = applyRounding(Math.max(0, origBase + numAdj), roundingOption);
            newWithTax = applyRounding(newBase * (1 + newTaxRate / 100), 'integer');
          } else {
            newWithTax = applyRounding(Math.max(0, origWithTax + numAdj), roundingOption);
            newBase = applyRounding(newWithTax / (1 + newTaxRate / 100), 'integer');
          }
        } else if (priceAdjustmentMode === 'set_base') {
          // Uniform Base Price
          newBase = applyRounding(Math.max(0, numAdj), roundingOption);
          newWithTax = applyRounding(newBase * (1 + newTaxRate / 100), 'integer');
        } else if (priceAdjustmentMode === 'set_with_tax') {
          // Uniform Retail Price
          newWithTax = applyRounding(Math.max(0, numAdj), roundingOption);
          newBase = applyRounding(newWithTax / (1 + newTaxRate / 100), 'integer');
        }
      } else if (enableTaxUpdate && resolvedTaxRate !== null && resolvedTaxRate !== origTax) {
        // Only Tax rate changed
        if (taxRecalcMode === 'recalc_with_tax') {
          newBase = origBase;
          newWithTax = applyRounding(origBase * (1 + newTaxRate / 100), 'integer');
        } else {
          newWithTax = origWithTax;
          newBase = applyRounding(origWithTax / (1 + newTaxRate / 100), 'integer');
        }
      }

      const diffWithTax = newWithTax - origWithTax;
      const diffBase = newBase - origBase;
      const hasChanged = newTaxRate !== origTax || newBase !== origBase || newWithTax !== origWithTax;

      return {
        product: p,
        origTax,
        newTaxRate,
        origBase,
        newBase,
        origWithTax,
        newWithTax,
        diffWithTax,
        diffBase,
        hasChanged,
      };
    });
  }, [
    targetProducts,
    enableTaxUpdate,
    resolvedTaxRate,
    taxRecalcMode,
    enablePriceUpdate,
    priceAdjustmentMode,
    adjustmentValue,
    priceAdjustmentTarget,
    roundingOption,
  ]);

  // Filtered preview
  const filteredPreview = useMemo(() => {
    if (!previewSearch.trim()) return previewData;
    const q = previewSearch.toLowerCase();
    return previewData.filter(
      item =>
        String(item.product.serial).includes(q) ||
        item.product.product_name_eng.toLowerCase().includes(q) ||
        (item.product.product_name_jp || '').toLowerCase().includes(q) ||
        (item.product.origin || '').toLowerCase().includes(q)
    );
  }, [previewData, previewSearch]);

  // Aggregate stats
  const totalCount = targetProducts.length;
  const changedCount = previewData.filter(d => d.hasChanged).length;
  const totalValuationDelta = previewData.reduce((acc, d) => acc + d.diffWithTax * d.product.stockQuantity, 0);

  const handleRemoveFromActive = (productId: string) => {
    setActiveSelectedIds(prev => prev.filter(id => id !== productId));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetProducts.length === 0) {
      setFormError('No products currently selected for bulk edit.');
      return;
    }
    if (!enableTaxUpdate && !enablePriceUpdate) {
      setFormError('Please enable either Tax Percentage update or Price Adjustment.');
      return;
    }

    const updates = previewData.map(item => ({
      id: item.product.id,
      changes: {
        tax_rate: item.newTaxRate,
        price_without_tax: item.newBase,
        price_with_tax: item.newWithTax,
        sellingPrice: item.newWithTax,
      },
    }));

    onApplyBulkUpdate(updates, auditReason.trim() || 'Bulk Price & Tax Update');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  Bulk Price & Tax Editor
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 text-red-700">
                  {totalCount} item{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Batch update consumption tax percentage, base prices, and retail shelf pricing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Box 1: Tax Percentage Controls */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                enableTaxUpdate
                  ? 'bg-white border-red-300 ring-2 ring-red-50'
                  : 'bg-stone-50/60 border-stone-200 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTaxUpdate}
                    onChange={e => setEnableTaxUpdate(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500"
                  />
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-red-600" />
                    <span>Update Tax Percentage</span>
                  </span>
                </label>
                <span className="text-[11px] font-mono text-stone-400">軽減税率 / 標準税率</span>
              </div>

              {enableTaxUpdate && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  {/* Preset Pills */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                      Standard Japanese Tax Rates
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setSelectedTaxPreset('8')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold transition-all ${
                          selectedTaxPreset === '8'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        8.0% (Food)
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTaxPreset('10')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold transition-all ${
                          selectedTaxPreset === '10'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        10.0% (Std)
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTaxPreset('0')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold transition-all ${
                          selectedTaxPreset === '0'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        0.0% (Free)
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTaxPreset('custom')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold transition-all ${
                          selectedTaxPreset === 'custom'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        Custom %
                      </button>
                    </div>
                  </div>

                  {selectedTaxPreset === 'custom' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Custom Tax Percentage Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={customTaxRate}
                          onChange={e => setCustomTaxRate(e.target.value)}
                          placeholder="e.g. 5.0"
                          className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                        <span className="absolute right-3 top-1.5 text-xs font-mono text-stone-400 font-bold">%</span>
                      </div>
                    </div>
                  )}

                  {/* Recalculation behavior */}
                  <div className="pt-2 border-t border-stone-100">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                      When Tax Rate Changes:
                    </label>
                    <div className="space-y-1.5 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-stone-800">
                        <input
                          type="radio"
                          name="taxRecalc"
                          checked={taxRecalcMode === 'recalc_with_tax'}
                          onChange={() => setTaxRecalcMode('recalc_with_tax')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>Recalculate 税込 (Keep base price without tax fixed)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-stone-800">
                        <input
                          type="radio"
                          name="taxRecalc"
                          checked={taxRecalcMode === 'recalc_base'}
                          onChange={() => setTaxRecalcMode('recalc_base')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>Recalculate 税抜 (Keep customer shelf price 税込 fixed)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Box 2: Price Fields Controls */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                enablePriceUpdate
                  ? 'bg-white border-emerald-300 ring-2 ring-emerald-50'
                  : 'bg-stone-50/60 border-stone-200 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePriceUpdate}
                    onChange={e => setEnablePriceUpdate(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Update Price Fields (税抜 / 税込)</span>
                  </span>
                </label>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">Pricing Action</span>
              </div>

              {enablePriceUpdate && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  {/* Adjustment Mode Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Adjustment Operation
                    </label>
                    <select
                      value={priceAdjustmentMode}
                      onChange={e => setPriceAdjustmentMode(e.target.value as PriceAdjustmentMode)}
                      className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="percentage">Percentage Change (% Markup or Discount)</option>
                      <option value="fixed_amount">Fixed Yen Shift (+ / - ¥ flat amount)</option>
                      <option value="set_base">Set Uniform Base Price (税抜 price_without_tax)</option>
                      <option value="set_with_tax">Set Uniform Retail Price (税込 price_with_tax)</option>
                    </select>
                  </div>

                  {/* Adjustment Value and Target */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        {priceAdjustmentMode === 'percentage'
                          ? 'Percentage (+% / -%)'
                          : priceAdjustmentMode === 'fixed_amount'
                          ? 'Shift Amount (+¥ / -¥)'
                          : 'New Fixed Amount (¥)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={priceAdjustmentMode === 'percentage' ? '0.5' : '1'}
                          value={adjustmentValue}
                          onChange={e => setAdjustmentValue(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="absolute right-3 top-1.5 text-xs font-mono text-stone-400 font-bold">
                          {priceAdjustmentMode === 'percentage' ? '%' : '¥'}
                        </span>
                      </div>
                    </div>

                    {(priceAdjustmentMode === 'percentage' || priceAdjustmentMode === 'fixed_amount') && (
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          Apply Shift To:
                        </label>
                        <select
                          value={priceAdjustmentTarget}
                          onChange={e => setPriceAdjustmentTarget(e.target.value as 'base' | 'with_tax')}
                          className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium focus:outline-none focus:border-emerald-500"
                        >
                          <option value="base">Base Price (税抜)</option>
                          <option value="with_tax">Retail Price (税込)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Rounding Rules */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600">
                        Price Rounding Rule
                      </label>
                      <p className="text-[10px] text-stone-400">Convenient for Japanese retail price points</p>
                    </div>

                    <select
                      value={roundingOption}
                      onChange={e => setRoundingOption(e.target.value as RoundingOption)}
                      className="px-2 py-1 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="integer">Exact Yen (¥1)</option>
                      <option value="nearest_5">Nearest ¥5 (e.g. ¥195)</option>
                      <option value="nearest_10">Nearest ¥10 (e.g. ¥200)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Impact Stats Banner */}
          <div className="p-3 sm:p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-stone-800">
                {changedCount} of {totalCount} product{totalCount !== 1 ? 's' : ''} will be updated
              </span>
            </div>

            <div className="flex items-center gap-4 font-mono">
              <div className="text-stone-500">
                Target Tax Rate:{' '}
                <span className="text-red-600 font-bold">
                  {enableTaxUpdate ? `${resolvedTaxRate}%` : 'Unchanged'}
                </span>
              </div>
              <div className="text-stone-500">
                Inventory Valuation Shift:{' '}
                <span
                  className={`font-bold ${
                    totalValuationDelta > 0
                      ? 'text-emerald-600'
                      : totalValuationDelta < 0
                      ? 'text-red-600'
                      : 'text-stone-600'
                  }`}
                >
                  {totalValuationDelta >= 0 ? `+¥${totalValuationDelta.toLocaleString()}` : `-¥${Math.abs(totalValuationDelta).toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* Live Preview Table */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">
                  Live Change Preview
                </h3>
                <p className="text-[11px] text-stone-500">
                  Inspect the calculated tax rates and price differences before saving
                </p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={previewSearch}
                  onChange={e => setPreviewSearch(e.target.value)}
                  placeholder="Filter preview items..."
                  className="w-full pl-8 pr-3 py-1 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-stone-100 border-b border-stone-200 text-stone-600 text-[10px] uppercase font-mono font-bold z-10">
                  <tr>
                    <th className="py-2 px-3">Serial & Item</th>
                    <th className="py-2 px-3 text-center">Tax %</th>
                    <th className="py-2 px-3 text-right">税抜 (Base)</th>
                    <th className="py-2 px-3 text-right">税込 (Retail)</th>
                    <th className="py-2 px-3 text-right">Net Shift</th>
                    <th className="py-2 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-xs">
                  {filteredPreview.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 font-sans">
                        No products match current preview filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPreview.map(item => {
                      const taxChanged = item.newTaxRate !== item.origTax;
                      const baseChanged = item.newBase !== item.origBase;
                      const withTaxChanged = item.newWithTax !== item.origWithTax;

                      return (
                        <tr key={item.product.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-700 bg-stone-100 px-1 py-0.5 rounded text-[11px]">
                                #{item.product.serial}
                              </span>
                              <span className="font-sans font-bold text-stone-900 truncate max-w-[180px] sm:max-w-[220px]">
                                {item.product.product_name_eng}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-400 font-sans">
                              {item.product.product_name_jp || item.product.origin}
                            </div>
                          </td>

                          {/* Tax % */}
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            {taxChanged ? (
                              <div className="flex items-center justify-center gap-1 text-[11px]">
                                <span className="text-stone-400 line-through">{item.origTax}%</span>
                                <ArrowRight className="w-3 h-3 text-stone-400" />
                                <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                  {item.newTaxRate}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-stone-600">{item.origTax}%</span>
                            )}
                          </td>

                          {/* Base Price 税抜 */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            {baseChanged ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-stone-400 text-[11px] line-through">¥{item.origBase}</span>
                                <span className="font-bold text-stone-900">¥{item.newBase}</span>
                              </div>
                            ) : (
                              <span className="text-stone-700">¥{item.origBase}</span>
                            )}
                          </td>

                          {/* Retail Price 税込 */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            {withTaxChanged ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-stone-400 text-[11px] line-through">¥{item.origWithTax}</span>
                                <span className="font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                  ¥{item.newWithTax}
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-red-600">¥{item.origWithTax}</span>
                            )}
                          </td>

                          {/* Net Shift */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            {item.diffWithTax !== 0 ? (
                              <span
                                className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${
                                  item.diffWithTax > 0
                                    ? 'text-red-700 bg-red-50'
                                    : 'text-emerald-700 bg-emerald-50'
                                }`}
                              >
                                {item.diffWithTax > 0 ? `+¥${item.diffWithTax}` : `-¥${Math.abs(item.diffWithTax)}`}
                              </span>
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>

                          {/* Quick Remove from selection */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromActive(item.product.id)}
                              title="Exclude from this bulk edit"
                              className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Ledger Note */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Audit Ledger Justification Note *
            </label>
            <input
              type="text"
              value={auditReason}
              onChange={e => setAuditReason(e.target.value)}
              placeholder="e.g. 2026 Spring Consumption Tax Alignment, Retail Promotion"
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={changedCount === 0 && (!enableTaxUpdate && !enablePriceUpdate)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Apply Updates ({changedCount} items)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
