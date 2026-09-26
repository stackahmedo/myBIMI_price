import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';
import { X, ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface StockAdjustModalProps {
  product: Product | null;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({ product, onClose }) => {
  const { adjustStock } = useInventory();
  const [operation, setOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [amount, setAmount] = useState<string>('10');
  const [reason, setReason] = useState('PO Shipment Intake');
  const [error, setError] = useState('');

  if (!product) return null;

  const currentStock = product.stockQuantity;
  const numAmount = parseInt(amount, 10) || 0;

  let calculatedNewStock = currentStock;
  if (operation === 'add') {
    calculatedNewStock = currentStock + numAmount;
  } else if (operation === 'subtract') {
    calculatedNewStock = Math.max(0, currentStock - numAmount);
  } else if (operation === 'set') {
    calculatedNewStock = Math.max(0, numAmount);
  }

  const delta = calculatedNewStock - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please provide a valid quantity.');
      return;
    }
    if (delta === 0) {
      setError('No quantity change detected.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a business justification for this stock adjustment.');
      return;
    }

    adjustStock(product.id, delta, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-slate-900 mb-1">Adjust On-Hand Stock</h3>
        <div className="text-xs text-slate-500 mb-4 flex items-center gap-1.5 font-mono">
          <span className="font-bold text-red-600">{product.sku}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-slate-800 font-semibold truncate max-w-[200px]">{product.product_name_eng}</span>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operation selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setOperation('add');
                setReason('Purchase Order Received');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                operation === 'add'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Inflow (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperation('subtract');
                setReason('Work Order Dispatch / Sold');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                operation === 'subtract'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Outflow (-)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperation('set');
                setReason('Physical Inventory Count Correction');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                operation === 'set'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Exact Set</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {operation === 'set' ? 'New Total Count' : 'Quantity Units'} ({product.unit})
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* Preview Delta Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Current Stock</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                {currentStock} {product.unit}
              </span>
            </div>

            <div className="text-center font-mono">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Delta</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-600' : 'text-slate-500'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Resulting Stock</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                {calculatedNewStock} {product.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Ledger Reason *</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. PO #8911 Receiving, Store Floor Restock"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
            >
              Commit Stock Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
