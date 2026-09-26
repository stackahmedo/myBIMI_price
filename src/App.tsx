/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { TopNav, NavTab } from './components/TopNav';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProductMasterGrid } from './components/ProductMasterGrid';
import { FolderManager } from './components/FolderManager';
import { AuditTrailView } from './components/AuditTrailView';
import { ProductFormModal } from './components/ProductFormModal';
import { StockAdjustModal } from './components/StockAdjustModal';
import { AdminLoginModal } from './components/AdminLogin';
import { PriceTagMakerModal } from './components/PriceTagMakerModal';
import { Product } from './types/inventory';
import { Tag } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { products, adminUser } = useInventory();

  // Navigation tab - default to products so user immediately sees their table
  const [currentTab, setCurrentTab] = useState<NavTab>('products');

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPriceTagMakerOpen, setIsPriceTagMakerOpen] = useState(false);
  const [tagMakerTargetProduct, setTagMakerTargetProduct] = useState<Product | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('all');

  const handleSelectFolderToView = (folderId: string) => {
    setActiveFolderFilter(folderId);
    setCurrentTab('products');
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsAddProductOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsAddProductOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setAdjustingProduct(product);
  };

  const handleOpenPriceTagMaker = (product?: Product) => {
    setTagMakerTargetProduct(product || null);
    setIsPriceTagMakerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar Header */}
      <TopNav
        currentTab={currentTab}
        onTabChange={tab => setCurrentTab(tab)}
        onOpenAddModal={handleOpenAdd}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        onOpenPriceTagMaker={() => handleOpenPriceTagMaker()}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Context Breadcrumb & Workspace Status */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-slate-200">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <span className="font-bold text-red-600 tracking-tight">BIMI TAG PRO</span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span>Price Tag Engine</span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold capitalize">
              {currentTab === 'products'
                ? 'Price Tag Catalog'
                : currentTab === 'dashboard'
                ? 'Analytics Dashboard'
                : currentTab === 'folders'
                ? 'Folders & Groups'
                : 'Stock Audit Ledger'}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="text-emerald-700 font-medium">BIMI Cloud Sync</span>
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-slate-300">·</span>
            <span className="text-slate-500 font-mono text-[11px] sm:text-xs truncate max-w-[140px] sm:max-w-none">
              Admin: <span className="text-slate-800 font-semibold">{adminUser?.name || 'Authorized'}</span>
            </span>
          </div>
        </div>

        {/* Tab View Routing */}
        {currentTab === 'products' && (
          <ProductMasterGrid
            onOpenAddModal={handleOpenAdd}
            onEditProduct={handleEdit}
            onAdjustStock={handleAdjustStock}
            onOpenPriceTagMaker={handleOpenPriceTagMaker}
            initialFolderFilter={activeFolderFilter}
          />
        )}

        {currentTab === 'dashboard' && <AnalyticsDashboard />}

        {currentTab === 'folders' && (
          <FolderManager onSelectFolderToView={handleSelectFolderToView} />
        )}

        {currentTab === 'history' && <AuditTrailView />}
      </main>

      {/* Modals */}
      <ProductFormModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        defaultFolderId={activeFolderFilter !== 'all' ? activeFolderFilter : undefined}
      />

      <StockAdjustModal
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
      />

      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <PriceTagMakerModal
        isOpen={isPriceTagMakerOpen}
        onClose={() => {
          setIsPriceTagMakerOpen(false);
          setTagMakerTargetProduct(null);
        }}
        products={products}
        preselectedProduct={tagMakerTargetProduct}
      />

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-sm"></span>
          <span className="font-bold text-slate-800">BIMI TAG PRO</span>
          <span className="text-slate-400">·</span>
          <span>Bilingual Price Tag Master</span>
        </div>
        <div className="text-[11px] text-slate-400">
          serial · product_name_eng · product_name_jp · weight/pc/unit · tax % · price_without_tax · price_with_tax · origin
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainAppContent />
    </InventoryProvider>
  );
}
