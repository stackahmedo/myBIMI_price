import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Download,
  FolderInput,
  CheckSquare,
  Square,
  Package,
  Printer,
  Tag,
  Globe,
  LayoutGrid,
  Table as TableIcon,
  SlidersHorizontal,
  CheckCircle2,
  X,
  ChevronDown,
  FileSpreadsheet,
  Store,
  Copy,
} from 'lucide-react';
import { BulkPriceEditModal } from './BulkPriceEditModal';
import { ExcelBulkImportModal } from './ExcelBulkImportModal';
import { CloneToShopModal } from './CloneToShopModal';

interface ProductMasterGridProps {
  onOpenAddModal: () => void;
  onEditProduct: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onOpenPriceTagMaker: (product?: Product) => void;
  initialFolderFilter?: string;
}

type SortField = 'serial' | 'product_name_eng' | 'stockQuantity' | 'price_without_tax' | 'price_with_tax' | 'origin';
type SortOrder = 'asc' | 'desc';

export const ProductMasterGrid: React.FC<ProductMasterGridProps> = ({
  onOpenAddModal,
  onEditProduct,
  onAdjustStock,
  onOpenPriceTagMaker,
  initialFolderFilter = 'all',
}) => {
  const { products, folders, deleteProduct, batchDeleteProducts, batchUpdateProducts, batchAssignFolder, exportCSV } = useInventory();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>(initialFolderFilter);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');

  // View mode toggle for mobile devices (card vs table)
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('serial');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Deletion and Bulk edit modals
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isBatchMoveOpen, setIsBatchMoveOpen] = useState(false);
  const [batchMoveTargetFolder, setBatchMoveTargetFolder] = useState('');
  const [isBulkPriceEditOpen, setIsBulkPriceEditOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [excelImportTab, setExcelImportTab] = useState<'file' | 'weblink'>('file');
  const [productToClone, setProductToClone] = useState<Product | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Fast map lookup
  const folderMap = useMemo(() => new Map(folders.map(f => [f.id, f])), [folders]);

  // Lookup sibling products across shops (Same product, two shop two price)
  const multiShopMap = useMemo(() => {
    const map = new Map<string, Product[]>();
    products.forEach(p => {
      const key = p.masterSku || p.product_name_eng.toLowerCase().trim();
      const list = map.get(key) || [];
      list.push(p);
      map.set(key, list);
    });
    return map;
  }, [products]);

  // Unique origins list
  const originList = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.origin) set.add(p.origin);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedFolder !== 'all' && p.folderId !== selectedFolder) {
        return false;
      }

      if (selectedOrigin !== 'all' && p.origin !== selectedOrigin) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSerial = String(p.serial).includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesEng = p.product_name_eng.toLowerCase().includes(q);
        const matchesJp = (p.product_name_jp || '').toLowerCase().includes(q);
        const matchesOrigin = (p.origin || '').toLowerCase().includes(q);
        const matchesWeight = (p.weight_unit || '').toLowerCase().includes(q);
        return matchesSerial || matchesSku || matchesEng || matchesJp || matchesOrigin || matchesWeight;
      }

      return true;
    });
  }, [products, selectedFolder, selectedOrigin, searchQuery]);

  // Sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        const res = valA.localeCompare(valB);
        return sortOrder === 'asc' ? res : -res;
      }

      const res = Number(valA || 0) - Number(valB || 0);
      return sortOrder === 'asc' ? res : -res;
    });
  }, [filteredProducts, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sortedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedProducts.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setSelectedIds(prev => prev.filter(i => i !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  const handleBatchDelete = () => {
    if (confirm(`Permanently delete ${selectedIds.length} selected price tag records?`)) {
      batchDeleteProducts(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBatchMoveSubmit = () => {
    if (!batchMoveTargetFolder) return;
    batchAssignFolder(selectedIds, batchMoveTargetFolder);
    setIsBatchMoveOpen(false);
    setSelectedIds([]);
  };

  const handleOpenBulkEdit = () => {
    if (selectedIds.length === 0) {
      // If none selected, pre-select all currently filtered/sorted products so user can immediately edit them
      setSelectedIds(sortedProducts.map(p => p.id));
    }
    setIsBulkPriceEditOpen(true);
  };

  const handleApplyBulkUpdate = (
    updates: { id: string; changes: Partial<Product> }[],
    auditReason: string
  ) => {
    batchUpdateProducts(updates, auditReason);
    setSuccessNotice(`Successfully updated tax percentage and price fields for ${updates.length} products.`);
    setTimeout(() => {
      setSuccessNotice(null);
    }, 4500);
  };

  // CSV export controls & options
  const [isCsvMenuOpen, setIsCsvMenuOpen] = useState(false);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedFolder !== 'all' || selectedOrigin !== 'all'
  );

  const handleDownloadCSV = (mode: 'active' | 'all' | 'selected' = 'active') => {
    let itemsToExport: Product[] = [];
    let fileScope = '';

    if (mode === 'selected' && selectedIds.length > 0) {
      itemsToExport = products.filter(p => selectedIds.includes(p.id));
      fileScope = `selected_${itemsToExport.length}_items`;
    } else if (mode === 'all') {
      itemsToExport = products;
      fileScope = `full_catalog_${products.length}_items`;
    } else {
      // mode === 'active' (matches current search/folder/origin filters and sorting)
      itemsToExport = sortedProducts;
      fileScope = hasActiveFilters
        ? `filtered_${sortedProducts.length}_items`
        : `full_catalog_${products.length}_items`;
    }

    if (itemsToExport.length === 0) {
      alert('No products available to export matching the current selection or filter.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `bimi_tag_pro_inventory_${fileScope}_${dateStr}.csv`;

    exportCSV(itemsToExport, filename);
    setIsCsvMenuOpen(false);

    setSuccessNotice(
      `Catalog CSV downloaded successfully (${itemsToExport.length} products exported as ${filename}).`
    );
    setTimeout(() => {
      setSuccessNotice(null);
    }, 4500);
  };

  return (
    <div className="space-y-4">
      {/* Toast notification banner */}
      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="p-1 text-emerald-600 hover:text-emerald-900 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Filter and Search Controls (Light Theme: White background with clean stone/red/green borders) */}
      <div className="p-3 sm:p-4 bg-white border border-stone-200 rounded-xl shadow-xs flex flex-col gap-3">
        {/* Row 1: Search input and Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search serial #, English / Japanese title, origin..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-white font-medium"
            />
          </div>

          {/* Quick View Mode Toggle on Mobile & Main Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
              <button
                onClick={() => setViewMode('auto')}
                className={`px-2 py-1 rounded transition-colors ${
                  viewMode === 'auto' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Responsive auto layout"
              >
                Auto
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Force table mode"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Force mobile card mode"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download CSV button */}
            <div className="relative shrink-0">
              <div className="flex items-center rounded-lg border border-stone-300 shadow-xs bg-white">
                <button
                  type="button"
                  onClick={() => handleDownloadCSV('active')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 transition-colors rounded-l-lg"
                  title={
                    hasActiveFilters
                      ? `Download currently filtered inventory (${sortedProducts.length} items) as CSV`
                      : `Download full inventory catalog (${products.length} items) as CSV`
                  }
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  <span>Download CSV</span>
                  {hasActiveFilters && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Filtered catalog" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCsvMenuOpen(prev => !prev)}
                  className="px-1.5 py-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-50 border-l border-stone-200 transition-colors rounded-r-lg"
                  title="CSV Export Options"
                  aria-label="CSV options"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCsvMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* CSV dropdown options menu */}
              {isCsvMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsCsvMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-white border border-stone-200 rounded-xl shadow-xl p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Export Catalog CSV
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadCSV('active')}
                      className="w-full text-left flex items-center justify-between px-2.5 py-2 hover:bg-stone-50 rounded-lg text-stone-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-xs">
                            {hasActiveFilters ? 'Current Filtered Catalog' : 'Active Catalog'}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} {hasActiveFilters ? '(matches filter & search)' : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                        {sortedProducts.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadCSV('all')}
                      className="w-full text-left flex items-center justify-between px-2.5 py-2 hover:bg-stone-50 rounded-lg text-stone-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-stone-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-xs">Full Inventory Backup</div>
                          <div className="text-[10px] text-stone-500">
                            Complete catalog backup (all products)
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                        {products.length}
                      </span>
                    </button>

                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDownloadCSV('selected')}
                        className="w-full text-left flex items-center justify-between px-2.5 py-2 hover:bg-red-50 text-red-800 rounded-lg transition-colors border-t border-stone-100 mt-1"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                          <div>
                            <div className="font-semibold text-xs">Selected Items Only</div>
                            <div className="text-[10px] text-red-600">
                              Export checked records
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                          {selectedIds.length}
                        </span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Import Excel button */}
            <button
              type="button"
              onClick={() => {
                setExcelImportTab('file');
                setIsExcelImportOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="Bulk import products from local Excel (.xlsx) or CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Import Excel</span>
            </button>

            {/* Google Sheets Link button */}
            <button
              type="button"
              onClick={() => {
                setExcelImportTab('weblink');
                setIsExcelImportOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="Import or sync products from Google Sheets web link"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span>Google Sheets Link</span>
            </button>

            {/* Bulk Edit Tax & Prices Button */}
            <button
              onClick={handleOpenBulkEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-xs transition-colors shrink-0"
              title="Bulk update tax percentage and prices simultaneously"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-red-600" />
              <span>Bulk Edit{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}</span>
            </button>

            {/* Print Price Tags button - Orange Accent */}
            <button
              onClick={() => onOpenPriceTagMaker()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Make Tags</span>
            </button>

            {/* Add Product button - Green Accent */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter selects */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
          {/* Shop / Folder filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 flex-1 min-w-[140px] sm:flex-none">
            <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <select
              value={selectedFolder}
              onChange={e => setSelectedFolder(e.target.value)}
              className="w-full sm:w-auto bg-stone-50 border border-stone-300 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 focus:bg-white font-medium"
            >
              <option value="all">All Shops &amp; Folders ({products.length})</option>
              <optgroup label="🏪 Retail Shops &amp; Branches (Two Shop Two Price)">
                {folders.filter(f => f.type === 'shop').map(f => {
                  const count = products.filter(p => p.folderId === f.id).length;
                  return (
                    <option key={f.id} value={f.id}>
                      🏪 {f.name} ({count} items)
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="📁 Categories">
                {folders.filter(f => f.type !== 'shop').map(f => {
                  const count = products.filter(p => p.folderId === f.id).length;
                  return (
                    <option key={f.id} value={f.id}>
                      📁 {f.name} ({count} items)
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          {/* Origin filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 flex-1 min-w-[140px] sm:flex-none">
            <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={selectedOrigin}
              onChange={e => setSelectedOrigin(e.target.value)}
              className="w-full sm:w-auto bg-stone-50 border border-stone-300 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 focus:bg-white font-medium"
            >
              <option value="all">All Origins (産地)</option>
              {originList.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs text-stone-500 ml-auto">
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={e => {
                const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(f);
                setSortOrder(o);
              }}
              className="bg-stone-50 border border-stone-300 text-stone-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-500 font-mono"
            >
              <option value="serial-asc">Serial (1 → 367)</option>
              <option value="serial-desc">Serial (367 → 1)</option>
              <option value="price_with_tax-desc">Price: High to Low</option>
              <option value="price_with_tax-asc">Price: Low to High</option>
              <option value="product_name_eng-asc">Name (A → Z)</option>
              <option value="origin-asc">Origin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar (visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in duration-100 shadow-xs">
          <div className="flex items-center gap-2 text-red-800 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
            <span>{selectedIds.length} Price Tag{selectedIds.length > 1 ? 's' : ''} selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBulkPriceEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bulk Edit Tax / Prices ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => onOpenPriceTagMaker()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Selected</span>
            </button>

            <button
              onClick={() => handleDownloadCSV('selected')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-xs transition-colors"
              title="Download selected items as CSV"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>Download CSV ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => {
                setBatchMoveTargetFolder(folders[0]?.id || '');
                setIsBatchMoveOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors shadow-xs"
            >
              <FolderInput className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Assign Folder</span>
            </button>

            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-lg transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Responsive View Switcher: Mobile Cards */}
      {(viewMode === 'cards' || (viewMode === 'auto' && true)) && (
        <div className={`space-y-3 ${viewMode === 'auto' ? 'md:hidden' : ''}`}>
          {sortedProducts.length === 0 ? (
            <div className="p-8 text-center text-stone-500 bg-white rounded-xl border border-stone-200">
              <Package className="w-8 h-8 mx-auto mb-2 text-stone-400 stroke-[1.5]" />
              <p className="text-sm font-semibold text-stone-700">No products match your filter criteria.</p>
            </div>
          ) : (
            sortedProducts.map(p => {
              const folder = folderMap.get(p.folderId);
              const isSelected = selectedIds.includes(p.id);

              return (
                <div
                  key={`card-${p.id}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-red-50/70 border-red-400 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                  }`}
                >
                  {/* Top Bar of card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleSelect(p.id)} className="p-0.5">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-red-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400 shrink-0" />
                        )}
                      </button>
                      <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                        #{p.serial}
                      </span>
                      {folderMap.get(p.folderId) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 truncate max-w-[130px]">
                          🏪 {folderMap.get(p.folderId)?.name}
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-800 font-semibold uppercase">
                        {p.origin}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setProductToClone(p)}
                        className="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy to Another Shop (Set Shop Price)"
                      >
                        <Store className="w-3 h-3 text-emerald-600" />
                        <span>Shop</span>
                      </button>
                      <button
                        onClick={() => onOpenPriceTagMaker(p)}
                        className="px-2 py-1 text-xs font-mono font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Tag className="w-3 h-3 text-orange-600" />
                        <span>Tag</span>
                      </button>
                      <button
                        onClick={() => onEditProduct(p)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                        title="Edit Price Tag"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setProductToDelete(p)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Product Names */}
                  <div className="mb-2.5">
                    <h4 className="text-xs font-black text-stone-900 leading-tight">
                      {p.product_name_eng}
                    </h4>
                    <p className="text-xs text-stone-600 font-medium mt-0.5">
                      {p.product_name_jp || '—'}
                    </p>
                    {/* Multi-Shop Price indicator */}
                    {(() => {
                      const siblings = (multiShopMap.get(p.masterSku || p.product_name_eng.toLowerCase().trim()) || []).filter(s => s.id !== p.id);
                      if (siblings.length === 0) return null;
                      return (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px]">
                          <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Store className="w-2.5 h-2.5 text-amber-600" />
                            <span>2 Shops:</span>
                          </span>
                          {siblings.map(s => {
                            const sf = folderMap.get(s.folderId);
                            return (
                              <span key={s.id} className="font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                {sf?.name || 'Shop'}: ¥{s.price_without_tax.toLocaleString()}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Metrics & Price Bottom Bar */}
                  <div className="pt-2.5 border-t border-stone-100 flex items-end justify-between text-xs">
                    <div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        Weight: <span className="text-stone-800 font-bold">{p.weight_unit}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        税抜: <span className="text-stone-700 font-semibold">¥{p.price_without_tax.toLocaleString()}</span> (税{p.tax_rate}%)
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-red-600 block">税込価格</span>
                      <span className="text-lg font-black text-red-600 font-mono tracking-tight">
                        ¥{p.price_with_tax.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Desktop/Tablet Table Container (Light Theme: Clean White Card, crisp borders) */}
      <div className={`bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs ${
        viewMode === 'cards' ? 'hidden' : viewMode === 'auto' ? 'hidden md:block' : 'block'
      }`}>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[11px] uppercase tracking-wider font-mono font-bold">
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="hover:text-stone-900">
                    {selectedIds.length > 0 && selectedIds.length === sortedProducts.length ? (
                      <CheckSquare className="w-4 h-4 text-red-600" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                  </button>
                </th>

                <th className="py-3 px-3">
                  <button
                    onClick={() => handleSort('serial')}
                    className="flex items-center gap-1 hover:text-stone-900"
                  >
                    <span>serial</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </button>
                </th>

                <th className="py-3 px-3">
                  <button
                    onClick={() => handleSort('product_name_eng')}
                    className="flex items-center gap-1 hover:text-stone-900"
                  >
                    <span>product_name_eng</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </button>
                </th>

                <th className="py-3 px-3">product_name_jp</th>

                <th className="py-3 px-3">weight/pc/unit</th>

                <th className="py-3 px-3 text-center">tax %</th>

                <th className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleSort('price_without_tax')}
                    className="inline-flex items-center gap-1 hover:text-stone-900"
                  >
                    <span>price_without_tax</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </button>
                </th>

                <th className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleSort('price_with_tax')}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-extrabold"
                  >
                    <span>price_with_tax</span>
                    <ArrowUpDown className="w-3 h-3 text-red-400" />
                  </button>
                </th>

                <th className="py-3 px-3">
                  <button
                    onClick={() => handleSort('origin')}
                    className="flex items-center gap-1 hover:text-stone-900"
                  >
                    <span>origin</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </button>
                </th>

                <th className="py-3 px-3">Shop / Location</th>

                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-stone-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-stone-300 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-stone-700">No products match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                sortedProducts.map(p => {
                  const folder = folderMap.get(p.folderId);
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isSelected ? 'bg-red-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(p.id)}
                          className="hover:text-stone-900"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-red-600" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400" />
                          )}
                        </button>
                      </td>

                      {/* serial */}
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-700 whitespace-nowrap">
                        {p.serial}
                      </td>

                      {/* product_name_eng */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-stone-900 truncate max-w-[200px] lg:max-w-[240px]" title={p.product_name_eng}>
                          {p.product_name_eng}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-stone-400 font-medium mt-0.5">
                          <span>{folder ? folder.name : 'General'}</span>
                          {(() => {
                            const siblings = (multiShopMap.get(p.masterSku || p.product_name_eng.toLowerCase().trim()) || []).filter(s => s.id !== p.id);
                            if (siblings.length === 0) return null;
                            return (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded" title="Same product with different shop price">
                                <Store className="w-2.5 h-2.5 text-amber-600" />
                                <span>{siblings.length + 1} Shops</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* product_name_jp */}
                      <td className="py-2.5 px-3 text-stone-700 font-semibold truncate max-w-[150px] lg:max-w-[180px]" title={p.product_name_jp}>
                        {p.product_name_jp || '—'}
                      </td>

                      {/* weight/pc/unit */}
                      <td className="py-2.5 px-3 font-mono text-stone-700 whitespace-nowrap">
                        {p.weight_unit || '1pc'}
                      </td>

                      {/* tax % */}
                      <td className="py-2.5 px-3 text-center font-mono text-stone-600 whitespace-nowrap">
                        {p.tax_rate.toFixed(1)}%
                      </td>

                      {/* price_without_tax */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-stone-600 whitespace-nowrap font-medium">
                        ¥{p.price_without_tax.toLocaleString()}
                      </td>

                      {/* price_with_tax */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-red-600 whitespace-nowrap text-sm">
                        ¥{p.price_with_tax.toLocaleString()}
                      </td>

                      {/* origin */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 font-medium uppercase">
                          {p.origin || 'UNKNOWN'}
                        </span>
                      </td>

                      {/* Shop / Branch */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <Store className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[130px]">{folder?.name || 'Tokyo Main'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setProductToClone(p)}
                            title="Copy to Another Shop (Set Shop Price)"
                            className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Store className="w-3 h-3 text-emerald-600" />
                            <span>Shop</span>
                          </button>

                          <button
                            onClick={() => onOpenPriceTagMaker(p)}
                            title="Print Price Tag"
                            className="px-2 py-1 text-[11px] font-mono font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Tag className="w-3 h-3 text-orange-600" />
                            <span>Tag</span>
                          </button>

                          <button
                            onClick={() => onEditProduct(p)}
                            title="Edit Price Tag"
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setProductToDelete(p)}
                            title="Delete Price Tag"
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 font-mono">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="text-stone-900 font-bold">{sortedProducts.length}</span> of{' '}
              <span className="text-stone-900 font-bold">{products.length}</span> items
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Catalog Total (税込):{' '}
              <span className="text-red-600 font-black">
                ¥{sortedProducts.reduce((sum, p) => sum + p.price_with_tax, 0).toLocaleString()}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadCSV('active')}
              className="text-xs text-stone-700 hover:text-stone-900 font-bold flex items-center gap-1.5 bg-white hover:bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-300 shadow-xs transition-colors"
              title="Download inventory catalog as CSV"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white border border-stone-200 rounded-xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-stone-900 mb-2">Delete Product Price Tag?</h3>
            <p className="text-xs text-stone-600 mb-5">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-stone-900">#{productToDelete.serial} {productToDelete.product_name_eng}</span>?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Assign Folder Modal */}
      {isBatchMoveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white border border-stone-200 rounded-xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-stone-900 mb-2">Assign Selected to Folder</h3>
            <p className="text-xs text-stone-600 mb-4">
              Move <span className="font-bold text-stone-900">{selectedIds.length} items</span> to folder:
            </p>

            <select
              value={batchMoveTargetFolder}
              onChange={e => setBatchMoveTargetFolder(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 mb-5"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBatchMoveOpen(false)}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchMoveSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
              >
                Apply Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Price & Tax Editor Modal */}
      <BulkPriceEditModal
        isOpen={isBulkPriceEditOpen}
        onClose={() => setIsBulkPriceEditOpen(false)}
        products={products}
        selectedProductIds={selectedIds}
        onApplyBulkUpdate={handleApplyBulkUpdate}
      />

      {/* Excel Bulk Import Modal */}
      <ExcelBulkImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        defaultFolderId={selectedFolder !== 'all' ? selectedFolder : undefined}
        initialTab={excelImportTab}
      />

      {/* Clone to Shop / Multi-Shop Pricing Modal */}
      <CloneToShopModal
        isOpen={!!productToClone}
        product={productToClone}
        onClose={() => setProductToClone(null)}
        onSuccess={(cloned) => {
          setSuccessNotice(`Successfully created shop price tag for ${cloned.product_name_eng} (¥${cloned.price_without_tax.toLocaleString()}).`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />
    </div>
  );
};
