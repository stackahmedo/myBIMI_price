import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  BarChart3, 
  FolderTree, 
  History, 
  Plus, 
  LogOut, 
  ShieldCheck, 
  Download, 
  RotateCcw,
  Printer,
  Tag,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export type NavTab = 'dashboard' | 'products' | 'folders' | 'history';

interface TopNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  onOpenLoginModal: () => void;
  onOpenPriceTagMaker: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal,
  onOpenLoginModal,
  onOpenPriceTagMaker,
}) => {
  const { adminUser, isAuthenticated, logout, exportCSV, resetToDemo } = useInventory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavSelect = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/90 bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Brand logo & title: BIMI TAG PRO in White, Red, Green, Orange palette */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onTabChange('products')}
            className="text-left font-black text-base sm:text-lg tracking-tight text-stone-900 flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {/* Visual badge: Red & Green with Orange accent dot */}
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs">
              <span className="font-mono">B</span>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-red-600 font-extrabold">BIMI</span>
              <span className="text-emerald-700 font-black">TAG</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                PRO
              </span>
            </div>
          </button>
          <span className="text-[11px] text-stone-400 font-medium hidden xl:inline">
            · Price Tag Maker & Food Retail Catalog
          </span>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onTabChange('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-md ${
              currentTab === 'products'
                ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-red-600" />
            <span className="whitespace-nowrap">Price Tags</span>
          </button>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-md ${
              currentTab === 'dashboard'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="whitespace-nowrap">Stock Analytics</span>
          </button>

          <button
            onClick={() => onTabChange('folders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-md ${
              currentTab === 'folders'
                ? 'bg-orange-50 text-orange-800 border border-orange-200 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-orange-600" />
            <span className="whitespace-nowrap">Groups & Folders</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-md ${
              currentTab === 'history'
                ? 'bg-stone-100 text-stone-900 border border-stone-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <History className="w-3.5 h-3.5 text-stone-600" />
            <span className="whitespace-nowrap">Audit Trail</span>
          </button>
        </nav>

        {/* Action Buttons: Red, Green, Orange accents */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Print Price Tags button - Orange/Amber primary action */}
          <button
            onClick={onOpenPriceTagMaker}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-md shadow-xs transition-colors whitespace-nowrap active:scale-95"
            title="Make & Print Retail Price Tags"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Make Tags</span>
            <span className="sm:hidden">Tags</span>
          </button>

          {/* Add Product button - Emerald Green primary action */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-xs transition-colors whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={() => exportCSV()}
            title="Export CSV"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 hover:border-stone-400 rounded-md transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>CSV</span>
          </button>

          {/* Admin auth badge or sign in */}
          {isAuthenticated && adminUser ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="text-right hidden md:block">
                <div className="text-[11px] font-bold text-stone-800 truncate max-w-[100px]">{adminUser.name}</div>
                <div className="text-[9px] text-emerald-700 font-mono font-semibold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>Admin</span>
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span>Admin</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 pt-2 pb-3 border-t border-stone-200 space-y-1 text-xs animate-in slide-in-from-top-2 duration-150 bg-white">
          <button
            onClick={() => handleNavSelect('products')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
              currentTab === 'products' ? 'bg-red-50 text-red-700 font-bold border border-red-200' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-red-600" />
              <span>Price Tag Catalog</span>
            </span>
          </button>

          <button
            onClick={() => handleNavSelect('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
              currentTab === 'dashboard' ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Stock Analytics</span>
            </span>
          </button>

          <button
            onClick={() => handleNavSelect('folders')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
              currentTab === 'folders' ? 'bg-orange-50 text-orange-800 font-bold border border-orange-200' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-orange-600" />
              <span>Product Folders & Groups</span>
            </span>
          </button>

          <button
            onClick={() => handleNavSelect('history')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
              currentTab === 'history' ? 'bg-stone-100 text-stone-900 font-bold' : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-stone-600" />
              <span>Audit Trail Ledger</span>
            </span>
          </button>

          {/* Mobile Extra Actions */}
          <div className="pt-2 mt-2 border-t border-stone-200 flex items-center justify-between px-2 text-stone-600">
            <button
              onClick={() => {
                exportCSV();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 py-1 text-stone-700 hover:text-stone-900 font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                resetToDemo();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 py-1 text-stone-500 hover:text-stone-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 py-1 text-red-600 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenLoginModal();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 py-1 text-red-600 font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
