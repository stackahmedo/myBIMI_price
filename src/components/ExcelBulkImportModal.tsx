import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useInventory } from '../context/InventoryContext';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Store,
  RefreshCw,
  FileText,
  HelpCircle,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface ExcelBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFolderId?: string;
}

interface ParsedRow {
  rowNum: number;
  product_name_eng: string;
  product_name_jp: string;
  price_without_tax: number;
  tax_rate: number;
  price_with_tax: number;
  weight_unit: string;
  origin: string;
  folderNameOrCode?: string;
  resolvedFolderId: string;
  category?: string;
  stockQuantity: number;
  sku?: string;
  barcode?: string;
  serial?: number;
  isValid: boolean;
  validationError?: string;
}

export const ExcelBulkImportModal: React.FC<ExcelBulkImportModalProps> = ({
  isOpen,
  onClose,
  defaultFolderId,
}) => {
  const { folders, bulkImportProducts } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [targetFolderOverride, setTargetFolderOverride] = useState<string>(defaultFolderId || 'auto');
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importSummary, setImportSummary] = useState<{ imported: number; updated: number; total: number } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Map folder names and codes for fast lookup
  const folderLookup = new Map<string, string>();
  folders.forEach(f => {
    folderLookup.set(f.name.toLowerCase().trim(), f.id);
    folderLookup.set(f.code.toLowerCase().trim(), f.id);
    folderLookup.set(f.id.toLowerCase().trim(), f.id);
  });

  const fallbackFolderId = defaultFolderId || folders[0]?.id || 'fld-shop-tokyo';

  // Normalize column keys
  const normalizeKey = (key: string): string => {
    const k = key.toLowerCase().replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');
    if (k.includes('eng') || k.includes('english') || k.includes('itemname') || k.includes('productname') || k === 'name') return 'name_eng';
    if (k.includes('jp') || k.includes('japan') || k.includes('品名') || k.includes('商品名')) return 'name_jp';
    if (k.includes('notax') || k.includes('withouttax') || k.includes('extax') || k.includes('税抜') || k.includes('本体価格') || k === 'price') return 'price_ex';
    if (k.includes('withtax') || k.includes('inctax') || k.includes('税込')) return 'price_inc';
    if (k.includes('tax') || k.includes('税率') || k.includes('消費税') || k.includes('rate')) return 'tax_rate';
    if (k.includes('weight') || k.includes('unit') || k.includes('規格') || k.includes('内容量') || k.includes('gram') || k.includes('size')) return 'weight';
    if (k.includes('origin') || k.includes('country') || k.includes('原産国') || k.includes('産地')) return 'origin';
    if (k.includes('shop') || k.includes('store') || k.includes('branch') || k.includes('folder') || k.includes('店舗')) return 'shop';
    if (k.includes('stock') || k.includes('qty') || k.includes('quantity') || k.includes('在庫')) return 'stock';
    if (k.includes('barcode') || k.includes('バーコード') || k.includes('jan')) return 'barcode';
    if (k.includes('sku') || k.includes('code') || k.includes('型番')) return 'sku';
    if (k.includes('serial') || k.includes('no') || k.includes('番号')) return 'serial';
    if (k.includes('cat') || k.includes('category') || k.includes('分類')) return 'category';
    return k;
  };

  const processWorkbook = (file: File) => {
    setIsProcessing(true);
    setParseError(null);
    setImportSummary(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          setParseError('The uploaded workbook has no sheets.');
          setIsProcessing(false);
          return;
        }

        const ws = wb.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          setParseError('The sheet appears to be empty. Please include headers and data rows.');
          setIsProcessing(false);
          return;
        }

        const rows: ParsedRow[] = rawJson.map((row, idx) => {
          const rowNum = idx + 2; // +1 for 1-index, +1 for header row
          let nameEng = '';
          let nameJp = '';
          let priceExStr = '';
          let priceIncStr = '';
          let taxRateStr = '';
          let weight = '';
          let origin = '';
          let shopStr = '';
          let stockStr = '';
          let sku = '';
          let barcode = '';
          let serialNum: number | undefined;
          let category = '';

          // Match normalized keys
          Object.keys(row).forEach(rawKey => {
            const val = String(row[rawKey]).trim();
            const norm = normalizeKey(rawKey);
            if (norm === 'name_eng') nameEng = val;
            else if (norm === 'name_jp') nameJp = val;
            else if (norm === 'price_ex') priceExStr = val;
            else if (norm === 'price_inc') priceIncStr = val;
            else if (norm === 'tax_rate') taxRateStr = val;
            else if (norm === 'weight') weight = val;
            else if (norm === 'origin') origin = val;
            else if (norm === 'shop') shopStr = val;
            else if (norm === 'stock') stockStr = val;
            else if (norm === 'sku') sku = val;
            else if (norm === 'barcode') barcode = val;
            else if (norm === 'serial' && !isNaN(Number(val))) serialNum = Number(val);
            else if (norm === 'category') category = val;
          });

          // Clean and parse numbers
          const cleanNumber = (s: string) => {
            const cleaned = s.replace(/[^0-9.-]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          };

          const priceWithoutTax = Math.max(0, Math.round(cleanNumber(priceExStr)));
          const taxRate = taxRateStr ? cleanNumber(taxRateStr) : 8.0;
          let priceWithTax = cleanNumber(priceIncStr);
          if (priceWithTax <= 0 && priceWithoutTax > 0) {
            priceWithTax = Math.round(priceWithoutTax * (1 + taxRate / 100));
          }

          // Resolve folder / shop
          let resolvedFolderId = fallbackFolderId;
          if (targetFolderOverride && targetFolderOverride !== 'auto') {
            resolvedFolderId = targetFolderOverride;
          } else if (shopStr) {
            const matched = folderLookup.get(shopStr.toLowerCase().trim());
            if (matched) resolvedFolderId = matched;
          }

          const isValid = !!nameEng && priceWithoutTax > 0;
          let validationError: string | undefined;
          if (!nameEng) validationError = 'Missing English Name';
          else if (priceWithoutTax <= 0) validationError = 'Invalid or 0 Price';

          return {
            rowNum,
            product_name_eng: nameEng,
            product_name_jp: nameJp || nameEng,
            price_without_tax: priceWithoutTax,
            tax_rate: taxRate,
            price_with_tax: priceWithTax,
            weight_unit: weight || '1 pc',
            origin: (origin || 'UNKNOWN').toUpperCase(),
            folderNameOrCode: shopStr,
            resolvedFolderId,
            category: category || 'General Food',
            stockQuantity: stockStr ? Math.max(0, Math.round(cleanNumber(stockStr))) : 50,
            sku: sku || undefined,
            barcode: barcode || undefined,
            serial: serialNum,
            isValid,
            validationError,
          };
        });

        setParsedRows(rows);
      } catch (err: any) {
        console.error('Error parsing excel workbook', err);
        setParseError(`Failed to parse file: ${err.message || 'Invalid Excel format'}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file from disk.');
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processWorkbook(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processWorkbook(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const items = validRows.map(r => ({
      serial: r.serial,
      sku: r.sku,
      product_name_eng: r.product_name_eng,
      product_name_jp: r.product_name_jp,
      weight_unit: r.weight_unit,
      tax_rate: r.tax_rate,
      price_without_tax: r.price_without_tax,
      price_with_tax: r.price_with_tax,
      origin: r.origin,
      folderId: targetFolderOverride !== 'auto' ? targetFolderOverride : r.resolvedFolderId,
      category: r.category,
      stockQuantity: r.stockQuantity,
      barcode: r.barcode,
    }));

    const result = bulkImportProducts(items, {
      updateExisting,
      defaultFolderId: targetFolderOverride !== 'auto' ? targetFolderOverride : fallbackFolderId,
    });

    setImportSummary(result);
  };

  // Generate Sample Excel Template (.xlsx)
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        'Serial #': 101,
        'English Name': 'ROYAL BASMATI RICE PREMIUM',
        'Japanese Name': 'ロイヤル バスマティライス 高級品',
        'Price (Ex Tax)': 1980,
        'Tax Rate %': 8,
        'Price (Inc Tax)': 2138,
        'Weight / Unit': '5 kg',
        'Origin': 'PAKISTAN',
        'Shop / Branch': 'Tokyo Main Store',
        'Category': 'Rice & Grains',
        'Stock Quantity': 75,
        'SKU': 'RICE-0101',
        'Barcode': '8901234567890',
      },
      {
        'Serial #': 102,
        'English Name': 'FRESH HALAL BONELESS CHICKEN BREAST',
        'Japanese Name': 'ハラール 鶏むね肉 骨なし',
        'Price (Ex Tax)': 680,
        'Tax Rate %': 8,
        'Price (Inc Tax)': 734,
        'Weight / Unit': '1 kg',
        'Origin': 'JAPAN',
        'Shop / Branch': 'Yokohama Branch Store',
        'Category': 'Halal Meat & Poultry',
        'Stock Quantity': 120,
        'SKU': 'MEAT-0102',
        'Barcode': '8901234567891',
      },
      {
        'Serial #': 103,
        'English Name': 'AL-AMEEN BIRYANI SPICE MIX',
        'Japanese Name': 'アルアミーン ビリヤニ スパイス ミックス',
        'Price (Ex Tax)': 350,
        'Tax Rate %': 8,
        'Price (Inc Tax)': 378,
        'Weight / Unit': '100 g',
        'Origin': 'INDIA',
        'Shop / Branch': 'Tokyo Main Store',
        'Category': 'Spices & Seasonings',
        'Stock Quantity': 200,
        'SKU': 'SPICE-0103',
        'Barcode': '8901234567892',
      },
      {
        'Serial #': 104,
        'English Name': 'PURE EXTRA VIRGIN OLIVE OIL',
        'Japanese Name': 'ピュア エキストラバージン オリーブオイル',
        'Price (Ex Tax)': 1450,
        'Tax Rate %': 8,
        'Price (Inc Tax)': 1566,
        'Weight / Unit': '1 L',
        'Origin': 'TURKEY',
        'Shop / Branch': 'Halal Express Station Stall',
        'Category': 'Oils & Ghee',
        'Stock Quantity': 45,
        'SKU': 'OIL-0104',
        'Barcode': '8901234567893',
      },
      {
        'Serial #': 105,
        'English Name': 'SWEET MANGO JUICE DRINK',
        'Japanese Name': '完熟 マンゴージュース ドリンク',
        'Price (Ex Tax)': 220,
        'Tax Rate %': 8,
        'Price (Inc Tax)': 238,
        'Weight / Unit': '330 ml',
        'Origin': 'BANGLADESH',
        'Shop / Branch': 'Yokohama Branch Store',
        'Category': 'Beverages & Soft Drinks',
        'Stock Quantity': 180,
        'SKU': 'BEV-0105',
        'Barcode': '8901234567894',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MyBIMI_Inventory_Template');
    XLSX.writeFile(wb, 'MyBIMI_Inventory_Bulk_Import_Template.xlsx');
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                <span>Excel &amp; CSV Bulk Import</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Multi-Shop Ready
                </span>
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Upload .xlsx, .xls, or .csv sheets with product names, prices, origins, and shop assignments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSampleExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Download formatted Excel template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template (.xlsx)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0 bg-stone-50/50">
          {/* Success Banner */}
          {importSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-900 animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Import Completed Successfully!</h4>
                  <p className="text-xs text-emerald-700">
                    Added <strong>{importSummary.imported}</strong> new products and updated <strong>{importSummary.updated}</strong> existing records ({importSummary.total} total rows processed).
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Close &amp; View Catalog
              </button>
            </div>
          )}

          {/* Parse Error Banner */}
          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Upload Area */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/70'
                : 'border-stone-300 bg-white hover:border-emerald-400 hover:bg-stone-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-stone-800">
                {fileName ? (
                  <span className="text-emerald-800 font-mono">Loaded: {fileName}</span>
                ) : (
                  <span>Click to browse or drag and drop your spreadsheet here</span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Supports Excel (.xlsx, .xls) and CSV (.csv). Automatically detects headers in English and Japanese.
              </p>
            </div>
          </div>

          {/* Import Configuration Controls */}
          {parsedRows.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              {/* Target Shop/Folder Setting */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Assign to Shop / Folder:</span>
                </label>
                <select
                  value={targetFolderOverride}
                  onChange={e => setTargetFolderOverride(e.target.value)}
                  className="text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="auto">Automatic (Use "Shop / Branch" column from Excel)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.type === 'shop' ? '🏪 ' : '📁 '}
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duplicate Handling */}
              <div className="flex items-center gap-4 text-xs font-medium text-stone-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={e => setUpdateExisting(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Update existing items if SKU / Serial matches</span>
                </label>
              </div>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 px-1">
                <div className="flex items-center gap-2">
                  <span>Found {parsedRows.length} rows</span>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    {validCount} Ready
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                      {invalidCount} Issues
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-400 font-mono">
                  Showing first 50 rows
                </div>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs max-h-[320px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider sticky top-0 font-bold z-10">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">English Product Name</th>
                      <th className="py-2.5 px-3">Japanese Name</th>
                      <th className="py-2.5 px-3">Price (税抜)</th>
                      <th className="py-2.5 px-3">Price (税込)</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">Origin</th>
                      <th className="py-2.5 px-3">Assigned Shop</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {parsedRows.slice(0, 50).map(r => {
                      const folderObj = folders.find(
                        f => f.id === (targetFolderOverride !== 'auto' ? targetFolderOverride : r.resolvedFolderId)
                      );
                      return (
                        <tr
                          key={r.rowNum}
                          className={`hover:bg-stone-50/80 transition-colors ${
                            !r.isValid ? 'bg-red-50/40' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono text-[11px] text-stone-400">{r.rowNum}</td>
                          <td className="py-2 px-3">
                            {r.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                {r.validationError}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-stone-900 max-w-[200px] truncate">
                            {r.product_name_eng || <span className="text-red-400 italic">Required</span>}
                          </td>
                          <td className="py-2 px-3 text-stone-600 max-w-[180px] truncate">
                            {r.product_name_jp}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-red-600">
                            ¥{r.price_without_tax.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-mono text-stone-600">
                            込¥{r.price_with_tax.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-mono text-stone-500">{r.weight_unit}</td>
                          <td className="py-2 px-3 font-bold text-stone-700">{r.origin}</td>
                          <td className="py-2 px-3 font-medium text-stone-600 truncate max-w-[160px]">
                            {folderObj?.name || 'Tokyo Main'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Help Guide */}
          <div className="bg-stone-100/70 p-3.5 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-stone-800">Supported Columns &amp; Multi-Shop Tips:</span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                You can specify different prices for different branches (e.g. <strong>Tokyo Main Store</strong> vs <strong>Yokohama Branch</strong>) by adding a <code>Shop / Branch</code> column. The system will create identical physical products with shop-specific price tags.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isProcessing}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing File…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import {validCount} Products to Catalog</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
