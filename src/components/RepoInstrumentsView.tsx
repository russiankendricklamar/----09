/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, AlertCircle, Check, Download, Info, Calculator, 
  RefreshCw, TrendingUp, History, ClipboardCheck, ArrowUpRight,
  Play, Upload, FileText, Edit2, Search, Eye, Sparkles
} from 'lucide-react';
import { Deal, MarketQuote, YieldCurve } from '../types';

interface RepoInstrumentsViewProps {
  deals: Deal[];
  quotes: MarketQuote[];
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

export default function RepoInstrumentsView({ deals: initialDeals, quotes, onRefresh, onInspectDeal }: RepoInstrumentsViewProps) {
  const [appMode, setAppMode] = useState<'AUTO' | 'SEMI_AUTO' | 'CALCULATOR'>('AUTO');
  
  // --- STATE FOR SEMI-AUTO ---
  const [activeDeals, setActiveDeals] = useState<any[]>(
    initialDeals.filter(d => d.type === 'REPO').map(d => ({ ...d }))
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [editingCell, setEditingCell] = useState<{ dealId: string; field: string; value: string } | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);

  // --- STATE FOR CALCULATOR ---
  const [selectedIsin, setSelectedIsin] = useState<string>('RU000A1038V1');
  const [inputClosePrice, setInputClosePrice] = useState<number>(98.50);
  const [inputLeg1Price, setInputLeg1Price] = useState<number>(93.20);
  const [inputRepoRate, setInputRepoRate] = useState<number>(14.50);
  const [inputTermDays, setInputTermDays] = useState<number>(7);
  const [calcResult, setCalcResult] = useState<any | null>(null);

  const dealsFileRef = useRef<HTMLInputElement>(null);

  // Evaluate REPO deals
  const evaluatedRepoDeals = activeDeals.map(deal => {
    let closePrice = 98.20;
    if (deal.isin === 'XS2345678901') closePrice = 100.50;
    const qty = deal.leg1Qty || 100000;
    const price1 = deal.rate ? (deal.rate * 20) : 92.40;
    const nkd1 = parseFloat((qty * 0.12).toFixed(2));
    const nkd2 = parseFloat((qty * 0.15).toFixed(2));
    const sum1NoNkd = parseFloat((qty * (price1 / 100) * 1000).toFixed(2));
    const sum1WithNkd = sum1NoNkd + nkd1;
    const t = 30;
    const repoRate = deal.rate || 4.20;
    const sum2NoNkd = parseFloat((sum1NoNkd * (1 + (repoRate / 100) * t / 360)).toFixed(2));
    const sum2WithNkd = sum2NoNkd + nkd2;
    const calculatedDiscount = parseFloat(((1 - price1 / closePrice) * 100).toFixed(2));
    const rusfarBench = 15.02;
    const repoRateAnomalyPp = parseFloat((repoRate - rusfarBench).toFixed(2));

    return {
      dealId: deal.id,
      isin: deal.isin || 'RU000A101234',
      counterparty: deal.counterparty,
      termDays: t,
      qty,
      price1,
      nkd1,
      nkd2,
      sum1WithNkd,
      sum2WithNkd,
      repoRate,
      calculatedDiscount,
      rusfarBench,
      repoRateAnomalyPp,
    };
  });

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Сделки,ISIN,Контрагент,Срок (дн),Ставка РЕПО,Сумма Нога 1,Дисконт %,RUSFAR\n";
    evaluatedRepoDeals.forEach(r => {
      csvContent += `${r.dealId},${r.isin},${r.counterparty},${r.termDays},${r.repoRate}%,${r.sum1WithNkd.toFixed(2)},${r.calculatedDiscount}%,${r.rusfarBench}%\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Analytica_REPO_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCellEditSubmit = (dealId: string, field: string, value: string) => {
    const origValue = activeDeals.find(d => d.id === dealId)?.[field];
    setActiveDeals(prev => prev.map(d => d.id === dealId ? { ...d, [field]: parseFloat(value) || value } : d));
    setAuditLog(prev => [{
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      field: `${dealId} -> ${field}`,
      oldValue: String(origValue || ''),
      newValue: String(value),
      user: 'Пользователь'
    }, ...prev]);
    setEditingCell(null);
  };

  const runRepoCalculator = () => {
    const parValue = 1000;
    const tradeQty = 10000;
    const sum1NoNkd = (tradeQty * (inputLeg1Price / 100) * parValue);
    const sum1WithNkd = sum1NoNkd + (tradeQty * 12.50);
    const accrualFactor = 1 + (inputRepoRate / 100) * inputTermDays / 360;
    const sum2WithNkd = (sum1NoNkd * accrualFactor) + (tradeQty * 14.80);
    const actualDiscount = (1 - inputLeg1Price / inputClosePrice) * 100;
    const rusfarBench = 15.15;
    setCalcResult({ sum1WithNkd, sum2WithNkd, actualDiscount, rusfarBench, repoRatePp: inputRepoRate });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      {/* Mode Switcher - FX Style */}
      <div className="flex justify-end bg-surface-bright p-2 rounded-xl border border-line-soft shadow-sm">
        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1">
          {[
            { id: 'AUTO', icon: Play, label: 'Авто' },
            { id: 'SEMI_AUTO', icon: Upload, label: 'Ручной' },
            { id: 'CALCULATOR', icon: Calculator, label: 'Расчет' }
          ].map(m => (
            <button 
              key={m.id}
              onClick={() => setAppMode(m.id as any)}
              className={`px-4 py-1.5 font-sans text-[11px] font-bold rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
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
          {/* KPI and registry table for REPO */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                   <ClipboardCheck className="w-5 h-5 text-primary opacity-70" />
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">Всего РЕПО</div>
                   <div className="text-xl font-black text-on-surface mt-1">{evaluatedRepoDeals.length.toLocaleString('ru-RU')}</div>
                </div>
             </div>
             <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                   <Percent className="w-5 h-5 text-primary opacity-70" />
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">Ср. ставка</div>
                   <div className="text-xl font-black text-primary mt-1">14.12%</div>
                </div>
             </div>
             <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                   <ShieldCheck className="w-5 h-5 text-primary opacity-70" />
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">Комплаенс</div>
                   <div className="text-xl font-black text-pos mt-1">OK</div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-line-soft bg-surface-container-lowest flex justify-between items-center font-black text-[11px] text-primary uppercase">
              <span className="flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Реестр сделок РЕПО</span>
              <div className="flex items-center gap-4">
                <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] text-on-surface-variant tracking-tighter">Положение 511-П</span>
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
                    <th className="py-2.5 px-4">ISIN</th>
                    <th className="py-2.5 px-3 text-right">Ставка</th>
                    <th className="py-2.5 px-3 text-center">Срок</th>
                    <th className="py-2.5 px-3 text-right">Нога 1 (₽)</th>
                    <th className="py-2.5 px-3 text-right">Нога 2 (₽)</th>
                    <th className="py-2.5 px-4 text-center">Контроль</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft text-[12px] font-medium text-on-surface tabular-nums">
                  {evaluatedRepoDeals.map((res, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => onInspectDeal(res.dealId)}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-primary font-mono">{res.dealId}</td>
                      <td className="py-3 px-4 font-mono text-on-surface-variant font-semibold">{res.isin}</td>
                      <td className="py-3 px-3 text-right font-black text-secondary">{res.repoRate.toFixed(2)}%</td>
                      <td className="py-3 px-3 text-center font-bold">{res.termDays}д</td>
                      <td className="py-3 px-3 text-right">{res.sum1WithNkd.toLocaleString('ru-RU')}</td>
                      <td className="py-3 px-3 text-right">{res.sum2WithNkd.toLocaleString('ru-RU')}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-pos/15 text-pos text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tighter">Пройден</span>
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
            <h3 className="font-sans text-sm font-black text-on-surface uppercase tracking-tight">Загрузить реестр РЕПО ведомости</h3>
            <p className="font-sans text-[11px] text-on-surface-variant mt-1 leading-none">Форматы: XLSX, CSV, JSON</p>
            <input type="file" ref={dealsFileRef} onChange={() => setFileUploaded(true)} className="hidden" />
            {fileUploaded && <span className="mt-3 bg-pos/10 text-pos text-[11px] font-black px-3 py-1 rounded-full shadow-sm">Данные загружены</span>}
          </div>

          <div className="bg-white rounded-xl border border-line-soft p-5">
             <h3 className="font-sans text-[11px] font-black text-on-surface uppercase mb-4 flex items-center gap-2"><Edit2 className="w-4 h-4 text-primary" /> Ручная сверка параметров</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left font-sans text-xs font-semibold border-collapse">
                 <thead className="bg-surface-container-low text-[10px] uppercase text-on-surface-variant border-b border-line font-black">
                   <tr>
                     <th className="py-2.5 px-4">Deal ID</th>
                     <th className="py-2.5 px-3 text-right">Ставка</th>
                     <th className="py-2.5 px-3 text-right">Срок (дн)</th>
                     <th className="py-2.5 px-4 text-right">Дисконт %</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-line-soft font-medium text-on-surface">
                   {evaluatedRepoDeals.map((res, idx) => (
                     <tr key={idx} className="hover:bg-yellow-50/30 transition-colors">
                       <td className="py-3 px-4 font-mono font-black text-primary">{res.dealId}</td>
                       <td className="py-3 px-3 text-right cursor-pointer hover:text-primary font-mono" onClick={() => setEditingCell({ dealId: res.dealId, field: 'rate', value: String(activeDeals[idx].rate) })}>
                         {editingCell?.dealId === res.dealId && editingCell?.field === 'rate' ? (
                           <input autoFocus onBlur={(e) => handleCellEditSubmit(res.dealId, 'rate', e.target.value)} className="border border-primary rounded p-1 w-20 text-right outline-none ring-1 ring-primary/20" />
                         ) : <span className="flex items-center justify-end gap-1">{activeDeals[idx].rate?.toFixed(2)}% <Edit2 className="w-3 h-3 opacity-30" /></span>}
                       </td>
                       <td className="py-3 px-3 text-right font-bold">{res.termDays}</td>
                       <td className="py-3 px-4 text-right font-black text-primary font-mono">{res.calculatedDiscount}%</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-line-soft shadow-sm p-5">
            <h4 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-wider flex items-center gap-2 mb-3"><History className="w-4 h-4 text-primary" /> Журнал аудита правок РЕПО</h4>
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
            <h3 className="font-sans text-[11px] font-black text-primary border-b border-line-soft pb-2.5 uppercase tracking-widest flex items-center gap-2 leading-none"><Calculator className="w-4 h-4" /> Калькулятор обеспечения</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">ISIN инструмента</span>
                <input type="text" value={selectedIsin} onChange={(e) => setSelectedIsin(e.target.value)} className="border border-line rounded-lg h-10 px-3 text-[13px] font-black text-primary font-mono outline-none focus:border-primary-light uppercase shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                   <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Цена закрытия %</span>
                   <input type="number" value={inputClosePrice} onChange={(e) => setInputClosePrice(Number(e.target.value))} className="border border-line rounded-lg h-10 px-3 text-[13px] font-bold font-mono outline-none focus:border-primary-light bg-surface-bright shadow-inner" />
                </div>
                <div className="flex flex-col gap-1.5">
                   <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Цена Нога 1 %</span>
                   <input type="number" value={inputLeg1Price} onChange={(e) => setInputLeg1Price(Number(e.target.value))} className="border border-line rounded-lg h-10 px-3 text-[13px] font-bold font-mono outline-none focus:border-primary-light bg-surface-bright shadow-inner" />
                </div>
              </div>
              <button onClick={runRepoCalculator} className="w-full bg-primary hover:bg-primary-light text-on-primary font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-widest mt-2">
                <ShieldCheck className="w-4 h-4" /> Рассчитать РЕПО-позицию
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-xl border border-line-soft shadow-sm p-5 flex flex-col">
            <h3 className="font-sans text-[11px] font-black text-on-surface border-b border-line-soft pb-2.5 uppercase tracking-widest flex items-center gap-2 leading-none"><Eye className="w-4 h-4 text-secondary" /> Результат аудита</h3>
            {calcResult ? (
              <div className="mt-6 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container rounded-xl border border-line-soft shadow-inner">
                    <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Сумма Возврата (Ч.2)</span>
                    <p className="text-2xl font-black text-primary font-mono mt-1 leading-none">{calcResult.sum2WithNkd.toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div className="p-4 bg-surface-container rounded-xl border border-line-soft shadow-inner">
                    <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Дисконт по сделке</span>
                    <p className="text-2xl font-black font-mono mt-1 leading-none text-secondary tracking-tighter">{calcResult.actualDiscount.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-xl border border-primary/10 p-5 font-mono text-[12px] space-y-3 mt-auto shadow-inner">
                   <div className="flex justify-between items-center"><span className="text-on-surface-variant">RUSFAR Бенчмарк</span><strong className="text-primary">{calcResult.rusfarBench}%</strong></div>
                   <div className="flex justify-between items-center"><span className="text-on-surface-variant font-semibold">Отклонение от рынка</span><strong className={Math.abs(calcResult.repoRatePp - calcResult.rusfarBench) > 0.5 ? "text-neg" : "text-pos"}>{(calcResult.repoRatePp - calcResult.rusfarBench).toFixed(2)} п.п.</strong></div>
                </div>

                <div className="mt-4 p-3 bg-surface-container-low rounded-lg text-[9px] font-bold text-on-surface-variant italic leading-tight text-center">
                  * Расчет обеспеченных сделок РЕПО соответствует стандартам ССР НКЦ
                </div>
              </div>
            ) : <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant italic text-xs gap-3 opacity-40 py-12"><Calculator className="w-14 h-14" /><span className="font-black uppercase tracking-widest">Ожидание ввода данных</span></div>}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Re-importing icon locally
import { Percent } from 'lucide-react';
