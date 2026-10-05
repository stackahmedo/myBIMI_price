import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { INITIAL_TREND_DATA } from '../data/initialData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Line,
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Filter, 
  Globe,
  Tag
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { products, folders } = useInventory();

  // Filter states
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [stockMetricView, setStockMetricView] = useState<'units' | 'valuation'>('units');
  const [pieMode, setPieMode] = useState<'valuation' | 'units'>('valuation');

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (selectedFolderId === 'all') return products;
    return products.filter(p => p.folderId === selectedFolderId);
  }, [products, selectedFolderId]);

  // Aggregate KPIs
  const stats = useMemo(() => {
    const totalValuationWithTax = products.reduce((acc, p) => acc + p.stockQuantity * p.price_with_tax, 0);
    const totalBaseValuation = products.reduce((acc, p) => acc + p.stockQuantity * p.price_without_tax, 0);
    const totalUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
    const lowStockCount = products.filter(p => p.status === 'low_stock').length;
    const outOfStockCount = products.filter(p => p.status === 'out_of_stock').length;
    const healthyCount = products.filter(p => p.status === 'in_stock' || p.status === 'overstocked').length;
    const healthPercentage = products.length > 0 ? Math.round((healthyCount / products.length) * 100) : 100;

    return {
      totalValuationWithTax,
      totalBaseValuation,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      healthyCount,
      healthPercentage,
      skuCount: products.length,
    };
  }, [products]);

  // Chart 1: Inventory Levels vs Reorder Threshold by Product
  const productStockData = useMemo(() => {
    return filteredProducts.slice(0, 10).map(p => ({
      name: p.product_name_eng.length > 16 ? p.product_name_eng.substring(0, 16) + '...' : p.product_name_eng,
      fullName: p.product_name_eng,
      sku: p.sku,
      currentStock: p.stockQuantity,
      reorderPoint: p.reorderPoint,
      priceWithTax: p.price_with_tax,
      totalValue: p.stockQuantity * p.price_with_tax,
      origin: p.origin,
    }));
  }, [filteredProducts]);

  // Chart 2: Product Category & Folder Distribution
  const folderDistribution = useMemo(() => {
    const map = new Map<string, { name: string; color: string; value: number; units: number; count: number }>();

    folders.forEach(f => {
      map.set(f.id, {
        name: f.name,
        color: f.color || '#16a34a',
        value: 0,
        units: 0,
        count: 0,
      });
    });

    products.forEach(p => {
      const entry = map.get(p.folderId);
      if (entry) {
        entry.value += p.stockQuantity * p.price_with_tax;
        entry.units += p.stockQuantity;
        entry.count += 1;
      }
    });

    return Array.from(map.values()).filter(item => item.count > 0 || item.units > 0);
  }, [products, folders]);

  // Chart 3: Distribution by Country of Origin
  const originDistribution = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      const orig = p.origin || 'UNKNOWN';
      map.set(orig, (map.get(orig) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([origin, count]) => ({ origin, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 - Retail Valuation (Green) */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Retail Valuation (税込)</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-700">
            ¥{stats.totalValuationWithTax.toLocaleString()}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-slate-700 font-semibold font-mono">
              ¥{stats.totalBaseValuation.toLocaleString()}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>税抜 catalog base</span>
          </div>
        </div>

        {/* KPI 2 - Total Units (Red / Crimson) */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Total Units In Stock</span>
            <span className="p-1 rounded-md bg-red-50 text-red-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.totalUnits.toLocaleString()}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-red-600 font-bold font-mono">{stats.skuCount}</span>
            <span>price tags active</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{folders.length} groups</span>
          </div>
        </div>

        {/* KPI 3 - Critical Reorder (Orange) */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Critical Reorder Alerts</span>
            <span className="p-1 rounded-md bg-orange-50 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-orange-600">
            {stats.lowStockCount}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-red-600 font-bold font-mono">{stats.outOfStockCount}</span>
            <span>depleted</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-orange-700 font-medium">shelf restock needed</span>
          </div>
        </div>

        {/* KPI 4 - Stock Health Index (Green) */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Stock Health Index</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.healthPercentage}%
          </div>
          <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-700 font-semibold font-mono">{stats.healthyCount} items</span>
            <span>optimal inventory level</span>
          </div>
        </div>
      </div>

      {/* Row 1: Stock Level vs Reorder Point */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Inventory Levels vs. Reorder Threshold by Product</h3>
            <p className="text-xs text-slate-500">Compares shelf volume against safety minimums across price tag products</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedFolderId}
                onChange={e => setSelectedFolderId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 font-medium"
              >
                <option value="all">All Groups ({products.length} products)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setStockMetricView('units')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  stockMetricView === 'units' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Units
              </button>
              <button
                onClick={() => setStockMetricView('valuation')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  stockMetricView === 'valuation' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Valuation (¥)
              </button>
            </div>
          </div>
        </div>

        <div className="h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={productStockData}
              margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                tick={{ fill: '#475569', fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#475569', fontSize: 11 }}
                tickFormatter={val => (stockMetricView === 'valuation' ? `¥${val}` : `${val}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(val: any, name: any) => [
                  stockMetricView === 'valuation' && name === 'Inventory Valuation'
                    ? `¥${Number(val).toLocaleString()}`
                    : Number(val).toLocaleString(),
                  name,
                ]}
                labelFormatter={(_, items) => {
                  if (items && items[0]) {
                    const item = items[0].payload;
                    return `${item.fullName} (Origin: ${item.origin})`;
                  }
                  return '';
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />
              {stockMetricView === 'units' ? (
                <>
                  <Bar
                    dataKey="currentStock"
                    name="Current Stock Units"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="reorderPoint"
                    name="Safety Reorder Threshold"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : (
                <Bar
                  dataKey="totalValue"
                  name="Inventory Valuation (¥)"
                  fill="#dc2626"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Category/Folder Distribution & Stock Movement Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category & Folder Donut Chart (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Product Folder Distribution</h3>
                <p className="text-xs text-slate-500">Capital and unit share across product groups</p>
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setPieMode('valuation')}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                    pieMode === 'valuation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Value (¥)
                </button>
                <button
                  onClick={() => setPieMode('units')}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                    pieMode === 'units' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Units
                </button>
              </div>
            </div>

            <div className="h-56 w-full min-w-0 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={folderDistribution}
                    dataKey={pieMode === 'valuation' ? 'value' : 'units'}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {folderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(val: any) => [
                      pieMode === 'valuation'
                        ? `¥${Number(val).toLocaleString()}`
                        : `${Number(val).toLocaleString()} units`,
                      pieMode === 'valuation' ? 'Valuation' : 'Stock Units',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Folder Breakdown List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {folderDistribution.map(f => {
              const totalVal = folderDistribution.reduce((a, b) => a + (pieMode === 'valuation' ? b.value : b.units), 0);
              const curVal = pieMode === 'valuation' ? f.value : f.units;
              const percent = totalVal > 0 ? Math.round((curVal / totalVal) * 100) : 0;

              return (
                <div key={f.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: f.color }} />
                    <span className="text-slate-700 font-medium truncate max-w-[150px]">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums text-slate-500">
                    <span className="text-slate-900 font-semibold">
                      {pieMode === 'valuation' ? `¥${Math.round(f.value).toLocaleString()}` : `${f.units} pcs`}
                    </span>
                    <span className="text-[11px] text-slate-400 w-8 text-right font-medium">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Movement Inflow / Outflow Trends (7 cols) */}
        <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock Movement & Inflow Trends</h3>
                <p className="text-xs text-slate-500">Inventory intake vs store floor shelf dispatches</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">Last 30 Days</span>
            </div>

            <div className="h-64 w-full min-w-0 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={INITIAL_TREND_DATA}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    name="Inflow (Import / Received)"
                    stroke="#16a34a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInflow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    name="Outflow (Store Shelf Sales)"
                    stroke="#dc2626"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOutflow)"
                  />
                  <Line
                    type="monotone"
                    dataKey="netBalance"
                    name="Net Movement"
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#ea580c' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Positive net intake rate over recent retail restock cycles</span>
            </span>
            <span className="font-mono text-slate-700 font-semibold">
              Avg Daily Intake: ~460 units
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Country of Origin Distribution Breakdown */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Product Catalog by Country of Origin (産地)</h3>
            <p className="text-xs text-slate-500">International distribution of imported and domestic food items</p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500">{originDistribution.length} Sourcing Regions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {originDistribution.map(item => (
            <div
              key={item.origin}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-orange-600" />
                <span className="font-mono font-bold text-slate-800">{item.origin}</span>
              </div>
              <span className="font-mono font-bold text-red-600 tabular-nums px-2 py-0.5 rounded bg-red-50 border border-red-100">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
