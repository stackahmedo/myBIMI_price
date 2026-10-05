import React from 'react';
import {
  PriceCardTypographyConfig,
  DEFAULT_TYPOGRAPHY_CONFIG,
  AVAILABLE_JP_FONTS,
  AVAILABLE_JP_SUBFONTS,
  AVAILABLE_EN_FONTS,
  AVAILABLE_EN_SUBFONTS,
  AVAILABLE_PRICE_FONTS,
  AVAILABLE_PRICE_SUBFONTS,
} from '../types/inventory';
import {
  Type,
  RotateCcw,
  Check,
  Languages,
  DollarSign,
  Minus,
  Plus,
  Baseline,
} from 'lucide-react';

interface TypographyConfigPanelProps {
  config: PriceCardTypographyConfig;
  onChange: (newConfig: PriceCardTypographyConfig) => void;
  className?: string;
}

export const TypographyConfigPanel: React.FC<TypographyConfigPanelProps> = ({
  config,
  onChange,
  className = '',
}) => {
  const updateField = <K extends keyof PriceCardTypographyConfig>(
    field: K,
    value: PriceCardTypographyConfig[K]
  ) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const adjustScale = (
    field: 'jpFontSizeScale' | 'enFontSizeScale' | 'priceFontSizeScale',
    delta: number
  ) => {
    const current = config[field];
    const updated = Math.min(1.45, Math.max(0.7, Math.round((current + delta) * 100) / 100));
    updateField(field, updated);
  };

  const handleReset = () => {
    onChange(DEFAULT_TYPOGRAPHY_CONFIG);
  };

  const applyPreset = (presetName: 'default' | 'supermarket' | 'dela_pop' | 'gourmet' | 'modern') => {
    if (presetName === 'default') {
      onChange(DEFAULT_TYPOGRAPHY_CONFIG);
    } else if (presetName === 'supermarket') {
      onChange({
        jpFont: 'Zen Kaku Gothic New',
        jpSubFont: 'Hiragino Sans, Meiryo, sans-serif',
        jpFontSizeScale: 1.05,
        enFont: 'Oswald',
        enSubFont: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        enFontSizeScale: 1.0,
        priceFont: 'Bebas Neue',
        priceSubFont: 'Arial Black, Impact, sans-serif',
        priceFontSizeScale: 1.15,
      });
    } else if (presetName === 'dela_pop') {
      onChange({
        jpFont: 'Dela Gothic One',
        jpSubFont: 'Hiragino Sans, Meiryo, sans-serif',
        jpFontSizeScale: 1.0,
        enFont: 'Outfit',
        enSubFont: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        enFontSizeScale: 1.0,
        priceFont: 'Anton',
        priceSubFont: 'Arial Black, Impact, sans-serif',
        priceFontSizeScale: 1.1,
      });
    } else if (presetName === 'gourmet') {
      onChange({
        jpFont: 'Shippori Mincho',
        jpSubFont: 'Yu Mincho, Georgia, serif',
        jpFontSizeScale: 1.0,
        enFont: 'Inter',
        enSubFont: 'Helvetica Neue, Arial, sans-serif',
        enFontSizeScale: 0.95,
        priceFont: 'Montserrat',
        priceSubFont: '-apple-system, BlinkMacSystemFont, Arial Black, Impact, sans-serif',
        priceFontSizeScale: 1.0,
      });
    } else if (presetName === 'modern') {
      onChange({
        jpFont: 'Noto Sans JP',
        jpSubFont: 'sans-serif',
        jpFontSizeScale: 1.0,
        enFont: 'Inter',
        enSubFont: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        enFontSizeScale: 1.0,
        priceFont: 'Outfit',
        priceSubFont: '-apple-system, BlinkMacSystemFont, Arial Black, Impact, sans-serif',
        priceFontSizeScale: 1.05,
      });
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 space-y-6 ${className}`}>
      {/* Header & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-xs">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <span>Card Font &amp; Size Customizer</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Live POP Engine
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 font-medium">
              Japanese Font | sub-font · English Font | sub-font · Price Font | sub-font · FONT size for each
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
          title="Restore standard BIMI POP typography defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Defaults</span>
        </button>
      </div>

      {/* Quick Typography Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Instant Font &amp; Size Presets
          </span>
          <span className="text-[11px] text-stone-500 font-medium">Click to apply curated retail styling</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              config.jpFont === 'Noto Sans JP' && config.priceFont === 'Outfit' && config.enFont === 'Outfit'
                ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold shadow-xs'
                : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Standard BIMI</span>
              {config.jpFont === 'Noto Sans JP' && config.priceFont === 'Outfit' && (
                <Check className="w-3 h-3 text-orange-600" />
              )}
            </div>
            <div className="text-[10px] text-stone-500 font-normal truncate mt-0.5">Noto Sans + Outfit</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('dela_pop')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              config.jpFont === 'Dela Gothic One'
                ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold shadow-xs'
                : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Supermarket POP</span>
              {config.jpFont === 'Dela Gothic One' && <Check className="w-3 h-3 text-orange-600" />}
            </div>
            <div className="text-[10px] text-stone-500 font-normal truncate mt-0.5">Dela Gothic + Anton</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('supermarket')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              config.jpFont === 'Zen Kaku Gothic New' && config.priceFont === 'Bebas Neue'
                ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold shadow-xs'
                : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Crisp Retail</span>
              {config.jpFont === 'Zen Kaku Gothic New' && <Check className="w-3 h-3 text-orange-600" />}
            </div>
            <div className="text-[10px] text-stone-500 font-normal truncate mt-0.5">Zen Kaku + Bebas</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('gourmet')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              config.jpFont === 'Shippori Mincho'
                ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold shadow-xs'
                : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Gourmet Serif</span>
              {config.jpFont === 'Shippori Mincho' && <Check className="w-3 h-3 text-orange-600" />}
            </div>
            <div className="text-[10px] text-stone-500 font-normal truncate mt-0.5">Shippori + Montserrat</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('modern')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              config.enFont === 'Inter' && config.jpFont === 'Noto Sans JP'
                ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold shadow-xs'
                : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Modern Clean</span>
              {config.enFont === 'Inter' && config.jpFont === 'Noto Sans JP' && (
                <Check className="w-3 h-3 text-orange-600" />
              )}
            </div>
            <div className="text-[10px] text-stone-500 font-normal truncate mt-0.5">Noto Sans + Inter</div>
          </button>
        </div>
      </div>

      {/* 3 Core Typography Columns: JP / EN / Price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ========================================================================= */}
        {/* 1. JAPANESE FONT | SUB-FONT | FONT SIZE                                  */}
        {/* ========================================================================= */}
        <div className="p-4 bg-stone-50/90 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <span className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-emerald-700" />
              <span>Japanese Title &amp; Origin</span>
            </span>
            <span className="font-bold text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              日本語フォント
            </span>
          </div>

          {/* Primary Japanese Font */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
              <span>Japanese Font</span>
              <span className="text-[10px] text-stone-400 font-mono">Primary</span>
            </label>
            <select
              value={config.jpFont}
              onChange={e => updateField('jpFont', e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
            >
              {AVAILABLE_JP_FONTS.map(f => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Japanese Sub-font (Fallback) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
              <span>Japanese Sub-Font</span>
              <span className="text-[10px] text-stone-400 font-mono">System Fallback</span>
            </label>
            <select
              value={config.jpSubFont}
              onChange={e => updateField('jpSubFont', e.target.value)}
              className="w-full text-xs font-medium bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-800 focus:outline-hidden focus:border-emerald-600 truncate"
            >
              {AVAILABLE_JP_SUBFONTS.map(sf => (
                <option key={sf.id} value={sf.id}>
                  {sf.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live Glyphs Preview */}
          <div className="p-2.5 bg-white rounded-xl border border-stone-200">
            <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Preview Japanese Typography</span>
              <span className="font-mono text-emerald-700">{config.jpFont}</span>
            </div>
            <div
              className="text-stone-900 font-bold truncate transition-all leading-tight"
              style={{
                fontFamily: `'${config.jpFont}', ${config.jpSubFont}`,
                fontSize: `${Math.round(18 * config.jpFontSizeScale)}px`,
              }}
            >
              骨付きラムチョップ（生肉）
            </div>
            <div
              className="text-stone-500 text-[11px] mt-0.5 truncate"
              style={{ fontFamily: `'${config.jpFont}', ${config.jpSubFont}` }}
            >
              原産国：ニュージーランド · 安心・ハラール
            </div>
          </div>

          {/* FONT SIZE OPTION FOR JAPANESE */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-800 flex items-center gap-1">
                <Baseline className="w-3.5 h-3.5 text-emerald-700" />
                <span>Japanese Font Size</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                  {Math.round(config.jpFontSizeScale * 100)}%
                </span>
                <div className="flex items-center border border-stone-300 rounded-md bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => adjustScale('jpFontSizeScale', -0.05)}
                    className="p-1 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                    title="Decrease Japanese font size (-5%)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="w-px h-3.5 bg-stone-200" />
                  <button
                    type="button"
                    onClick={() => adjustScale('jpFontSizeScale', 0.05)}
                    className="p-1 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                    title="Increase Japanese font size (+5%)"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <input
              type="range"
              min="0.70"
              max="1.45"
              step="0.05"
              value={config.jpFontSizeScale}
              onChange={e => updateField('jpFontSizeScale', parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
            />

            {/* Quick Size Presets */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => updateField('jpFontSizeScale', 0.85)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.jpFontSizeScale * 100) === 85
                    ? 'bg-emerald-700 text-white font-bold border-emerald-700'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => updateField('jpFontSizeScale', 1.0)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.jpFontSizeScale * 100) === 100
                    ? 'bg-emerald-700 text-white font-bold border-emerald-700'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => updateField('jpFontSizeScale', 1.15)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.jpFontSizeScale * 100) === 115
                    ? 'bg-emerald-700 text-white font-bold border-emerald-700'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                115%
              </button>
              <button
                type="button"
                onClick={() => updateField('jpFontSizeScale', 1.3)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.jpFontSizeScale * 100) === 130
                    ? 'bg-emerald-700 text-white font-bold border-emerald-700'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                130%
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. ENGLISH FONT | SUB-FONT | FONT SIZE                                    */}
        {/* ========================================================================= */}
        <div className="p-4 bg-stone-50/90 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <span className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-blue-700" />
              <span>English Title &amp; Weight</span>
            </span>
            <span className="font-bold text-[10px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
              ENG FONT
            </span>
          </div>

          {/* Primary English Font */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
              <span>English Font</span>
              <span className="text-[10px] text-stone-400 font-mono">Primary</span>
            </label>
            <select
              value={config.enFont}
              onChange={e => updateField('enFont', e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
            >
              {AVAILABLE_EN_FONTS.map(f => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* English Sub-font (Fallback) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
              <span>English Sub-Font</span>
              <span className="text-[10px] text-stone-400 font-mono">System Fallback</span>
            </label>
            <select
              value={config.enSubFont}
              onChange={e => updateField('enSubFont', e.target.value)}
              className="w-full text-xs font-medium bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-800 focus:outline-hidden focus:border-blue-600 truncate"
            >
              {AVAILABLE_EN_SUBFONTS.map(sf => (
                <option key={sf.id} value={sf.id}>
                  {sf.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live Glyphs Preview */}
          <div className="p-2.5 bg-white rounded-xl border border-stone-200">
            <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Preview English Typography</span>
              <span className="font-mono text-blue-700">{config.enFont}</span>
            </div>
            <div
              className="text-stone-900 font-black truncate transition-all leading-tight tracking-wide"
              style={{
                fontFamily: `'${config.enFont}', ${config.enSubFont}`,
                fontSize: `${Math.round(18 * config.enFontSizeScale)}px`,
              }}
            >
              FRESH LAMB CHOPS 1KG
            </div>
            <div
              className="text-stone-500 text-[11px] mt-0.5 truncate font-semibold"
              style={{ fontFamily: `'${config.enFont}', ${config.enSubFont}` }}
            >
              Halal &amp; Quality · Good Food Better Life
            </div>
          </div>

          {/* FONT SIZE OPTION FOR ENGLISH */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-800 flex items-center gap-1">
                <Baseline className="w-3.5 h-3.5 text-blue-700" />
                <span>English Font Size</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                  {Math.round(config.enFontSizeScale * 100)}%
                </span>
                <div className="flex items-center border border-stone-300 rounded-md bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => adjustScale('enFontSizeScale', -0.05)}
                    className="p-1 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                    title="Decrease English font size (-5%)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="w-px h-3.5 bg-stone-200" />
                  <button
                    type="button"
                    onClick={() => adjustScale('enFontSizeScale', 0.05)}
                    className="p-1 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                    title="Increase English font size (+5%)"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <input
              type="range"
              min="0.70"
              max="1.45"
              step="0.05"
              value={config.enFontSizeScale}
              onChange={e => updateField('enFontSizeScale', parseFloat(e.target.value))}
              className="w-full accent-blue-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
            />

            {/* Quick Size Presets */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => updateField('enFontSizeScale', 0.85)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.enFontSizeScale * 100) === 85
                    ? 'bg-blue-700 text-white font-bold border-blue-700'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => updateField('enFontSizeScale', 1.0)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.enFontSizeScale * 100) === 100
                    ? 'bg-blue-700 text-white font-bold border-blue-700'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => updateField('enFontSizeScale', 1.15)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.enFontSizeScale * 100) === 115
                    ? 'bg-blue-700 text-white font-bold border-blue-700'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                115%
              </button>
              <button
                type="button"
                onClick={() => updateField('enFontSizeScale', 1.3)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.enFontSizeScale * 100) === 130
                    ? 'bg-blue-700 text-white font-bold border-blue-700'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                130%
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. PRICE FONT | SUB-FONT | FONT SIZE                                      */}
        {/* ========================================================================= */}
        <div className="p-4 bg-stone-50/90 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <span className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-red-600" />
              <span>Price Numerals (税抜/税込)</span>
            </span>
            <span className="font-bold text-[10px] text-red-800 bg-red-100 px-2 py-0.5 rounded-md">
              ¥ 価格フォント
            </span>
          </div>

          {/* Primary Price Font */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
              <span>Price Font</span>
              <span className="text-[10px] text-stone-400 font-mono">Primary Numerals</span>
            </label>
            <select
              value={config.priceFont}
              onChange={e => updateField('priceFont', e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-900 focus:outline-hidden focus:border-red-600 focus:ring-1 focus:ring-red-500"
            >
              {AVAILABLE_PRICE_FONTS.map(f => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Sub-font (Fallback) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
              <span>Price Sub-Font</span>
              <span className="text-[10px] text-stone-400 font-mono">System Fallback</span>
            </label>
            <select
              value={config.priceSubFont}
              onChange={e => updateField('priceSubFont', e.target.value)}
              className="w-full text-xs font-medium bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-800 focus:outline-hidden focus:border-red-600 truncate"
            >
              {AVAILABLE_PRICE_SUBFONTS.map(sf => (
                <option key={sf.id} value={sf.id}>
                  {sf.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live Glyphs Preview */}
          <div className="p-2.5 bg-white rounded-xl border border-stone-200">
            <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Preview Price Numerals</span>
              <span className="font-mono text-red-600">{config.priceFont}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-red-600 font-black tracking-tight leading-none"
                style={{
                  fontFamily: `'${config.priceFont}', ${config.priceSubFont}`,
                  fontSize: `${Math.round(28 * config.priceFontSizeScale)}px`,
                }}
              >
                1,980
              </span>
              <span className="text-red-600 font-bold text-sm">円</span>
              <span className="text-stone-400 text-xs ml-2 font-mono">税抜</span>
            </div>
            <div className="text-[11px] text-stone-600 font-semibold mt-1 flex items-center gap-1">
              <span>8%税込</span>
              <span
                className="font-bold text-stone-900"
                style={{ fontFamily: `'${config.priceFont}', ${config.priceSubFont}` }}
              >
                2,138
              </span>
              <span>円</span>
            </div>
          </div>

          {/* FONT SIZE OPTION FOR PRICE */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-800 flex items-center gap-1">
                <Baseline className="w-3.5 h-3.5 text-red-600" />
                <span>Price Font Size</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs">
                  {Math.round(config.priceFontSizeScale * 100)}%
                </span>
                <div className="flex items-center border border-stone-300 rounded-md bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => adjustScale('priceFontSizeScale', -0.05)}
                    className="p-1 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                    title="Decrease Price font size (-5%)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="w-px h-3.5 bg-stone-200" />
                  <button
                    type="button"
                    onClick={() => adjustScale('priceFontSizeScale', 0.05)}
                    className="p-1 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                    title="Increase Price font size (+5%)"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <input
              type="range"
              min="0.70"
              max="1.45"
              step="0.05"
              value={config.priceFontSizeScale}
              onChange={e => updateField('priceFontSizeScale', parseFloat(e.target.value))}
              className="w-full accent-red-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
            />

            {/* Quick Size Presets */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => updateField('priceFontSizeScale', 0.85)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.priceFontSizeScale * 100) === 85
                    ? 'bg-red-600 text-white font-bold border-red-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => updateField('priceFontSizeScale', 1.0)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.priceFontSizeScale * 100) === 100
                    ? 'bg-red-600 text-white font-bold border-red-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => updateField('priceFontSizeScale', 1.15)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.priceFontSizeScale * 100) === 115
                    ? 'bg-red-600 text-white font-bold border-red-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                115%
              </button>
              <button
                type="button"
                onClick={() => updateField('priceFontSizeScale', 1.3)}
                className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                  Math.round(config.priceFontSizeScale * 100) === 130
                    ? 'bg-red-600 text-white font-bold border-red-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                130%
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
