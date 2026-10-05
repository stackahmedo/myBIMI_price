import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { ProductFolder, Product, FolderType } from '../types/inventory';
import { 
  FolderPlus, 
  Folder, 
  Edit3, 
  Trash2, 
  Store, 
  ArrowRight, 
  Check, 
  X,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
} from 'lucide-react';
import { CloneToShopModal } from './CloneToShopModal';

interface FolderManagerProps {
  onSelectFolderToView: (folderId: string) => void;
}

const PRESET_COLORS = [
  '#16a34a', // Emerald/Green
  '#ea580c', // Orange
  '#0284c7', // Sky
  '#dc2626', // Red
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#059669', // Teal
  '#475569', // Slate
];

export const FolderManager: React.FC<FolderManagerProps> = ({ onSelectFolderToView }) => {
  const { folders, products, addFolder, updateFolder, deleteFolder, updateProduct, batchDuplicateToFolder } = useInventory();

  // Active view tab
  const [viewTab, setViewTab] = useState<'shops' | 'matrix' | 'categories'>('shops');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProductFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<ProductFolder | null>(null);
  const [reassignTargetFolderId, setReassignTargetFolderId] = useState<string>('');

  // Clone to shop modal state
  const [productToClone, setProductToClone] = useState<Product | null>(null);

  // Matrix search and editing
  const [matrixSearch, setMatrixSearch] = useState('');
  const [editingPriceItem, setEditingPriceItem] = useState<{ productId: string; currentPrice: number } | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<number>(0);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#16a34a');
  const [folderType, setFolderType] = useState<FolderType>('shop');
  const [storeLocation, setStoreLocation] = useState('');
  const [markupPercent, setMarkupPercent] = useState<number>(0);
  const [formError, setFormError] = useState('');

  // Filtered folder lists
  const shopFolders = useMemo(() => folders.filter(f => f.type === 'shop' || f.code.startsWith('SHOP-')), [folders]);
  const categoryFolders = useMemo(() => folders.filter(f => f.type !== 'shop' && !f.code.startsWith('SHOP-')), [folders]);

  // Group products for Multi-Shop Matrix (Same product across two shops with two prices)
  const productMatrixGroups = useMemo(() => {
    const groups = new Map<string, { baseName: string; weight: string; origin: string; items: Product[] }>();

    products.forEach(p => {
      // Key by masterSku or cleaned English name
      const key = p.masterSku || p.product_name_eng.toLowerCase().trim();
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(p);
      } else {
        groups.set(key, {
          baseName: p.product_name_eng,
          weight: p.weight_unit,
          origin: p.origin,
          items: [p],
        });
      }
    });

    let list = Array.from(groups.values());

    if (matrixSearch.trim()) {
      const q = matrixSearch.toLowerCase();
      list = list.filter(g =>
        g.baseName.toLowerCase().includes(q) ||
        g.origin.toLowerCase().includes(q) ||
        g.weight.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, matrixSearch]);

  const openAddModal = (defaultType: FolderType = 'shop') => {
    setName('');
    setCode(defaultType === 'shop' ? 'SHOP-' : 'GRP-');
    setDescription('');
    setColor(defaultType === 'shop' ? '#16a34a' : '#d97706');
    setFolderType(defaultType);
    setStoreLocation('');
    setMarkupPercent(0);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (folder: ProductFolder) => {
    setEditingFolder(folder);
    setName(folder.name);
    setCode(folder.code);
    setDescription(folder.description);
    setColor(folder.color);
    setFolderType(folder.type || (folder.code.startsWith('SHOP-') ? 'shop' : 'category'));
    setStoreLocation(folder.storeLocation || '');
    setMarkupPercent(folder.markupPercent || 0);
    setFormError('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFormError('Name and uppercase code are mandatory.');
      return;
    }
    addFolder({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      color,
      type: folderType,
      storeLocation: storeLocation.trim(),
      markupPercent: markupPercent || 0,
    });
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder) return;
    if (!name.trim() || !code.trim()) {
      setFormError('Name and uppercase code are mandatory.');
      return;
    }
    updateFolder(editingFolder.id, {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      color,
      type: folderType,
      storeLocation: storeLocation.trim(),
      markupPercent: markupPercent || 0,
    });
    setEditingFolder(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingFolder) return;
    deleteFolder(deletingFolder.id, reassignTargetFolderId || undefined);
    setDeletingFolder(null);
    setReassignTargetFolderId('');
  };

  // Fast inline price save
  const handleSaveInlinePrice = (productId: string) => {
    if (tempPriceInput > 0) {
      updateProduct(productId, { price_without_tax: tempPriceInput });
      setEditingPriceItem(null);
    }
  };

  // Batch clone all products from Shop A into Shop B
  const handleSyncAllBetweenShops = (sourceShopId: string, targetShopId: string, markup = 1.08) => {
    const sourceProducts = products.filter(p => p.folderId === sourceShopId);
    const sourceIds = sourceProducts.map(p => p.id);
    const count = batchDuplicateToFolder(sourceIds, targetShopId, markup);

    const sourceFolder = folders.find(f => f.id === sourceShopId);
    const targetFolder = folders.find(f => f.id === targetShopId);

    setSyncNotice(
      `Synced ${count} products from ${sourceFolder?.name || 'Shop'} to ${targetFolder?.name || 'Target'} with ${(markup >= 1 ? `+${Math.round((markup - 1) * 100)}%` : '')} price markup!`
    );
    setTimeout(() => setSyncNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {syncNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="p-1 hover:bg-emerald-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-stone-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-stone-900">Retail Shop &amp; Folder Management</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Two Shop · Two Price Engine
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage store locations, compare multi-shop prices for identical products, and configure branch-specific price tags.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewTab('shops')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewTab === 'shops'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Retail Shops ({shopFolders.length})</span>
          </button>

          <button
            onClick={() => setViewTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewTab === 'matrix'
                ? 'bg-white text-orange-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-orange-600" />
            <span>Multi-Shop Prices</span>
          </button>

          <button
            onClick={() => setViewTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewTab === 'categories'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-stone-500" />
            <span>Categories ({categoryFolders.length})</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: RETAIL SHOPS & BRANCHES
          ------------------------------------------------------------- */}
      {viewTab === 'shops' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Active Store Branches ({shopFolders.length})
            </h3>
            <button
              onClick={() => openAddModal('shop')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Store Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopFolders.map(folder => {
              const folderProducts = products.filter(p => p.folderId === folder.id);
              const totalUnits = folderProducts.reduce((sum, p) => sum + p.stockQuantity, 0);
              const totalValuation = folderProducts.reduce((sum, p) => sum + p.stockQuantity * p.price_with_tax, 0);

              return (
                <div
                  key={folder.id}
                  className="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
                >
                  <div>
                    {/* Top header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: folder.color }}
                        >
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-stone-900">{folder.name}</h4>
                          <span className="text-[11px] font-mono font-bold text-stone-400">{folder.code}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(folder)}
                          title="Edit Store"
                          className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {folders.length > 1 && (
                          <button
                            onClick={() => {
                              setDeletingFolder(folder);
                              const alt = folders.find(f => f.id !== folder.id)?.id || '';
                              setReassignTargetFolderId(alt);
                            }}
                            title="Delete Store"
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Location & Markup info */}
                    <div className="mt-3 space-y-1 text-xs">
                      {folder.storeLocation && (
                        <div className="text-stone-600 font-medium flex items-center gap-1.5">
                          <span className="text-[10px] text-stone-400 uppercase font-bold">Location:</span>
                          <span>{folder.storeLocation}</span>
                        </div>
                      )}
                      {folder.markupPercent !== undefined && folder.markupPercent !== 0 && (
                        <div className="text-orange-700 font-bold flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          <span>Default Price Markup: +{folder.markupPercent}%</span>
                        </div>
                      )}
                      <p className="text-[11px] text-stone-500 line-clamp-2 pt-1">
                        {folder.description || 'Retail store branch location.'}
                      </p>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Products</span>
                        <span className="font-mono font-bold text-stone-900 text-sm">{folderProducts.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Units</span>
                        <span className="font-mono font-bold text-stone-900 text-sm">{totalUnits.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Valuation</span>
                        <span className="font-mono font-bold text-emerald-700 text-xs">¥{Math.round(totalValuation).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectFolderToView(folder.id)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                    >
                      <span>View Price Tags</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {folder.id !== 'fld-shop-tokyo' && folderProducts.length < 50 && (
                      <button
                        onClick={() => handleSyncAllBetweenShops('fld-shop-tokyo', folder.id, folder.markupPercent ? 1 + folder.markupPercent / 100 : 1.08)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors cursor-pointer"
                        title="Sync all products from Tokyo Main to this branch with automatic markup"
                      >
                        <RefreshCw className="w-3 h-3 text-orange-600" />
                        <span>Sync from Tokyo</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: MULTI-SHOP PRICE MATRIX (Same Product, Two Shop, Two Price)
          ------------------------------------------------------------- */}
      {viewTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <span>Multi-Shop Price Comparison Matrix</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  Two Shop · Two Price
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Compare retail prices for the same physical product across branches. Click any price to edit, or click <strong>+ Add to Shop</strong> to clone with a shop price.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={matrixSearch}
                onChange={e => setMatrixSearch(e.target.value)}
                placeholder="Search products by title, origin..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Matrix Comparison Table */}
          <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4 min-w-[220px]">Base Product</th>
                    <th className="py-3 px-3 min-w-[100px]">Weight</th>
                    <th className="py-3 px-3 min-w-[100px]">Origin</th>
                    {shopFolders.map(shop => (
                      <th key={shop.id} className="py-3 px-4 text-right min-w-[160px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: shop.color }} />
                          <span className="text-stone-800 font-bold">{shop.name}</span>
                        </div>
                        {shop.markupPercent ? (
                          <div className="text-[10px] text-orange-600 font-mono font-normal">
                            +{shop.markupPercent}% markup
                          </div>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {productMatrixGroups.slice(0, 50).map((group, gIdx) => {
                    return (
                      <tr key={gIdx} className="hover:bg-stone-50/80 transition-colors">
                        {/* Base Product Name */}
                        <td className="py-3 px-4 font-bold text-stone-900">
                          <div className="truncate max-w-[240px]">{group.baseName}</div>
                        </td>

                        {/* Weight */}
                        <td className="py-3 px-3 font-mono text-stone-600">
                          {group.weight}
                        </td>

                        {/* Origin */}
                        <td className="py-3 px-3 font-bold text-stone-700">
                          {group.origin}
                        </td>

                        {/* Each Shop Column */}
                        {shopFolders.map(shop => {
                          const shopItem = group.items.find(p => p.folderId === shop.id);
                          const isEditingThis = editingPriceItem?.productId === shopItem?.id;

                          if (shopItem) {
                            return (
                              <td key={shop.id} className="py-3 px-4 text-right font-mono">
                                {isEditingThis ? (
                                  <div className="inline-flex items-center gap-1 justify-end">
                                    <input
                                      type="number"
                                      value={tempPriceInput}
                                      onChange={e => setTempPriceInput(parseInt(e.target.value) || 0)}
                                      className="w-20 px-2 py-0.5 text-xs font-bold border border-orange-400 rounded bg-white text-right"
                                      autoFocus
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleSaveInlinePrice(shopItem.id);
                                        if (e.key === 'Escape') setEditingPriceItem(null);
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSaveInlinePrice(shopItem.id)}
                                      className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => {
                                      setEditingPriceItem({ productId: shopItem.id, currentPrice: shopItem.price_without_tax });
                                      setTempPriceInput(shopItem.price_without_tax);
                                    }}
                                    className="cursor-pointer group flex flex-col items-end"
                                    title="Click to edit shop price"
                                  >
                                    <span className="font-black text-red-600 group-hover:underline">
                                      ¥{shopItem.price_without_tax.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                      込¥{shopItem.price_with_tax.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          } else {
                            // Product not yet in this shop: provide 1-click clone button
                            const baseSourceItem = group.items[0];
                            return (
                              <td key={shop.id} className="py-3 px-4 text-right">
                                <button
                                  onClick={() => setProductToClone(baseSourceItem)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors cursor-pointer"
                                  title={`Add ${group.baseName} to ${shop.name} with custom price`}
                                >
                                  <Plus className="w-3 h-3 text-orange-600" />
                                  <span>+ Add Price</span>
                                </button>
                              </td>
                            );
                          }
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 font-mono flex items-center justify-between">
              <span>Showing first 50 multi-shop product groups</span>
              <span>Use the search bar above to filter items across all branches</span>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: PRODUCT CATEGORIES
          ------------------------------------------------------------- */}
      {viewTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Product Category Groups ({categoryFolders.length})
            </h3>
            <button
              onClick={() => openAddModal('category')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Add Category Group</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryFolders.map(folder => {
              const folderProducts = products.filter(p => p.folderId === folder.id);
              const totalUnits = folderProducts.reduce((sum, p) => sum + p.stockQuantity, 0);
              const totalValuation = folderProducts.reduce((sum, p) => sum + p.stockQuantity * p.price_with_tax, 0);

              return (
                <div
                  key={folder.id}
                  className="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-sm shrink-0 shadow-xs" style={{ backgroundColor: folder.color }} />
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">{folder.name}</h4>
                          <span className="text-[11px] font-mono text-stone-500 font-semibold">{folder.code}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(folder)}
                          title="Edit Group"
                          className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {folders.length > 1 && (
                          <button
                            onClick={() => {
                              setDeletingFolder(folder);
                              const alt = folders.find(f => f.id !== folder.id)?.id || '';
                              setReassignTargetFolderId(alt);
                            }}
                            title="Delete Group"
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-stone-500 line-clamp-2 min-h-[32px]">
                      {folder.description || 'Category classification group.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Products</span>
                        <span className="font-mono font-bold text-stone-900 text-sm">{folderProducts.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Units</span>
                        <span className="font-mono font-bold text-stone-900 text-sm">{totalUnits.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Valuation</span>
                        <span className="font-mono font-bold text-emerald-700 text-xs">¥{Math.round(totalValuation).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectFolderToView(folder.id)}
                      className="flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                    >
                      <span>View Products</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          ADD / EDIT FOLDER MODAL
          ------------------------------------------------------------- */}
      {(isAddModalOpen || editingFolder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl">
            {/* Top-Right Cross Sign Close Button */}
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingFolder(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>

            <h3 className="text-base font-black text-stone-900 mb-1 pr-8">
              {editingFolder ? 'Edit Store Branch or Folder' : 'Create New Store Branch or Folder'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Configure branch parameters, retail location, and default price adjustments.
            </p>

            {formError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={editingFolder ? handleEditSubmit : handleAddSubmit} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFolderType('shop');
                      if (code.startsWith('GRP-')) setCode('SHOP-' + code.slice(4));
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      folderType === 'shop'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-stone-300 text-stone-600'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>🏪 Store Branch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFolderType('category');
                      if (code.startsWith('SHOP-')) setCode('GRP-' + code.slice(5));
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      folderType === 'category'
                        ? 'bg-red-50 border-red-500 text-red-900'
                        : 'bg-white border-stone-300 text-stone-600'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-red-600" />
                    <span>📁 Category Group</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Branch / Folder Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={folderType === 'shop' ? 'e.g. Yokohama Branch Store' : 'e.g. SPICES & SEASONINGS'}
                  required
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Identifier Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder={folderType === 'shop' ? 'e.g. SHOP-YOK' : 'e.g. GRP-SPICE'}
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg text-stone-900 uppercase focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              {folderType === 'shop' && (
                <>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Store Address / Location</label>
                    <input
                      type="text"
                      value={storeLocation}
                      onChange={e => setStoreLocation(e.target.value)}
                      placeholder="e.g. Yokohama Naka-ku · Yamashita 12"
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Default Price Adjustment (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={markupPercent}
                      onChange={e => setMarkupPercent(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 8 for +8%"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">Automatic markup applied when cloning products to this branch</p>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Notes about this location or category..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1.5">Color Tag</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-md transition-transform flex items-center justify-center shadow-xs cursor-pointer ${
                        color === c ? 'scale-110 ring-2 ring-stone-900 ring-offset-2' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingFolder(null);
                  }}
                  className="px-3.5 py-1.5 font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingFolder ? 'Save Changes' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          DELETE CONFIRMATION MODAL
          ------------------------------------------------------------- */}
      {deletingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl">
            {/* Top-Right Cross Sign Close Button */}
            <button
              type="button"
              onClick={() => setDeletingFolder(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>

            <h3 className="text-base font-bold text-stone-900 mb-2 pr-8">Delete Store &amp; Reassign Products</h3>
            <p className="text-xs text-stone-600 mb-4">
              You are about to delete <span className="font-bold text-red-600">{deletingFolder.name}</span>.
              Please select where products belonging to this location should be transferred:
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Target Reassignment Folder
              </label>
              <select
                value={reassignTargetFolderId}
                onChange={e => setReassignTargetFolderId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-red-500 font-medium"
              >
                {folders
                  .filter(f => f.id !== deletingFolder.id)
                  .map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setDeletingFolder(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Confirm Delete &amp; Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone To Shop Modal */}
      <CloneToShopModal
        isOpen={!!productToClone}
        product={productToClone}
        onClose={() => setProductToClone(null)}
        onSuccess={(cloned) => {
          setSyncNotice(`Created shop price tag for ${cloned.product_name_eng} (¥${cloned.price_without_tax.toLocaleString()}).`);
          setTimeout(() => setSyncNotice(null), 4000);
        }}
      />
    </div>
  );
};
