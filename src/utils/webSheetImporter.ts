import * as XLSX from 'xlsx';

export type WebLinkType =
  | 'google-sheets'
  | 'google-sheets-published'
  | 'excel-file'
  | 'csv-file'
  | 'onedrive'
  | 'generic-web';

export interface WebLinkInfo {
  rawUrl: string;
  type: WebLinkType;
  sheetId?: string;
  gid?: string;
  candidateExportUrls: string[];
  displayName: string;
}

export const STORAGE_KEY_SAVED_URL = 'bimi_saved_web_import_url';
export const STORAGE_KEY_SAVED_NAME = 'bimi_saved_web_import_name';
export const STORAGE_KEY_LAST_SYNCED = 'bimi_saved_web_import_last_synced';
export const STORAGE_KEY_LAST_COUNT = 'bimi_saved_web_import_last_count';

export interface SavedWebLink {
  url: string;
  name: string;
  lastSynced?: string;
  lastCount?: number;
}

export function getSavedWebLink(): SavedWebLink | null {
  try {
    const url = localStorage.getItem(STORAGE_KEY_SAVED_URL);
    if (!url) return null;
    const name = localStorage.getItem(STORAGE_KEY_SAVED_NAME) || 'Connected Google Sheet';
    const lastSynced = localStorage.getItem(STORAGE_KEY_LAST_SYNCED) || undefined;
    const countStr = localStorage.getItem(STORAGE_KEY_LAST_COUNT);
    const lastCount = countStr ? parseInt(countStr, 10) : undefined;
    return { url, name, lastSynced, lastCount };
  } catch {
    return null;
  }
}

export function saveWebLink(url: string, name = 'Google Sheet Catalog', count?: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_SAVED_NAME, name);
    localStorage.setItem(STORAGE_KEY_LAST_SYNCED, new Date().toISOString());
    if (typeof count === 'number') {
      localStorage.setItem(STORAGE_KEY_LAST_COUNT, count.toString());
    }
  } catch {}
}

export function clearSavedWebLink(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SAVED_URL);
    localStorage.removeItem(STORAGE_KEY_SAVED_NAME);
    localStorage.removeItem(STORAGE_KEY_LAST_SYNCED);
    localStorage.removeItem(STORAGE_KEY_LAST_COUNT);
  } catch {}
}

/**
 * Analyzes a URL and extracts Google Sheets IDs or file type info
 */
export function analyzeWebLink(rawUrl: string, overrideGid?: string): WebLinkInfo {
  const url = (rawUrl || '').trim();

  // 1. Google Sheets standard URL: /spreadsheets/d/{ID}/...
  const gsMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (gsMatch) {
    const sheetId = gsMatch[1];
    let gid = overrideGid?.trim();
    if (!gid) {
      const gidMatch = url.match(/[#?&]gid=([0-9]+)/);
      gid = gidMatch ? gidMatch[1] : '0';
    }

    return {
      rawUrl: url,
      type: 'google-sheets',
      sheetId,
      gid,
      candidateExportUrls: [
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&gid=${gid}`,
      ],
      displayName: `Google Sheet (ID: ${sheetId.slice(0, 10)}…, Tab: ${gid})`,
    };
  }

  // 2. Google Sheets published URL: /spreadsheets/d/e/{PUB_ID}/...
  const pubMatch = url.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) {
    const pubId = pubMatch[1];
    const cleanPub = `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`;
    return {
      rawUrl: url,
      type: 'google-sheets-published',
      sheetId: pubId,
      candidateExportUrls: [cleanPub, url],
      displayName: `Published Google Sheet (${pubId.slice(0, 8)}…)`,
    };
  }

  // 3. Direct CSV URL
  if (url.toLowerCase().endsWith('.csv') || url.toLowerCase().includes('.csv?')) {
    return {
      rawUrl: url,
      type: 'csv-file',
      candidateExportUrls: [url],
      displayName: `Remote CSV Document (${url.split('/').pop()?.split('?')[0] || 'catalog.csv'})`,
    };
  }

  // 4. Direct Excel URL
  if (
    url.toLowerCase().endsWith('.xlsx') ||
    url.toLowerCase().endsWith('.xls') ||
    url.toLowerCase().includes('.xlsx?')
  ) {
    return {
      rawUrl: url,
      type: 'excel-file',
      candidateExportUrls: [url],
      displayName: `Remote Excel Workbook (${url.split('/').pop()?.split('?')[0] || 'catalog.xlsx'})`,
    };
  }

  // 5. OneDrive / Office Web
  if (url.includes('onedrive.live.com') || url.includes('sharepoint.com')) {
    const dlUrl = url.includes('download=1') ? url : `${url}${url.includes('?') ? '&' : '?'}download=1`;
    return {
      rawUrl: url,
      type: 'onedrive',
      candidateExportUrls: [dlUrl, url],
      displayName: 'OneDrive / Excel Online Workbook',
    };
  }

  // Generic Web URL
  return {
    rawUrl: url,
    type: 'generic-web',
    candidateExportUrls: [url],
    displayName: 'Web Spreadsheet Link',
  };
}

/**
 * Robust fetcher that fetches spreadsheet data from a URL using direct fetch, proxy, and fallback
 */
export async function fetchSpreadsheetFromUrl(
  inputUrl: string,
  overrideGid?: string
): Promise<{ workbook: XLSX.WorkBook; sourceLabel: string; rowCount: number }> {
  const info = analyzeWebLink(inputUrl, overrideGid);
  const candidates = info.candidateExportUrls;

  let lastError: Error | null = null;
  let rawData: ArrayBuffer | string | null = null;
  let isCsvFormat = false;

  for (const targetUrl of candidates) {
    // 1. Try Direct Fetch
    try {
      const resp = await fetch(targetUrl, {
        headers: {
          Accept: 'text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,*/*',
        },
      });

      if (resp.ok) {
        const contentType = (resp.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('text/html')) {
          const text = await resp.text();
          // Check if Google sign-in page returned
          if (text.includes('accounts.google.com') || text.includes('ServiceLogin') || text.includes('<html')) {
            throw new Error(
              'The Google Sheet is private or requires sign-in. Please open your Google Sheet, click "Share" (top-right), and change access to "Anyone with the link can view".'
            );
          }
          rawData = text;
          isCsvFormat = true;
        } else if (contentType.includes('csv') || contentType.includes('text/plain')) {
          rawData = await resp.text();
          isCsvFormat = true;
        } else {
          rawData = await resp.arrayBuffer();
          isCsvFormat = false;
        }
        if (rawData) break;
      }
    } catch (err: any) {
      if (err.message && err.message.includes('private or requires sign-in')) {
        throw err;
      }
      lastError = err;
    }

    // 2. Try App Dev Server Proxy (/api/proxy-sheet)
    try {
      const proxyUrl = `/api/proxy-sheet?url=${encodeURIComponent(targetUrl)}`;
      const proxyResp = await fetch(proxyUrl);
      if (proxyResp.ok) {
        const ct = (proxyResp.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('csv') || ct.includes('text')) {
          const text = await proxyResp.text();
          if (text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
            throw new Error(
              'The Google Sheet is private. In Google Sheets: Share → General access → set to "Anyone with the link can view".'
            );
          }
          rawData = text;
          isCsvFormat = true;
        } else {
          rawData = await proxyResp.arrayBuffer();
          isCsvFormat = false;
        }
        if (rawData) break;
      }
    } catch (err: any) {
      if (err.message && err.message.includes('private')) throw err;
      lastError = err;
    }

    // 3. Try Public CORS Gateway Fallback
    try {
      const publicGateway = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const gatewayResp = await fetch(publicGateway);
      if (gatewayResp.ok) {
        const text = await gatewayResp.text();
        if (text && !text.includes('accounts.google.com') && !text.includes('ServiceLogin')) {
          rawData = text;
          isCsvFormat = true;
          break;
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!rawData) {
    throw new Error(
      lastError?.message ||
        'Could not download spreadsheet from this web link. Please verify the URL is accessible and shared as "Anyone with the link can view".'
    );
  }

  // Parse using XLSX library
  let wb: XLSX.WorkBook;
  try {
    if (isCsvFormat && typeof rawData === 'string') {
      wb = XLSX.read(rawData, { type: 'string' });
    } else {
      wb = XLSX.read(rawData, { type: 'array' });
    }
  } catch (err: any) {
    throw new Error(`Failed to parse spreadsheet file: ${err.message || 'Invalid format'}`);
  }

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error('Spreadsheet has no sheets.');
  }

  const ws = wb.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(ws);

  return {
    workbook: wb,
    sourceLabel: info.displayName,
    rowCount: jsonData.length,
  };
}

/**
 * Built-in Retail Supermarket demo data generator to let users test with 1-click
 */
export function getDemoGoogleSheetData(): Record<string, any>[] {
  return [
    {
      'Serial #': 201,
      'English Name': 'PREMIUM AUSTRALIAN WAGYU RIBEYE STEAK',
      'Japanese Name': '豪州産 特選和牛リブアイステーキ',
      'Price (Ex Tax)': 2980,
      'Tax Rate %': 8,
      'Price (Inc Tax)': 3218,
      'Weight / Unit': '300 g',
      'Origin': 'AUSTRALIA',
      'Shop / Branch': 'Tokyo Main Store',
      'Category': 'Halal Meat & Poultry',
      'Stock Quantity': 45,
      'SKU': 'WAGYU-0201',
      'Barcode': '8901234567901',
    },
    {
      'Serial #': 202,
      'English Name': 'FRESH HALAL BABY LAMB CHOPS',
      'Japanese Name': '新鮮ハラール 骨付き仔羊チョップ',
      'Price (Ex Tax)': 1480,
      'Tax Rate %': 8,
      'Price (Inc Tax)': 1598,
      'Weight / Unit': '500 g',
      'Origin': 'AUSTRALIA',
      'Shop / Branch': 'Yokohama Branch Store',
      'Category': 'Halal Meat & Poultry',
      'Stock Quantity': 60,
      'SKU': 'LAMB-0202',
      'Barcode': '8901234567902',
    },
    {
      'Serial #': 203,
      'English Name': 'CEYLON ROASTED CURRY POWDER SPECIAL',
      'Japanese Name': 'セイロン 特製ローストカレーパウダー',
      'Price (Ex Tax)': 420,
      'Tax Rate %': 8,
      'Price (Inc Tax)': 454,
      'Weight / Unit': '250 g',
      'Origin': 'INDIA',
      'Shop / Branch': 'Tokyo Main Store',
      'Category': 'Spices & Seasonings',
      'Stock Quantity': 150,
      'SKU': 'SPICE-0203',
      'Barcode': '8901234567903',
    },
    {
      'Serial #': 204,
      'English Name': 'ORGANIC MEDJOOL DATES LARGE JUMBO',
      'Japanese Name': '有機栽培 マジョール デーツ 特大',
      'Price (Ex Tax)': 1250,
      'Tax Rate %': 8,
      'Price (Inc Tax)': 1350,
      'Weight / Unit': '500 g',
      'Origin': 'SAUDI ARAB',
      'Shop / Branch': 'Tokyo Main Store',
      'Category': 'Dates & Dry Fruits',
      'Stock Quantity': 80,
      'SKU': 'DATES-0204',
      'Barcode': '8901234567904',
    },
    {
      'Serial #': 205,
      'English Name': 'PREMIUM BASMATI SELLA RICE 1121',
      'Japanese Name': '特選 1121 セラ バスマティライス',
      'Price (Ex Tax)': 2150,
      'Tax Rate %': 8,
      'Price (Inc Tax)': 2322,
      'Weight / Unit': '5 kg',
      'Origin': 'PAKISTAN',
      'Shop / Branch': 'Yokohama Branch Store',
      'Category': 'Rice & Grains',
      'Stock Quantity': 95,
      'SKU': 'RICE-0205',
      'Barcode': '8901234567905',
    },
    {
      'Serial #': 206,
      'English Name': 'ALPHONSO MANGO PULP CAN',
      'Japanese Name': 'アルフォンソ マンゴーピューレ 缶',
      'Price (Ex Tax)': 480,
      'Tax Rate %': 8,
      'Price (Inc Tax)': 518,
      'Weight / Unit': '850 g',
      'Origin': 'INDIA',
      'Shop / Branch': 'Tokyo Main Store',
      'Category': 'Canned & Preserves',
      'Stock Quantity': 110,
      'SKU': 'CAN-0206',
      'Barcode': '8901234567906',
    },
  ];
}
