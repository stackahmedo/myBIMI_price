import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../types/inventory';
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
  Sparkles,
  Maximize2,
  Grid3X3,
  Scissors,
  Check,
  Loader2,
} from 'lucide-react';
import { MyBimiPriceCardSvg, getMyBimiCardSvgString } from './MyBimiPriceCardSvg';
import { jsPDF } from 'jspdf';

interface PriceTagMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  preselectedProduct?: Product | null;
}

export type PaperSize = 'A4' | 'A5' | 'A3';
export type ViewTab = 'sheet' | 'studio';

export const PriceTagMakerModal: React.FC<PriceTagMakerModalProps> = ({
  isOpen,
  onClose,
  products,
  preselectedProduct,
}) => {
  // Tabs and view
  const [activeTab, setActiveTab] = useState<ViewTab>('sheet');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [showCropGuides, setShowCropGuides] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);

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
    if (exportScope === 'all') return products;
    const selected = products.filter(p => selectedIds.includes(p.id));
    return selected.length > 0 ? selected : products.slice(0, 8);
  }, [products, selectedIds, exportScope]);

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
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  // Direct Browser Print (Multi-page zero-bleed physical A4)
  const handlePrint = (target: 'all' | 'current') => {
    setPrintTarget(target);
    // Allow React to re-render the portal with target pages before opening print dialog
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Standalone Single SVG Download
  const handleDownloadSingleSvg = (product: Product) => {
    const svgContent = getMyBimiCardSvgString(product);
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
        return new Promise((resolve, reject) => {
          const svgString = getMyBimiCardSvgString(product);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);

          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1507;
            canvas.height = 1044;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              URL.revokeObjectURL(url);
              return reject('No canvas context');
            }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png', 0.96));
          };
          img.onerror = e => {
            URL.revokeObjectURL(url);
            reject(e);
          };
          img.src = url;
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'studio'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Card Studio</span>
                </button>
              </div>

              {/* Crop Guides Toggle */}
              <button
                onClick={() => setShowCropGuides(!showCropGuides)}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs transition-colors active:scale-95 disabled:opacity-50"
                title="Export high-resolution multi-page PDF"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-xs transition-colors active:scale-95"
                  title="Print all selected pages on A4 paper"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print All ({itemsToPrint.length})</span>
                </button>
              </div>

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
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
            {/* Left Column: Product Selection Catalog */}
            <div
              className={`lg:col-span-4 p-4 border-r border-stone-200 overflow-y-auto space-y-4 bg-stone-50 ${
                showConfigMobile ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Batch Selection Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Queue Selection</h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {selectedIds.length} of {products.length} products selected
                  </p>
                </div>

                <button
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  {selectedIds.length === products.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Select All</span>
                    </>
                  )}
                </button>
              </div>

              {/* Products List Checklist */}
              <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {products.map(p => {
                  const isChecked = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        handleToggleSelect(p.id);
                        setSelectedStudioProduct(p);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{p.product_name_eng}</div>
                        <div className="text-[11px] text-stone-500 truncate">{p.product_name_jp}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-red-600">¥{p.price_without_tax.toLocaleString()}</div>
                        <div className="text-[9px] text-stone-500">込¥{p.price_with_tax.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Interactive View */}
            <div className="lg:col-span-8 p-3 sm:p-5 bg-stone-100 overflow-y-auto flex flex-col items-center">
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
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Print only this page (8 cards)"
                      >
                        <Printer className="w-3 h-3 text-orange-600" />
                        <span>Print This Page</span>
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
              ) : (
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
                      showCropMarks={showCropGuides}
                      className="w-full max-w-xl mx-auto"
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
