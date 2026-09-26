import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { ProductFolder } from '../types/inventory';
import { 
  FolderPlus, 
  Folder, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  X,
  Layers
} from 'lucide-react';

interface FolderManagerProps {
  onSelectFolderToView: (folderId: string) => void;
}

const PRESET_COLORS = [
  '#dc2626', // Red
  '#16a34a', // Green
  '#ea580c', // Orange
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Crimson/Rose
  '#0284c7', // Sky
  '#475569', // Slate
];

export const FolderManager: React.FC<FolderManagerProps> = ({ onSelectFolderToView }) => {
  const { folders, products, addFolder, updateFolder, deleteFolder } = useInventory();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProductFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<ProductFolder | null>(null);
  const [reassignTargetFolderId, setReassignTargetFolderId] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#dc2626');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setName('');
    setCode('');
    setDescription('');
    setColor('#dc2626');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (folder: ProductFolder) => {
    setEditingFolder(folder);
    setName(folder.name);
    setCode(folder.code);
    setDescription(folder.description);
    setColor(folder.color);
    setFormError('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFormError('Folder name and uppercase code are mandatory.');
      return;
    }
    addFolder({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      color,
    });
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder) return;
    if (!name.trim() || !code.trim()) {
      setFormError('Folder name and uppercase code are mandatory.');
      return;
    }
    updateFolder(editingFolder.id, {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      color,
    });
    setEditingFolder(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingFolder) return;
    deleteFolder(deletingFolder.id, reassignTargetFolderId || undefined);
    setDeletingFolder(null);
    setReassignTargetFolderId('');
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Product Folders & Organizational Groups</h2>
          <p className="text-xs text-slate-500">
            Categorize SKUs into structured material groups, track asset valuation per cluster, and configure bulk group operations
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Product Folder</span>
        </button>
      </div>

      {/* Grid of folders */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {folders.map(folder => {
          const folderProducts = products.filter(p => p.folderId === folder.id);
          const totalUnits = folderProducts.reduce((sum, p) => sum + p.stockQuantity, 0);
          const totalValuation = folderProducts.reduce((sum, p) => sum + p.stockQuantity * p.price_with_tax, 0);
          const lowStockCount = folderProducts.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length;

          return (
            <div
              key={folder.id}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-sm shrink-0 shadow-xs"
                      style={{ backgroundColor: folder.color }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{folder.name}</h3>
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">{folder.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(folder)}
                      title="Edit Folder"
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
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
                        title="Delete Folder"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                  {folder.description || 'No folder description provided.'}
                </p>

                {/* Metrics Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Products</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                      {folderProducts.length}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Units</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                      {totalUnits.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Valuation</span>
                    <span className="font-mono font-bold text-emerald-700 tabular-nums text-sm">
                      ¥{Math.round(totalValuation).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {lowStockCount > 0 ? (
                  <span className="text-xs text-orange-600 font-semibold flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                    <span>{lowStockCount} SKU alert{lowStockCount > 1 ? 's' : ''}</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Nominal stock levels</span>
                )}

                <button
                  onClick={() => onSelectFolderToView(folder.id)}
                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  <span>Filter SKUs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Folder Modal */}
      {(isAddModalOpen || editingFolder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingFolder(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingFolder ? 'Edit Product Folder' : 'Create New Product Folder'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Define the folder parameters and visual accent color for catalog grouping.
            </p>

            {formError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={editingFolder ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Folder Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. SPICES & MASALA"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Group Code Identifier *</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GRP-SPICE"
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief summary of items in this shelf cluster..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chart & Accent Tag Color</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-md transition-transform flex items-center justify-center shadow-xs ${
                        color === c ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingFolder(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingFolder ? 'Save Changes' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Folder & Reassign SKUs</h3>
            <p className="text-xs text-slate-600 mb-4">
              You are about to delete <span className="font-bold text-red-600">{deletingFolder.name}</span>.
              Please select where products belonging to this group should be transferred:
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Reassignment Folder
              </label>
              <select
                value={reassignTargetFolderId}
                onChange={e => setReassignTargetFolderId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-red-500 font-medium"
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

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setDeletingFolder(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
              >
                Confirm Delete & Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
