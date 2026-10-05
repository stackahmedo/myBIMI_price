import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Palette,
  Type,
  Maximize2,
  Printer,
  Database,
  Check,
  Copy,
  Code,
  FileSpreadsheet,
  Globe,
  Sparkles,
  Compass,
  Box,
  X,
} from 'lucide-react';
import { MyBimiPriceCardSvg } from './MyBimiPriceCardSvg';
import {
  Product,
  PriceCardTypographyConfig,
  DEFAULT_TYPOGRAPHY_CONFIG,
  AVAILABLE_JP_FONTS,
  AVAILABLE_JP_SUBFONTS,
  AVAILABLE_EN_FONTS,
  AVAILABLE_EN_SUBFONTS,
  AVAILABLE_PRICE_FONTS,
  AVAILABLE_PRICE_SUBFONTS,
} from '../types/inventory';

export type ArchitectureSection =
  | 'overview'
  | 'geometry'
  | 'print'
  | 'tokens'
  | 'typography'
  | 'components'
  | 'multishop';

interface CoordinateZone {
  id: string;
  name: string;
  nameJp: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  badgeBg: string;
  description: string;
  printSpec: string;
}

const POP_COORDINATE_ZONES: CoordinateZone[] = [
  {
    id: 'top_accent',
    name: 'Top Accent Safety Strip',
    nameJp: '上部アクセント帯',
    x: 0,
    y: 0,
    width: 1507,
    height: 28,
    color: '#FF5A00',
    badgeBg: 'bg-orange-500',
    description: 'Full-bleed retail orange (#FF5A00) safety anchor, immune to supermarket plastic rail clip obscuration.',
    printSpec: 'x: 0, y: 0, w: 1507, h: 28 (0mm → 1.74mm physical)',
  },
  {
    id: 'brand_emblem',
    name: 'Brand Emblem & Store Sub-Kicker',
    nameJp: 'ブランドロゴ＆ハラール店舗表記',
    x: 62,
    y: 42,
    width: 780,
    height: 180,
    color: '#0B6043',
    badgeBg: 'bg-emerald-700',
    description: 'MyBIMI crimson & emerald seal with "HALAL 360 STORE" guarantee emblem.',
    printSpec: 'x: 62, y: 42, w: 780, h: 180 (3.7mm × 11.2mm physical)',
  },
  {
    id: 'freshness_ribbon',
    name: 'Freshness Ribbon Badge',
    nameJp: '新鮮度保証リボン',
    x: 902,
    y: 34,
    width: 580,
    height: 188,
    color: '#0B6043',
    badgeBg: 'bg-emerald-800',
    description: 'Dynamic angled polygon ribbon with "新鮮で美味しい" and English freshness kicker.',
    printSpec: 'x: 902, y: 34, w: 580, h: 188 (53.8mm × 11.7mm physical)',
  },
  {
    id: 'title_jp',
    name: 'Primary Japanese Title Zone',
    nameJp: '商品名（日本語）表示枠',
    x: 64,
    y: 240,
    width: 1380,
    height: 135,
    color: '#D61C24',
    badgeBg: 'bg-red-600',
    description: 'Clamped SVG clipPath (#titleJpClip) supporting 2-line auto-wrap and spacingAndGlyphs scaling.',
    printSpec: 'x: 64, y: 240, w: 1380, h: 135 (max-w: 82.4mm physical)',
  },
  {
    id: 'title_en',
    name: 'Secondary English Title Zone',
    nameJp: '商品名（英語）表示枠',
    x: 64,
    y: 390,
    width: 1380,
    height: 110,
    color: '#2563EB',
    badgeBg: 'bg-blue-600',
    description: 'High-contrast Latin typography bounds (#titleEnClip) with uppercase retail tracking.',
    printSpec: 'x: 64, y: 390, w: 1380, h: 110 (max-w: 82.4mm physical)',
  },
  {
    id: 'hero_price',
    name: 'Hero Ex-Tax Price (本体価格)',
    nameJp: '本体価格（税抜）特大数値',
    x: 770,
    y: 560,
    width: 670,
    height: 220,
    color: '#D61C24',
    badgeBg: 'bg-red-600',
    description: 'Right-aligned retail price numerals up to 142px size, capped at 570px width to avoid collision.',
    printSpec: 'x: 770..1440, y: 560..780 (End-aligned, 21:1 WCAG contrast)',
  },
  {
    id: 'tax_badge',
    name: 'Tax Rate Badge (8% / 10%)',
    nameJp: '消費税率バッジ（軽減税率）',
    x: 510,
    y: 683,
    width: 240,
    height: 172,
    color: '#FF5A00',
    badgeBg: 'bg-orange-600',
    description: 'Consumption tax indicator compliant with Japan National Tax Agency retail invoice standards.',
    printSpec: 'x: 510, y: 683, w: 240, h: 172 (14.3mm × 10.7mm physical)',
  },
  {
    id: 'specs_zone',
    name: 'Origin & Weight Specification',
    nameJp: '産地・規格・内容量ゾーン',
    x: 64,
    y: 683,
    width: 420,
    height: 172,
    color: '#475569',
    badgeBg: 'bg-slate-700',
    description: 'Strict 420px maximum boundary preventing encroachment on the tax rate badge at x=510.',
    printSpec: 'x: 64, y: 683, w: 420, h: 172 (25.1mm × 10.7mm physical)',
  },
  {
    id: 'tax_inclusive_price',
    name: 'Tax-Inclusive Price (税込価格)',
    nameJp: '税込価格（総額表示法対応）',
    x: 770,
    y: 790,
    width: 670,
    height: 140,
    color: '#050505',
    badgeBg: 'bg-stone-900',
    description: 'Mandatory Japanese Total Price Display Law numeral with black container backing.',
    printSpec: 'x: 770..1440, y: 790..930 (End-aligned, bold Gothic stack)',
  },
  {
    id: 'bottom_slant',
    name: 'Bottom Slanted Slash Accent',
    nameJp: '下部ダイナミックスラッシュ',
    x: 0,
    y: 994,
    width: 1507,
    height: 50,
    color: '#FF5A00',
    badgeBg: 'bg-orange-500',
    description: 'Sharp dynamic decorative slash reinforcing forward energy and retail freshness aesthetics.',
    printSpec: 'x: 0, y: 994, w: 1507, h: 50 (Full-width base bleed)',
  },
];

export const DesignSystemArchitectureView: React.FC = () => {
  const { products, folders } = useInventory();
  const [activeSection, setActiveSection] = useState<ArchitectureSection>('overview');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Interactive Coordinate Inspector State
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('title_jp');
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Typography Lab interactive state
  const [specimenConfig, setSpecimenConfig] = useState<PriceCardTypographyConfig>(DEFAULT_TYPOGRAPHY_CONFIG);
  const specimenJpText = '豪州産 特選和牛リブアイステーキ';
  const specimenEnText = 'PREMIUM AUSTRALIAN WAGYU RIBEYE';
  const specimenPrice = 2980;

  // Token Export Modal State
  const [isExportTokensOpen, setIsExportTokensOpen] = useState(false);
  const [exportTokenFormat, setExportTokenFormat] = useState<'json' | 'css' | 'tailwind'>('json');

  // Active sample product for live visual schematics
  const sampleProduct: Product = useMemo(() => {
    if (products.length > 0) return products[0];
    return {
      id: 'demo-sample-1',
      serial: 101,
      sku: 'WAGYU-101',
      name: 'PREMIUM AUSTRALIAN WAGYU RIBEYE',
      product_name_eng: 'PREMIUM AUSTRALIAN WAGYU RIBEYE',
      product_name_jp: '豪州産 特選和牛リブアイステーキ',
      weight_unit: '300 g',
      tax_rate: 8.0,
      price_without_tax: 2980,
      price_with_tax: 3218,
      origin: 'AUSTRALIA',
      folderId: folders[0]?.id || 'fld-shop-tokyo',
      category: 'Halal Meat & Poultry',
      description: 'Premium Australian Halal Wagyu Ribeye Steak cut',
      unitCost: 1800,
      sellingPrice: 3218,
      stockQuantity: 45,
      reorderPoint: 10,
      maxCapacity: 100,
      unit: 'pcs',
      location: 'Tokyo Main Walk-in Freezer #2',
      supplier: 'Halal Meat Global Export',
      leadTimeDays: 3,
      lastRestocked: '2026-01-01T00:00:00.000Z',
      status: 'in_stock',
      updatedAt: '2026-01-01T00:00:00.000Z',
      barcode: '8901234567901',
    };
  }, [products, folders]);

  const activeZone = useMemo(() => {
    const activeId = hoveredZoneId || selectedZoneId;
    return POP_COORDINATE_ZONES.find(z => z.id === activeId) || null;
  }, [hoveredZoneId, selectedZoneId]);

  const copyToClipboard = (text: string, tokenName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Generate Tokens in selected format
  const generatedTokensString = useMemo(() => {
    const tokens = {
      color: {
        brand: {
          crimson: '#D61C24',
          emerald: '#0B6043',
          orange: '#FF5A00',
          jet: '#050505',
        },
        surface: {
          canvas: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
        },
        status: {
          in_stock: '#10B981',
          low_stock: '#F59E0B',
          out_of_stock: '#EF4444',
          on_order: '#0284C7',
        },
      },
      geometry: {
        cardWidthMm: 90,
        cardHeightMm: 65,
        vectorWidth: 1507,
        vectorHeight: 1044,
        dpi: 425,
        aspectRatio: 1.443,
      },
      printSheet: {
        paper: 'A4',
        paperWidthMm: 210,
        paperHeightMm: 297,
        columns: 2,
        rows: 4,
        capacity: 8,
        marginXmm: 13,
        marginYmm: 15.5,
        gutterXmm: 4,
        gutterYmm: 3,
      },
      typography: {
        primaryJpFont: specimenConfig.jpFont,
        primaryEnFont: specimenConfig.enFont,
        primaryPriceFont: specimenConfig.priceFont,
      },
    };

    if (exportTokenFormat === 'json') {
      return JSON.stringify(tokens, null, 2);
    }

    if (exportTokenFormat === 'css') {
      return `:root {
  /* BIMI TAG PRO Design Tokens */
  --bimi-crimson: #D61C24;
  --bimi-emerald: #0B6043;
  --bimi-orange: #FF5A00;
  --bimi-jet: #050505;

  /* Surfaces & Borders */
  --bimi-surface-canvas: #F8FAFC;
  --bimi-surface-card: #FFFFFF;
  --bimi-border: #E2E8F0;

  /* Card Geometry (Physical mm & 425 DPI Vector) */
  --bimi-card-width-mm: 90mm;
  --bimi-card-height-mm: 65mm;
  --bimi-vector-width: 1507px;
  --bimi-vector-height: 1044px;

  /* A4 Gang Sheet Configuration */
  --bimi-a4-cols: 2;
  --bimi-a4-rows: 4;
  --bimi-a4-margin-x: 13mm;
  --bimi-a4-margin-y: 15.5mm;
  --bimi-a4-gap-x: 4mm;
  --bimi-a4-gap-y: 3mm;
}`;
    }

    return `// tailwind.config.js snippet
module.exports = {
  theme: {
    extend: {
      colors: {
        bimi: {
          crimson: '#D61C24',
          emerald: '#0B6043',
          orange: '#FF5A00',
          jet: '#050505',
        },
      },
      screens: {
        print: { raw: 'print' },
      },
    },
  },
};`;
  }, [exportTokenFormat, specimenConfig]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <span className="text-red-500 font-bold uppercase tracking-wider">System Architecture</span>
            <span aria-hidden="true">/</span>
            <span>BIMI TAG PRO</span>
            <span aria-hidden="true">/</span>
            <span className="text-emerald-400 font-bold">Design System &amp; Engine Spec v2.6</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Design System &amp; Technical Architecture Blueprint</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Interactive
            </span>
          </h1>

          <p className="text-sm text-stone-300 leading-relaxed font-normal">
            Bilingual Japanese/Latin supermarket POP engine specification, physical 90mm × 65mm SVG geometry,
            zero-bleed A4 gang sheet print pipeline, multi-shop pricing matrix, and reactive state architecture.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsExportTokensOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Export Design Tokens (JSON / CSS / Tailwind)</span>
            </button>
            <span className="text-xs text-stone-400 font-mono">
              Calibrated for Japanese Supermarket Retail Shelving
            </span>
          </div>
        </div>

        {/* Subtle Decorative Background Lines */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center font-mono text-8xl font-black select-none text-emerald-300">
          90×65
        </div>
      </div>

      {/* Navigation Segmented Control */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-200/80 rounded-xl overflow-x-auto text-xs font-bold shrink-0">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'overview'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-red-600" />
          <span>Architecture &amp; Data Pipeline</span>
        </button>

        <button
          onClick={() => setActiveSection('geometry')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'geometry'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5 text-orange-600" />
          <span>90×65mm POP Card Blueprint</span>
        </button>

        <button
          onClick={() => setActiveSection('print')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'print'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Printer className="w-3.5 h-3.5 text-emerald-700" />
          <span>A4 Gang Sheet &amp; Print Engine</span>
        </button>

        <button
          onClick={() => setActiveSection('tokens')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'tokens'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-blue-600" />
          <span>Design Tokens &amp; Color Engine</span>
        </button>

        <button
          onClick={() => setActiveSection('typography')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'typography'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-purple-600" />
          <span>Bilingual Typography Specimen Lab</span>
        </button>

        <button
          onClick={() => setActiveSection('components')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'components'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-indigo-600" />
          <span>UI Components &amp; Atomic Library</span>
        </button>

        <button
          onClick={() => setActiveSection('multishop')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'multishop'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-600" />
          <span>Multi-Shop Matrix Model</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW & DATA PIPELINE ARCHITECTURE                                  */}
      {/* ========================================================================= */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Architectural Diagram Box */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <span>System Data Flow &amp; Rendering Pipeline</span>
                  <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Dual Fallback Ingestion
                  </span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  End-to-end lifecycle from data ingestion (Google Sheets / Excel) through state consolidation to dual print rendering targets.
                </p>
              </div>

              <div className="text-xs font-mono text-stone-400">
                Client-Side Engine · Zero Latency
              </div>
            </div>

            {/* Pipeline Stage Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Stage 1: Ingestion */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 relative hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                  <span>STAGE 01</span>
                  <Globe className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="font-bold text-sm text-stone-900">Ingestion Layer</h3>
                <ul className="text-xs text-stone-600 space-y-1.5 leading-relaxed">
                  <li>• Google Sheets copy/paste URL parser</li>
                  <li>• Automatic GID &amp; Tab extraction</li>
                  <li>• Remote Excel (.xlsx/.xls) fetcher</li>
                  <li>• Dev proxy middleware (<code>/api/proxy-sheet</code>)</li>
                  <li>• Direct drag &amp; drop file reader</li>
                </ul>
              </div>

              {/* Stage 2: Normalization */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 relative hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                  <span>STAGE 02</span>
                  <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                </div>
                <h3 className="font-bold text-sm text-stone-900">Normalization Engine</h3>
                <ul className="text-xs text-stone-600 space-y-1.5 leading-relaxed">
                  <li>• Multilingual header matcher (EN/JP)</li>
                  <li>• Tax-inclusive/exclusive reconciliation</li>
                  <li>• Smart CJK &amp; Latin word wrapping</li>
                  <li>• Shop branch alias resolver</li>
                  <li>• Strict schema validation &amp; error flags</li>
                </ul>
              </div>

              {/* Stage 3: Reactive State */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 relative hover:border-amber-300 transition-colors">
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                  <span>STAGE 03</span>
                  <Database className="w-4 h-4 text-amber-700" />
                </div>
                <h3 className="font-bold text-sm text-stone-900">Reactive Core Store</h3>
                <ul className="text-xs text-stone-600 space-y-1.5 leading-relaxed">
                  <li>• <code>InventoryContext</code> state machine</li>
                  <li>• Multi-shop SKU lookup table</li>
                  <li>• Persistent local cache (<code>localStorage</code>)</li>
                  <li>• Immutable audit ledger logging</li>
                  <li>• Typography preference store</li>
                </ul>
              </div>

              {/* Stage 4: Output Rendering */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 relative hover:border-red-300 transition-colors">
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                  <span>STAGE 04</span>
                  <Printer className="w-4 h-4 text-red-700" />
                </div>
                <h3 className="font-bold text-sm text-stone-900">Dual Print Targets</h3>
                <ul className="text-xs text-stone-600 space-y-1.5 leading-relaxed">
                  <li>• Physical A4 gang sheet (2×4 8-up portal)</li>
                  <li>• Zero-overflow textLength scaling</li>
                  <li>• Clean vector SVG standalone export</li>
                  <li>• 300DPI embedded PDF via <code>jsPDF</code></li>
                  <li>• Cross-browser CSS <code>@page</code> isolation</li>
                </ul>
              </div>
            </div>

            {/* Architectural Highlights */}
            <div className="border-t border-stone-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-stone-900 block">Client-Centric Resilience</span>
                <p className="text-stone-500 leading-relaxed">
                  Entire pricing calculation, SVG rendering, and vector PDF compilation run client-side in the browser without server latency or data leakage.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-stone-900 block">Dual Fallback Ingestion</span>
                <p className="text-stone-500 leading-relaxed">
                  Google Sheets can be synced via direct export, local proxy middleware, or public CORS fallback to ensure 100% availability in all environments.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-stone-900 block">Strict WCAG &amp; Print Precision</span>
                <p className="text-stone-500 leading-relaxed">
                  Card proportions match standard Japanese 90mm × 65mm POP retail card holders, calibrated for standard supermarket display racks.
                </p>
              </div>
            </div>
          </div>

          {/* Component Hierarchy Tree */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center justify-between">
              <span>Component Hierarchy Architecture</span>
              <span className="text-xs font-mono text-stone-400">Strict One-Way Reactive Data Flow</span>
            </h3>
            <div className="font-mono text-xs text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200 overflow-x-auto leading-relaxed">
              <div>App.tsx (Root Shell)</div>
              <div>├── AppSidebar.tsx (Brand Navigation &amp; Store Switcher)</div>
              <div>├── AppTopBar.tsx (Global Command Search &amp; Quick Actions)</div>
              <div>├── InventoryContext.tsx (Authoritative State Provider)</div>
              <div>│   ├── DashboardView.tsx (Overview KPIs, Creation Trends &amp; Category Donut)</div>
              <div>│   ├── ProductMasterGrid.tsx (Live Catalog, Multi-Shop Sibling Badges)</div>
              <div>│   │   ├── BulkPriceEditModal.tsx (Batch Tax &amp; Margin Engine)</div>
              <div>│   │   ├── CloneToShopModal.tsx (Branch Duplication Engine)</div>
              <div>│   │   └── ExcelBulkImportModal.tsx (Spreadsheet &amp; Web Link Ingest)</div>
              <div>│   ├── FolderManager.tsx (Shop &amp; Category Hierarchy, Matrix Matrix)</div>
              <div>│   ├── AnalyticsDashboard.tsx (Stock Movement &amp; Velocity Charts)</div>
              <div>│   ├── AuditTrailView.tsx (Immutable Transaction Ledger)</div>
              <div>│   ├── DesignSystemArchitectureView.tsx (Design System Specimen &amp; Lab)</div>
              <div>│   └── PriceTagMakerModal.tsx (POP Card Studio &amp; Sheet Generator)</div>
              <div>│       ├── TypographyConfigPanel.tsx (Font, Sub-Font &amp; Size Customizer)</div>
              <div>│       └── MyBimiPriceCardSvg.tsx (90×65mm Vector POP Engine)</div>
              <div>└── #print-portal-root (Dedicated zero-margin physical printing DOM tree)</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 90x65mm PHYSICAL POP CARD GEOMETRY BLUEPRINT                          */}
      {/* ========================================================================= */}
      {activeSection === 'geometry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <span>Physical 90mm × 65mm Card Geometry Specification</span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                    Interactive Zone Inspector
                  </span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Vector coordinate space (1507 × 1044 px) calibrated for standard Japanese supermarket POP price holders. Hover or click rows below to inspect bounding boxes.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-stone-500">
                <span>Aspect Ratio: 1507 : 1044</span>
                <span aria-hidden="true">·</span>
                <span>Physical Size: 90mm × 65mm</span>
                <span aria-hidden="true">·</span>
                <span>DPI: 425</span>
              </div>
            </div>

            {/* Interactive Blueprint Schematic View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 cols: Rendered Live Card with Interactive Coordinate Overlay */}
              <div className="lg:col-span-7 bg-stone-50 p-4 sm:p-6 rounded-2xl border border-stone-200 flex flex-col items-center">
                <div className="w-full max-w-xl relative">
                  {/* Base Vector Card */}
                  <MyBimiPriceCardSvg
                    product={sampleProduct}
                    showCropMarks={true}
                    className="w-full shadow-md"
                  />

                  {/* Interactive Coordinate Inspector Overlay */}
                  <svg
                    viewBox="0 0 1507 1044"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: 'visible' }}
                  >
                    {POP_COORDINATE_ZONES.map(zone => {
                      const isSelected = selectedZoneId === zone.id;
                      const isHovered = hoveredZoneId === zone.id;
                      const isActive = isSelected || isHovered;

                      if (!isActive) return null;

                      return (
                        <g key={zone.id}>
                          {/* Highlight box */}
                          <rect
                            x={zone.x}
                            y={zone.y}
                            width={zone.width}
                            height={zone.height}
                            fill={zone.color}
                            fillOpacity={0.22}
                            stroke={zone.color}
                            strokeWidth={5}
                            strokeDasharray="14 7"
                          />
                          {/* Coordinate label tag */}
                          <rect
                            x={zone.x + 8}
                            y={Math.max(8, zone.y - 36)}
                            width={Math.min(480, zone.width - 16)}
                            height={32}
                            rx={6}
                            fill="#0F172A"
                            fillOpacity={0.92}
                          />
                          <text
                            x={zone.x + 18}
                            y={Math.max(30, zone.y - 14)}
                            fill="#FFFFFF"
                            fontSize={18}
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {zone.name} ({zone.width}×{zone.height}px)
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Live Inspector readout below card */}
                {activeZone && (
                  <div className="w-full max-w-xl mt-4 p-3 bg-white rounded-xl border border-stone-300 shadow-xs flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${activeZone.badgeBg}`} />
                      <span className="font-bold text-stone-900">{activeZone.name}</span>
                      <span className="text-stone-400 font-mono text-[11px]">({activeZone.nameJp})</span>
                    </div>
                    <div className="font-mono text-stone-600 text-[11px]">
                      {activeZone.printSpec}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-center text-xs text-stone-400 font-mono">
                  Scale: 1507 × 1044 vector units · 90mm × 65mm at 425 DPI
                </div>
              </div>

              {/* Right 5 cols: Coordinate Zone Architecture Table */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Coordinate Layout Matrix ({POP_COORDINATE_ZONES.length} Zones)
                  </h3>
                  <span className="text-[11px] text-stone-400 font-mono">Click to lock overlay</span>
                </div>

                <div className="space-y-2 text-xs max-h-[580px] overflow-y-auto pr-1">
                  {POP_COORDINATE_ZONES.map(zone => {
                    const isSelected = selectedZoneId === zone.id;
                    const isHovered = hoveredZoneId === zone.id;

                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                        onMouseEnter={() => setHoveredZoneId(zone.id)}
                        onMouseLeave={() => setHoveredZoneId(null)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-800 shadow-sm'
                            : isHovered
                            ? 'bg-stone-100 border-stone-300'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${zone.badgeBg}`} />
                            <span className="font-bold">{zone.name}</span>
                          </div>
                          <span className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-400' : 'text-stone-500'}`}>
                            {zone.printSpec.split('(')[0]}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          {zone.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. A4 GANG SHEET & PRINT PIPELINE                                         */}
      {/* ========================================================================= */}
      {activeSection === 'print' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                A4 Gang Sheet Layout &amp; Zero-Bleed Math
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Standard Japanese A4 paper (210mm × 297mm) holds exactly 8 cards in a 2-column by 4-row layout.
              </p>
            </div>

            {/* Physical Dimensions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase">Paper Size</span>
                <span className="font-bold text-stone-900 text-sm">210mm × 297mm</span>
                <span className="text-stone-500 text-[11px] block mt-0.5">ISO 216 Standard A4</span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase">Grid Arrangement</span>
                <span className="font-bold text-stone-900 text-sm">2 Cols × 4 Rows</span>
                <span className="text-stone-500 text-[11px] block mt-0.5">8 Cards per Sheet</span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase">Page Margins</span>
                <span className="font-bold text-stone-900 text-sm">X: 13mm · Y: 15.5mm</span>
                <span className="text-stone-500 text-[11px] block mt-0.5">Symmetric Centering</span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase">Cutting Gutters</span>
                <span className="font-bold text-stone-900 text-sm">Gap X: 4mm · Gap Y: 3mm</span>
                <span className="text-stone-500 text-[11px] block mt-0.5">Guillotine Safe Spacing</span>
              </div>
            </div>

            {/* Print Engine Comparison Matrix */}
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Print Target / Platform</th>
                    <th className="py-2.5 px-4">Engine Mechanism</th>
                    <th className="py-2.5 px-4">Accuracy / Resolution</th>
                    <th className="py-2.5 px-4">Cross-Browser Consistency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  <tr>
                    <td className="py-3 px-4 font-bold text-stone-900">Vector PDF Export</td>
                    <td className="py-3 px-4 font-mono text-[11px]">jsPDF + High-DPI Vector Canvas</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">300 DPI (Lossless)</td>
                    <td className="py-3 px-4">100% Identical on Mac, Windows, Linux, iOS</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-stone-900">Chrome / Edge Direct Print</td>
                    <td className="py-3 px-4 font-mono text-[11px]">Blink Engine + CSS @page</td>
                    <td className="py-3 px-4">600 DPI Native Spool</td>
                    <td className="py-3 px-4">Exact with Margins set to "None"</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-stone-900">Safari macOS Print</td>
                    <td className="py-3 px-4 font-mono text-[11px]">WebKit Print Spooler</td>
                    <td className="py-3 px-4">Native Quartz Driver</td>
                    <td className="py-3 px-4">Requires "Print headers &amp; footers" unchecked</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DESIGN TOKENS & COLOR ENGINE                                           */}
      {/* ========================================================================= */}
      {activeSection === 'tokens' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Design Tokens &amp; Color System
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Authentic Japanese supermarket POP visual language: Halal Emerald Green, Crimson Red, and Retail Orange.
                </p>
              </div>

              <button
                onClick={() => setIsExportTokensOpen(true)}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs"
              >
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Code Tokens</span>
              </button>
            </div>

            {/* Palette Swatches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Token 1: BIMI Crimson */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="h-20 bg-[#D61C24] flex items-end p-2 text-white font-mono text-xs font-bold">
                  #D61C24
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span>BIMI Crimson Red</span>
                    <button
                      onClick={() => copyToClipboard('#D61C24', 'red')}
                      className="text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {copiedToken === 'red' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Hero price numerals (税抜), MyBIMI brand prefix, discount highlights.
                  </p>
                </div>
              </div>

              {/* Token 2: Halal Emerald */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="h-20 bg-[#0B6043] flex items-end p-2 text-white font-mono text-xs font-bold">
                  #0B6043
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span>Halal Deep Emerald</span>
                    <button
                      onClick={() => copyToClipboard('#0B6043', 'green')}
                      className="text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {copiedToken === 'green' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    BIMI brand mark, fresh quality ribbon, trust assurance badging.
                  </p>
                </div>
              </div>

              {/* Token 3: Retail POP Orange */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="h-20 bg-[#FF5A00] flex items-end p-2 text-white font-mono text-xs font-bold">
                  #FF5A00
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span>Retail POP Accent</span>
                    <button
                      onClick={() => copyToClipboard('#FF5A00', 'orange')}
                      className="text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {copiedToken === 'orange' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Card top accent border (y=0..28), footer slash ribbon, active controls.
                  </p>
                </div>
              </div>

              {/* Token 4: Retail Jet Black */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="h-20 bg-[#050505] flex items-end p-2 text-white font-mono text-xs font-bold">
                  #050505
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span>High-Contrast Jet</span>
                    <button
                      onClick={() => copyToClipboard('#050505', 'black')}
                      className="text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {copiedToken === 'black' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Kanji titles, English specs, tax-inclusive prices (21:1 contrast).
                  </p>
                </div>
              </div>
            </div>

            {/* Semantic Inventory Status Tokens */}
            <div className="border-t border-stone-100 pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Inventory State Tokens
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="font-bold text-emerald-900">In Stock</span>
                  </div>
                  <span className="font-mono text-emerald-700 text-[10px]">#10B981</span>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span className="font-bold text-amber-900">Low Stock</span>
                  </div>
                  <span className="font-mono text-amber-700 text-[10px]">#F59E0B</span>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span className="font-bold text-rose-900">Out of Stock</span>
                  </div>
                  <span className="font-mono text-rose-700 text-[10px]">#EF4444</span>
                </div>

                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    <span className="font-bold text-sky-900">On Order</span>
                  </div>
                  <span className="font-mono text-sky-700 text-[10px]">#0284C7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BILINGUAL TYPOGRAPHY SPECIMEN LAB                                      */}
      {/* ========================================================================= */}
      {activeSection === 'typography' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Bilingual Typography &amp; Sub-Font Specimen Lab
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Inspect live character kerning, kanji glyph weights, fallback cascade stacks, and dynamic size scaling.
              </p>
            </div>

            {/* Interactive Specimen Controls (Primary Font + Sub-Font + Size) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* JP Font, Sub-Font & Size */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>Japanese Font &amp; Sub-Font</span>
                  <span className="font-mono text-emerald-800">{Math.round(specimenConfig.jpFontSizeScale * 100)}%</span>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Primary Font</label>
                  <select
                    value={specimenConfig.jpFont}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, jpFont: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg p-2"
                  >
                    {AVAILABLE_JP_FONTS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Sub-Font (Fallback Cascade)</label>
                  <select
                    value={specimenConfig.jpSubFont}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, jpSubFont: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg p-2"
                  >
                    {AVAILABLE_JP_SUBFONTS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Font Size Scale</label>
                  <input
                    type="range"
                    min="0.75"
                    max="1.35"
                    step="0.05"
                    value={specimenConfig.jpFontSizeScale}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, jpFontSizeScale: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-700 cursor-pointer h-1.5"
                  />
                </div>
              </div>

              {/* EN Font, Sub-Font & Size */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>English Font &amp; Sub-Font</span>
                  <span className="font-mono text-blue-800">{Math.round(specimenConfig.enFontSizeScale * 100)}%</span>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Primary Font</label>
                  <select
                    value={specimenConfig.enFont}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, enFont: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg p-2"
                  >
                    {AVAILABLE_EN_FONTS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Sub-Font (Fallback Cascade)</label>
                  <select
                    value={specimenConfig.enSubFont}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, enSubFont: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg p-2"
                  >
                    {AVAILABLE_EN_SUBFONTS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Font Size Scale</label>
                  <input
                    type="range"
                    min="0.75"
                    max="1.35"
                    step="0.05"
                    value={specimenConfig.enFontSizeScale}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, enFontSizeScale: parseFloat(e.target.value) })}
                    className="w-full accent-blue-700 cursor-pointer h-1.5"
                  />
                </div>
              </div>

              {/* Price Font, Sub-Font & Size */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>Price Numerals Font &amp; Sub-Font</span>
                  <span className="font-mono text-red-600">{Math.round(specimenConfig.priceFontSizeScale * 100)}%</span>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Primary Font</label>
                  <select
                    value={specimenConfig.priceFont}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, priceFont: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg p-2"
                  >
                    {AVAILABLE_PRICE_FONTS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Sub-Font (Fallback Cascade)</label>
                  <select
                    value={specimenConfig.priceSubFont}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, priceSubFont: e.target.value })}
                    className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg p-2"
                  >
                    {AVAILABLE_PRICE_SUBFONTS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 font-mono block">Font Size Scale</label>
                  <input
                    type="range"
                    min="0.75"
                    max="1.35"
                    step="0.05"
                    value={specimenConfig.priceFontSizeScale}
                    onChange={e => setSpecimenConfig({ ...specimenConfig, priceFontSizeScale: parseFloat(e.target.value) })}
                    className="w-full accent-red-600 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Live Specimen Preview Board */}
            <div className="border border-stone-200 rounded-xl p-6 bg-white space-y-6">
              {/* Japanese Specimen */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Japanese Specimen ({specimenConfig.jpFont})</span>
                  <span>Active Size: {Math.round(36 * specimenConfig.jpFontSizeScale)}px</span>
                </div>
                <div
                  className="text-stone-900 font-bold leading-tight"
                  style={{
                    fontFamily: `'${specimenConfig.jpFont}', ${specimenConfig.jpSubFont}`,
                    fontSize: `${Math.round(36 * specimenConfig.jpFontSizeScale)}px`,
                  }}
                >
                  {specimenJpText}
                </div>
                <div className="text-xs text-stone-400 font-mono">
                  Stack: '{specimenConfig.jpFont}', {specimenConfig.jpSubFont}
                </div>
              </div>

              {/* English Specimen */}
              <div className="space-y-1 pt-4 border-t border-stone-100">
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
                  <span>English Specimen ({specimenConfig.enFont})</span>
                  <span>Active Size: {Math.round(32 * specimenConfig.enFontSizeScale)}px</span>
                </div>
                <div
                  className="text-stone-900 font-black tracking-wide leading-tight"
                  style={{
                    fontFamily: `'${specimenConfig.enFont}', ${specimenConfig.enSubFont}`,
                    fontSize: `${Math.round(32 * specimenConfig.enFontSizeScale)}px`,
                  }}
                >
                  {specimenEnText}
                </div>
                <div className="text-xs text-stone-400 font-mono">
                  Stack: '{specimenConfig.enFont}', {specimenConfig.enSubFont}
                </div>
              </div>

              {/* Price Numerals Specimen */}
              <div className="space-y-1 pt-4 border-t border-stone-100">
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Price Numerals Specimen ({specimenConfig.priceFont})</span>
                  <span>Active Size: {Math.round(56 * specimenConfig.priceFontSizeScale)}px</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-red-600 font-black tracking-tight leading-none"
                    style={{
                      fontFamily: `'${specimenConfig.priceFont}', ${specimenConfig.priceSubFont}`,
                      fontSize: `${Math.round(56 * specimenConfig.priceFontSizeScale)}px`,
                    }}
                  >
                    ¥{specimenPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-stone-500 font-mono">税抜 (本体価格)</span>
                  <span
                    className="text-stone-900 font-bold ml-4"
                    style={{
                      fontFamily: `'${specimenConfig.priceFont}', ${specimenConfig.priceSubFont}`,
                      fontSize: `${Math.round(24 * specimenConfig.priceFontSizeScale)}px`,
                    }}
                  >
                    込¥{Math.round(specimenPrice * 1.08).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-stone-400 font-mono">
                  Stack: '{specimenConfig.priceFont}', {specimenConfig.priceSubFont}
                </div>
              </div>

              {/* CJK Glyph Coverage Test Suite */}
              <div className="space-y-2 pt-4 border-t border-stone-100">
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                  CJK Character Set Coverage &amp; Kerning Validation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-stone-600">
                  <div className="p-2 bg-stone-50 rounded border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Kanji + Hiragana + Katakana:</span>
                    <span className="font-bold text-stone-900">特選・和牛・ハラール認証・消費税率・軽減税率</span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Half-Width vs Full-Width Numerals:</span>
                    <span className="font-bold text-stone-900">1234567890 · １２３４５６７８９０ · ¥ · ￥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. UI COMPONENTS & ATOMIC LIBRARY                                         */}
      {/* ========================================================================= */}
      {activeSection === 'components' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                UI Kit &amp; Atomic Component Architecture
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Standard design primitives for catalog manipulation, batch tax adjustments, and print preparation.
              </p>
            </div>

            {/* 1. Button Hierarchy */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                1. Action Buttons Hierarchy
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <button className="flex items-center gap-2 px-3.5 py-2 bg-red-600 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-red-700">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Primary Crimson Action (Print Tag)</span>
                </button>

                <button className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-emerald-800">
                  <Check className="w-3.5 h-3.5" />
                  <span>Halal Emerald Action (Confirm / Save)</span>
                </button>

                <button className="flex items-center gap-2 px-3.5 py-2 bg-orange-600 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-orange-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Retail Orange (Batch Edit)</span>
                </button>

                <button className="flex items-center gap-2 px-3.5 py-2 bg-stone-100 text-stone-800 font-bold text-xs rounded-lg border border-stone-300 hover:bg-stone-200">
                  <span>Neutral Outline (Cancel)</span>
                </button>
              </div>
            </div>

            {/* 2. Status Badges & Chips */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                2. Semantic Badges &amp; Store Chips
              </h3>
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  In Stock (45 pcs)
                </span>

                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  Low Stock Alert
                </span>

                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                  Out of Stock
                </span>

                <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px] font-semibold border border-stone-200">
                  Tax: 8.0% (Reduced Food Rate)
                </span>

                <span className="px-2.5 py-1 rounded-md bg-stone-800 text-white font-mono text-[11px] font-bold">
                  Shop: Tokyo Main Store (TOK)
                </span>
              </div>
            </div>

            {/* 3. Form Input Field Anatomy */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                3. Retail Form Control Anatomy
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Currency Price (Ex-Tax)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-mono text-xs">¥</span>
                    <input
                      type="text"
                      readOnly
                      value="2,980"
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-lg bg-stone-50"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">Tax-inclusive: ¥3,218 (8%)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Bilingual Japanese Name</label>
                  <input
                    type="text"
                    readOnly
                    value="豪州産 特選和牛リブアイステーキ"
                    className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-lg bg-stone-50"
                  />
                  <span className="text-[10px] text-stone-400 font-mono">Kanji / Hiragana glyph input</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Bilingual English Latin Name</label>
                  <input
                    type="text"
                    readOnly
                    value="PREMIUM AUSTRALIAN WAGYU RIBEYE"
                    className="w-full px-3 py-2 text-xs font-bold border border-stone-300 rounded-lg bg-stone-50 uppercase tracking-tight"
                  />
                  <span className="text-[10px] text-stone-400 font-mono">Latin uppercase specs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MULTI-SHOP PRICING MATRIX MODEL                                        */}
      {/* ========================================================================= */}
      {activeSection === 'multishop' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Multi-Shop Pricing Matrix Data Architecture
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                How BIMI TAG PRO supports multiple prices for the same physical product across different retail branch stores.
              </p>
            </div>

            {/* Architecture Concept */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3 text-xs leading-relaxed text-stone-600">
                <h3 className="font-bold text-sm text-stone-900">Master SKU vs Branch SKU Association</h3>
                <p>
                  Retail businesses often sell identical inventory items at different prices depending on store location (e.g. prime downtown flagship vs suburban warehouse outlet).
                </p>
                <p>
                  In BIMI TAG PRO, items share an identical <strong>masterSku</strong> (or matching product name) while maintaining branch-specific:
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-700 font-medium pl-1">
                  <li><code>price_without_tax</code> (Base retail price)</li>
                  <li><code>price_with_tax</code> (Calculated with store-specific tax rules)</li>
                  <li><code>folderId</code> (Shop/branch association token)</li>
                  <li><code>stockQuantity</code> (Local warehouse shelf balance)</li>
                </ul>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 font-mono text-xs text-stone-800">
                <span className="text-[10px] text-stone-400 block uppercase">Product Entity Schema</span>
                <div className="text-[11px] leading-relaxed bg-white p-3 rounded-lg border border-stone-200 overflow-x-auto">
                  <div>interface Product {'{'}</div>
                  <div className="pl-3">id: string; // Unique record ID</div>
                  <div className="pl-3">masterSku?: string; // Grouping token</div>
                  <div className="pl-3">sku: string; // Branch SKU</div>
                  <div className="pl-3">product_name_eng: string;</div>
                  <div className="pl-3">product_name_jp: string;</div>
                  <div className="pl-3 text-red-600 font-bold">price_without_tax: number; // Shop price</div>
                  <div className="pl-3 text-emerald-700 font-bold">folderId: string; // Target shop ID</div>
                  <div>{'}'}</div>
                </div>
              </div>
            </div>

            {/* Current Registered Shops Table */}
            <div className="border-t border-stone-100 pt-4 space-y-2">
              <h4 className="text-xs font-bold text-stone-900">Configured Shop Folders in Engine:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {folders.map(f => {
                  const itemCount = products.filter(p => p.folderId === f.id).length;
                  return (
                    <div key={f.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-stone-900">
                        <span>{f.name}</span>
                        <span className="font-mono text-stone-400 text-[10px]">{f.code}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1">
                        Type: {f.type === 'shop' ? 'Retail Store' : 'Category Group'} · {itemCount} items
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Tokens Modal */}
      {isExportTokensOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  DS
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">BIMI Design Tokens Export</h3>
                  <p className="text-[11px] text-stone-500">Machine-readable design tokens for web, print, and CAD systems</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    onClick={() => setExportTokenFormat('json')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      exportTokenFormat === 'json' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setExportTokenFormat('css')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      exportTokenFormat === 'css' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                    }`}
                  >
                    CSS
                  </button>
                  <button
                    onClick={() => setExportTokenFormat('tailwind')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      exportTokenFormat === 'tailwind' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                    }`}
                  >
                    Tailwind
                  </button>
                </div>

                {/* Top-Right Cross Sign Close Button */}
                <button
                  type="button"
                  onClick={() => setIsExportTokensOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer shrink-0 ml-1"
                  title="Close modal (Esc)"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-xs text-stone-800 bg-stone-950 text-stone-200">
              <pre className="whitespace-pre-wrap leading-relaxed select-all">
                {generatedTokensString}
              </pre>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
              <button
                onClick={() => copyToClipboard(generatedTokensString, 'export_tokens')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                {copiedToken === 'export_tokens' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Tokens Snippet</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsExportTokensOpen(false)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold rounded-lg hover:bg-stone-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
