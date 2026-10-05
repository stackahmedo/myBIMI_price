import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StockTransaction } from '../types/inventory';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Search } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { transactions } = useInventory();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.productSku.toLowerCase().includes(q) ||
        t.productName.toLowerCase().includes(q) ||
        t.reason.toLowerCase().includes(q) ||
        t.performedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getTypeBadge = (type: StockTransaction['type']) => {
    switch (type) {
      case 'inflow':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stock Inflow</span>
          </span>
        );
      case 'outflow':
        return (
          <span className="inline-flex items-center gap-1 text-red-700 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-red-50 border border-red-200">
            <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
            <span>Stock Outflow</span>
          </span>
        );
      case 'adjustment':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-orange-700 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
            <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
            <span>Count Adjustment</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Stock Audit Trail & Ledger</h2>
          <p className="text-xs text-slate-500">
            Immutable log of all physical stock receipts, dispatches, and catalog adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ledger..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-red-500 font-medium"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-red-500 font-medium"
          >
            <option value="all">All Event Types</option>
            <option value="inflow">Inflow (Receiving)</option>
            <option value="outflow">Outflow (Dispatch)</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-mono font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4 text-right">Movement Quantity</th>
                <th className="py-3 px-4 text-right">Prior Stock → New</th>
                <th className="py-3 px-4">Justification / PO / Reason</th>
                <th className="py-3 px-4">Authorized User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No transaction entries recorded for current filter.
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(t.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-red-600 mr-2">{t.productSku}</span>
                      <span className="text-slate-800 font-sans text-xs font-medium">{t.productName}</span>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">{getTypeBadge(t.type)}</td>

                    <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          t.type === 'inflow'
                            ? 'text-emerald-700'
                            : t.type === 'outflow'
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {t.type === 'inflow' ? `+${t.quantity}` : t.type === 'outflow' ? `-${t.quantity}` : t.quantity}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right text-slate-500 tabular-nums whitespace-nowrap font-medium">
                      <span>{t.previousStock}</span>
                      <span className="text-slate-300 mx-1.5">→</span>
                      <span className="text-slate-900 font-bold">{t.newStock}</span>
                    </td>

                    <td className="py-2.5 px-4 text-slate-600 font-sans truncate max-w-[280px]" title={t.reason}>
                      {t.reason}
                    </td>

                    <td className="py-2.5 px-4 text-slate-500 font-sans whitespace-nowrap font-medium">
                      {t.performedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
