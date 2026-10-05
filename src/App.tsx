/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AppSidebar, SidebarTab } from './components/AppSidebar';
import { AppTopBar } from './components/AppTopBar';
import { DashboardView } from './components/DashboardView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProductMasterGrid } from './components/ProductMasterGrid';
import { FolderManager } from './components/FolderManager';
import { AuditTrailView } from './components/AuditTrailView';
import { ProductFormModal } from './components/ProductFormModal';
import { StockAdjustModal } from './components/StockAdjustModal';
import { AdminLoginModal } from './components/AdminLogin';
import { PriceTagMakerModal } from './components/PriceTagMakerModal';
import { ExcelBulkImportModal } from './components/ExcelBulkImportModal';
import { BulkPriceEditModal } from './components/BulkPriceEditModal';
import { DesignSystemArchitectureView } from './components/DesignSystemArchitectureView';
import { Product } from './types/inventory';

const MainAppContent: React.FC = () => {
  const { products, batchUpdateProducts } = useInventory();

  // Navigation tab - default to 'dashboard' as requested by reference image!
  const [currentTab, setCurrentTab] = useState<SidebarTab>('dashboard');

  // Mobile sidebar drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPriceTagMakerOpen, setIsPriceTagMakerOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [excelImportTab, setExcelImportTab] = useState<'file' | 'weblink'>('file');
  const [isBulkPriceEditOpen, setIsBulkPriceEditOpen] = useState(false);
  const [bulkEditProductIds, setBulkEditProductIds] = useState<string[]>([]);
  const [tagMakerTargetProduct, setTagMakerTargetProduct] = useState<Product | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('all');
  const [activeStoreFilter, setActiveStoreFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectFolderToView = (folderId: string) => {
    setActiveFolderFilter(folderId);
    setCurrentTab('products');
  };

  const handleSelectStoreFilter = (storeName: string) => {
    setActiveStoreFilter(storeName);
    if (storeName === 'All') {
      setActiveFolderFilter('all');
    }
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

  const handleOpenBulkEdit = () => {
    setBulkEditProductIds(products.slice(0, 10).map(p => p.id));
    setIsBulkPriceEditOpen(true);
  };

  const handleTabChange = (tab: SidebarTab) => {
    if (tab === 'pricetags') {
      handleOpenPriceTagMaker();
      return;
    }
    if (tab === 'import') {
      setExcelImportTab('file');
      setIsExcelImportOpen(true);
      return;
    }
    if (tab === 'settings') {
      setIsLoginOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-['Plus_Jakarta_Sans',sans-serif] w-full overflow-x-hidden">
      {/* Left Sidebar Navigation matching reference image */}
      <AppSidebar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        activeStoreFilter={activeStoreFilter}
        onSelectStoreFilter={handleSelectStoreFilter}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenLoginModal={() => setIsLoginOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-50">
        {/* Top Bar Header matching reference image */}
        <AppTopBar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenPriceTagMaker={() => handleOpenPriceTagMaker()}
          onOpenAddProduct={handleOpenAdd}
          onOpenExcelImport={(tab?: 'file' | 'weblink') => {
            setExcelImportTab(tab || 'file');
            setIsExcelImportOpen(true);
          }}
          searchQuery={searchQuery}
          onSearchChange={q => {
            setSearchQuery(q);
            if (q && currentTab !== 'products') {
              // Automatically switch to products when typing a search query
              setCurrentTab('products');
            }
          }}
        />

        {/* Main Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 min-w-0">
          {/* Tab View Routing */}
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={tab => setCurrentTab(tab)}
              onOpenPriceTagMaker={handleOpenPriceTagMaker}
              onOpenAddProduct={handleOpenAdd}
              onOpenExcelImport={(tab?: 'file' | 'weblink') => {
                setExcelImportTab(tab || 'file');
                setIsExcelImportOpen(true);
              }}
              onOpenBulkEdit={handleOpenBulkEdit}
              onSelectProductToEdit={handleEdit}
              onSelectStoreFilter={handleSelectStoreFilter}
            />
          )}

          {currentTab === 'products' && (
            <ProductMasterGrid
              onOpenAddModal={handleOpenAdd}
              onEditProduct={handleEdit}
              onAdjustStock={handleAdjustStock}
              onOpenPriceTagMaker={handleOpenPriceTagMaker}
              initialFolderFilter={activeFolderFilter}
              initialSearchQuery={searchQuery}
            />
          )}

          {currentTab === 'folders' && (
            <FolderManager onSelectFolderToView={handleSelectFolderToView} />
          )}

          {currentTab === 'stock' && (
            <ProductMasterGrid
              onOpenAddModal={handleOpenAdd}
              onEditProduct={handleEdit}
              onAdjustStock={handleAdjustStock}
              onOpenPriceTagMaker={handleOpenPriceTagMaker}
              initialFolderFilter={activeFolderFilter}
            />
          )}

          {currentTab === 'analytics' && <AnalyticsDashboard />}

          {currentTab === 'history' && <AuditTrailView />}

          {currentTab === 'architecture' && <DesignSystemArchitectureView />}
        </main>
      </div>

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

      <ExcelBulkImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        defaultFolderId={activeFolderFilter !== 'all' ? activeFolderFilter : undefined}
        initialTab={excelImportTab}
      />

      <BulkPriceEditModal
        isOpen={isBulkPriceEditOpen}
        onClose={() => setIsBulkPriceEditOpen(false)}
        products={products}
        selectedProductIds={bulkEditProductIds}
        onApplyBulkUpdate={(updates, reason) => {
          batchUpdateProducts(updates, reason);
          setIsBulkPriceEditOpen(false);
        }}
      />
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
