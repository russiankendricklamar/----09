/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, RefreshCw, Download, 
  CheckCircle, AlertTriangle, Landmark, ReceiptText, MoreVertical,
  ChevronRight, Clock
} from 'lucide-react';
import { Deal, MarketQuote, YieldCurve } from '../types';

interface OverviewProps {
  deals: Deal[];
  quotes: MarketQuote[];
  curves: YieldCurve[];
  onNavigate: (tab: any) => void;
  onRefresh: () => void;
  onInspectDeal: (id: string) => void;
}

export default function Overview({ deals, quotes, curves, onNavigate, onRefresh, onInspectDeal }: OverviewProps) {
  const [selectedCcyCurve, setSelectedCcyCurve] = useState<'RUB' | 'USD' | 'EUR' | 'CNY'>('RUB');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate stats
  const totalDealsCount = deals.length;
  const verifiedDeals = deals.filter(d => d.status === 'Verified').length;
  const conformityPercentage = totalDealsCount > 0 ? ((verifiedDeals / totalDealsCount) * 100).toFixed(1) : '0';
  const offMarketDeals = deals.filter(d => d.deltaToMarket > 1.0 || d.status === 'Failed' || d.id === 'FX-2023-1003');
  const totalVolumeRUB = deals.reduce((acc, d) => acc + (d.pv || 0), 0);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onRefresh();
    }, 600);
  };

  const activeCurve = curves.find(c => c.currency === selectedCcyCurve) || curves[0];
  const ticks = ['16.0%', '12.0%', '8.0%', '4.0%', '0.0%'];
  const pointsCurrent = activeCurve.nodes.map((node, i) => ({
    x: (i / (activeCurve.nodes.length - 1)) * 1000,
    y: 90 - (node.rate / 16.0) * 80
  }));
  const pathCurrent = pointsCurrent.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5">
      {/* KPI Cards (Very compact row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-line-soft shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0"><ReceiptText className="w-5 h-5 text-primary opacity-70" /></div>
          <div><div className="text-[10px] font-black uppercase text-on-surface-variant">Всего сделок</div><div className="text-xl font-black text-on-surface mt-0.5">{totalDealsCount.toLocaleString('ru-RU')}</div></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-line-soft shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pos/5 flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-pos opacity-70" /></div>
          <div><div className="text-[10px] font-black uppercase text-on-surface-variant">Соответствие</div><div className="text-xl font-black text-on-surface mt-0.5">{conformityPercentage}%</div></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-line-soft shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neg/5 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-neg opacity-70" /></div>
          <div><div className="text-[10px] font-black uppercase text-on-surface-variant">Вне рынка</div><div className="text-xl font-black text-neg mt-0.5">{offMarketDeals.length}</div></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-line-soft shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0"><Landmark className="w-5 h-5 text-primary opacity-70" /></div>
          <div><div className="text-[10px] font-black uppercase text-on-surface-variant">Взвеш. PV</div><div className="text-xl font-black text-on-surface mt-0.5">₽{(totalVolumeRUB / 1000).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Market Indicators Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-line-soft flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-sans text-[11px] font-black text-on-surface uppercase">Анализ соответствия ПФИ</h3>
            <button onClick={handleRefreshClick} className="p-1 hover:bg-surface-container rounded transition-all"><RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low text-[10px] font-black uppercase text-on-surface-variant border-b border-line-soft">
                <tr><th className="py-2 px-5">Инструмент</th><th className="py-2 px-5 text-right">Сделок</th><th className="py-2 px-5 text-right">Объем</th><th className="py-2 px-5">Статус</th></tr>
              </thead>
              <tbody className="text-[12px] font-semibold divide-y divide-line-soft tabular-nums">
                {['FX SPOT', 'FX SWAP', 'FX FORWARD', 'REPO', 'IRS'].map((type, i) => (
                  <tr key={i} className="hover:bg-primary/5 cursor-pointer" onClick={() => onNavigate('fx_derivatives')}>
                    <td className="py-2.5 px-5 font-bold text-primary">{type}</td>
                    <td className="py-2.5 px-5 text-right">{(100 + i * 42).toLocaleString('ru-RU')}</td>
                    <td className="py-2.5 px-5 text-right">{(45200 + i * 15000).toLocaleString('ru-RU')}M</td>
                    <td className="py-2.5 px-5"><div className="w-24 h-1.5 bg-line-soft rounded-full overflow-hidden"><div className="h-full bg-pos" style={{ width: `${99 - i * 2}%` }}></div></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mini Chart Area */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden flex flex-col p-4">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-wider leading-none">Кривые доходности (OIS)</h3>
              <div className="flex bg-surface-container p-0.5 rounded border border-line-soft gap-1">
                {['RUB', 'USD', 'CNY'].map(c => <button key={c} onClick={() => setSelectedCcyCurve(c as any)} className={`px-2 py-0.5 rounded font-black text-[9px] ${selectedCcyCurve === c ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}>{c}</button>)}
              </div>
           </div>
           <div className="h-40 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <path d={pathCurrent} fill="none" stroke="#0088BB" strokeWidth="2.5" />
              </svg>
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] font-black text-on-surface-variant opacity-50">
                 {ticks.map(t => <span key={t}>{t}</span>)}
              </div>
           </div>
        </div>
      </div>

      {/* Full width exceptions block */}
      <div className="bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-line-soft bg-surface-container-lowest flex justify-between items-center">
          <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-wider">Критические исключения ({offMarketDeals.length})</h3>
        </div>
        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {offMarketDeals.map(d => (
            <div key={d.id} className="p-3 rounded-lg bg-neg/5 border border-neg/10 flex justify-between items-center group hover:bg-neg/10 transition-all cursor-pointer" onClick={() => onInspectDeal(d.id)}>
              <div>
                <div className="text-[11px] font-black text-neg uppercase tracking-tight">{d.id} • {d.type}</div>
                <div className="text-[10px] font-bold text-on-surface-variant mt-0.5">Отклонение: <strong className="text-neg">+{d.deltaToMarket.toFixed(2)}%</strong></div>
              </div>
              <ChevronRight className="w-4 h-4 text-neg opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
