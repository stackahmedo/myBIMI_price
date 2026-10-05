import React from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  LayoutDashboard,
  Tag,
  Package,
  FolderTree,
  Boxes,
  FileSpreadsheet,
  TrendingUp,
  History,
  Compass,
  Settings,
  MapPin,
  ChevronRight,
  X,
} from 'lucide-react';

export type SidebarTab =
  | 'dashboard'
  | 'pricetags'
  | 'products'
  | 'folders'
  | 'stock'
  | 'import'
  | 'analytics'
  | 'history'
  | 'architecture'
  | 'settings';

interface AppSidebarProps {
  currentTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  activeStoreFilter?: string;
  onSelectStoreFilter?: (storeName: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenLoginModal?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentTab,
  onTabChange,
  activeStoreFilter = 'All',
  onSelectStoreFilter,
  isOpenMobile = false,
  onCloseMobile,
  onOpenLoginModal,
}) => {
  const { products, folders, adminUser } = useInventory();

  const handleSelectTab = (tab: SidebarTab) => {
    onTabChange(tab);
    onCloseMobile?.();
  };

  const navItems = [
    { id: 'dashboard' as SidebarTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pricetags' as SidebarTab, label: 'Price Tags', icon: Tag },
    { id: 'products' as SidebarTab, label: 'Products', icon: Package },
    { id: 'folders' as SidebarTab, label: 'Groups & Folders', icon: FolderTree },
    { id: 'stock' as SidebarTab, label: 'Stock Management', icon: Boxes },
    { id: 'import' as SidebarTab, label: 'Import / Export', icon: FileSpreadsheet },
    { id: 'analytics' as SidebarTab, label: 'Analytics', icon: TrendingUp },
    { id: 'history' as SidebarTab, label: 'Audit Trail', icon: History },
    { id: 'architecture' as SidebarTab, label: 'Design System', icon: Compass },
    { id: 'settings' as SidebarTab, label: 'Settings', icon: Settings },
  ];

  const shopFolders = folders.filter(f => f.type === 'shop' || f.code?.startsWith('SHOP-'));
  const storeItems = [
    { name: 'All Stores', count: products.length, filterKey: 'All' },
    ...shopFolders.map(sf => ({
      name: sf.name,
      count: products.filter(p => p.folderId === sf.id).length,
      filterKey: sf.id,
    })),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:h-screen lg:shrink-0 select-none`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
          {/* Top Brand Header */}
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <button
              onClick={() => handleSelectTab('dashboard')}
              className="text-left flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              {/* Green square badge with "B" and red dot */}
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm shadow-xs shrink-0">
                <span className="font-mono">B</span>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">
                  Card Studio
                </h1>
                <h6 className="text-[10px] font-bold text-slate-400 tracking-wide leading-tight mt-0.5">
                  by mybimi
                </h6>
              </div>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Menu */}
          <div className="px-3 py-3 space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-semibold'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Section: Shops / Stores */}
          <div className="mt-3 px-3 pt-3 border-t border-slate-100">
            <div className="px-3 mb-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Shops / Stores</span>
            </div>

            <div className="space-y-0.5">
              {storeItems.map(store => {
                const isSelected = activeStoreFilter === store.filterKey;
                return (
                  <button
                    key={store.name}
                    onClick={() => {
                      onSelectStoreFilter?.(store.filterKey);
                      onCloseMobile?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="truncate">{store.name}</span>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? 'bg-emerald-200/60 text-emerald-900 font-bold'
                          : 'text-slate-500 font-semibold'
                      }`}
                    >
                      {store.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Profile and Sync Status */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div
            onClick={() => onOpenLoginModal?.()}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                A
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-slate-800 truncate leading-none">
                  {adminUser?.name || 'Alex Vance'}
                </div>
                <div className="text-[10px] font-medium text-slate-400 leading-none mt-1">
                  Admin
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Sync indicator */}
          <div className="mt-2.5 px-2 flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="font-semibold text-slate-700">BIMI Cloud Sync</span>
            </span>
            <span className="text-emerald-700 font-bold">Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};
