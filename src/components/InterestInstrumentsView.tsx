/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, RefreshCw, Check, AlertCircle,
  Play, Upload, Edit2, History, Search, Eye, Sparkles, Percent,
  ChevronRight, ReceiptText, Calculator, GitCommit, Activity, TableCellsSplit
} from 'lucide-react';
import { Deal, YieldCurve } from '../types';
import { interpolateRate, calculateDF, TENOR_DAYS } from '../utils/valuationMath';

interface InterestInstrumentsViewProps {
  deals: Deal[];
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

type InterestSubTab = 'IRS' | 'FRA' | 'CURVES';

export default function InterestInstrumentsView({ deals: initialDeals, curves, onRefresh, onInspectDeal }: InterestInstrumentsViewProps) {
  const [appMode, setAppMode] = useState<'AUTO' | 'SEMI_AUTO' | 'CALCULATOR'>('AUTO');
  const [subTab, setSubTab] = useState<InterestSubTab>('IRS');
  
  // --- STATE FOR SEMI-AUTO ---
  const [activeDeals, setActiveDeals] = useState<any[]>(
    initialDeals.filter(d => d.type === 'IRS').map(d => ({ ...d }))
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [editingCell, setEditingCell] = useState<{ dealId: string; field: string; value: string } | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);

  // --- STATE FOR CALCULATOR ---
  const [selectedCurveId, setSelectedCurveId] = useState<string>(curves[0]?.id || 'RUB_KEY_OIS');
  const [calcTermDays, setCalcTermDays] = useState<number>(45);
  const [interpolationMath, setInterpolationMath] = useState<any | null>(null);

  const dealsFileRef = useRef<HTMLInputElement>(null);
  const activeCurve = curves.find(c => c.id === selectedCurveId) || curves[0];

  // Mock FRA Data
  const fraDeals = [
    { id: 'FRA-2023-5001', counterparty: 'Банк ВТБ (ПАО)', currency: 'RUB', term: '3x6', rate: 15.45, pv: 125000 },
    { id: 'FRA-2023-5002', counterparty: 'ПАО Сбербанк', currency: 'RUB', term: '6x9', rate: 14.80, pv: -45000 },
  ];

  const handleInterpolate = () => {
    if (!activeCurve) return;
    const result = interpolateRate(calcTermDays, activeCurve);
    const df = calculateDF(result.r, calcTermDays);
    setInterpolationMath({
      term: calcTermDays,
      curveName: activeCurve.id,
      interpolatedRate: result.r,
      df,
      lowNode: { tenor: result.tenorMin, days: TENOR_DAYS[result.tenorMin] || 1, rate: result.rMin },
      highNode: { tenor: result.tenorMax, days: TENOR_DAYS[result.tenorMax] || 360, rate: result.rMax }
    });
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      {/* Compact Header Row: Subtabs + Mode Switcher (NO ICONS) */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-surface-bright p-2 rounded-xl border border-line-soft shadow-sm">
        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1">
          {[
            { id: 'IRS', label: 'СВОПЫ (IRS)' },
            { id: 'FRA', label: 'FRA СОГЛАШЕНИЯ' },
            { id: 'CURVES', label: 'КРИВЫЕ OIS' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSubTab(tab.id as InterestSubTab);
                setInterpolationMath(null);
              }}
              className={`px-4 py-1.5 font-sans text-[11px] font-black rounded-md cursor-pointer transition-all ${
                subTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1">
          {[
            { id: 'AUTO', label: 'АВТО' },
            { id: 'SEMI_AUTO', label: 'РУЧНОЙ' },
            { id: 'CALCULATOR', label: 'РАСЧЕТ' }
          ].map(m => (
            <button 
              key={m.id}
              onClick={() => setAppMode(m.id as any)}
              className={`px-4 py-1.5 font-sans text-[11px] font-bold rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                appMode === m.id ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {appMode === 'AUTO' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* KPI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">{subTab === 'IRS' ? 'Контракты' : subTab === 'FRA' ? 'Сделки FRA' : 'Узлы'}</div>
                <div className="text-xl font-black text-on-surface mt-1">{subTab === 'IRS' ? activeDeals.length : subTab === 'FRA' ? fraDeals.length : activeCurve.nodes.length}</div>
             </div>
             <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">Ср. ставка</div>
                <div className="text-xl font-black text-primary mt-1">16.25%</div>
             </div>
             <div className="bg-white rounded-xl border border-line-soft p-4 shadow-sm flex flex-col justify-center">
                <div className="text-[10px] font-black uppercase text-on-surface-variant leading-none">Лимиты</div>
                <div className="text-xl font-black text-on-surface mt-1">ОК</div>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-line-soft bg-surface-container-lowest flex justify-between items-center font-black text-[11px] text-primary uppercase">
              <span>
                {subTab === 'IRS' && 'Реестр процентных свопов (IRS)'}
                {subTab === 'FRA' && 'Реестр соглашений FRA'}
                {subTab === 'CURVES' && 'Таблица узлов кривых'}
              </span>
              <div className="flex items-center gap-4">
                <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] text-on-surface-variant tracking-tighter uppercase">ЦБ РФ / ММВБ</span>
                <button 
                  className="p-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer shadow-xs"
                  title="Экспорт в Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto w-full">
              {subTab === 'IRS' && (
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-surface-container-low text-[10px] font-black text-on-surface-variant border-b border-line-soft uppercase">
                      <th className="py-2.5 px-4">Договор</th>
                      <th className="py-2.5 px-4">Контрагент</th>
                      <th className="py-2.5 px-4">Номинал</th>
                      <th className="py-2.5 px-3">Нога 1 (Fix)</th>
                      <th className="py-2.5 px-3">Нога 2 (Float)</th>
                      <th className="py-2.5 px-3 text-right">Ставка</th>
                      <th className="py-2.5 px-4 text-right text-primary">PV (руб.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft text-[12px] font-medium text-on-surface tabular-nums">
                    {activeDeals.map(deal => (
                      <tr 
                        key={deal.id} 
                        onClick={() => onInspectDeal(deal.id)}
                        className="hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-bold text-primary font-mono">{deal.id}</td>
                        <td className="py-3 px-4 font-semibold">{deal.counterparty}</td>
                        <td className="py-3 px-4 font-mono">{(deal.buyAmt || 10000000).toLocaleString('ru-RU')} {deal.currency}</td>
                        <td className="py-3 px-3"><span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black uppercase">{deal.leg1Type}</span></td>
                        <td className="py-3 px-3"><span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] font-black uppercase">{deal.leg2Type}</span></td>
                        <td className="py-3 px-3 text-right font-black text-secondary">{deal.rate?.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-right font-black text-primary font-mono">{(deal.pv).toLocaleString('ru-RU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {subTab === 'FRA' && (
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-surface-container-low text-[10px] font-black text-on-surface-variant border-b border-line-soft uppercase">
                      <th className="py-2.5 px-4">ID Сделки</th>
                      <th className="py-2.5 px-4">Контрагент</th>
                      <th className="py-2.5 px-4">Валюта</th>
                      <th className="py-2.5 px-4">Период (Tenor)</th>
                      <th className="py-2.5 px-4 text-right">Ставка FRA %</th>
                      <th className="py-2.5 px-4 text-right text-primary">Справ. ст-ть (₽)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft text-[12px] font-medium text-on-surface tabular-nums">
                    {fraDeals.map(fra => (
                      <tr 
                        key={fra.id} 
                        onClick={() => onInspectDeal(fra.id)}
                        className="hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-bold text-primary font-mono">{fra.id}</td>
                        <td className="py-3 px-4 font-semibold">{fra.counterparty}</td>
                        <td className="py-3 px-4 font-mono">{fra.currency}</td>
                        <td className="py-3 px-4 font-bold">{fra.term}</td>
                        <td className="py-3 px-4 text-right font-black text-secondary">{fra.rate.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-right font-black text-primary">{fra.pv.toLocaleString('ru-RU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {subTab === 'CURVES' && (
                <div className="p-4 flex flex-col gap-4">
                   <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-on-surface-variant uppercase">Выбор кривой:</span>
                      <select value={selectedCurveId} onChange={e => setSelectedCurveId(e.target.value)} className="border border-line rounded-lg px-3 h-8 bg-surface-bright text-[11px] font-black text-primary outline-none">
                         {curves.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                      </select>
                   </div>
                   <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low text-[10px] font-black text-on-surface-variant border-b border-line-soft uppercase">
                      <tr><th className="py-2 px-4">Срок (Tenor)</th><th className="py-2 px-4">Дата узла</th><th className="py-2 px-4 text-right">Ставка %</th><th className="py-2 px-4 text-right">Дисконт (DF)</th></tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft text-[12px] font-medium text-on-surface tabular-nums">
                      {activeCurve.nodes.map((node, i) => (
                        <tr key={i} className="hover:bg-primary/5">
                          <td className="py-2 px-4 font-bold text-primary">{node.tenor}</td>
                          <td className="py-2 px-4 text-on-surface-variant">{node.date}</td>
                          <td className="py-2 px-4 text-right font-black text-secondary">{node.rate.toFixed(4)}%</td>
                          <td className="py-2 px-4 text-right font-mono text-on-surface-variant">{node.df.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
              )}
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
            <h3 className="font-sans text-sm font-black text-on-surface uppercase tracking-tight">Загрузить реестр {subTab}</h3>
            <p className="font-sans text-[11px] text-on-surface-variant mt-1 leading-none">Форматы: XLSX, CSV, JSON</p>
            <input type="file" ref={dealsFileRef} onChange={() => setFileUploaded(true)} className="hidden" />
            {fileUploaded && <span className="mt-3 bg-pos/10 text-pos text-[11px] font-black px-3 py-1 rounded-full shadow-sm">Данные загружены</span>}
          </div>

          <div className="bg-white rounded-xl border border-line-soft shadow-sm p-5">
             <h3 className="font-sans text-[11px] font-black text-on-surface uppercase mb-4">Корректировка параметров</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left font-sans text-xs font-semibold border-collapse">
                 <thead className="bg-surface-container-low text-[10px] uppercase text-on-surface-variant border-b border-line font-black">
                   <tr><th className="py-2.5 px-4">Deal ID</th><th className="py-2.5 px-3 text-right">Ставка %</th><th className="py-2.5 px-4 text-right">Расчетный PV (₽)</th></tr>
                 </thead>
                 <tbody className="divide-y divide-line-soft font-medium text-on-surface">
                   {(subTab === 'IRS' ? activeDeals : []).map((deal, idx) => (
                     <tr key={idx} className="hover:bg-yellow-50/30 transition-colors">
                       <td className="py-3 px-4 font-mono font-black text-primary">{deal.id}</td>
                       <td className="py-3 px-3 text-right cursor-pointer hover:text-primary font-mono" onClick={() => setEditingCell({ dealId: deal.id, field: 'rate', value: String(deal.rate) })}>
                         {editingCell?.dealId === deal.id && editingCell?.field === 'rate' ? (
                           <input autoFocus onBlur={(e) => handleCellEditSubmit(deal.id, 'rate', e.target.value)} className="border border-primary rounded p-1 w-20 text-right outline-none ring-1 ring-primary/20" />
                         ) : <span className="flex items-center justify-end gap-1">{deal.rate?.toFixed(2)}% <Edit2 className="w-3 h-3 opacity-30" /></span>}
                       </td>
                       <td className="py-3 px-4 text-right font-black text-primary font-mono">{deal.pv.toLocaleString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {appMode === 'CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fadeIn">
          <div className="lg:col-span-5 bg-white rounded-xl border border-line-soft shadow-sm p-5 flex flex-col gap-5 text-on-surface">
            <h3 className="font-sans text-[11px] font-black text-primary border-b border-line-soft pb-2.5 uppercase tracking-widest flex items-center gap-2 leading-none">Параметры интерполяции</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Кривая OIS</span>
                <select value={selectedCurveId} onChange={(e) => setSelectedCurveId(e.target.value)} className="border border-line rounded-lg h-10 px-3 bg-surface-bright text-[13px] font-black text-primary outline-none focus:border-primary-light shadow-inner">
                  {curves.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">Целевой срок (дней)</span>
                 <input type="range" min="1" max="360" value={calcTermDays} onChange={(e) => setCalcTermDays(Number(e.target.value))} className="accent-primary cursor-pointer w-full mt-2" />
                 <div className="flex justify-between font-black text-[10px] text-primary mt-1"><span>1д</span><span className="bg-primary/10 px-2 py-0.5 rounded font-mono">{calcTermDays} дней</span><span>360д</span></div>
              </div>
              <button onClick={handleInterpolate} className="w-full bg-primary hover:bg-primary-light text-on-primary font-black py-3 rounded-xl text-xs transition-all uppercase tracking-widest mt-2">
                Вычислить теоретическую ставку
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-xl border border-line-soft shadow-sm p-5 flex flex-col">
            <h3 className="font-sans text-[11px] font-black text-on-surface border-b border-line-soft pb-2.5 uppercase tracking-widest leading-none">Результат вычислений</h3>
            {interpolationMath ? (
              <div className="mt-6 flex-1 flex flex-col justify-between">
                <div className="p-5 bg-surface-container rounded-xl border border-line-soft shadow-inner flex justify-between items-center">
                   <div>
                     <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Теор. ставка</span>
                     <p className="text-3xl font-black text-primary font-mono mt-1 leading-none">{interpolationMath.interpolatedRate.toFixed(4)}%</p>
                   </div>
                   <div className="text-right">
                     <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Коэф. DF</span>
                     <p className="text-xl font-black text-secondary font-mono mt-1 leading-none">{interpolationMath.df.toFixed(7)}</p>
                   </div>
                </div>
                <div className="bg-primary/5 rounded-xl border border-primary/10 p-5 font-mono text-[11px] space-y-3 mt-4 shadow-inner">
                   <div className="flex justify-between italic text-on-surface-variant"><span>Грань T_low:</span><span>{interpolationMath.lowNode.days}д ({interpolationMath.lowNode.rate}%)</span></div>
                   <div className="flex justify-between italic text-on-surface-variant"><span>Грань T_high:</span><span>{interpolationMath.highNode.days}д ({interpolationMath.highNode.rate}%)</span></div>
                </div>
              </div>
            ) : <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant italic text-xs gap-3 opacity-40 py-12"><span>Ожидание ввода параметров для расчета матрицы</span></div>}
          </div>
        </div>
      )}
    </motion.div>
  );
}
