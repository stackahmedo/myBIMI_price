import React, { useState } from 'react';
import { Product } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import {
  Store,
  ArrowRight,
  Copy,
  CheckCircle2,
  X,
  Percent,
  Sparkles,
  Tag,
} from 'lucide-react';

interface CloneToShopModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (clonedProduct: Product) => void;
}

export const CloneToShopModal: React.FC<CloneToShopModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { folders, duplicateProductToFolder } = useInventory();

  // Find shop folders (or all folders if none marked as shop)
  const shopFolders = folders.filter(f => f.type === 'shop');
  const availableFolders = shopFolders.length > 0 ? shopFolders : folders;

  const currentFolder = folders.find(f => f.id === product?.folderId);
  const otherFolders = availableFolders.filter(f => f.id !== product?.folderId);

  const [targetFolderId, setTargetFolderId] = useState<string>(() => otherFolders[0]?.id || '');
  const [priceWithoutTax, setPriceWithoutTax] = useState<number>(() => product?.price_without_tax || 0);
  const [taxRate, setTaxRate] = useState<number>(() => product?.tax_rate || 8.0);

  // Sync when product changes
  React.useEffect(() => {
    if (product) {
      const target = folders.find(f => f.id !== product.folderId && (f.type === 'shop' || true));
      setTargetFolderId(target?.id || '');
      // If target has markup, apply it
      const markup = target?.markupPercent || 0;
      const initialPrice = Math.round(product.price_without_tax * (1 + markup / 100));
      setPriceWithoutTax(initialPrice);
      setTaxRate(product.tax_rate || 8.0);
    }
  }, [product, folders]);

  if (!isOpen || !product) return null;

  const selectedTargetFolder = folders.find(f => f.id === targetFolderId);
  const priceWithTax = Math.round(priceWithoutTax * (1 + taxRate / 100));
  const priceDiff = priceWithoutTax - product.price_without_tax;
  const percentDiff = product.price_without_tax > 0 ? ((priceDiff / product.price_without_tax) * 100).toFixed(1) : '0';

  const applyPercentMarkup = (percent: number) => {
    const newPrice = Math.round(product.price_without_tax * (1 + percent / 100));
    setPriceWithoutTax(newPrice);
  };

  const handleTargetChange = (folderId: string) => {
    setTargetFolderId(folderId);
    const target = folders.find(f => f.id === folderId);
    if (target?.markupPercent) {
      applyPercentMarkup(target.markupPercent);
    }
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFolderId) return;

    const cloned = duplicateProductToFolder(product.id, targetFolderId, priceWithoutTax, taxRate);
    if (cloned && onSuccess) {
      onSuccess(cloned);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Copy to Another Shop (Two Shop Two Price)</h3>
              <p className="text-xs text-stone-500">Same physical item with store-specific retail pricing and tags</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleExecute} className="p-5 space-y-4 text-xs">
          {/* Base Product Card */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Source Product</div>
            <div className="font-black text-stone-900 text-sm truncate">{product.product_name_eng}</div>
            <div className="text-stone-600 font-medium truncate">{product.product_name_jp}</div>
            <div className="pt-2 mt-1 border-t border-stone-200 flex items-center justify-between font-mono">
              <span className="text-stone-500">
                Current Shop: <strong className="text-stone-800">{currentFolder?.name || 'Main Catalog'}</strong>
              </span>
              <span className="text-red-600 font-bold">
                ¥{product.price_without_tax.toLocaleString()} <span className="text-stone-400 text-[10px]">(込¥{product.price_with_tax.toLocaleString()})</span>
              </span>
            </div>
          </div>

          {/* Target Shop Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 block">Target Shop / Branch:</label>
            <div className="grid grid-cols-1 gap-2">
              {availableFolders.map(folder => {
                const isSelected = folder.id === targetFolderId;
                const isCurrent = folder.id === product.folderId;
                return (
                  <button
                    type="button"
                    key={folder.id}
                    disabled={isCurrent}
                    onClick={() => handleTargetChange(folder.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? 'opacity-40 bg-stone-100 border-stone-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
                      <div>
                        <div className="font-bold text-stone-900 text-xs">
                          {folder.name}
                          {isCurrent && <span className="ml-2 text-[10px] text-stone-400 font-normal">(Current Location)</span>}
                        </div>
                        {folder.storeLocation && (
                          <div className="text-[10px] text-stone-500">{folder.storeLocation}</div>
                        )}
                      </div>
                    </div>
                    {folder.markupPercent ? (
                      <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        +{folder.markupPercent}% default
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shop-Specific Price Input */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-700">Shop Retail Price (Without Tax):</label>
              <div className="text-[11px] font-mono">
                {priceDiff !== 0 && (
                  <span className={`font-bold ${priceDiff > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {priceDiff > 0 ? `+¥${priceDiff} (+${percentDiff}%)` : `-¥${Math.abs(priceDiff)} (${percentDiff}%)`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-stone-400">¥</span>
              <input
                type="number"
                min="0"
                step="1"
                value={priceWithoutTax}
                onChange={e => setPriceWithoutTax(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 px-3 py-2 text-sm font-bold font-mono bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <div className="px-3 py-2 bg-stone-100 rounded-lg border border-stone-200 text-stone-600 font-mono font-bold text-xs shrink-0">
                込¥{priceWithTax.toLocaleString()}
              </div>
            </div>

            {/* Quick Multipliers */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Same Price', pct: 0 },
                { label: '+5%', pct: 5 },
                { label: '+8%', pct: 8 },
                { label: '+10%', pct: 10 },
                { label: '+15%', pct: 15 },
                { label: '-5%', pct: -5 },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.label}
                  onClick={() => applyPercentMarkup(opt.pct)}
                  className="px-2 py-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tax Rate Setting */}
          <div className="flex items-center justify-between text-xs pt-2">
            <span className="font-semibold text-stone-600">Tax Rate:</span>
            <div className="flex items-center gap-2">
              {[8, 10].map(rate => (
                <button
                  type="button"
                  key={rate}
                  onClick={() => setTaxRate(rate)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    taxRate === rate
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!targetFolderId || targetFolderId === product.folderId}
              className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-xs transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Create Shop Price Tag</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
