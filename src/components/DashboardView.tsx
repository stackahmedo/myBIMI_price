import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  Tag,
  Store,
  Layers,
  ChevronRight,
  Calendar,
  ChevronDown,
  BarChart2,
  PieChart as PieChartIcon,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  PlusCircle,
  Edit3,
  Clock,
  Printer,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: 'dashboard' | 'products' | 'folders' | 'history' | 'analytics' | 'architecture') => void;
  onOpenPriceTagMaker: (product?: Product) => void;
  onOpenAddProduct: () => void;
  onOpenExcelImport: (tab?: 'file' | 'weblink') => void;
  onOpenBulkEdit: () => void;
  onSelectProductToEdit?: (product: Product) => void;
  onSelectStoreFilter?: (storeName: string) => void;
}

// Custom Tooltip for Trend Chart
const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xl text-xs font-mono border border-slate-700 pointer-events-none">
        <div className="text-[10px] text-slate-400 font-semibold mb-0.5">{label}</div>
        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>{payload[0].value} tags</span>
        </div>
      </div>
    );
  }
  return null;
};

const CATEGORY_COLORS = ['#10b981', '#f59e0b', '#0284c7', '#8b5cf6', '#f43f5e', '#ec4899', '#64748b'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenPriceTagMaker,
  onOpenAddProduct,
  onOpenExcelImport,
  onOpenBulkEdit,
  onSelectProductToEdit,
  onSelectStoreFilter,
}) => {
  const { products, folders, transactions } = useInventory();

  // Time range toggle state: '7D' | '30D' | '90D' | '1Y'
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');

  // Date range picker toggle
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedDateRangeLabel, setSelectedDateRangeLabel] = useState('Current Period');

  // Dynamic Category breakdown computed from real products
  const categoryBreakdown = useMemo(() => {
    if (products.length === 0) return [];
    const countMap = new Map<string, number>();
    products.forEach(p => {
      const cat = p.category?.trim() || 'General';
      countMap.set(cat, (countMap.get(cat) || 0) + 1);
    });

    const items: { name: string; count: number; color: string }[] = [];
    let idx = 0;
    countMap.forEach((count, name) => {
      items.push({
        name,
        count,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      });
      idx++;
    });

    return items.sort((a, b) => b.count - a.count);
  }, [products]);

  // Dynamic Store-wise products computed from real folders and products
  const storeWiseData = useMemo(() => {
    const shopFolders = folders.filter(f => f.type === 'shop' || f.code?.startsWith('SHOP-'));
    if (shopFolders.length === 0) return [];
    return shopFolders.map(shop => {
      const count = products.filter(p => p.folderId === shop.id).length;
      const pct = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
      return { shop, count, pct };
    });
  }, [folders, products]);

  // Dynamic Low stock alerts computed from real products
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stockQuantity <= p.reorderPoint).slice(0, 5);
  }, [products]);

  // Dynamic Recent Imports from transactions
  const recentImports = useMemo(() => {
    return transactions.filter(t => t.productSku === 'EXCEL-IMPORT').slice(0, 3);
  }, [transactions]);

  // Dynamic Recent activities from transactions
  const recentActivities = useMemo(() => {
    return transactions.slice(0, 4);
  }, [transactions]);

  // Dynamic trend chart data based on transactions or empty state
  const chartData = useMemo(() => {
    if (transactions.length === 0 && products.length === 0) {
      return [
        { date: 'Day 1', tags: 0 },
        { date: 'Day 5', tags: 0 },
        { date: 'Day 10', tags: 0 },
        { date: 'Day 15', tags: 0 },
        { date: 'Day 20', tags: 0 },
        { date: 'Day 25', tags: 0 },
        { date: 'Day 30', tags: 0 },
      ];
    }
    // Simple grouped timeline if transactions exist
    return [
      { date: 'Week 1', tags: Math.min(transactions.length, 12) },
      { date: 'Week 2', tags: Math.min(transactions.length * 2, 28) },
      { date: 'Week 3', tags: Math.min(transactions.length * 3, 45) },
      { date: 'Week 4', tags: transactions.length },
    ];
  }, [transactions, products]);

  // Recent products list for table
  const recentProductsList = useMemo(() => {
    return products.slice(0, 5);
  }, [products]);

  const activeStoresCount = folders.filter(f => f.type === 'shop' || f.code?.startsWith('SHOP-')).length;
  const categoriesCount = folders.filter(f => f.type === 'category' || f.code?.startsWith('GRP-')).length || categoryBreakdown.length;
  const priceTagsCreatedCount = transactions.filter(t => t.type === 'outflow' || t.productSku.includes('TAG') || t.reason?.toLowerCase().includes('tag')).length;

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Header Section: Title & Date Range Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
              Dashboard
            </h1>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="System online" />
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Real-time catalog analytics, store distribution &amp; price tag activities
          </p>
        </div>

        {/* Date Range Selector Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setDateRangeOpen(!dateRangeOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400 stroke-[1.75]" />
            <span className="text-xs font-medium text-slate-800">{selectedDateRangeLabel}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${dateRangeOpen ? 'rotate-180' : ''}`} />
          </button>

          {dateRangeOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200/90 rounded-xl shadow-lg shadow-slate-900/5 z-30 py-1 text-xs text-slate-600 font-medium animate-in fade-in zoom-in-95 duration-100">
              {['Current Period', 'Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'All Time'].map(range => (
                <button
                  key={range}
                  onClick={() => {
                    setSelectedDateRangeLabel(range);
                    setDateRangeOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between text-xs cursor-pointer ${
                    selectedDateRangeLabel === range ? 'font-semibold text-emerald-700 bg-emerald-50/50' : 'text-slate-600'
                  }`}
                >
                  <span>{range}</span>
                  {selectedDateRangeLabel === range && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 1: Four Stat Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <button
              className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100 transition-colors"
              title="View all products"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Products
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight font-mono">
              {products.length}
            </div>
            <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
              <span>{products.length === 0 ? 'Empty catalog' : `${products.length} active items`}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Price Tags Created */}
        <div
          onClick={() => onOpenPriceTagMaker()}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Tag className="w-5 h-5 text-orange-500" />
            </div>
            <button
              className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100 transition-colors"
              title="Open Price Tag Maker"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Price Tags Created
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight font-mono">
              {priceTagsCreatedCount}
            </div>
            <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
              <span>{priceTagsCreatedCount === 0 ? 'Ready to print' : `${priceTagsCreatedCount} tags logged`}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Stores */}
        <div
          onClick={() => onNavigateTab('folders')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <button
              className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100 transition-colors"
              title="View store locations"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Stores
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight font-mono">
              {activeStoresCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1 truncate">
              {activeStoresCount === 0 ? 'No stores configured' : `${activeStoresCount} locations`}
            </div>
          </div>
        </div>

        {/* Card 4: Categories */}
        <div
          onClick={() => onNavigateTab('folders')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <button
              className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100 transition-colors"
              title="View categories and groups"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Categories
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight font-mono">
              {categoriesCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1 truncate">
              {categoriesCount === 0 ? 'No groups yet' : `${categoriesCount} categories`}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Price Tag Creation Trend (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Price Tag Creation Trend
              </h2>
            </div>

            {/* Time Filter Pills: 7D, 30D, 90D, 1Y */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 self-start sm:self-auto">
              {(['7D', '30D', '90D', '1Y'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tagTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={[0, Math.max(10, transactions.length + 5)]}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tags"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#tagTrendGradient)"
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Products by Category (col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between h-full min-h-[340px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Products by Category
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {categoryBreakdown.length} Categories
            </span>
          </div>

          {/* Donut chart + Legend */}
          {categoryBreakdown.length === 0 ? (
            <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <PieChartIcon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-slate-700">No categories found</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Add products to automatically track category distribution.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 my-auto w-full min-w-0">
              <div className="relative w-[140px] h-[140px] shrink-0 flex items-center justify-center select-none">
                <PieChart width={140} height={140}>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} items (${Math.round((Number(value) / (products.length || 1)) * 100)}%)`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Pie
                    data={categoryBreakdown}
                    cx={70}
                    cy={70}
                    innerRadius={44}
                    outerRadius={66}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900 leading-none font-mono">
                    {products.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    Products
                  </span>
                </div>
              </div>

              {/* Legend breakdown list */}
              <div className="flex-1 w-full min-w-0 space-y-1 max-h-48 overflow-y-auto">
                {categoryBreakdown.map(cat => (
                  <div
                    key={cat.name}
                    onClick={() => onNavigateTab('products')}
                    className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                    title={`${cat.name}: ${cat.count} items (${Math.round((cat.count / (products.length || 1)) * 100)}%)`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-slate-600 font-medium truncate group-hover:text-slate-900">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 font-mono text-[11px] shrink-0">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Four Info Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Store Wise Products */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Store Wise Products</h3>
            </div>

            {storeWiseData.length === 0 ? (
              <div className="py-6 text-center">
                <Store className="w-6 h-6 mx-auto mb-1.5 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">No stores configured</p>
                <button
                  onClick={() => onNavigateTab('folders')}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  + Add Store in Folders
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {storeWiseData.map(({ shop, count, pct }) => (
                  <div
                    key={shop.id}
                    onClick={() => onSelectStoreFilter?.(shop.name)}
                    className="cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white font-bold text-[10px]"
                          style={{ backgroundColor: shop.color || '#16a34a' }}
                        >
                          {shop.name.slice(0, 1)}
                        </div>
                        <span className="text-slate-700 group-hover:text-emerald-700 transition-colors truncate">
                          {shop.name}
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0 ml-2">
                        <span className="font-bold text-slate-800">{count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: shop.color || '#16a34a',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800">Low Stock Alerts</h3>
              </div>
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shadow-xs">
                {lowStockItems.length}
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-emerald-500 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-700">Healthy Inventory</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No products below reorder thresholds</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab('products')}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center text-xs shrink-0 font-bold">
                        ⚠️
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                        {item.product_name_eng}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-600 font-mono shrink-0 whitespace-nowrap">
                      {item.stockQuantity} {item.unit || 'pcs'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Widget 3: Recent Imports */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Recent Imports</h3>
            </div>

            {recentImports.length === 0 ? (
              <div className="py-6 text-center">
                <FileSpreadsheet className="w-6 h-6 mx-auto mb-1.5 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">No imports yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload Excel files to populate catalog</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentImports.map((imp, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate" title={imp.productName}>
                          {imp.productName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(imp.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Done
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenExcelImport('file')}
            className="mt-4 pt-3 border-t border-slate-100 w-full text-center text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>Import from Excel</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Widget 4: Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">Quick Actions</h3>
            </div>

            <div className="space-y-2">
              {/* Make Price Tags */}
              <button
                onClick={() => onOpenPriceTagMaker()}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-orange-50/80 border border-orange-200/70 hover:bg-orange-100/80 text-orange-950 font-bold text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <span>Make Price Tags</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-orange-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Add New Product */}
              <button
                onClick={() => onOpenAddProduct()}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 hover:bg-emerald-100/80 text-emerald-950 font-bold text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Add New Product</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Import from Excel */}
              <button
                onClick={() => onOpenExcelImport('file')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70 hover:bg-blue-100/80 text-blue-950 font-bold text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Import from Excel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Bulk Edit Products */}
              <button
                onClick={() => onOpenBulkEdit()}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-purple-50/80 border border-purple-200/70 hover:bg-purple-100/80 text-purple-950 font-bold text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-600" />
                  <span>Bulk Edit Products</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Bottom Sections (Recent Products Table & Recent Activities) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Products Table (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Recent Products
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">商品名</th>
                  <th className="py-2.5 px-2 text-center">Weight / Unit</th>
                  <th className="py-2.5 px-3 text-right">Price (incl. tax)</th>
                  <th className="py-2.5 px-3">Origin</th>
                  <th className="py-2.5 px-3">Store</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentProductsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 mx-auto mb-3 flex items-center justify-center text-slate-400">
                        <Package className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No products in catalog</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        All previous sample data has been removed. You can create a new product or import an Excel spreadsheet.
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button
                          onClick={() => onOpenAddProduct()}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Product</span>
                        </button>
                        <button
                          onClick={() => onOpenExcelImport('file')}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                          <span>Import Excel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentProductsList.map((product, idx) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectProductToEdit?.(product)}
                    >
                      <td className="py-3 px-2 font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shrink-0 font-bold text-slate-600">
                          📦
                        </div>
                        <span className="truncate max-w-[170px]" title={product.product_name_eng}>
                          {product.product_name_eng}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-jp truncate max-w-[130px]">
                        {product.product_name_jp || '—'}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-500 text-[11px]">
                        {product.weight_unit || '1pc'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 font-mono text-xs">
                        ¥{product.price_with_tax.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                          {product.origin || 'JAPAN'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs">
                        {product.category || 'Retail Store'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenPriceTagMaker(product);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          title="Print Price Tag"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Activities (col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Recent Activities
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeline Feed items */}
          <div className="space-y-3.5 my-auto">
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">No activity logged yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Stock adjustments, tag prints, and product additions will be recorded here.
                </p>
              </div>
            ) : (
              recentActivities.map(act => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === 'inflow' ? (
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                    ) : act.type === 'outflow' ? (
                      <Printer className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Edit3 className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-800 truncate">{act.productName}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] truncate mt-0.5">
                      {act.reason}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
