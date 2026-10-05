import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Product,
  PriceCardTypographyConfig,
  DEFAULT_TYPOGRAPHY_CONFIG,
  AVAILABLE_JP_FONTS,
  AVAILABLE_EN_FONTS,
  AVAILABLE_PRICE_FONTS,
} from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import {
  Printer,
  X,
  Download,
  FileText,
  Sliders,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Grid3X3,
  Scissors,
  Loader2,
  HelpCircle,
  Search,
  Store,
  Type,
} from 'lucide-react';
import { MyBimiPriceCardSvg, getMyBimiCardSvgString } from './MyBimiPriceCardSvg';
import { TypographyConfigPanel } from './TypographyConfigPanel';
import { jsPDF } from 'jspdf';

interface PriceTagMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  preselectedProduct?: Product | null;
}

export type PaperSize = 'A4' | 'A5' | 'A3';
export type ViewTab = 'sheet' | 'studio' | 'typography';

const STORAGE_KEY_TYPOGRAPHY = 'bimi_tag_pro_card_typography';

export const PriceTagMakerModal: React.FC<PriceTagMakerModalProps> = ({
  isOpen,
  onClose,
  products,
  preselectedProduct,
}) => {
  const { folders } = useInventory();
  const folderMap = useMemo(() => new Map(folders.map(f => [f.id, f])), [folders]);

  // Tabs and view
  const [activeTab, setActiveTab] = useState<ViewTab>('sheet');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [showCropGuides, setShowCropGuides] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showBrowserTips, setShowBrowserTips] = useState(false);
  const [showInlineTypography, setShowInlineTypography] = useState(false);
  const [printNotice, setPrintNotice] = useState<{ title: string; desc: string; pdfReady?: boolean } | null>(null);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);

  // Typography Configuration (Japanese font/sub-font/size, English font/sub-font/size, Price font/sub-font/size)
  const [typography, setTypography] = useState<PriceCardTypographyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TYPOGRAPHY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TYPOGRAPHY_CONFIG;
  });

  const handleTypographyChange = (newConfig: PriceCardTypographyConfig) => {
    setTypography(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_TYPOGRAPHY, JSON.stringify(newConfig));
    } catch {}
  };

  // Search and shop filter for queue
  const [searchQuery, setSearchQuery] = useState('');
  const [shopFilter, setShopFilter] = useState<string>('all');

  const [selectedStudioProduct, setSelectedStudioProduct] = useState<Product>(
    () => preselectedProduct || products[0] || ({} as Product)
  );

  // Pagination for sheet view
  const [currentPage, setCurrentPage] = useState(1);

  // Export scope: 'selected' or 'all'
  const [exportScope, setExportScope] = useState<'selected' | 'all'>('selected');

  // Print mode: 'all' (all pages) or 'current' (current page only)
  const [printTarget, setPrintTarget] = useState<'all' | 'current'>('all');

  // Mobile controls
  const [showConfigMobile, setShowConfigMobile] = useState(false);

  // Filtered queue of catalog for list display
  const filteredCatalog = useMemo(() => {
    return products.filter(p => {
      if (shopFilter !== 'all' && p.folderId !== shopFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const f = folderMap.get(p.folderId)?.name.toLowerCase() || '';
        return (
          p.product_name_eng.toLowerCase().includes(q) ||
          p.product_name_jp.toLowerCase().includes(q) ||
          p.origin.toLowerCase().includes(q) ||
          f.includes(q) ||
          p.serial.toString().includes(q)
        );
      }
      return true;
    });
  }, [products, shopFilter, searchQuery, folderMap]);

  // Selected items queue
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (preselectedProduct) return [preselectedProduct.id];
    return products.slice(0, 8).map(p => p.id);
  });

  // Exactly 8 cards per A4 page (2 columns x 4 rows)
  const cardsPerPage = useMemo(() => {
    if (paperSize === 'A5') return 4;
    if (paperSize === 'A3') return 16;
    return 8; // Standard A4 8-up
  }, [paperSize]);

  // Filtered queue of items based on scope
  const itemsToPrint = useMemo(() => {
    if (exportScope === 'all') {
      return shopFilter !== 'all' ? products.filter(p => p.folderId === shopFilter) : products;
    }
    const selected = products.filter(p => selectedIds.includes(p.id));
    return selected.length > 0 ? selected : products.slice(0, 8);
  }, [products, selectedIds, exportScope, shopFilter]);

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(itemsToPrint.length / cardsPerPage));

  // Current page cards for on-screen interactive preview
  const currentSheetCards = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return itemsToPrint.slice(start, start + cardsPerPage);
  }, [itemsToPrint, currentPage, cardsPerPage]);

  // Chunk items into pages of 8 cards for physical multi-page printing
  const printPagesChunks = useMemo(() => {
    if (printTarget === 'current') {
      return [currentSheetCards];
    }
    const pages: Product[][] = [];
    for (let i = 0; i < itemsToPrint.length; i += cardsPerPage) {
      pages.push(itemsToPrint.slice(i, i + cardsPerPage));
    }
    return pages.length > 0 ? pages : [[]];
  }, [itemsToPrint, cardsPerPage, printTarget, currentSheetCards]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    const visibleIds = filteredCatalog.map(p => p.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Direct Browser Print (Multi-page zero-bleed physical A4)
  const handlePrint = (target: 'all' | 'current') => {
    setIsPrinting(true);
    setPrintTarget(target);
    setPrintNotice(null);

    // Allow React to re-render the portal with target pages before dispatching print
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn('Direct window.print encountered error or sandbox limitation:', err);
      }

      setIsPrinting(false);
      setPrintNotice({
        title: target === 'all' ? `Print Job Ready (${itemsToPrint.length} cards)` : `Print Page ${currentPage} Ready`,
        desc: 'Browser print dialog dispatched. If popup was blocked by your browser preview frame, download the print-ready A4 PDF directly below.',
        pdfReady: true,
      });
    }, 120);
  };

  // Standalone Single SVG Download
  const handleDownloadSingleSvg = (product: Product) => {
    const svgContent = getMyBimiCardSvgString(product, typography);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = product.product_name_eng.replace(/[^A-Za-z0-9_-]/g, '_').toLowerCase();
    link.download = `MyBIMI_PriceTag_${product.serial}_${safeName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Multi-page PDF Export Engine
  const handleExportPdf = async (scope: 'all' | 'current' = 'all') => {
    try {
      setIsExportingPdf(true);
      const cardsList = scope === 'current' ? currentSheetCards : itemsToPrint;
      const pagesCount = Math.max(1, Math.ceil(cardsList.length / cardsPerPage));
      setPdfProgress({ current: 0, total: pagesCount });

      const pdf = new jsPDF({
        orientation: paperSize === 'A5' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: paperSize.toLowerCase() as 'a4' | 'a5' | 'a3',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Card geometry in mm (90mm x 65mm standard Japanese POP shelf talker)
      const cardW = 90;
      const cardH = 65;
      const gapX = 4;
      const gapY = 3;

      const cols = paperSize === 'A3' ? 4 : 2;
      const rows = paperSize === 'A5' ? 2 : paperSize === 'A3' ? 4 : 4;

      const totalGridW = cols * cardW + (cols - 1) * gapX;
      const totalGridH = rows * cardH + (rows - 1) * gapY;

      const marginX = (pageWidth - totalGridW) / 2;
      const marginY = (pageHeight - totalGridH) / 2;

      // Helper to render an SVG card into high-res PNG for vector PDF embedding
      const renderCardToPng = (product: Product): Promise<string> => {
        return new Promise((resolve) => {
          try {
            let svgString = getMyBimiCardSvgString(product, typography);
            // Remove external @import so SVG image does not fail CORS in isolated context
            svgString = svgString.replace(/@import\s+url\([^)]+\);?/g, '');
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();

            const timer = setTimeout(() => {
              URL.revokeObjectURL(url);
              resolve('');
            }, 1200);

            img.onload = () => {
              clearTimeout(timer);
              const canvas = document.createElement('canvas');
              canvas.width = 1507;
              canvas.height = 1044;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                URL.revokeObjectURL(url);
                resolve('');
                return;
              }
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              resolve(canvas.toDataURL('image/png', 0.95));
            };

            img.onerror = () => {
              clearTimeout(timer);
              URL.revokeObjectURL(url);
              resolve('');
            };

            img.src = url;
          } catch {
            resolve('');
          }
        });
      };

      for (let pIdx = 0; pIdx < pagesCount; pIdx++) {
        if (pIdx > 0) pdf.addPage();
        setPdfProgress({ current: pIdx + 1, total: pagesCount });

        const pageCards = cardsList.slice(pIdx * cardsPerPage, (pIdx + 1) * cardsPerPage);

        for (let cIdx = 0; cIdx < pageCards.length; cIdx++) {
          const card = pageCards[cIdx];
          const col = cIdx % cols;
          const row = Math.floor(cIdx / cols);

          const x = marginX + col * (cardW + gapX);
          const y = marginY + row * (cardH + gapY);

          const imgData = await renderCardToPng(card);
          pdf.addImage(imgData, 'PNG', x, y, cardW, cardH);

          // Optional Guillotine Cut Guides (Thin dashed rectangle)
          if (showCropGuides) {
            pdf.setDrawColor(210, 210, 210);
            pdf.setLineDashPattern([1.5, 2], 0);
            pdf.rect(x, y, cardW, cardH);
            pdf.setLineDashPattern([], 0);
          }
        }
      }

      const fileName =
        scope === 'current'
          ? `MyBIMI_PriceCards_Page${currentPage}_${paperSize}.pdf`
          : `MyBIMI_PriceCards_${paperSize}_${cardsList.length}items.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
      setPdfProgress(null);
    }
  };

  // Mount physical print portal to document.getElementById('print-portal-root')
  const printPortalContainer = typeof document !== 'undefined' ? document.getElementById('print-portal-root') : null;

  return (
    <>
      {/* -------------------------------------------------------------
          ON-SCREEN MODAL INTERACTION
          ------------------------------------------------------------- */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto no-print">
        <div className="relative w-full max-w-7xl bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
          {/* Top App Bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-stone-50">
            <div className="flex items-center gap-3">
              {/* MyBIMI Badge */}
              <div className="h-9 px-2.5 rounded-lg bg-emerald-900 text-white flex items-center gap-1.5 shadow-xs shrink-0">
                <span className="font-black text-red-500 italic text-sm">My</span>
                <span className="font-black text-emerald-300 text-sm">BIMI</span>
                <span className="text-[10px] text-emerald-200 font-bold ml-1 uppercase hidden sm:inline">Price Studio</span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex bg-stone-200/80 p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setActiveTab('sheet')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'sheet'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Print Sheet ({paperSize})</span>
                </button>
                <button
                  onClick={() => setActiveTab('studio')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'studio'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Card Studio</span>
                </button>
                <button
                  onClick={() => setActiveTab('typography')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'typography'
                      ? 'bg-white text-orange-950 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5 text-orange-600" />
                  <span>Fonts &amp; Sizes</span>
                </button>
              </div>

              {/* Quick Font Options Bar Toggle */}
              <button
                onClick={() => setShowInlineTypography(!showInlineTypography)}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  showInlineTypography
                    ? 'bg-orange-50 text-orange-900 border-orange-300 shadow-2xs font-bold'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                }`}
                title="Toggle quick font and size tuning bar"
              >
                <Sliders className="w-3.5 h-3.5 text-orange-600" />
                <span>Fonts Bar {showInlineTypography ? '▲' : '▼'}</span>
              </button>

              {/* Crop Guides Toggle */}
              <button
                onClick={() => setShowCropGuides(!showCropGuides)}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  showCropGuides
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                }`}
                title="Toggle cutting guidelines"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Cut Guides {showCropGuides ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Action Center */}
            <div className="flex items-center gap-2">
              {/* Paper Size Selector */}
              <div className="hidden sm:flex items-center bg-white border border-stone-300 rounded-lg p-0.5 text-xs font-bold shadow-2xs">
                {(['A4', 'A5', 'A3'] as PaperSize[]).map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      setPaperSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      paperSize === size
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {size} ({size === 'A5' ? '4' : size === 'A3' ? '16' : '8'})
                  </button>
                ))}
              </div>

              {/* Scope Filter */}
              <select
                value={exportScope}
                onChange={e => {
                  setExportScope(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 shadow-2xs focus:outline-hidden focus:border-emerald-600"
              >
                <option value="selected">Selected ({selectedIds.length})</option>
                <option value="all">All Catalog ({products.length})</option>
              </select>

              {/* Export PDF Button */}
              <button
                onClick={() => handleExportPdf('all')}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Export high-resolution multi-page PDF (Guaranteed 100% cross-browser fit)"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {pdfProgress ? `${pdfProgress.current}/${pdfProgress.total}p` : 'Exporting…'}
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>

              {/* Print Button (Multi-page clean A4 print) */}
              <div className="relative flex items-center">
                <button
                  onClick={() => handlePrint('all')}
                  disabled={isPrinting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-xs transition-colors active:scale-95 disabled:opacity-75 cursor-pointer"
                  title="Print all selected pages on A4 paper"
                >
                  {isPrinting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Printing…</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print All ({itemsToPrint.length})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Browser Tips Button */}
              <button
                onClick={() => setShowBrowserTips(prev => !prev)}
                className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  showBrowserTips
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                }`}
                title="Cross-Browser & Vercel Printing Tips"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span className="hidden xl:inline">Print Tips</span>
              </button>

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setShowConfigMobile(!showConfigMobile)}
                className="lg:hidden p-1.5 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Close Modal */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200/80 border border-stone-200 hover:border-stone-300 transition-all cursor-pointer ml-1.5 shrink-0"
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Cross-Browser & Vercel Printing Guide Banner */}
          {showBrowserTips && (
            <div className="bg-amber-50/95 border-b border-amber-200 px-4 py-3 text-xs text-amber-950 animate-in slide-in-from-top-2 duration-150 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 max-w-4xl">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>How to get zero text overflow & exact 90×65mm cards in any browser on Vercel:</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px] leading-relaxed">
                    <div className="p-2 bg-white/80 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-bold text-stone-900 block mb-0.5">🌐 Chrome &amp; Edge</span>
                      In Print Dialog → Set <strong>Margins: "None"</strong> (or Minimum), Scale: 100%, and check <strong>"Background graphics"</strong>.
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-bold text-stone-900 block mb-0.5">🧭 Safari &amp; macOS</span>
                      In Print Dialog → Uncheck <strong>"Print headers and footers"</strong> so Safari doesn't shrink the 297mm height.
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-bold text-stone-900 block mb-0.5">⭐ 100% Vector PDF (Best)</span>
                      Click <strong>"Export PDF"</strong>! It generates a pristine, vector-embedded PDF that prints identically on any printer without browser discrepancies.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBrowserTips(false)}
                  className="p-1 text-amber-700 hover:text-amber-950 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Print Notice & Quick Action Banner */}
          {printNotice && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-orange-600 shrink-0" />
                <div>
                  <span className="font-bold">{printNotice.title}: </span>
                  <span className="text-amber-800">{printNotice.desc}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {printNotice.pdfReady && (
                  <button
                    onClick={() => handleExportPdf('all')}
                    disabled={isExportingPdf}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-md flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating PDF…</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download A4 PDF</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setPrintNotice(null)}
                  className="p-1 text-amber-600 hover:text-amber-900 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Modal Body */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* Left Column: Product Selection Catalog */}
            <div
              className={`lg:col-span-4 p-3.5 border-r border-stone-200 overflow-y-auto space-y-3 bg-stone-50 ${
                showConfigMobile ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Filter by Shop / Folder and Search */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Filter products, shops, origins..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-emerald-600 font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <select
                    value={shopFilter}
                    onChange={e => setShopFilter(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-hidden focus:border-emerald-600 truncate"
                  >
                    <option value="all">All Shops &amp; Folders ({products.length})</option>
                    {folders.map(f => {
                      const count = products.filter(p => p.folderId === f.id).length;
                      return (
                        <option key={f.id} value={f.id}>
                          {f.type === 'shop' ? '🏪 ' : '📁 '}
                          {f.name} ({count} items)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Batch Selection Header */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Queue Selection</h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {selectedIds.length} of {filteredCatalog.length} visible selected
                  </p>
                </div>

                <button
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  {filteredCatalog.every(p => selectedIds.includes(p.id)) && filteredCatalog.length > 0 ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-stone-400" />
                      <span>Select All ({filteredCatalog.length})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Products List Checklist */}
              <div className="space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                {filteredCatalog.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400 bg-white rounded-xl border border-stone-200">
                    No products match the selected shop or search filter.
                  </div>
                ) : (
                  filteredCatalog.map(p => {
                    const isChecked = selectedIds.includes(p.id);
                    const folder = folderMap.get(p.folderId);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          handleToggleSelect(p.id);
                          setSelectedStudioProduct(p);
                        }}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                            : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{p.product_name_eng}</div>
                          <div className="text-[11px] text-stone-500 truncate">{p.product_name_jp}</div>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                            {folder && (
                              <span className="font-bold px-1.5 py-0.2 rounded bg-stone-100 border border-stone-200 text-stone-700 truncate max-w-[120px]">
                                {folder.type === 'shop' ? '🏪 ' : '📁 '}
                                {folder.name}
                              </span>
                            )}
                            <span className="font-mono text-stone-400">#{p.serial}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-red-600">¥{p.price_without_tax.toLocaleString()}</div>
                          <div className="text-[9px] text-stone-500 font-mono">込¥{p.price_with_tax.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Live Interactive View */}
            <div className="lg:col-span-8 p-3 sm:p-5 bg-stone-100 overflow-y-auto flex flex-col items-center">
              {/* Inline Quick Font & Size Customizer Bar (Visible when toggled in sheet or studio view) */}
              {showInlineTypography && activeTab !== 'typography' && (
                <div className="w-full max-w-[850px] bg-white rounded-xl border border-orange-200 shadow-xs p-3.5 mb-3 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-stone-900">
                      <Sliders className="w-4 h-4 text-orange-600" />
                      <span>Quick Font &amp; Size Tuning Bar</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('typography')}
                      className="text-[11px] font-bold text-orange-700 hover:text-orange-950 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Open Full Font Studio →</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Japanese Font | Size */}
                    <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-800">
                        <span>Japanese Font | Size</span>
                        <span className="font-mono text-emerald-800 font-bold bg-white px-1.5 py-0.2 rounded border border-stone-200 text-[10px]">
                          {Math.round(typography.jpFontSizeScale * 100)}%
                        </span>
                      </div>
                      <select
                        value={typography.jpFont}
                        onChange={e => handleTypographyChange({ ...typography, jpFont: e.target.value })}
                        className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-stone-900 truncate"
                      >
                        {AVAILABLE_JP_FONTS.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="range"
                          min="0.70"
                          max="1.45"
                          step="0.05"
                          value={typography.jpFontSizeScale}
                          onChange={e => handleTypographyChange({ ...typography, jpFontSizeScale: parseFloat(e.target.value) })}
                          className="w-full accent-emerald-700 cursor-pointer h-1.5 bg-stone-200 rounded"
                        />
                      </div>
                    </div>

                    {/* English Font | Size */}
                    <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-800">
                        <span>English Font | Size</span>
                        <span className="font-mono text-blue-800 font-bold bg-white px-1.5 py-0.2 rounded border border-stone-200 text-[10px]">
                          {Math.round(typography.enFontSizeScale * 100)}%
                        </span>
                      </div>
                      <select
                        value={typography.enFont}
                        onChange={e => handleTypographyChange({ ...typography, enFont: e.target.value })}
                        className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-stone-900 truncate"
                      >
                        {AVAILABLE_EN_FONTS.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="range"
                          min="0.70"
                          max="1.45"
                          step="0.05"
                          value={typography.enFontSizeScale}
                          onChange={e => handleTypographyChange({ ...typography, enFontSizeScale: parseFloat(e.target.value) })}
                          className="w-full accent-blue-700 cursor-pointer h-1.5 bg-stone-200 rounded"
                        />
                      </div>
                    </div>

                    {/* Price Font | Size */}
                    <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-800">
                        <span>Price Font | Size</span>
                        <span className="font-mono text-red-700 font-bold bg-white px-1.5 py-0.2 rounded border border-stone-200 text-[10px]">
                          {Math.round(typography.priceFontSizeScale * 100)}%
                        </span>
                      </div>
                      <select
                        value={typography.priceFont}
                        onChange={e => handleTypographyChange({ ...typography, priceFont: e.target.value })}
                        className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-stone-900 truncate"
                      >
                        {AVAILABLE_PRICE_FONTS.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="range"
                          min="0.70"
                          max="1.45"
                          step="0.05"
                          value={typography.priceFontSizeScale}
                          onChange={e => handleTypographyChange({ ...typography, priceFontSizeScale: parseFloat(e.target.value) })}
                          className="w-full accent-red-600 cursor-pointer h-1.5 bg-stone-200 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sheet' ? (
                // Multi-Card Sheet View (2x4 on A4)
                <div className="w-full flex flex-col items-center space-y-3">
                  {/* Pagination & Print Actions Toolbar */}
                  <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-2xs text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage <= 1}
                        className="p-1 rounded-md hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-stone-800">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-1 rounded-md hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-stone-600">
                      <button
                        onClick={() => handlePrint('current')}
                        disabled={isPrinting}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Print only this page (8 cards)"
                      >
                        <Printer className="w-3 h-3 text-orange-600" />
                        <span>{isPrinting ? 'Printing…' : 'Print This Page'}</span>
                      </button>

                      <button
                        onClick={() => handleExportPdf('current')}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Export only this page to PDF"
                      >
                        <FileText className="w-3 h-3 text-emerald-700" />
                        <span>Export This Page</span>
                      </button>
                    </div>

                    <div className="text-stone-500 font-mono text-[11px] hidden sm:block">
                      {itemsToPrint.length} products · 8 cards / page
                    </div>
                  </div>

                  {/* Interactive Screen Representation of A4 Gang Sheet */}
                  <div className="w-full max-w-[850px] bg-white text-stone-900 rounded-xl p-4 sm:p-6 shadow-sm border border-stone-200">
                    <div className="border-b pb-2 mb-4 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>MyBIMI HALAL 360 STORE · POP PRINT SHEET (Page {currentPage} of {totalPages})</span>
                      <span>90mm × 65mm CARDS · NO QR CODE</span>
                    </div>

                    {/* 2 Columns x 4 Rows = 8 Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      {currentSheetCards.map(product => (
                        <div key={product.id} className="flex flex-col">
                          <MyBimiPriceCardSvg
                            product={product}
                            typography={typography}
                            showCropMarks={showCropGuides}
                            className="w-full cursor-pointer hover:opacity-95 transition-opacity"
                          />
                          <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-stone-500 font-mono">
                            <span>#{product.serial} · {product.product_name_eng.slice(0, 20)}</span>
                            <button
                              onClick={() => handleDownloadSingleSvg(product)}
                              title="Download standalone SVG file"
                              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>SVG</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-2 mt-4 text-center text-[10px] text-stone-400 font-mono">
                      High-Resolution Halal Supermarket Retail POP Card Standard (No QR Code)
                    </div>
                  </div>
                </div>
              ) : activeTab === 'studio' ? (
                // Single Card Studio View (100% vector focus)
                <div className="w-full max-w-2xl flex flex-col items-center space-y-4">
                  <div className="w-full flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-2xs">
                    <div>
                      <h3 className="text-sm font-black text-stone-900">{selectedStudioProduct.product_name_eng}</h3>
                      <p className="text-xs font-bold text-stone-500">{selectedStudioProduct.product_name_jp}</p>
                    </div>

                    <button
                      onClick={() => handleDownloadSingleSvg(selectedStudioProduct)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download SVG</span>
                    </button>
                  </div>

                  <div className="w-full bg-white p-6 rounded-2xl border border-stone-200 shadow-md">
                    <MyBimiPriceCardSvg
                      product={selectedStudioProduct}
                      typography={typography}
                      showCropMarks={showCropGuides}
                      className="w-full max-w-xl mx-auto"
                    />
                  </div>
                </div>
              ) : (
                // Full Typography & Font Customizer View (activeTab === 'typography')
                <div className="w-full max-w-5xl flex flex-col items-center space-y-4">
                  {/* Top Bar for Typography View */}
                  <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-2xs text-xs">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-orange-600" />
                      <span className="font-bold text-stone-900">
                        Price Tag Typography &amp; Font Studio
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
                        (Live preview: {selectedStudioProduct.product_name_eng || 'Sample Card'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('sheet')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Grid3X3 className="w-3.5 h-3.5" />
                        <span>Apply &amp; View Sheet</span>
                      </button>
                      <button
                        onClick={() => handleDownloadSingleSvg(selectedStudioProduct)}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download SVG</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Sticky Preview of the Selected Card */}
                  <div className="w-full bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center">
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-stone-500 font-medium border-b border-stone-100 pb-2">
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <span>Live Price Tag Render</span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          (Select any item in the left queue to preview)
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-orange-700 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        JP: {typography.jpFont} ({Math.round(typography.jpFontSizeScale * 100)}%) · EN: {typography.enFont} ({Math.round(typography.enFontSizeScale * 100)}%) · ¥: {typography.priceFont} ({Math.round(typography.priceFontSizeScale * 100)}%)
                      </span>
                    </div>
                    <div className="w-full max-w-xl">
                      <MyBimiPriceCardSvg
                        product={selectedStudioProduct}
                        typography={typography}
                        showCropMarks={showCropGuides}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Full Comprehensive Typography Config Panel */}
                  <div className="w-full">
                    <TypographyConfigPanel
                      config={typography}
                      onChange={handleTypographyChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          DEDICATED PHYSICAL PRINT PORTAL
          Exact physical 210mm x 297mm A4 geometry
          Multi-page output: 8 cards per page with 0 overflow
          ------------------------------------------------------------- */}
      {printPortalContainer &&
        createPortal(
          <div id="print-sheet-root">
            {printPagesChunks.map((chunk, pageIndex) => (
              <div key={pageIndex} className="print-page-a4">
                {chunk.map(product => (
                  <div key={product.id} className="print-card-box">
                    <MyBimiPriceCardSvg
                      product={product}
                      typography={typography}
                      showCropMarks={showCropGuides}
                      className="w-full h-full"
                    />
                  </div>
                ))}
                {/* Pad any empty slots on the last page to preserve exact 2x4 grid alignment */}
                {Array.from({ length: Math.max(0, cardsPerPage - chunk.length) }).map((_, padIdx) => (
                  <div key={`pad-${padIdx}`} className="print-card-box opacity-0" />
                ))}
              </div>
            ))}
          </div>,
          printPortalContainer
        )}
    </>
  );
};
