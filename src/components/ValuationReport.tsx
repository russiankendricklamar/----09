/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Filter, Calendar, Search, ArrowLeftRight, Check, X,
  Calculator, ReceiptText, ChevronLeft, ChevronRight, HelpCircle, Eye,
  Upload, Sparkles, Plus, Play, AlertCircle, Edit2, FileText, Clipboard, History
} from 'lucide-react';
import { Deal, MarketQuote, YieldCurve } from '../types';
import { evaluateDerivativeDeal, ValuationResult, CURRENCY_HIERARCHY } from '../utils/valuationMath';

interface ValuationReportProps {
  deals: Deal[];
  quotes: MarketQuote[];
  curves: YieldCurve[];
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
  user: string;
}

export default function ValuationReport({ deals: initialDeals, quotes, curves }: ValuationReportProps) {
  // Mode selection: 'AUTO' | 'SEMI_AUTO' | 'CALCULATOR'
  const [appMode, setAppMode] = useState<'AUTO' | 'SEMI_AUTO' | 'CALCULATOR'>('AUTO');
  
  // Instrument Filter for and tables
  const [selectedInst, setSelectedInst] = useState<'ALL' | 'SPOT' | 'SWAP' | 'FORWARD' | 'REPO'>('ALL');
  const [selectedSource, setSelectedSource] = useState<'MOEX' | 'Cbonds'>('MOEX');
  const [reportDate, setReportDate] = useState('2023-10-27');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Zone 2 Collapsible State (Simulating Excel Column Grouping)
  const [showZone2, setShowZone2] = useState(true);
  
  // Active state lists of deals
  const [activeDeals, setActiveDeals] = useState<any[]>(
    initialDeals.map(d => ({
      ...d,
      // Ensure date format or properties compatibility
      rate: d.rate || 94.52,
      buyAmt: d.buyAmt || 1000000,
      sellAmt: d.sellAmt || 95420000,
      buyCcy: d.buyCcy || d.currency,
      sellCcy: d.sellCcy || 'RUB'
    }))
  );

  // --- SEMI-AUTOMATIC MODE STATES ---
  const [pricingFileUploaded, setPricingFileUploaded] = useState(false);
  const [dealsFileUploaded, setDealsFileUploaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidationSuccess, setIsValidationSuccess] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [editingCell, setEditingCell] = useState<{ dealId: string; field: string; value: string } | null>(null);
  
  // --- CALCULATOR STATES ---
  const [calcInstrument, setCalcInstrument] = useState<'SPOT' | 'SWAP' | 'FORWARD' | 'REPO'>('SPOT');
  const [calcDirection, setCalcDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [calcCurrency, setCalcCurrency] = useState<'USD' | 'EUR' | 'CNY' | 'GBP'>('USD');
  const [calcNominal, setCalcNominal] = useState<number>(1000000);
  const [calcRate, setCalcRate] = useState<number>(93.5);
  const [calcTradeDate, setCalcTradeDate] = useState('2023-10-27');
  const [calcSettleDate, calcSettleDateLeg2] = useState('2023-11-27'); // 30 days default
  const [calculatorHistory, setCalculatorHistory] = useState<any[]>([]);
  const [calcResult, setCalcResult] = useState<ValuationResult | null>(null);
  
  // REPO Calculator States
  const [repoIsin, setRepoIsin] = useState('XS2345678901');
  const [repoCollateral, setRepoCollateral] = useState('Bonds');
  
  // SWAP Calculator States
  const [swapPointsValue, setSwapPointsValue] = useState(0.95);
  
  // Reference hooks
  const dealsFileRef = useRef<HTMLInputElement>(null);
  const pricingFileRef = useRef<HTMLInputElement>(null);

  // Evaluate All current deals with our engine (ZONA 1 + ZONA 2 calculations)
  const evaluatedDeals: ValuationResult[] = activeDeals.map(deal => {
    return evaluateDerivativeDeal(deal, curves, selectedSource === 'MOEX' ? 'MOEX' : 'REUTERS');
  });

  const filteredEvaluated = evaluatedDeals.filter(r => {
    const origDeal = activeDeals.find(d => d.id === r.dealId);
    if (!origDeal) return false;
    
    // Instrument type filter
    if (selectedInst !== 'ALL' && origDeal.type !== selectedInst) return false;
    
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = origDeal.id.toLowerCase().includes(q) || 
                      origDeal.counterparty.toLowerCase().includes(q) || 
                      origDeal.currency.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  // Calculate high-level stats based on current evaluation
  const statsTotal = filteredEvaluated.length;
  const statsInMarket = filteredEvaluated.filter(r => r.isMarket === 'В рынке').length;
  const statsConformityPct = statsTotal > 0 ? parseFloat(((statsInMarket / statsTotal) * 100).toFixed(1)) : 100;
  const statsTotalPv = filteredEvaluated.reduce((acc, r) => acc + Math.abs(r.fairValueCbr), 0);

  // --- HANDLERS ---
  
  // Simulation of EXCEL Export (creates a visual alert or downloads a mock CSV schema)
  const handleExportCSV = () => {
    let headers = "Зона 1 — Основной реестр (левая часть),,,,,,,Зона 2 — Расчетные показатели (правая часть)\n";
    headers += "№ сделки,Тип,Валюта,Курс сделки,FV по ЦБ РФ (тыс. руб.),FV min,FV max,Оценка рыночности,Разделитель,Разделитель,Разделитель,Разделитель,Разделитель,Спот ЦБ,Спот min,Спот max,Интерп. ставка 1 (r1),Интерп. ставка 2 (r2),DF1,DF2,Расчетный форвард/своп\n";
    
    const rows = filteredEvaluated.map(r => {
      const orig = activeDeals.find(d => d.id === r.dealId);
      return `${orig?.id},${orig?.type},${orig?.currency},${orig?.rate},${r.fairValueCbr.toFixed(2)},${r.fairValueMin.toFixed(2)},${r.fairValueMax.toFixed(2)},${r.isMarket},,,, , ,${r.spotCbr},${r.spotMin},${r.spotMax},${r.r1.toFixed(4)}%,${r.r2.toFixed(4)}%,${r.df1.toFixed(6)},${r.df2.toFixed(6)},${(r.forwardTheo || r.swapPointsTheo || 0).toFixed(4)}`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Parr_Valuation_Report_${selectedInst}_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cell Editing in Semi-Automatic Mode
  const handleCellEditSubmit = (dealId: string, field: string, value: string) => {
    const origValue = activeDeals.find(d => d.id === dealId)?.[field];
    const parsedVal = (field === 'rate' || field === 'buyAmt' || field === 'sellAmt') 
      ? parseFloat(value) 
      : value;

    if (isNaN(parsedVal as any) && (field === 'rate' || field === 'buyAmt' || field === 'sellAmt')) {
      setEditingCell(null);
      return;
    }

    // Capture log entry
    const newLog: AuditLogEntry = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      field: `${dealId} -> ${field}`,
      oldValue: String(origValue || ''),
      newValue: String(value),
      user: 'AA (Андрей Антонов)'
    };

    setAuditLog(prev => [newLog, ...prev]);

    // Update activeDeals
    setActiveDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        return { ...d, [field]: parsedVal };
      }
      return d;
    }));

    setEditingCell(null);
  };

  // Calculator execution
  const calculateSingleOption = () => {
    // Construct mock deal attributes for evaluating single transaction
    const mockCalcDeal = {
      id: 'CALC-TEMP',
      type: calcInstrument,
      currency: calcCurrency,
      rate: calcRate,
      buyAmt: calcNominal,
      sellAmt: calcNominal * calcRate,
      buyCcy: calcDirection === 'BUY' ? calcCurrency : 'RUB',
      sellCcy: calcDirection === 'BUY' ? 'RUB' : calcCurrency,
      tradeDate: calcTradeDate,
      settleDate: calcSettleDate,
      leg1Date: calcTradeDate,
      leg2Date: calcSettleDate,
      leg1Qty: calcNominal,
      leg1Total: calcNominal * calcRate,
      leg2Qty: calcNominal,
      leg2Total: calcNominal * (calcRate + (calcInstrument === 'SWAP' ? swapPointsValue : 0)),
      isin: repoIsin,
      collateral: repoCollateral
    };

    const calculation = evaluateDerivativeDeal(mockCalcDeal, curves, selectedSource === 'MOEX' ? 'MOEX' : 'REUTERS');
    setCalcResult(calculation);
  };

  // Add calculated deal to history journal
  const saveCalcToHistory = () => {
    if (!calcResult) return;
    const historyItem = {
      id: `C${100 + calculatorHistory.length + 1}`,
      type: calcInstrument,
      currency: calcCurrency,
      nominal: calcNominal,
      rate: calcRate,
      fairValueCbr: calcResult.fairValueCbr,
      isMarket: calcResult.isMarket,
      timestamp: new Date().toLocaleTimeString('ru-RU')
    };
    setCalculatorHistory(prev => [historyItem, ...prev]);
  };

  // Copy Calculator settings and inject as custom deal
  const pushCalcToSemiAuto = () => {
    if (!calcResult) return;
    
    const newDealId = `FX-CALC-${1000 + activeDeals.length}`;
    const newDeal = {
      id: newDealId,
      extId: `OTC-${Math.floor(Math.random() * 90000 + 10000)}`,
      type: calcInstrument,
      tradeDate: calcTradeDate,
      settleDate: calcSettleDate,
      status: 'Verified',
      counterparty: 'Пользовательская сделка (Калькулятор)',
      currency: calcCurrency,
      rate: calcRate,
      pv: calcResult.fairValueCbr,
      deltaToMarket: calcResult.deviationScorePct,
      buyCcy: calcDirection === 'BUY' ? calcCurrency : 'RUB',
      buyAmt: calcNominal,
      sellCcy: calcDirection === 'BUY' ? 'RUB' : calcCurrency,
      sellAmt: calcNominal * calcRate,
      leg1Date: calcTradeDate,
      leg2Date: calcSettleDate,
      leg1Qty: calcNominal,
      leg1Total: calcNominal * calcRate,
      leg2Qty: calcNominal,
      leg2Total: calcNominal * (calcRate + (calcInstrument === 'SWAP' ? swapPointsValue : 0)),
      isin: repoIsin,
      collateral: repoCollateral
    };

    setActiveDeals(prev => [...prev, newDeal]);
    setAppMode('SEMI_AUTO');
  };

  const handleDealsUploadSim = () => {
    setDealsFileUploaded(true);
    triggerFileUploadValidation();
  };

  const handlePricingUploadSim = () => {
    setPricingFileUploaded(true);
    triggerFileUploadValidation();
  };

  const triggerFileUploadValidation = () => {
    setValidationErrors([]);
    setIsValidationSuccess(false);

    // Simulated check of sheets structure
    setTimeout(() => {
      const errors: string[] = [];
      
      // If client-side check discovers issue:
      if (Math.random() > 0.8) {
        errors.push("Сделка на строке 3 содержит несоответствующую дату расчетов (settleDate < tradeDate)");
      }
      
      // Template alignment checks
      errors.push("В файле Сделок не совпадает заголовок столбца 5 (ожидается 'settleDate', найдено 'settlement_day')");
      
      setValidationErrors(errors);
      if (errors.length === 0) {
        setIsValidationSuccess(true);
      }
    }, 450);
  };

  const fixValidationErrorsSim = () => {
    // Reset file validation manually reflecting auto adjustment logic
    setValidationErrors([]);
    setIsValidationSuccess(true);
    
    const adjustmentLog: AuditLogEntry = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      field: 'Файл реестра сделок',
      oldValue: 'settlement_day',
      newValue: 'settleDate (авто-исправление шаблона)',
      user: 'Центральный процессор'
    };
    setAuditLog(prev => [adjustmentLog, ...prev]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Top Section with app-level Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_3px_rgba(11,37,69,.05)] p-5">
        <div>
          <h2 className="font-sans text-xl font-bold tracking-tight text-primary">Раздел Анализа и Оценки ПФИ</h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1 leading-normal">Выберите подходящий сценарий работы, настройте фильтры и экспортируйте итоговый отчет.</p>
        </div>
        
        {/* Three Modes Toggle Controls */}
        <div className="flex bg-surface-container rounded p-1 border border-line-soft items-center self-start md:self-center">
          <button 
            onClick={() => setAppMode('AUTO')}
            className={`px-4 py-2 font-sans text-xs font-bold rounded cursor-pointer transition-all flex items-center gap-1.5 ${
              appMode === 'AUTO' 
                ? 'bg-primary text-on-primary shadow shadow-primary-container-variant' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Автоматический
          </button>
          <button 
            onClick={() => setAppMode('SEMI_AUTO')}
            className={`px-4 py-2 font-sans text-xs font-bold rounded cursor-pointer transition-all flex items-center gap-1.5 ${
              appMode === 'SEMI_AUTO' 
                ? 'bg-primary text-on-primary shadow shadow-primary-container-variant' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Полуавтоматический
          </button>
          <button 
            onClick={() => setAppMode('CALCULATOR')}
            className={`px-4 py-2 font-sans text-xs font-bold rounded cursor-pointer transition-all flex items-center gap-1.5 ${
              appMode === 'CALCULATOR' 
                ? 'bg-primary text-on-primary shadow shadow-primary-container-variant' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Калькулятор ПФИ
          </button>
        </div>
      </div>

      {/* RENDER MODE: AUTOMATIC */}
      {appMode === 'AUTO' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Quick options Bar */}
          <div className="bg-surface-light border border-line-soft p-4 rounded-lg shadow-sm flex items-center gap-4 flex-wrap text-xs text-on-surface">
            {/* Source */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-on-surface-variant">Источник рыночных данных:</span>
              <select 
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as any)}
                className="border border-line rounded bg-surface-bright font-semibold py-1 px-2.5 h-8 cursor-pointer focus:outline-none focus:border-primary"
              >
                <option value="MOEX">MOEX (Московская биржа)</option>
                <option value="Cbonds">Cbonds (Информационная лента)</option>
              </select>
            </div>

            <div className="w-px h-6 bg-line-soft"></div>

            {/* Instrument Filter Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-on-surface-variant">Инструмент:</span>
              <div className="flex bg-surface-container rounded p-0.5 border border-line-soft">
                {['ALL', 'SPOT', 'SWAP', 'FORWARD', 'REPO'].map((inst) => (
                  <button
                    key={inst}
                    onClick={() => setSelectedInst(inst as any)}
                    className={`px-2.5 py-1 rounded font-sans text-[11px] font-bold cursor-pointer transition-all ${
                      selectedInst === inst
                        ? 'bg-surface-light shadow text-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-6 bg-line-soft"></div>

            {/* Expander checkbox for Excel Grouping Column Mode Zone 2 */}
            <label className="flex items-center gap-2 font-bold text-on-surface-variant cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showZone2} 
                onChange={() => setShowZone2(!showZone2)}
                className="rounded text-primary border-line focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Показать показатели Зоны 2 (Ревизия логики формул)</span>
            </label>

            {/* Search Input */}
            <div className="ml-auto relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск сделки, контр..."
                className="w-full pl-8 pr-2.5 h-8 border border-line rounded text-xs bg-surface-bright focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* KPI Dashboard cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-light rounded-lg border border-line-soft p-4 flex flex-col justify-between shadow-sm">
              <span className="font-sans text-[10.5px] uppercase tracking-wider font-bold text-on-surface-variant leading-none">Общий объем оценки</span>
              <p className="font-sans text-xl font-black text-primary mt-2 tabular-nums">₽ {(statsTotalPv / 1000).toFixed(1)} <span className="text-[10px] font-normal text-on-surface-variant">млрд</span></p>
            </div>
            <div className="bg-surface-light rounded-lg border border-line-soft p-4 flex flex-col justify-between shadow-sm">
              <span className="font-sans text-[10.5px] uppercase tracking-wider font-bold text-on-surface-variant leading-none">Количество сделок</span>
              <p className="font-sans text-xl font-black text-primary mt-2 tabular-nums">{statsTotal}</p>
            </div>
            <div className="bg-surface-light rounded-lg border border-line-soft p-4 flex flex-col justify-between shadow-sm">
              <span className="font-sans text-[10.5px] uppercase tracking-wider font-bold text-on-surface-variant leading-none">Соответствие рынку</span>
              <p className="font-sans text-xl font-black text-pos mt-2 tabular-nums">{statsConformityPct}%</p>
            </div>
            <button 
              onClick={handleExportCSV}
              className="bg-primary hover:bg-primary-container text-on-primary rounded-lg p-4 flex items-center justify-center gap-2 shadow-md transition-all font-sans text-xs font-bold cursor-pointer"
            >
              <Download className="w-5 h-5 shrink-0" /> Скачать отчет Excel (Зона 1 + 2)
            </button>
          </div>

          {/* MAIN TWO-ZONE TABLE */}
          <div className="bg-surface-light rounded-lg border border-line-soft shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-line-soft bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-sans text-xs font-extrabold text-on-surface flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0b2545]/20 border border-[#0b2545]/40 inline-block"></span> 
                  Зона 1: Основной реестр
                </span>
                {showZone2 && (
                  <span className="font-sans text-xs font-extrabold text-[#365e9f] flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#ecf2fa] border border-[#365e9f]/30 inline-block"></span> 
                    Зона 2: Расчётные параметры
                  </span>
                )}
              </div>
              <span className="font-sans text-[10px] text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container px-2.5 py-1 rounded">Режим: АВТОМАТИЧЕСКИЙ</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  {/* Visual separation row for Zonas */}
                  <tr className="bg-surface-container border-b border-line-soft text-[10px] font-extrabold tracking-wider uppercase text-on-surface-variant">
                    <th colSpan={8} className="py-2 px-4 border-r border-line text-left bg-surface-bright/20 shadow-sm">Зона 1 — Основной реестр сделок и Справедливая стоимость</th>
                    {showZone2 && (
                      <>
                        <th className="py-2 px-1 text-center font-bold text-on-surface-variant opacity-40"> </th>
                        <th colSpan={10} className="py-2 px-4 bg-surface-container-low text-left text-primary">Зона 2 — Расчётные показатели и Промежуточные значения</th>
                      </>
                    )}
                  </tr>
                  
                  {/* Detailed Table Column Headers */}
                  <tr className="bg-surface-container-low text-[10.5px] font-bold text-on-surface-variant border-b border-line-soft">
                    {/* Zone 1 Headers */}
                    <th className="py-2 px-4 font-bold">№ сделки (ID)</th>
                    <th className="py-2 px-4 font-bold">Тип</th>
                    <th className="py-2 px-4 font-bold">Сделка дата</th>
                    <th className="py-2 px-4 font-bold">Валюта</th>
                    <th className="py-2 px-3 text-right font-bold">Курс сделки</th>
                    <th className="py-2 px-4 text-right font-bold">Справ. ст-ть (ЦБ) руб.</th>
                    <th className="py-2 px-4 text-center font-bold">Оценка рыночности</th>
                    <th className="py-2 px-4 text-right font-bold border-r border-line-soft">Откл. сумма тыс. руб.</th>
                    
                    {/* Visual 5 separation empty columns collapsed into 1 spacer for display density */}
                    {showZone2 && (
                      <>
                        <th className="py-2 px-2 bg-on-surface-fixed-variant border-r border-line text-center italic text-on-surface-variant opacity-60">5 разд. столб.</th>
                        
                        {/* Zone 2 Headers */}
                        <th className="py-2 px-3 font-bold bg-[#ecf2fa]">Спот-курс (ЦБ/НКЦ)</th>
                        <th className="py-2 px-3 font-bold bg-[#ecf2fa]">Своп-разн. (сделка / рын)</th>
                        <th className="py-2 px-2 font-bold bg-[#ecf2fa]">Срок (T дн)</th>
                        <th className="py-2 px-3 font-bold bg-[#ecf2fa]">Ставки (r1 / r2)</th>
                        <th className="py-2 px-3 font-bold bg-[#ecf2fa]">DF1 / DF2 (дисконт-комп.)</th>
                        <th className="py-2 px-3 font-bold bg-[#ecf2fa]">Параметры купона / НКД</th>
                        <th className="py-2 px-3 font-bold bg-[#ecf2fa]">Контроль суммы 1 & 2</th>
                        <th className="py-2 px-3 font-bold bg-[#ecf2fa]">Дисконт REPO (сделка / НКЦ)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft text-[12px] font-medium text-on-surface tabular-nums">
                  {filteredEvaluated.map((res) => {
                    const orig = activeDeals.find(d => d.id === res.dealId);
                    if (!orig) return null;

                    const isOffMarket = res.isMarket !== 'В рынке';

                    return (
                      <tr key={res.dealId} className="hover:bg-surface-container-low transition-colors">
                        {/* ZONA 1 FIELDS */}
                        <td className="py-2.5 px-4 font-bold text-primary font-mono">{orig.id}</td>
                        <td className="py-2.5 px-4 font-semibold text-on-surface-variant">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            orig.type === 'REPO' ? 'bg-[#5c4033]/12 text-[#5c4033]' :
                            orig.type === 'FORWARD' ? 'bg-secondary/12 text-secondary' :
                            orig.type === 'SWAP' ? 'bg-info/12 text-info' : 'bg-primary/12 text-primary'
                          }`}>{orig.type}</span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-on-surface-variant">{orig.settleDate}</td>
                        <td className="py-2.5 px-4 font-bold">{orig.currency}/RUB</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{(orig.rate || 0).toFixed(4)}</td>
                        <td className="py-2.5 px-4 text-right font-black text-primary">{(res.fairValueCbr).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                            isOffMarket ? 'bg-neg/15 text-neg' : 'bg-pos/15 text-pos'
                          }`}>
                            {res.isMarket}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-on-surface-variant border-r border-line-soft">
                          {Math.abs(res.deviationSwapPointsAbs || res.deviationScorePct).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                        </td>
                        
                        {/* Separation spacer column representing 5 separation empty columns from requirement */}
                        {showZone2 && (
                          <>
                            <td className="py-2.5 bg-surface-container-low border-r border-line"></td>
                            
                            {/* ZONA 2 DETAILED VARIABLE FIELDS */}
                            <td className="py-2.5 px-3 bg-[#ecf2fa]/40">
                              <div className="flex flex-col text-[10.5px] font-semibold">
                                <span>ЦБ: <strong className="text-on-surface font-semibold">{res.spotCbr}</strong></span>
                                <span>НКЦ: <strong className="text-on-surface font-semibold">{res.spotCcp}</strong></span>
                                <span className="text-[9.5px] text-on-surface-variant">MOEX: {res.spotMin}-{res.spotMax}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 bg-[#ecf2fa]/40">
                              <div className="flex flex-col text-[10.5px] font-semibold">
                                {orig.type === 'SWAP' ? (
                                  <>
                                    <span>Сделка: <strong className="text-on-surface font-semibold">{(res.swapPointsDeal || 0).toFixed(4)}</strong></span>
                                    <span>Справ.: <strong className="text-on-surface font-semibold">{(res.swapPointsTheo || 0).toFixed(4)}</strong></span>
                                  </>
                                ) : orig.type === 'FORWARD' ? (
                                  <>
                                    <span>Форвард: <strong className="text-on-surface font-semibold">{(res.forwardDeal || 0).toFixed(4)}</strong></span>
                                    <span>Расч.: <strong className="text-on-surface font-semibold">{(res.forwardTheo || 0).toFixed(4)}</strong></span>
                                  </>
                                ) : (
                                  <span className="text-on-surface-variant">-</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 bg-[#ecf2fa]/40 text-center font-bold">{res.termDays} дн</td>
                            <td className="py-2.5 px-3 bg-[#ecf2fa]/40">
                              <div className="flex flex-col text-[10.5px] font-semibold text-on-surface-variant">
                                <span>r1 (RUB): <strong className="text-primary font-semibold">{res.r1.toFixed(3)}%</strong></span>
                                <span>r2 ({orig.currency}): <strong className="text-secondary font-semibold">{res.r2.toFixed(3)}%</strong></span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 bg-[#ecf2fa]/40">
                              <div className="flex flex-col text-[10.5px] font-mono leading-none py-0.5">
                                <span>DF1: {res.df1.toFixed(6)}</span>
                                <span className="mt-1">DF2: {res.df2.toFixed(6)}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 bg-[#ecf2fa]/40">
                              {orig.type === 'REPO' ? (
                                <div className="flex flex-col text-[10.5px] font-semibold">
                                  <span>НКД: <strong className="text-on-surface font-semibold">{orig.leg1Date ? 'Да' : 'Нет'}</strong></span>
                                  <span>Номинал: 1,000</span>
                                </div>
                              ) : (
                                <span className="text-on-surface-variant">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 bg-[#ecf2fa]/40">
                              {orig.type === 'REPO' ? (
                                <div className="flex flex-col text-[10.5px] font-semibold">
                                  <span>Ч.1 (сумма): <strong className={res.k1_control ? "text-pos font-semibold" : "text-neg font-semibold"}>{res.k1_control ? "Совпал" : "Ошибка"}</strong></span>
                                  <span>Ч.2 (с НКД): <strong className={res.k2_control ? "text-pos font-semibold" : "text-neg font-semibold"}>{res.k2_control ? "Пройден" : "Несовп"}</strong></span>
                                </div>
                              ) : (
                                <span className="text-on-surface-variant">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 bg-[#ecf2fa]/40">
                              {orig.type === 'REPO' ? (
                                <div className="flex flex-col text-[10.5px] font-semibold">
                                  <span>Расчетн: <strong className="text-on-surface font-semibold">{(res.discountDeal_repo || 0).toFixed(1)}%</strong></span>
                                  <span>Норма НКЦ: <strong className="text-on-surface font-semibold">{(res.discountNkc_repo || 0).toFixed(1)}%</strong></span>
                                </div>
                              ) : (
                                <span className="text-on-surface-variant">-</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODE: SEMI-AUTOMATIC */}
      {appMode === 'SEMI_AUTO' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* File Upload Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Deals Registry */}
            <div 
              onClick={() => dealsFileRef.current?.click()}
              className="border-2 border-dashed border-line hover:border-primary-container-variant bg-surface-light hover:bg-surface-container rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
            >
              <Upload className="w-10 h-10 text-primary mb-3" />
              <h3 className="font-sans text-xs font-bold text-on-surface">Импортировать реестр сделок (Excel)</h3>
              <p className="font-sans text-[10.5px] text-on-surface-variant mt-1 leading-normal">Загрузите реестр сделок по шаблону программы.<br />(Поддержка CSV/XLSX)</p>
              <input 
                type="file" 
                ref={dealsFileRef} 
                onChange={handleDealsUploadSim} 
                className="hidden" 
              />
              {dealsFileUploaded && (
                <span className="mt-3 inline-flex items-center gap-1.5 bg-pos/10 text-pos text-[11px] font-bold px-2 py-0.5 rounded">
                  <Check className="w-3.5 h-3.5" /> Файл сделок подключен!
                </span>
              )}
            </div>

            {/* Box 2: Curves / Zero Rates */}
            <div 
              onClick={() => pricingFileRef.current?.click()}
              className="border-2 border-dashed border-line hover:border-primary-container-variant bg-surface-light hover:bg-surface-container rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
            >
              <FileText className="w-10 h-10 text-secondary mb-3" />
              <h3 className="font-sans text-xs font-bold text-on-surface">Загрузить рыночные котировки и кривые (Excel)</h3>
              <p className="font-sans text-[10.5px] text-on-surface-variant mt-1 leading-normal">Листы curve, fx_rate и swap_points_fwd.<br />(Котировки на дату оценки)</p>
              <input 
                type="file" 
                ref={pricingFileRef} 
                onChange={handlePricingUploadSim} 
                className="hidden" 
              />
              {pricingFileUploaded && (
                <span className="mt-3 inline-flex items-center gap-1.5 bg-pos/10 text-pos text-[11px] font-bold px-2 py-0.5 rounded">
                  <Check className="w-3.5 h-3.5" /> Файл котировок подключен!
                </span>
              )}
            </div>
          </div>

          {/* Validation Errors Panel */}
          {validationErrors.length > 0 && (
            <div className="bg-neg/10 border border-neg/20 rounded-lg p-4 flex flex-col gap-3 font-sans text-xs font-bold text-neg">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-neg" /> Обнаружено {validationErrors.length} расхождений в структуре шаблонов Excel!</span>
                <button 
                  onClick={fixValidationErrorsSim} 
                  className="bg-neg text-[#ffebed] px-3.5 py-1.5 rounded-md hover:opacity-90 transition-all cursor-pointer text-[11.5px]"
                >
                  Исправить авто-маппингом
                </button>
              </div>
              <ul className="list-disc pl-5 font-semibold text-on-surface-variant space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {isValidationSuccess && (
            <div className="bg-pos/10 border border-pos/20 rounded-lg p-4 flex items-center gap-2.5 font-sans text-xs font-bold text-pos leading-relaxed">
              <Check className="w-5 h-5" />
              <span>Данные успешно загружены и отвалидированы! Все структуры маппинга столбцов "curve", "fx_rate" корректны. Запущен автоматический пересчет справедливой стоимости.</span>
            </div>
          )}

          {/* Collaborative Grid with Hand-Editing Cell Mode */}
          <div className="bg-surface-light rounded-lg border border-line-soft p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-sans text-sm font-bold text-on-surface">Интерактивный реестр (Кликните по показателю для ручной корректировки)</h3>
              <span className="text-[11px] font-bold text-primary italic">Все правки цен/ставок мгновенно пересчитывают PV и логируются.</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-sans text-xs font-semibold tabular-nums border-collapse">
                <thead className="bg-surface-container-low text-[10.5px] uppercase tracking-wider text-on-surface-variant border-b border-line">
                  <tr>
                    <th className="py-2.5 px-4">Deal ID</th>
                    <th className="py-2.5 px-4">Контрагент</th>
                    <th className="py-2.5 px-3">Котируемая Валюта</th>
                    <th className="py-2.5 px-3 text-right">Номинал</th>
                    <th className="py-2.5 px-3 text-right">Ручной курс (Deal Rate)</th>
                    <th className="py-2.5 px-4 text-right">Расчетный PV (тыс. руб.)</th>
                    <th className="py-2.5 px-4 text-center">Оценка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft font-medium text-on-surface">
                  {filteredEvaluated.map(res => {
                    const orig = activeDeals.find(d => d.id === res.dealId);
                    if (!orig) return null;

                    return (
                      <tr key={res.dealId} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-4 font-bold text-primary font-mono">{orig.id}</td>
                        <td className="py-3 px-4">{orig.counterparty}</td>
                        <td className="py-3 px-3 font-semibold text-on-surface-variant">{orig.currency}/RUB</td>
                        
                        {/* Interactive Edit Nominal Cell */}
                        <td className="py-3 px-3 text-right cursor-pointer hover:bg-yellow-50/50" onClick={() => setEditingCell({ dealId: orig.id, field: 'buyAmt', value: String(orig.buyAmt) })}>
                          {editingCell?.dealId === orig.id && editingCell?.field === 'buyAmt' ? (
                            <input 
                              type="text" 
                              autoFocus 
                              defaultValue={orig.buyAmt} 
                              onBlur={(e) => handleCellEditSubmit(orig.id, 'buyAmt', e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCellEditSubmit(orig.id, 'buyAmt', (e.target as any).value)}
                              className="border border-primary rounded p-1 text-right w-24 text-[11.5px] font-bold font-mono"
                            />
                          ) : (
                            <span className="flex items-center justify-end gap-1 font-mono text-primary font-bold">
                              {orig.buyAmt?.toLocaleString()} <Edit2 className="w-3 h-3 text-on-surface-variant opacity-40 shrink-0" />
                            </span>
                          )}
                        </td>

                        {/* Interactive Edit Rate Cell */}
                        <td className="py-3 px-3 text-right cursor-pointer hover:bg-yellow-50/50" onClick={() => setEditingCell({ dealId: orig.id, field: 'rate', value: String(orig.rate) })}>
                          {editingCell?.dealId === orig.id && editingCell?.field === 'rate' ? (
                            <input 
                              type="text" 
                              autoFocus 
                              defaultValue={orig.rate} 
                              onBlur={(e) => handleCellEditSubmit(orig.id, 'rate', e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCellEditSubmit(orig.id, 'rate', (e.target as any).value)}
                              className="border border-primary rounded p-1 text-right w-20 text-[11.5px] font-bold font-mono"
                            />
                          ) : (
                            <span className="flex items-center justify-end gap-1 font-mono text-primary font-bold">
                              {(orig.rate || 0).toFixed(4)} <Edit2 className="w-3 h-3 text-on-surface-variant opacity-40 shrink-0" />
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-black text-primary">{(res.fairValueCbr).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                            res.isMarket === 'В рынке' ? 'bg-pos/15 text-pos' : 'bg-neg/15 text-neg'
                          }`}>
                            {res.isMarket}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Log representation (Section requirement) */}
          <div className="bg-surface-light rounded-lg border border-line-soft p-5">
            <div className="flex items-center justify-between mb-3.5 border-b border-line-soft pb-2.5">
              <h4 className="font-sans text-sm font-bold text-on-surface flex items-center gap-1.5"><History className="w-4 h-4 text-primary" /> История корректировок (Audit Compliance Log)</h4>
              <span className="font-sans text-[10px] text-on-surface-variant font-bold bg-[#ecf2fa] px-2 py-0.5 rounded">ЛОГ ЗАФИКСИРОВАН</span>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {auditLog.map(entry => (
                <div key={entry.id} className="p-3 bg-surface-container-low border border-line-soft rounded-md flex justify-between text-[11px] font-semibold text-on-surface-variant font-mono">
                  <div>
                    <span className="text-secondary">[{entry.timestamp}]</span> Изменение: <strong className="text-primary font-mono">{entry.field}</strong>: с "{entry.oldValue}" на "{entry.newValue}".
                  </div>
                  <div>
                    Пользователь: <strong className="text-on-surface font-mono">{entry.user}</strong>
                  </div>
                </div>
              ))}
              {auditLog.length === 0 && (
                <p className="text-center font-sans text-xs text-on-surface-variant py-4 italic">Ручных корректировок рыночных курсов или реестра сделок не проводилось.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODE: CALCULATOR */}
      {appMode === 'CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left panel: Interactive Form */}
          <div className="lg:col-span-5 bg-surface-light rounded-lg border border-line-soft shadow-sm p-5 flex flex-col gap-5">
            <h3 className="font-sans text-sm font-bold text-primary border-b border-line-soft pb-2.5 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-primary" /> Параметры сделки (Для быстрой оценки)
            </h3>

            {/* Selector: Instrument type */}
            <div className="flex flex-col gap-1.5 text-xs text-on-surface">
              <span className="font-bold text-on-surface-variant">Тип Оцениваемого Инструмента</span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-surface-container rounded border border-line-soft">
                {['SPOT', 'SWAP', 'FORWARD', 'REPO'].map(inst => (
                  <button
                    key={inst}
                    onClick={() => {
                      setCalcInstrument(inst as any);
                      // Clear results
                      setCalcResult(null);
                    }}
                    className={`py-1.5 rounded font-sans text-[9.5px] font-extrabold cursor-pointer transition-all ${
                      calcInstrument === inst
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            {/* Input fields based on instrument */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-on-surface">
              {/* Direction */}
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant">Направление</span>
                <select 
                  value={calcDirection} 
                  onChange={(e) => setCalcDirection(e.target.value as any)}
                  className="border border-line rounded h-8 px-2 bg-surface-bright text-xs focus:outline-none focus:border-primary"
                >
                  <option value="BUY">Покупка иностранной валюты</option>
                  <option value="SELL">Продажа иностранной валюты</option>
                </select>
              </div>

              {/* Currency Pair list */}
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant font-bold">Валютная пара (Базовый актив)</span>
                <select 
                  value={calcCurrency} 
                  onChange={(e) => setCalcCurrency(e.target.value as any)}
                  className="border border-line rounded h-8 px-2 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono font-bold"
                >
                  <option value="USD">USD/RUB</option>
                  <option value="EUR">EUR/RUB</option>
                  <option value="CNY">CNY/RUB</option>
                  <option value="GBP">GBP/RUB</option>
                </select>
              </div>

              {/* Nominal buy / sell amount */}
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant">Номинал (Notional) {calcCurrency}</span>
                <input 
                  type="number" 
                  value={calcNominal}
                  onChange={(e) => setCalcNominal(parseFloat(e.target.value) || 0)}
                  className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono"
                />
              </div>

              {/* Deal Execution Kurs */}
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant">Курс первой ноги (Deal Rate)</span>
                <input 
                  type="number" 
                  step="0.0001"
                  value={calcRate}
                  onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                  className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono"
                />
              </div>

              {/* Trade date */}
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant">Дата сделки</span>
                <input 
                  type="date" 
                  value={calcTradeDate}
                  onChange={(e) => setCalcTradeDate(e.target.value)}
                  className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary cursor-pointer font-mono"
                />
              </div>

              {/* Settle Date */}
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant">Дата второй ноги (Исполнения)</span>
                <input 
                  type="date" 
                  value={calcSettleDate}
                  onChange={(e) => calcSettleDateLeg2(e.target.value)}
                  className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary cursor-pointer font-mono"
                />
              </div>
            </div>

            {/* Instrument specific blocks */}
            {calcInstrument === 'SWAP' && (
              <div className="grid grid-cols-2 gap-4 border-t border-line-soft pt-4 text-xs font-semibold text-on-surface">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <span className="text-on-surface-variant font-bold">Своп-разница по сделке в валюте (Swap Points)</span>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={swapPointsValue}
                    onChange={(e) => setSwapPointsValue(parseFloat(e.target.value) || 0)}
                    className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono"
                  />
                  <span className="text-[10px] text-on-surface-variant leading-none font-semibold">Разница между второй и первой валютной ногой: {(calcRate + swapPointsValue).toFixed(4)}</span>
                </div>
              </div>
            )}

            {calcInstrument === 'REPO' && (
              <div className="grid grid-cols-2 gap-4 border-t border-line-soft pt-4 text-xs font-semibold text-on-surface">
                <div className="flex flex-col gap-1">
                  <span className="text-on-surface-variant">Код ISIN</span>
                  <input 
                    type="text" 
                    value={repoIsin}
                    onChange={(e) => setRepoIsin(e.target.value)}
                    className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-on-surface-variant">Предмет залога</span>
                  <input 
                    type="text" 
                    value={repoCollateral}
                    onChange={(e) => setRepoCollateral(e.target.value)}
                    className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary text-secondary"
                  />
                </div>
              </div>
            )}

            {/* Buttons area */}
            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={calculateSingleOption}
                className="flex-1 bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Calculator className="w-4 h-4" /> Рассчитать показатели
              </button>
              
              {calcResult && (
                <>
                  <button 
                    onClick={saveCalcToHistory}
                    title="Записать в журнал"
                    className="p-2.5 text-primary border border-line-soft hover:bg-surface-container rounded-lg cursor-pointer"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={pushCalcToSemiAuto}
                    title="Передать в реестр"
                    className="p-2.5 text-secondary border border-line-soft hover:bg-surface-container rounded-lg cursor-pointer flex items-center gap-1 italic text-[11px] font-bold"
                  >
                    Передать в реестр <Plus className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right panel: Step-by-Step interactive Calculations outputs (ZONA 1 & ZONA 2 variables) */}
          <div className="lg:col-span-7 bg-surface-light rounded-lg border border-line-soft shadow-sm p-5 flex flex-col gap-5">
            <h3 className="font-sans text-sm font-bold text-on-surface border-b border-line-soft pb-2.5 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-secondary" /> Логика пошагового расчета (Ревизия формул)
            </h3>

            {calcResult ? (
              <div className="flex flex-col gap-5 text-xs text-on-surface animate-fadeIn">
                {/* Out of Market warning if applicable */}
                <div className={`p-4 rounded-lg flex items-center gap-2.5 font-sans font-bold text-xs ${
                  calcResult.isMarket === 'В рынке' ? 'bg-pos/10 border border-pos/20 text-pos' : 'bg-neg/10 border border-neg/20 text-neg'
                }`}>
                  {calcResult.isMarket === 'В рынке' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>Оценка: {calcResult.isMarket === 'В рынке' ? 'Условия сделки соответствуют рыночному диапазону (В рамках толерантности)' : `Отклонение составляет ${calcResult.deviationScorePct.toFixed(2)}% от теоретической цены.`}</span>
                </div>

                {/* Grid view mapping Zona 1 and Zona 2 variables exactly from specifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Side: ZONA 1 (Primary Valuation Results) */}
                  <div className="bg-surface rounded-lg border border-line-soft p-4 flex flex-col gap-3">
                    <h4 className="font-sans text-[11px] font-extrabold text-[#0b2545] uppercase tracking-wider border-b border-line-soft pb-1.5 flex items-center gap-1 leading-none">
                      <FileText className="w-3.5 h-3.5" /> Зона 1 — Основной реестр
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-y-2 font-sans font-semibold text-on-surface-variant mt-1.5">
                      <span>Справедливая ст-ть (ЦБ)</span>
                      <span className="text-right font-black text-primary font-mono text-[13px]">{calcResult.fairValueCbr.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} тыс. ₽</span>
                      
                      <span>Нижняя граница (FV min)</span>
                      <span className="text-right font-bold text-on-surface font-mono">{calcResult.fairValueMin.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} тыс. ₽</span>
                      
                      <span>Верхняя граница (FV max)</span>
                      <span className="text-right font-bold text-on-surface font-mono">{calcResult.fairValueMax.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} тыс. ₽</span>
                    </div>
                  </div>

                  {/* Right Side: ZONA 2 (Calculation Indicators) */}
                  <div className="bg-[#ecf2fa]/25 rounded-lg border border-line-soft/80 p-4 flex flex-col gap-3">
                    <h4 className="font-sans text-[11px] font-extrabold text-[#365e9f] uppercase tracking-wider border-b border-line-soft pb-1.5 flex items-center gap-1 leading-none">
                      <Sparkles className="w-3.5 h-3.5" /> Зона 2 — Расчетные параметры
                    </h4>

                    <div className="grid grid-cols-2 gap-y-2 font-sans font-semibold text-on-surface-variant font-mono text-[11px] mt-1">
                      <span>Срок сделки (T)</span>
                      <span className="text-right text-on-surface font-bold">{calcResult.termDays} дней</span>
                      
                      <span>Ставка 1 (r1, RUB)</span>
                      <span className="text-right text-primary font-bold">{calcResult.r1.toFixed(4)}%</span>
                      
                      <span>Ставка 2 (r2, {calcCurrency})</span>
                      <span className="text-right text-secondary font-bold">{calcResult.r2.toFixed(4)}%</span>
                      
                      <span>Дисконт DF1 (RUB)</span>
                      <span className="text-right text-on-surface font-semibold">{calcResult.df1.toFixed(7)}</span>
                      
                      <span>Дисконт DF2 ({calcCurrency})</span>
                      <span className="text-right text-on-surface font-semibold">{calcResult.df2.toFixed(7)}</span>

                      {calcResult.swapPointsTheo !== undefined && (
                        <>
                          <span className="text-on-surface-variant font-sans col-span-2 border-t border-line-soft/60 my-1"></span>
                          <span>Своп-пункты (рын)</span>
                          <span className="text-right text-on-surface font-bold">{calcResult.swapPointsTheo.toFixed(4)}</span>
                        </>
                      )}

                      {calcResult.forwardTheo !== undefined && (
                        <>
                          <span className="text-on-surface-variant font-sans col-span-2 border-t border-line-soft/60 my-1"></span>
                          <span>Форвард курс (расч)</span>
                          <span className="text-right text-[#365e9f] font-bold">{calcResult.forwardTheo.toFixed(4)}</span>
                        </>
                      )}

                      {calcInstrument === 'REPO' && (
                        <>
                          <span className="text-on-surface-variant font-sans col-span-2 border-t border-line-soft/60 my-1"></span>
                          <span>RUSFAR ({calcResult.termDays}д):</span>
                          <span className="text-right text-on-surface font-bold">{calcResult.rusfarRate_repo}%</span>
                          
                          <span>Дисконт по сделке:</span>
                          <span className="text-right text-on-surface font-bold">{calcResult.discountDeal_repo?.toFixed(2)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mathematical Formula Preview block based on Instrument */}
                <div className="bg-surface-container-lowest border border-line-soft p-3.5 rounded-lg flex flex-col gap-1 font-mono text-[11.5px] leading-relaxed select-none">
                  <div className="text-on-surface-variant font-sans text-[10px] uppercase font-bold tracking-wider mb-1">Применяемая формула (Паритет ставок)</div>
                  {calcInstrument === 'SPOT' && (
                    <code className="text-primary leading-normal whitespace-pre-wrap">
                      FV = (DF2 * Notional * Spot - DF1 * RUB_Leg) / 1000
                    </code>
                  )}
                  {calcInstrument === 'FORWARD' && (
                    <code className="text-primary leading-normal whitespace-pre-wrap">
                      Теор. форвард F = Spot * (1 + {calcResult.r1.toFixed(3)}% * T/360) / (1 + {calcResult.r2.toFixed(3)}% * T/360) = {calcResult.forwardTheo?.toFixed(4)}
                    </code>
                  )}
                  {calcInstrument === 'SWAP' && (
                    <code className="text-[#365e9f] leading-normal whitespace-pre-wrap">
                      Своп-пункты = Spot * (r_rub - r_{calcCurrency.toLowerCase()}) * T / 360 / (1 + r_{calcCurrency.toLowerCase()} * T / 360) = {calcResult.swapPointsTheo?.toFixed(4)}
                    </code>
                  )}
                  {calcInstrument === 'REPO' && (
                    <code className="text-secondary leading-normal whitespace-pre-wrap text-[11px]">
                      Сумма Ч.2 = Ч.1 * (1 + Ставка_РЕПО% * Т / 360)
                    </code>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant font-sans text-xs gap-3">
                <Calculator className="w-12 h-12 text-on-surface-variant opacity-40 animate-pulse" />
                <p className="font-semibold leading-relaxed">Заполните параметры в форме слева и нажмите<br /> <strong className="text-primary">"Рассчитать показатели"</strong> для получения пошаговых шагов математической ревизии.</p>
              </div>
            )}

            {/* Calculator History Journal */}
            <div className="border-t border-line-soft mt-auto pt-4 flex flex-col gap-2">
              <span className="font-sans text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1"><History className="w-3.5 h-3.5" /> Последние записи в журнале калькулятора</span>
              
              <div className="max-h-24 overflow-y-auto space-y-1.5 font-mono text-[10px] font-semibold text-on-surface-variant text-left">
                {calculatorHistory.map((item, idx) => (
                  <div key={idx} className="p-2 bg-surface rounded border border-line-soft/80 flex justify-between">
                    <div>
                      <span className="text-secondary font-bold">[{item.timestamp}]</span> {item.id}: {item.type} {item.currency}/RUB {item.nominal.toLocaleString()}  (Курс {item.rate})
                    </div>
                    <div>
                      PV: <strong className="text-primary font-bold">{item.fairValueCbr.toFixed(1)} тыс ₽</strong> | {item.isMarket}
                    </div>
                  </div>
                ))}
                {calculatorHistory.length === 0 && (
                  <p className="font-sans text-xs italic text-on-surface-variant py-2">Журнал сессии пуст.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
