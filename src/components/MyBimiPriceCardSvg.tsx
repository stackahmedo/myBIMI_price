import React, { useMemo } from 'react';
import { Product, PriceCardTypographyConfig, DEFAULT_TYPOGRAPHY_CONFIG } from '../types/inventory';

interface MyBimiPriceCardProps {
  product: Product;
  className?: string;
  showCropMarks?: boolean;
  typography?: PriceCardTypographyConfig;
}

// Japanese country name mapping
const ORIGIN_JP_MAP: Record<string, string> = {
  JAPAN: '日本',
  BANGLADESH: 'バングラデシュ',
  PAKISTAN: 'パキスタン',
  INDIA: 'インド',
  VIETNAM: 'ベトナム',
  THAILAND: 'タイ',
  'SAUDI ARAB': 'サウジアラビア',
  AUSTRALIA: 'オーストラリア',
  BRAZIL: 'ブラジル',
  USA: 'アメリカ',
  CHINA: '中国',
  TURKEY: 'トルコ',
  INDONESIA: 'インドネシア',
};

export function formatOriginLabel(origin: string | undefined): string {
  if (!origin || origin.trim() === '' || origin.toUpperCase() === 'UNKNOWN') {
    return '原産国：日本';
  }
  const clean = origin.trim();
  if (clean.startsWith('原産国：') || clean.startsWith('原産国:')) {
    return clean;
  }
  const upper = clean.toUpperCase();
  const jp = ORIGIN_JP_MAP[upper] || clean;
  return `原産国：${jp}`;
}

// Smart text-wrapping for Latin / English words
function wrapTextWords(text: string, maxChars = 22): string[] {
  const words = (text || '').trim().split(/\s+/);
  if (words.length <= 1) {
    if (text.length > maxChars) {
      const mid = Math.floor(text.length / 2);
      return [text.slice(0, mid), text.slice(mid)];
    }
    return [text];
  }
  const lines: string[] = [];
  let curr: string[] = [];
  let currLen = 0;
  for (const w of words) {
    const addLen = w.length + (curr.length > 0 ? 1 : 0);
    if (currLen + addLen <= maxChars) {
      curr.push(w);
      currLen += addLen;
    } else {
      if (curr.length > 0) lines.push(curr.join(' '));
      curr = [w];
      currLen = w.length;
    }
  }
  if (curr.length > 0) lines.push(curr.join(' '));
  return lines.slice(0, 2);
}

// Smart text-wrapping for Japanese Kanji / Kana / punctuation
function wrapTextCjk(text: string, maxChars = 15): string[] {
  const clean = (text || '').trim();
  if (clean.length <= maxChars) return [clean];
  for (const sep of [' ', '　', '（', '(', '・', '&', '＆', '／', '/']) {
    const idx = clean.indexOf(sep);
    if (idx >= 3 && idx <= maxChars + 3) {
      return [clean.slice(0, idx), clean.slice(idx).trim()];
    }
  }
  const mid = Math.floor(clean.length / 2);
  return [clean.slice(0, mid), clean.slice(mid)];
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const getMyBimiCardSvgString = (
  product: Product,
  typography?: PriceCardTypographyConfig
): string => {
  const typo = typography || DEFAULT_TYPOGRAPHY_CONFIG;
  const jpFontFamily = `'${typo.jpFont}', ${typo.jpSubFont}`;
  const enFontFamily = `'${typo.enFont}', ${typo.enSubFont}`;
  const priceFontFamily = `'${typo.priceFont}', ${typo.priceSubFont}`;

  const jpScale = Math.max(0.65, Math.min(1.5, typo.jpFontSizeScale || 1.0));
  const enScale = Math.max(0.65, Math.min(1.5, typo.enFontSizeScale || 1.0));
  const priceScale = Math.max(0.65, Math.min(1.5, typo.priceFontSizeScale || 1.0));

  const taxEx = product.price_without_tax.toLocaleString();
  const taxInc = product.price_with_tax.toLocaleString();
  const weightStr = (product.weight_unit || '1 pc').trim();
  const originStr = formatOriginLabel(product.origin);

  // 1. Japanese Name Typography & Wrapping
  const rawJp = product.product_name_jp || product.product_name_eng;
  const jpLines = wrapTextCjk(rawJp, 16);
  let baseJpFontSize = 76;
  let jpTspan = '';
  let enStartY = 475;

  if (jpLines.length > 1) {
    baseJpFontSize = rawJp.length <= 22 ? 58 : (rawJp.length <= 32 ? 48 : 42);
    const jpFontSize = Math.round(baseJpFontSize * jpScale);
    const w0 = Math.min(1360, Math.round(jpLines[0].length * jpFontSize * 1.05));
    const w1 = Math.min(1360, Math.round(jpLines[1].length * jpFontSize * 1.05));
    jpTspan = `<tspan x="64" y="335" font-size="${jpFontSize}"${w0 > 1360 ? ` textLength="1360" lengthAdjust="spacingAndGlyphs"` : ''}>${escapeXml(jpLines[0])}</tspan><tspan x="64" y="${335 + jpFontSize + 12}" font-size="${jpFontSize}"${w1 > 1360 ? ` textLength="1360" lengthAdjust="spacingAndGlyphs"` : ''}>${escapeXml(jpLines[1])}</tspan>`;
    enStartY = 335 + jpFontSize + 12 + 62;
  } else {
    baseJpFontSize = rawJp.length <= 11 ? 76 : (rawJp.length <= 16 ? 62 : (rawJp.length <= 22 ? 52 : 44));
    const jpFontSize = Math.round(baseJpFontSize * jpScale);
    const w0 = Math.round(jpLines[0].length * jpFontSize * 1.05);
    jpTspan = `<tspan x="64" y="375" font-size="${jpFontSize}"${w0 > 1360 ? ` textLength="1360" lengthAdjust="spacingAndGlyphs"` : ''}>${escapeXml(jpLines[0])}</tspan>`;
    enStartY = 475;
  }

  // 2. English Name Typography & Wrapping
  const rawEn = (product.product_name_eng || '').toUpperCase();
  const enLines = wrapTextWords(rawEn, 24);
  let baseEnFontSize = 80;
  let enTspan = '';

  if (enLines.length > 1) {
    baseEnFontSize = rawEn.length <= 30 ? 54 : 44;
    const enFontSize = Math.round(baseEnFontSize * enScale);
    const w0 = Math.round(enLines[0].length * enFontSize * 0.65);
    const w1 = Math.round(enLines[1].length * enFontSize * 0.65);
    enTspan = `<tspan x="64" y="${enStartY}" font-size="${enFontSize}"${w0 > 1360 ? ` textLength="1360" lengthAdjust="spacingAndGlyphs"` : ''}>${escapeXml(enLines[0])}</tspan><tspan x="64" y="${enStartY + enFontSize + 10}" font-size="${enFontSize}"${w1 > 1360 ? ` textLength="1360" lengthAdjust="spacingAndGlyphs"` : ''}>${escapeXml(enLines[1])}</tspan>`;
  } else {
    baseEnFontSize = rawEn.length <= 14 ? 80 : (rawEn.length <= 22 ? 66 : 52);
    const enFontSize = Math.round(baseEnFontSize * enScale);
    const w0 = Math.round(enLines[0].length * enFontSize * 0.65);
    enTspan = `<tspan x="64" y="${enStartY}" font-size="${enFontSize}"${w0 > 1360 ? ` textLength="1360" lengthAdjust="spacingAndGlyphs"` : ''}>${escapeXml(enLines[0])}</tspan>`;
  }

  // 3. Weight Typography (Strictly constrained within 420px to avoid right-side collision)
  const weightFontSize = Math.round((weightStr.length <= 5 ? 88 : (weightStr.length <= 8 ? 72 : (weightStr.length <= 12 ? 58 : 46))) * enScale);
  const weightTextLen = Math.min(420, Math.round(weightStr.length * weightFontSize * 0.6));

  // 4. Origin Typography (Positioned strictly on left under weight section, strictly capped at 420px to never overlap Tax box at x=510)
  const originFontSize = Math.round((originStr.length <= 7 ? 44 : (originStr.length <= 11 ? 36 : (originStr.length <= 15 ? 30 : 26))) * jpScale);
  const originTextLen = Math.min(420, Math.round(originStr.length * originFontSize * 0.65));

  // 5. Hero Price Typography (Right-anchored, dynamically scaled and clamped to never collide with left tax box at x=510-660)
  const pExLen = taxEx.length;
  let basePriceFontSize = 320;
  if (pExLen >= 7) {
    basePriceFontSize = 160;
  } else if (pExLen >= 6) {
    basePriceFontSize = 195;
  } else if (pExLen === 5) {
    basePriceFontSize = 240;
  } else if (pExLen === 4) {
    basePriceFontSize = 280;
  } else {
    basePriceFontSize = 320;
  }
  const priceFontSize = Math.round(basePriceFontSize * priceScale);
  const maxPriceExWidth = 570;
  const estPriceWidth = Math.round(pExLen * priceFontSize * 0.62);
  const priceExTextLenAttr = estPriceWidth > maxPriceExWidth ? `textLength="${maxPriceExWidth}" lengthAdjust="spacingAndGlyphs"` : '';

  const incTaxFontSize = Math.round(105 * priceScale);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1507 1044" width="1507" height="1044" style="text-rendering: geometricPrecision; shape-rendering: geometricPrecision;">
  <defs>
    <linearGradient id="headerGrad" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#00603F"/>
      <stop offset="100%" stop-color="#007252"/>
    </linearGradient>
    <linearGradient id="footerGrad" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#00604A"/>
      <stop offset="100%" stop-color="#00735B"/>
    </linearGradient>
    <clipPath id="titleJpClip">
      <rect x="56" y="240" width="1395" height="190" />
    </clipPath>
    <clipPath id="titleEnClip">
      <rect x="56" y="420" width="1395" height="180" />
    </clipPath>
    <clipPath id="originSafeClip">
      <rect x="56" y="800" width="440" height="90" />
    </clipPath>
    <style>
      .sans  { font-family: ${jpFontFamily}; }
      .eng   { font-family: ${enFontFamily}; }
      .price { font-family: ${priceFontFamily}; }
    </style>
  </defs>

  <!-- Clean Card Base -->
  <rect id="Card_Background" x="0" y="0" width="1507" height="1044" fill="#ffffff"/>
  <rect id="Top_Accent_Bar" x="0" y="0" width="1507" height="28" fill="#ff5a00"/>

  <!-- Top-Left Official Brand Logo -->
  <g id="MyBIMI_Brand_Group" transform="translate(62, 42)">
    <text x="0" y="85" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="105" fill="#D61C24">My</text>
    <text x="160" y="85" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="105" fill="#0B6043">BIMI</text>
    <path d="M148 102 L440 92 L420 108 L148 108 Z" fill="#FA7910"/>
    <text x="4" y="140" font-family="'Outfit', sans-serif" font-weight="800" font-size="32" letter-spacing="9" fill="#1C1C1C">HALAL 360 STORE</text>
  </g>

  <!-- Top-Right Ribbon: Slanted Deep Green Polygon -->
  <polygon id="Header_Badge" points="902,34 1507,34 1507,222 1024,222" fill="url(#headerGrad)"/>
  <text id="Header_JP" x="1060" y="128" class="sans" font-size="59" font-weight="800" fill="#ffffff">新鮮で美味しい</text>
  <text id="Header_EN" x="1080" y="185" class="eng" font-size="43" font-weight="500" fill="#ffffff">Fresh &amp; Delicious</text>

  <!-- Product Names (Strictly bounded above y=520, clip paths and textLength prevent cross-browser overflow) -->
  <g clip-path="url(#titleJpClip)">
    <text id="Product_Name_JP" class="sans" font-weight="900" fill="#050505">
      ${jpTspan}
    </text>
  </g>
  <g clip-path="url(#titleEnClip)">
    <text id="Product_Name_EN" class="eng" font-weight="900" fill="#050505">
      ${enTspan}
    </text>
  </g>

  <!-- Weight section (Left side, guaranteed safe width <= 420px) -->
  <text id="Weight_Main" x="64" y="683" class="eng" font-size="${weightFontSize}" font-weight="900" fill="#000000" textLength="${weightTextLen}" lengthAdjust="spacingAndGlyphs">${escapeXml(weightStr)}</text>

  <!-- Origin section (Left side, strictly capped at 420px width so it NEVER collides with Tax Box at x=510) -->
  <g clip-path="url(#originSafeClip)">
    <text id="Product_Origin" x="64" y="855" class="sans" font-size="${originFontSize}" font-weight="800" fill="#000000" textLength="${originTextLen}" lengthAdjust="spacingAndGlyphs">${escapeXml(originStr)}</text>
  </g>

  <!-- Hero Tax-Ex Price (Right anchored with custom price font, scale, and max-width clamp) -->
  <text id="Price_ExTax" x="1285" y="768" text-anchor="end" class="price" font-size="${priceFontSize}" font-weight="900" fill="#df0011" ${priceExTextLenAttr}>${taxEx}</text>
  <text id="Price_ExTax_Yen" x="1440" y="767" text-anchor="end" class="sans" font-size="145" font-weight="900" fill="#df0011">円</text>

  <!-- Tax labels group matching official template -->
  <g id="Tax_Ex_Label" transform="translate(510, 0)">
    <text x="75" y="832" text-anchor="middle" class="sans" font-size="48" font-weight="800" fill="#000000">税 抜</text>
    <line x1="0" y1="849" x2="150" y2="849" stroke="#111111" stroke-width="3"/>
    <text x="75" y="891" text-anchor="middle" class="sans" font-size="36" font-weight="700" fill="#000000">(本体価格)</text>
  </g>

  <line id="Tax_Divider" x1="700" y1="794" x2="700" y2="905" stroke="#cfcfcf" stroke-width="3"/>

  <!-- Tax rate & Inc-tax price -->
  <text id="Tax_Rate_Label" x="735" y="884" class="sans" font-size="56" font-weight="800" fill="#000000">${product.tax_rate}%税込</text>
  <text id="Price_IncTax" x="1360" y="894" text-anchor="end" class="price" font-size="${incTaxFontSize}" font-weight="900" fill="#000000">${taxInc}</text>
  <text id="Price_IncTax_Yen" x="1440" y="891" text-anchor="end" class="sans" font-size="62" font-weight="900" fill="#000000">円</text>

  <!-- Footer Two-Tone Ribbon (y=922 to 1044) -->
  <path id="Footer_Left" d="M0 922 H736 L628 1044 H0 Z" fill="url(#footerGrad)"/>
  <path id="Footer_Right" d="M736 922 H1507 V1044 H628 Z" fill="#ff5a00"/>
  <line id="Footer_Divider" x1="739" y1="922" x2="628" y2="1044" stroke="#ffffff" stroke-width="7"/>
  <text id="Footer_Left_Text" x="50" y="991" class="eng" font-size="40" font-weight="600" letter-spacing="1.5" fill="#ffffff">Good Food Better Life</text>
  <text id="Footer_Right_JP" x="715" y="990" class="sans" font-size="40" font-weight="700" fill="#ffffff">安心・ハラール</text>
  <text id="Footer_Right_EN" x="1015" y="990" class="eng" font-size="38" font-weight="600" fill="#ffffff">| Halal &amp; Quality</text>
</svg>`;
};

export const MyBimiPriceCardSvg: React.FC<MyBimiPriceCardProps> = ({
  product,
  className = '',
  showCropMarks = false,
  typography,
}) => {
  const typo = typography || DEFAULT_TYPOGRAPHY_CONFIG;
  const jpFontFamily = `'${typo.jpFont}', ${typo.jpSubFont}`;
  const enFontFamily = `'${typo.enFont}', ${typo.enSubFont}`;
  const priceFontFamily = `'${typo.priceFont}', ${typo.priceSubFont}`;

  const jpScale = Math.max(0.65, Math.min(1.5, typo.jpFontSizeScale || 1.0));
  const enScale = Math.max(0.65, Math.min(1.5, typo.enFontSizeScale || 1.0));
  const priceScale = Math.max(0.65, Math.min(1.5, typo.priceFontSizeScale || 1.0));

  const taxEx = product.price_without_tax.toLocaleString();
  const taxInc = product.price_with_tax.toLocaleString();
  const weightStr = (product.weight_unit || '1 pc').trim();
  const originStr = formatOriginLabel(product.origin);

  // 1. Japanese Name Typography & Wrapping
  const rawJp = product.product_name_jp || product.product_name_eng;
  const jpLines = wrapTextCjk(rawJp, 16);
  let baseJpFontSize = 76;
  let enStartY = 475;

  if (jpLines.length > 1) {
    baseJpFontSize = rawJp.length <= 22 ? 58 : (rawJp.length <= 32 ? 48 : 42);
    const jpFontSize = Math.round(baseJpFontSize * jpScale);
    enStartY = 335 + jpFontSize + 12 + 62;
  } else {
    baseJpFontSize = rawJp.length <= 11 ? 76 : (rawJp.length <= 16 ? 62 : (rawJp.length <= 22 ? 52 : 44));
    enStartY = 475;
  }
  const jpFontSize = Math.round(baseJpFontSize * jpScale);

  // 2. English Name Typography & Wrapping
  const rawEn = (product.product_name_eng || '').toUpperCase();
  const enLines = wrapTextWords(rawEn, 24);
  let baseEnFontSize = 80;

  if (enLines.length > 1) {
    baseEnFontSize = rawEn.length <= 30 ? 54 : 44;
  } else {
    baseEnFontSize = rawEn.length <= 14 ? 80 : (rawEn.length <= 22 ? 66 : 52);
  }
  const enFontSize = Math.round(baseEnFontSize * enScale);

  // 3. Weight Typography (Strictly constrained within 420px)
  const weightFontSize = Math.round((weightStr.length <= 5 ? 88 : (weightStr.length <= 8 ? 72 : (weightStr.length <= 12 ? 58 : 46))) * enScale);
  const weightTextLen = Math.min(420, Math.round(weightStr.length * weightFontSize * 0.6));

  // 4. Origin Typography (Positioned under weight section on left, strictly <= 420px so it never overlaps Tax Box at x=510)
  const originFontSize = Math.round((originStr.length <= 7 ? 44 : (originStr.length <= 11 ? 36 : (originStr.length <= 15 ? 30 : 26))) * jpScale);
  const originTextLen = Math.min(420, Math.round(originStr.length * originFontSize * 0.65));

  // 5. Hero Price Typography (Right-anchored, dynamically scaled and clamped)
  const pExLen = taxEx.length;
  let basePriceFontSize = 320;
  if (pExLen >= 7) {
    basePriceFontSize = 160;
  } else if (pExLen >= 6) {
    basePriceFontSize = 195;
  } else if (pExLen === 5) {
    basePriceFontSize = 240;
  } else if (pExLen === 4) {
    basePriceFontSize = 280;
  } else {
    basePriceFontSize = 320;
  }
  const priceFontSize = Math.round(basePriceFontSize * priceScale);
  const maxPriceExWidth = 570;
  const estPriceWidth = Math.round(pExLen * priceFontSize * 0.62);
  const priceExTextLength = estPriceWidth > maxPriceExWidth ? maxPriceExWidth : undefined;

  const incTaxFontSize = Math.round(105 * priceScale);

  const clipUid = useMemo(() => `c-${product.id || Math.random().toString(36).substr(2, 6)}`, [product.id]);

  const rawJpW0 = (jpLines[0]?.length || 0) * jpFontSize * 1.05;
  const rawJpW1 = (jpLines[1]?.length || 0) * jpFontSize * 1.05;
  const jpWidth0 = rawJpW0 > 1360 ? 1360 : undefined;
  const jpWidth1 = rawJpW1 > 1360 ? 1360 : undefined;

  const rawEnW0 = (enLines[0]?.length || 0) * enFontSize * 0.65;
  const rawEnW1 = (enLines[1]?.length || 0) * enFontSize * 0.65;
  const enWidth0 = rawEnW0 > 1360 ? 1360 : undefined;
  const enWidth1 = rawEnW1 > 1360 ? 1360 : undefined;

  return (
    <div className={`relative ${className} select-none`}>
      {showCropMarks && (
        <div className="absolute -inset-1 border border-dashed border-stone-300 pointer-events-none rounded-sm" />
      )}
      <svg
        viewBox="0 0 1507 1044"
        className="w-full h-auto drop-shadow-sm rounded-lg overflow-hidden bg-white"
        style={{ aspectRatio: '1507 / 1044', textRendering: 'geometricPrecision', shapeRendering: 'geometricPrecision' }}
      >
        <defs>
          <linearGradient id="headerGradComp" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#00603F" />
            <stop offset="100%" stopColor="#007252" />
          </linearGradient>
          <linearGradient id="footerGradComp" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#00604A" />
            <stop offset="100%" stopColor="#00735B" />
          </linearGradient>
          <clipPath id={`titleJpClip-${clipUid}`}>
            <rect x="56" y="240" width="1395" height="190" />
          </clipPath>
          <clipPath id={`titleEnClip-${clipUid}`}>
            <rect x="56" y="420" width="1395" height="180" />
          </clipPath>
          <clipPath id={`originSafeClip-${clipUid}`}>
            <rect x="56" y="800" width="440" height="90" />
          </clipPath>
          <style>
            {`
              .card-sans  { font-family: ${jpFontFamily}; }
              .card-eng   { font-family: ${enFontFamily}; }
              .card-price { font-family: ${priceFontFamily}; }
            `}
          </style>
        </defs>

        {/* Card Background */}
        <rect id="Card_Background" x="0" y="0" width="1507" height="1044" fill="#ffffff" />
        <rect id="Top_Accent_Bar" x="0" y="0" width="1507" height="28" fill="#ff5a00" />

        {/* Top Left: MyBIMI Logo */}
        <g id="MyBIMI_Brand_Group" transform="translate(62, 42)">
          <text x="0" y="85" className="card-eng" fontWeight="900" fontStyle="italic" fontSize="105" fill="#D61C24">My</text>
          <text x="160" y="85" className="card-eng" fontWeight="900" fontStyle="italic" fontSize="105" fill="#0B6043">BIMI</text>
          <path d="M148 102 L440 92 L420 108 L148 108 Z" fill="#FA7910" />
          <text x="4" y="140" className="card-eng" fontWeight="800" fontSize="32" letterSpacing="9" fill="#1C1C1C">HALAL 360 STORE</text>
        </g>

        {/* Top Right: Slanted Deep Green Ribbon */}
        <polygon points="902,34 1507,34 1507,222 1024,222" fill="url(#headerGradComp)" />
        <text x="1060" y="128" className="card-sans" fontSize="59" fontWeight="800" fill="#ffffff">新鮮で美味しい</text>
        <text x="1080" y="185" className="card-eng" fontSize="43" fontWeight="500" fill="#ffffff">Fresh &amp; Delicious</text>

        {/* Product Japanese Name (bounded with textLength to ensure cross-browser consistency) */}
        <g clipPath={`url(#titleJpClip-${clipUid})`}>
          <text className="card-sans" fontWeight="900" fill="#050505">
            {jpLines.length > 1 ? (
              <>
                <tspan x="64" y="335" fontSize={jpFontSize} {...(jpWidth0 ? { textLength: jpWidth0, lengthAdjust: 'spacingAndGlyphs' } : {})}>{jpLines[0]}</tspan>
                <tspan x="64" y={335 + jpFontSize + 12} fontSize={jpFontSize} {...(jpWidth1 ? { textLength: jpWidth1, lengthAdjust: 'spacingAndGlyphs' } : {})}>{jpLines[1]}</tspan>
              </>
            ) : (
              <tspan x="64" y="375" fontSize={jpFontSize} {...(jpWidth0 ? { textLength: jpWidth0, lengthAdjust: 'spacingAndGlyphs' } : {})}>{jpLines[0]}</tspan>
            )}
          </text>
        </g>

        {/* Product English Name (bounded with textLength to prevent border clipping) */}
        <g clipPath={`url(#titleEnClip-${clipUid})`}>
          <text className="card-eng" fontWeight="900" fill="#050505">
            {enLines.length > 1 ? (
              <>
                <tspan x="64" y={enStartY} fontSize={enFontSize} {...(enWidth0 ? { textLength: enWidth0, lengthAdjust: 'spacingAndGlyphs' } : {})}>{enLines[0]}</tspan>
                <tspan x="64" y={enStartY + enFontSize + 10} fontSize={enFontSize} {...(enWidth1 ? { textLength: enWidth1, lengthAdjust: 'spacingAndGlyphs' } : {})}>{enLines[1]}</tspan>
              </>
            ) : (
              <tspan x="64" y={enStartY} fontSize={enFontSize} {...(enWidth0 ? { textLength: enWidth0, lengthAdjust: 'spacingAndGlyphs' } : {})}>{enLines[0]}</tspan>
            )}
          </text>
        </g>

        {/* Weight Section (Left, safe from titles above) */}
        <text x="64" y="683" className="card-eng" fontSize={weightFontSize} fontWeight="900" fill="#000000" textLength={weightTextLen} lengthAdjust="spacingAndGlyphs">
          {weightStr}
        </text>

        {/* Origin Section (Directly under weight/unit section on left side, strictly <= 420px) */}
        <g clipPath={`url(#originSafeClip-${clipUid})`}>
          <text x="64" y="855" className="card-sans" fontSize={originFontSize} fontWeight="800" fill="#000000" textLength={originTextLen} lengthAdjust="spacingAndGlyphs">
            {originStr}
          </text>
        </g>

        {/* Hero Price & Yen (Red, right-anchored with custom price font and clamp) */}
        <text
          x="1285"
          y="768"
          textAnchor="end"
          className="card-price"
          fontSize={priceFontSize}
          fontWeight="900"
          fill="#df0011"
          {...(priceExTextLength ? { textLength: priceExTextLength, lengthAdjust: 'spacingAndGlyphs' } : {})}
        >
          {taxEx}
        </text>
        <text x="1440" y="767" textAnchor="end" className="card-sans" fontSize="145" fontWeight="900" fill="#df0011">
          円
        </text>

        {/* Tax Labels Group matching official template */}
        <g id="Tax_Ex_Label" transform="translate(510, 0)">
          <text x="75" y="832" textAnchor="middle" className="card-sans" fontSize="48" fontWeight="800" fill="#000000">税 抜</text>
          <line x1="0" y1="849" x2="150" y2="849" stroke="#111111" strokeWidth="3" />
          <text x="75" y="891" textAnchor="middle" className="card-sans" fontSize="36" fontWeight="700" fill="#000000">(本体価格)</text>
        </g>

        <line x1="700" y1="794" x2="700" y2="905" stroke="#cfcfcf" strokeWidth="3" />

        {/* Tax Rate & Inc-Tax Price */}
        <text x="735" y="884" className="card-sans" fontSize="56" fontWeight="800" fill="#000000">{product.tax_rate}%税込</text>
        <text x="1360" y="894" textAnchor="end" className="card-price" fontSize={incTaxFontSize} fontWeight="900" fill="#000000">{taxInc}</text>
        <text x="1440" y="891" textAnchor="end" className="card-sans" fontSize="62" fontWeight="900" fill="#000000">円</text>

        {/* Footer Two-Tone Ribbon (y=922 to 1044) */}
        <path d="M0 922 H736 L628 1044 H0 Z" fill="url(#footerGradComp)" />
        <path d="M736 922 H1507 V1044 H628 Z" fill="#ff5a00" />
        <line x1="739" y1="922" x2="628" y2="1044" stroke="#ffffff" strokeWidth="7" />
        <text x="50" y="991" className="card-eng" fontSize="40" fontWeight="600" letterSpacing="1.5" fill="#ffffff">
          Good Food Better Life
        </text>
        <text x="715" y="990" className="card-sans" fontSize="40" fontWeight="700" fill="#ffffff">
          安心・ハラール
        </text>
        <text x="1015" y="990" className="card-eng" fontSize="38" fontWeight="600" fill="#ffffff">
          | Halal &amp; Quality
        </text>
      </svg>
    </div>
  );
};


