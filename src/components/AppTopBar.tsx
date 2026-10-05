import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Search,
  Printer,
  Plus,
  Cloud,
  FileSpreadsheet,
  Globe,
  Bell,
  Menu,
  Check,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface AppTopBarProps {
  onOpenMobileMenu: () => void;
  onOpenPriceTagMaker: () => void;
  onOpenAddProduct: () => void;
  onOpenExcelImport: (tab?: 'file' | 'weblink') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  onOpenMobileMenu,
  onOpenPriceTagMaker,
  onOpenAddProduct,
  onOpenExcelImport,
  searchQuery,
  onSearchChange,
}) => {
  const { products, clearAllData } = useInventory();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

  const lowStockCount = products.filter(p => p.stockQuantity <= p.reorderPoint).length;

  const handleTriggerSync = () => {
    setSyncToast('BIMI Cloud Sync: Catalog is up-to-date (0ms latency)');
    setTimeout(() => setSyncToast(null), 2500);
  };

  const handleConfirmClearAll = () => {
    clearAllData();
    setIsClearDataModalOpen(false);
    setSyncToast('All catalog and inventory data has been cleared.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 flex items-center px-4 sm:px-6">
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Left: Hamburger (mobile) + Global Search */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar matching reference image */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search products, SKU, barcode, Japanese or English name..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 pl-10 pr-12 py-2.5 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono font-bold text-slate-400 shadow-2xs pointer-events-none">
                <span>⌘</span>
                <span>K</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions matching reference image */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Orange Make Tags Button */}
          <button
            onClick={onOpenPriceTagMaker}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            title="Open Price Tag Maker"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Make Tags</span>
            <span className="sm:hidden">Tags</span>
          </button>

          {/* Emerald Add Product Button */}
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            title="Add New Product"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Quick Action Outline Icon Buttons */}
          <div className="hidden md:flex items-center gap-1.5 pl-1 border-l border-slate-200">
            {/* Cloud Sync Icon Button */}
            <button
              onClick={handleTriggerSync}
              className="p-2 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-emerald-700 transition-colors cursor-pointer relative"
              title="BIMI Cloud Sync Status"
            >
              <Cloud className="w-4 h-4" />
            </button>

            {/* Excel Sheet Import Icon Button */}
            <button
              onClick={() => onOpenExcelImport('file')}
              className="p-2 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Import from Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            </button>

            {/* Google Sheets Link Icon Button */}
            <button
              onClick={() => onOpenExcelImport('weblink')}
              className="p-2 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Import from Google Sheets Link"
            >
              <Globe className="w-4 h-4 text-emerald-700" />
            </button>

            {/* Clear All Data Icon Button */}
            <button
              onClick={() => setIsClearDataModalOpen(true)}
              className="p-2 rounded-xl border border-slate-200/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
              title="Remove / Clear All Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Notification Bell with dynamic badge */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-2xs">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Notifications</span>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                    {lowStockCount > 0 ? `${lowStockCount} Alerts` : 'System OK'}
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {lowStockCount > 0 ? (
                    <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100 text-rose-900">
                      <div className="font-bold">{lowStockCount} Low Stock Items</div>
                      <div className="text-[11px] text-rose-700 mt-0.5">
                        Products are at or below their reorder points.
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                      <div className="font-bold">Inventory Healthy</div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        No critical restock alerts currently reported.
                      </div>
                    </div>
                  )}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
                    <div className="font-bold">Card Studio Storage</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Local inventory cache initialized cleanly.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear All Data Confirmation Modal */}
      {isClearDataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            {/* Top-Right Cross Sign Close Button */}
            <button
              type="button"
              onClick={() => setIsClearDataModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-black text-slate-900">Remove All Data?</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              This will permanently remove all product catalog items, store assignments, and stock transaction logs. You will have a completely clean slate.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setIsClearDataModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Remove All Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Toast */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}
    </header>
  );
};
