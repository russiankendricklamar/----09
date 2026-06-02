/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, ArrowLeftRight, HelpCircle, Download, Check, AlertCircle,
  Calculator, ReceiptText, RefreshCw, BarChart2, ShieldCheck, Play,
  Upload, FileText, Edit2, History, Search, Eye, Sparkles
} from 'lucide-react';
import { Deal, MarketQuote, YieldCurve } from '../types';
import { evaluateDerivativeDeal, ValuationResult, interpolateRate, calculateDF } from '../utils/valuationMath';

interface FxDerivativesViewProps {
  deals: Deal[];
  quotes: MarketQuote[];
  curves: YieldCurve[];
  onRefresh: () => void;
  onInspectDeal: (id: string) => void;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
  user: string;
}

type FxInstrumentType = 'СПОТ' | 'СВОП' | 'ФОРВАРД' | 'ФЬЮЧЕРС';

const typeMapping: Record<FxInstrumentType, string> = {
  'СПОТ': 'SPOT',
  'СВОП': 'SWAP',
  'ФОРВАРД': 'FORWARD',
  'ФЬЮЧЕРС': 'FUTURES'
};

export default function FxDerivativesView({ deals: initialDeals, quotes, curves, onRefresh, onInspectDeal }: FxDerivativesViewProps) {
  const [appMode, setAppMode] = useState<'AUTO' | 'SEMI_AUTO' | 'CALCULATOR'>('AUTO');
  const [fxSubTab, setFxSubTab] = useState<FxInstrumentType>('СПОТ');
  const [selectedSource, setSelectedSource] = useState<'MOEX' | 'Cbonds'>('MOEX');
  
  // --- STATE FOR SEMI-AUTO ---
  const [activeDeals, setActiveDeals] = useState<any[]>(
    initialDeals.map(d => ({
      ...d,
      rate: d.rate || 94.52,
      buyAmt: d.buyAmt || 1000000,
      sellAmt: d.sellAmt || 95420000,
      buyCcy: d.buyCcy || d.currency,
      sellCcy: d.sellCcy || 'RUB'
    }))
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [editingCell, setEditingCell] = useState<{ dealId: string; field: string; value: string } | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);

  // --- STATE FOR CALCULATOR ---
  const [calcBase, setCalcBase] = useState<'USD' | 'EUR' | 'CNY' | 'GBP'>('USD');
  const [calcDir, setCalcDir] = useState<'BUY' | 'SELL'>('BUY');
  const [calcNominal, setCalcNominal] = useState<number>(1000000);
  const [calcRate, setCalcRate] = useState<number>(93.45);
  const [calcDays, setCalcDays] = useState<number>(30);
  const [calcResult, setCalcResult] = useState<any | null>(null);

  const dealsFileRef = useRef<HTMLInputElement>(null);

  // Filter deals for the active sub-instrument
  const fxDeals = activeDeals.filter(d => d.type === typeMapping[fxSubTab]);

  // Evaluate with our formula logic engine
  const evaluated = fxDeals.map(deal => {
    return evaluateDerivativeDeal(deal, curves, selectedSource === 'MOEX' ? 'MOEX' : 'REUTERS');
  });

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Сделки,Тип,Валюта,Дата расчетов,Номинал,Курс сделки,Справедливая стоимость ЦБ (тыс. руб),Оценка рыночности,Отклонение (%)\n";
    
    evaluated.forEach(r => {
      const d = activeDeals.find(x => x.id === r.dealId);
      if (d) {
        csvContent += `${d.id},${d.type},${d.currency}/RUB,${d.settleDate},${d.buyAmt},${d.rate},${r.fairValueCbr.toFixed(2)},${r.isMarket},${r.deviationScorePct.toFixed(4)}%\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Analytica_FX_${fxSubTab}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCellEditSubmit = (dealId: string, field: string, value: string) => {
    const origValue = activeDeals.find(d => d.id === dealId)?.[field];
    const parsedVal = (field === 'rate' || field === 'buyAmt') ? parseFloat(value) : value;

    if (isNaN(parsedVal as any) && (field === 'rate' || field === 'buyAmt')) {
      setEditingCell(null);
      return;
    }

    setAuditLog(prev => [{
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      field: `${dealId} -> ${field}`,
      oldValue: String(origValue || ''),
      newValue: String(value),
      user: 'Пользователь'
    }, ...prev]);

    setActiveDeals(prev => prev.map(d => d.id === dealId ? { ...d, [field]: parsedVal } : d));
    setEditingCell(null);
  };

  const runCalculator = () => {
    let spot = 93.42;
    if (calcBase === 'EUR') spot = 99.13;
    if (calcBase === 'CNY') spot = 12.75;
    if (calcBase === 'GBP') spot = 114.22;

    const curvesMap = {
      domestic: curves.find(c => c.currency === 'RUB') || curves[0],
      foreign: curves.find(c => c.currency === calcBase) || curves[0]
    };

    const { r: r1 } = interpolateRate(calcDays, curvesMap.domestic);
    const { r: r2 } = interpolateRate(calcDays, curvesMap.foreign);
    const df1 = calculateDF(r1, calcDays);
    const df2 = calculateDF(r2, calcDays);

    let theoreticalFwd = spot * (1 + (r1 / 100) * calcDays / 360) / (1 + (r2 / 100) * calcDays / 360);
    let theoreticalSwapPoints = spot * ((r1 - r2) / 100) * (calcDays / 360) / (1 + (r2 / 100) * (calcDays / 360));

    const foreignAmt = calcNominal;
    const localAmt = calcNominal * calcRate;
    let fv = calcDir === 'BUY' ? (df2 * foreignAmt * spot - df1 * localAmt) / 1000 : (df1 * localAmt - df2 * foreignAmt * spot) / 1000;

    setCalcResult({ spot, r1, r2, df1, df2, theoreticalFwd, theoreticalSwapPoints, fv });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      {/* Compact Header Row: Subtabs + Mode Switcher */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-surface-bright p-2 rounded-xl border border-line-soft shadow-sm">
        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1">
          {(['СПОТ', 'СВОП', 'ФОРВАРД', 'ФЬЮЧЕРС'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setFxSubTab(tab);
                setCalcResult(null);
              }}
              className={`px-4 py-1.5 font-sans text-[11px] font-black rounded-md cursor-pointer transition-all ${
                fxSubTab === tab ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1">
          {[
            { id: 'AUTO', icon: Play, label: 'Авто' },
            { id: 'SEMI_AUTO', icon: Upload, label: 'Ручной' },
            { id: 'CALCULATOR', icon: Calculator, label: 'Расчет' }
          ].map(m => (
            <button 
              key={m.id}
              onClick={() => setAppMode(m.id as any)}
              className={`px-3 py-1.5 font-sans text-[11px] font-bold rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                appMode === m.id ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <m.icon className="w-3.5 h-3.5" /> {m.label}
            </button>
          ))}
        </div>
      </div>

      {appMode === 'AUTO' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* KPI stats (compact) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <ReceiptText className="w-5 h-5 text-primary opacity-70" />
               </div>
               <div>
                  <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">Сделок</div>
                  <div className="text-xl font-black text-on-surface mt-1">{fxDeals.length}</div>
               </div>
            </div>
            <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-primary opacity-70" />
               </div>
               <div>
                  <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">Объем (ПРВ)</div>
                  <div className="text-xl font-black text-on-surface mt-1">₽ {(evaluated.reduce((acc, r) => acc + Math.abs(r.fairValueCbr), 0) / 1000).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M</div>
               </div>
            </div>
            <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary opacity-70" />
               </div>
               <div>
                  <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">Статус</div>
                  <div className="text-xl font-black text-pos mt-1">ОК</div>
               </div>
            </div>
          </div>

          {/* Registry Table */}
          <div className="bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-line-soft bg-surface-container-lowest flex justify-between items-center">
              <span className="font-sans text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                <ReceiptText className="w-4 h-4" /> Реестр {fxSubTab}-сделок
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Источник:</span>
                  <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value as any)} className="border border-line rounded-lg bg-surface-bright font-bold py-1 px-2 h-7 text-[11px] focus:ring-0">
                    <option value="MOEX">MOEX</option>
                    <option value="Cbonds">Cbonds</option>
                  </select>
                </div>
                <button 
                  onClick={handleExportCSV}
                  className="p-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer shadow-xs"
                  title="Экспорт в Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-surface-container-low text-[10px] font-black text-on-surface-variant border-b border-line-soft uppercase tracking-wider">
                    <th className="py-2.5 px-4">Код</th>
                    <th className="py-2.5 px-4">Контрагент</th>
                    <th className="py-2.5 px-4">Валюта</th>
                    <th className="py-2.5 px-3 text-right">Объем</th>
                    <th className="py-2.5 px-3 text-right">Курс</th>
                    <th className="py-2.5 px-4 text-right text-primary">PV (ЦБ) руб.</th>
                    <th className="py-2.5 px-4 text-center">Оценка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft text-[12px] font-medium text-on-surface tabular-nums">
                  {evaluated.map((res, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => onInspectDeal(res.dealId)}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-primary font-mono">{res.dealId}</td>
                      <td className="py-3 px-4 text-on-surface-variant font-semibold">{fxDeals[idx].counterparty}</td>
                      <td className="py-3 px-4 font-bold">{fxDeals[idx].currency}/RUB</td>
                      <td className="py-3 px-3 text-right">{fxDeals[idx].buyAmt.toLocaleString('ru-RU')}</td>
                      <td className="py-3 px-3 text-right">{fxDeals[idx].rate.toFixed(4)}</td>
                      <td className="py-3 px-4 text-right font-black text-primary">{res.fairValueCbr.toLocaleString('ru-RU')}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black ${res.isMarket === 'В рынке' ? 'bg-pos/15 text-pos' : 'bg-neg/15 text-neg'}`}>
                          {res.isMarket}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {appMode === 'SEMI_AUTO' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          <div onClick={() => dealsFileRef.current?.click()} className="border-2 border-dashed border-line hover:border-primary bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
            <div className="p-4 bg-primary/5 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-sans text-sm font-black text-on-surface uppercase tracking-tight">Загрузить реестр {fxSubTab} сделок</h3>
            <p className="font-sans text-[11px] text-on-surface-variant mt-1">Форматы: XLSX, CSV, JSON</p>
            <input type="file" ref={dealsFileRef} onChange={() => setFileUploaded(true)} className="hidden" />
            {fileUploaded && <span className="mt-3 inline-flex items-center gap-1.5 bg-pos/10 text-pos text-[11px] font-black px-3 py-1 rounded-full shadow-sm">Файл успешно загружен</span>}
          </div>

          <div className="bg-white rounded-xl border border-line-soft shadow-sm p-5">
            <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2"><Edit2 className="w-4 h-4 text-primary" /> Редактирование параметров</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs font-semibold tabular-nums border-collapse">
                <thead className="bg-surface-container-low text-[10px] uppercase text-on-surface-variant border-b border-line font-black">
                  <tr>
                    <th className="py-2.5 px-4">ID</th>
                    <th className="py-2.5 px-4">Контрагент</th>
                    <th className="py-2.5 px-3 text-right">Объем</th>
                    <th className="py-2.5 px-3 text-right">Курс</th>
                    <th className="py-2.5 px-4 text-right">Расчетный PV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft font-medium text-on-surface">
                  {evaluated.map((res, idx) => (
                    <tr key={idx} className="hover:bg-yellow-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-primary">{res.dealId}</td>
                      <td className="py-3 px-4 font-semibold">{fxDeals[idx].counterparty}</td>
                      <td className="py-3 px-3 text-right cursor-pointer hover:text-primary transition-colors font-mono" onClick={() => setEditingCell({ dealId: res.dealId, field: 'buyAmt', value: String(fxDeals[idx].buyAmt) })}>
                        {editingCell?.dealId === res.dealId && editingCell?.field === 'buyAmt' ? (
                          <input autoFocus onBlur={(e) => handleCellEditSubmit(res.dealId, 'buyAmt', e.target.value)} className="border border-primary rounded p-1 w-24 text-right outline-none ring-1 ring-primary/20" />
                        ) : <span className="flex items-center justify-end gap-1.5">{fxDeals[idx].buyAmt.toLocaleString()} <Edit2 className="w-3 h-3 opacity-30" /></span>}
                      </td>
                      <td className="py-3 px-3 text-right cursor-pointer hover:text-primary transition-colors font-mono" onClick={() => setEditingCell({ dealId: res.dealId, field: 'rate', value: String(fxDeals[idx].rate) })}>
                        {editingCell?.dealId === res.dealId && editingCell?.field === 'rate' ? (
                          <input autoFocus onBlur={(e) => handleCellEditSubmit(res.dealId, 'rate', e.target.value)} className="border border-primary rounded p-1 w-20 text-right outline-none ring-1 ring-primary/20" />
                        ) : <span className="flex items-center justify-end gap-1.5">{fxDeals[idx].rate.toFixed(4)} <Edit2 className="w-3 h-3 opacity-30" /></span>}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-primary font-mono">{res.fairValueCbr.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-line-soft shadow-sm p-5">
            <h4 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-wider flex items-center gap-2 mb-3"><History className="w-4 h-4 text-primary" /> Журнал аудита правок</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {auditLog.map(entry => (
                <div key={entry.id} className="p-2.5 bg-surface-container-low border border-line-soft rounded-lg flex justify-between text-[11px] font-mono leading-tight">
                  <span className="text-on-surface-variant font-semibold"><span className="text-secondary">[{entry.timestamp}]</span> {entry.field}: {entry.oldValue} → <strong className="text-primary">{entry.newValue}</strong></span>
                  <span className="font-black text-[10px] text-primary bg-white px-2 py-0.5 rounded shadow-sm uppercase">{entry.user}</span>
                </div>
              ))}
              {auditLog.length === 0 && <p className="text-center text-on-surface-variant italic py-4 text-xs font-semibold">История изменений пуста.</p>}
            </div>
          </div>
        </div>
      )}

      {appMode === 'CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fadeIn">
          <div className="lg:col-span-5 bg-white rounded-xl border border-line-soft shadow-sm p-5 flex flex-col gap-5">
            <h3 className="font-sans text-xs font-black text-primary border-b border-line-soft pb-2.5 flex items-center gap-2 uppercase tracking-widest"><Calculator className="w-4 h-4" /> Ввод параметров сделки</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Базовая валютная пара</span>
                <select value={calcBase} onChange={(e) => setCalcBase(e.target.value as any)} className="border border-line rounded-lg h-10 px-3 bg-surface-bright text-[13px] font-black text-primary outline-none focus:border-primary-light">
                  <option value="USD">USD / RUB</option><option value="EUR">EUR / RUB</option><option value="CNY">CNY / RUB</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Направление</span>
                  <select value={calcDir} onChange={(e) => setCalcDir(e.target.value as any)} className="border border-line rounded-lg h-10 px-3 text-[13px] font-bold outline-none focus:border-primary-light">
                    <option value="BUY">Покупка</option><option value="SELL">Продажа</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Срок T (дни)</span>
                  <input type="number" value={calcDays} onChange={(e) => setCalcDays(Number(e.target.value))} className="border border-line rounded-lg h-10 px-3 text-[13px] font-bold font-mono outline-none focus:border-primary-light" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Номинал</span>
                  <input type="number" value={calcNominal} onChange={(e) => setCalcNominal(Number(e.target.value))} className="border border-line rounded-lg h-10 px-3 text-[13px] font-black font-mono text-primary outline-none focus:border-primary-light" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Курс сделки</span>
                  <input type="number" step="0.0001" value={calcRate} onChange={(e) => setCalcRate(Number(e.target.value))} className="border border-line rounded-lg h-10 px-3 text-[13px] font-black font-mono text-primary outline-none focus:border-primary-light" />
                </div>
              </div>
              <button onClick={runCalculator} className="w-full bg-primary hover:bg-primary-light text-on-primary font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-widest mt-2">
                <Play className="w-4 h-4" /> Рассчитать показатели
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-xl border border-line-soft shadow-sm p-5 flex flex-col">
            <h3 className="font-sans text-xs font-black text-on-surface border-b border-line-soft pb-2.5 flex items-center gap-2 uppercase tracking-widest"><Eye className="w-4 h-4 text-secondary" /> Математическая ревизия</h3>
            {calcResult ? (
              <div className="mt-6 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container rounded-xl border border-line-soft shadow-inner">
                    <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Теор. Форвард (F)</span>
                    <p className="text-2xl font-black text-primary font-mono mt-1 leading-none">{calcResult.theoreticalFwd.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-surface-container rounded-xl border border-line-soft shadow-inner">
                    <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Оценка ЦБ (PV)</span>
                    <p className={`text-2xl font-black font-mono mt-1 leading-none ${calcResult.fv >= 0 ? 'text-pos' : 'text-neg'}`}>₽ {calcResult.fv.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} </p>
                  </div>
                </div>
                
                <div className="bg-primary/5 rounded-xl border border-primary/10 p-5 font-mono text-[12px] space-y-3 mt-auto">
                  <div className="flex justify-between items-center"><span className="text-on-surface-variant">Ставка r1 (RUB)</span><strong className="text-primary">{calcResult.r1.toFixed(4)}%</strong></div>
                  <div className="flex justify-between items-center"><span className="text-on-surface-variant">Ставка r2 ({calcBase})</span><strong className="text-secondary">{calcResult.r2.toFixed(4)}%</strong></div>
                  <div className="w-full border-t border-line-soft opacity-40 my-1"></div>
                  <div className="flex justify-between items-center"><span className="text-on-surface-variant">Дисконт-фактор RUB (DF1)</span><strong className="text-on-surface">{calcResult.df1.toFixed(7)}</strong></div>
                  <div className="flex justify-between items-center"><span className="text-on-surface-variant">Дисконт-фактор {calcBase} (DF2)</span><strong className="text-on-surface">{calcResult.df2.toFixed(7)}</strong></div>
                </div>

                <div className="mt-4 p-3 bg-surface-container-low rounded-lg text-[9px] font-bold text-on-surface-variant italic leading-tight text-center">
                  * Расчет произведен на основе паритета процентных ставок согласно внутренним регламентам
                </div>
              </div>
            ) : <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant italic text-xs gap-3 opacity-40"><Calculator className="w-14 h-14" /><span className="font-bold uppercase tracking-widest">Ожидание ввода параметров</span></div>}
          </div>
        </div>
      )}
    </motion.div>
  );
}
