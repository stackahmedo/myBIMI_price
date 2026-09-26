import React, { useState, useMemo } from 'react';
import { Product } from '../types/inventory';
import {
  Printer,
  X,
  Tag,
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
  const [selectedStudioProduct, setSelectedStudioProduct] = useState<Product>(
    () => preselectedProduct || products[0] || ({} as Product)
  );

  // Pagination for sheet view
  const [currentPage, setCurrentPage] = useState(1);

  // Export scope
  const [exportScope, setExportScope] = useState<'selected' | 'all'>('selected');

  // Mobile controls
  const [showConfigMobile, setShowConfigMobile] = useState(false);

  // Selected items queue
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (preselectedProduct) return [preselectedProduct.id];
    return products.slice(0, 8).map(p => p.id);
  });

  // Calculate cards per page according to paper size
  const cardsPerPage = useMemo(() => {
    if (paperSize === 'A5') return 4;
    if (paperSize === 'A3') return 16;
    return 8; // A4 standard 8-up
  }, [paperSize]);

  // Filtered queue of items based on scope
  const itemsToPrint = useMemo(() => {
    if (exportScope === 'all') return products;
    const selected = products.filter(p => selectedIds.includes(p.id));
    return selected.length > 0 ? selected : products.slice(0, 8);
  }, [products, selectedIds, exportScope]);

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(itemsToPrint.length / cardsPerPage));

  // Current page cards
  const currentSheetCards = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return itemsToPrint.slice(start, start + cardsPerPage);
  }, [itemsToPrint, currentPage, cardsPerPage]);

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

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
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
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
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
      const gap = 3;

      const cols = paperSize === 'A3' ? 4 : 2;
      const rows = paperSize === 'A5' ? 2 : paperSize === 'A3' ? 4 : 4;

      const totalGridW = cols * cardW + (cols - 1) * gap;
      const totalGridH = rows * cardH + (rows - 1) * gap;

      const marginX = (pageWidth - totalGridW) / 2;
      const marginY = (pageHeight - totalGridH) / 2;

      // Helper to render an SVG card into canvas and return image
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
            resolve(canvas.toDataURL('image/png', 0.95));
          };
          img.onerror = e => {
            URL.revokeObjectURL(url);
            reject(e);
          };
          img.src = url;
        });
      };

      for (let pIdx = 0; pIdx < totalPages; pIdx++) {
        if (pIdx > 0) pdf.addPage();

        // Sheet Header Info
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(
          `MyBIMI HALAL 360 STORE · ${paperSize} Print Sheet · Page ${pIdx + 1} of ${totalPages} · ${new Date().toLocaleDateString('ja-JP')}`,
          marginX,
          marginY - 4
        );

        const pageCards = itemsToPrint.slice(pIdx * cardsPerPage, (pIdx + 1) * cardsPerPage);

        for (let cIdx = 0; cIdx < pageCards.length; cIdx++) {
          const card = pageCards[cIdx];
          const col = cIdx % cols;
          const row = Math.floor(cIdx / cols);

          const x = marginX + col * (cardW + gap);
          const y = marginY + row * (cardH + gap);

          const imgData = await renderCardToPng(card);
          pdf.addImage(imgData, 'PNG', x, y, cardW, cardH);

          // Optional Cut Guides (Thin dashed border around card cells)
          if (showCropGuides) {
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineDashPattern([1, 2], 0);
            pdf.rect(x - 0.5, y - 0.5, cardW + 1, cardH + 1);
            pdf.setLineDashPattern([], 0);
          }
        }
      }

      pdf.save(`MyBIMI_PriceCards_${paperSize}_${itemsToPrint.length}items.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-7xl bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* Top App Bar Matching MyBIMI Studio */}
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
                <span>Print Layout ({paperSize})</span>
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
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-2">
            {/* Paper Size Selector */}
            <div className="flex items-center bg-white border border-stone-300 rounded-lg p-0.5 text-xs font-bold shadow-2xs">
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
                  {size} · {size === 'A5' ? '4' : size === 'A3' ? '16' : '8'}
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
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs transition-colors active:scale-95 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Exporting…' : 'Export PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-xs transition-colors active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ({itemsToPrint.length})</span>
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
            {/* Theme Badge */}
            <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  Active Theme
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Modern 2026
                </span>
              </div>
              <p className="text-xs font-medium text-stone-600 mt-1">
                Official MyBIMI POP: Red Hero Price + Japanese/English Hierarchy + No QR Code.
              </p>
            </div>

            {/* Layout Options */}
            <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2.5">
              <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Sheet Options
              </label>

              <label className="flex items-center justify-between text-xs text-stone-700 font-semibold cursor-pointer">
                <span>Show 3mm Trimming Cut Guides</span>
                <input
                  type="checkbox"
                  checked={showCropGuides}
                  onChange={e => setShowCropGuides(e.target.checked)}
                  className="rounded bg-white border-stone-300 text-emerald-600 focus:ring-0"
                />
              </label>

              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                Card spec: <strong className="text-stone-800">90mm × 65mm</strong> (Standard Supermarket Shelf POP).
              </div>
            </div>

            {/* Catalog Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  Select Products ({selectedIds.length}/{products.length})
                </label>
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  {selectedIds.length === products.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-[380px] overflow-y-auto space-y-1 border border-stone-200 rounded-xl p-1 bg-white shadow-2xs">
                {products.map(p => {
                  const isChecked = selectedIds.includes(p.id);
                  const isStudioActive = selectedStudioProduct?.id === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedStudioProduct(p)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isStudioActive
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleToggleSelect(p.id);
                          }}
                          className="shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400" />
                          )}
                        </button>
                        <span className="font-mono text-stone-500 font-bold shrink-0">#{p.serial}</span>
                        <div className="truncate">
                          <div className="truncate">{p.product_name_eng}</div>
                          <div className="text-[10px] text-stone-500 font-normal truncate">{p.product_name_jp}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <div className="font-mono font-black text-red-600">¥{p.price_without_tax.toLocaleString()}</div>
                        <div className="text-[9px] text-stone-500">込¥{p.price_with_tax.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live View (Sheet or Studio) */}
          <div className="lg:col-span-8 p-3 sm:p-5 bg-stone-100 overflow-y-auto flex flex-col items-center">
            {activeTab === 'sheet' ? (
              // Multi-Card Sheet View (2x4 on A4)
              <div className="w-full flex flex-col items-center space-y-3">
                {/* Pagination Toolbar */}
                <div className="w-full flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-2xs text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="p-1 rounded-md hover:bg-stone-100 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-stone-800">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1 rounded-md hover:bg-stone-100 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-stone-500 font-mono text-[11px]">
                    {itemsToPrint.length} products · {cardsPerPage} cards per {paperSize} page
                  </div>
                </div>

                {/* Printable A4 Gang Sheet Container */}
                <div
                  id="printable-price-tags-sheet"
                  className="w-full max-w-[850px] bg-white text-stone-900 rounded-xl p-4 sm:p-6 shadow-sm border border-stone-200"
                >
                  <div className="border-b pb-2 mb-4 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>MyBIMI HALAL 360 STORE · POP PRINT SHEET ({paperSize})</span>
                    <span>90mm × 65mm CARDS</span>
                  </div>

                  {/* 2x4 Card Grid (A4 Standard) */}
                  <div
                    className={`grid gap-3.5 sm:gap-4 ${
                      paperSize === 'A5'
                        ? 'grid-cols-2'
                        : paperSize === 'A3'
                        ? 'grid-cols-2 sm:grid-cols-4'
                        : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {currentSheetCards.map(product => (
                      <div key={product.id} className="flex flex-col">
                        <MyBimiPriceCardSvg
                          product={product}
                          showCropMarks={showCropGuides}
                          className="w-full"
                        />
                        <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-stone-500 font-mono no-print">
                          <span>#{product.serial} · {product.product_name_eng.slice(0, 18)}</span>
                          <button
                            onClick={() => handleDownloadSingleSvg(product)}
                            title="Download SVG file"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors"
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
  );
};
