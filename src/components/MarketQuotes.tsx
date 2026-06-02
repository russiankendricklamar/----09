/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, RefreshCw, Filter, Search, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, CircleDot, BarChart2
} from 'lucide-react';
import { MarketQuote, YieldCurve } from '../types';

interface MarketQuotesProps {
  quotes: MarketQuote[];
  curves: YieldCurve[];
  onRefresh: () => void;
}

type MarketTabType = 'CCY' | 'BONDS' | 'EQUITIES' | 'INDICES' | 'CURVES';

export default function MarketQuotes({ quotes, curves, onRefresh }: MarketQuotesProps) {
  const [activeSubTab, setActiveSubTab] = useState<MarketTabType>('CCY');
  
  // Filtering and sources state
  const [sourceFilter, setSourceFilter] = useState<'All' | 'MOEX' | 'REUTERS' | 'BLOOMBERG'>('All');
  const [dateFilter, setDateFilter] = useState('Today');
  const [pairFilterQuery, setPairFilterQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Yield curve sub selection
  const [selectedCurveId, setSelectedCurveId] = useState<string>('USD_S23_OIS');

  // Trigger loading animation on refresh icon clicked
  const handleRefreshClick = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onRefresh();
    }, 500);
  };

  // Quotes filters
  const filteredQuotes = quotes.filter((q) => {
    if (sourceFilter !== 'All' && q.source !== sourceFilter) return false;
    if (pairFilterQuery && !q.id.toLowerCase().includes(pairFilterQuery.toLowerCase())) return false;
    return true;
  });

  const selectedCurve = curves.find(c => c.id === selectedCurveId) || curves[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      {/* Compact Header Row: Tabs (Standardized Style) */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-surface-bright p-2 rounded-xl border border-line-soft shadow-sm">
        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1 flex-wrap">
          {[
            { label: 'ВАЛЮТНЫЕ ПАРЫ', value: 'CCY' },
            { label: 'КРИВЫЕ ДОХОДНОСТИ', value: 'CURVES' },
            { label: 'ОБЛИГАЦИИ', value: 'BONDS' },
            { label: 'АКЦИИ', value: 'EQUITIES' },
            { label: 'ИНДЕКСЫ', value: 'INDICES' },
          ].map((subTab) => (
            <button
              key={subTab.value}
              onClick={() => setActiveSubTab(subTab.value as any)}
              className={`px-4 py-1.5 rounded-md font-sans text-[11px] font-black cursor-pointer transition-all ${
                activeSubTab === subTab.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {subTab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pr-2">
            <div className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Шлюз: MOEX-FIX</div>
            <button 
              onClick={handleRefreshClick}
              className="p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* Render subtab contents dynamically */}
      {activeSubTab === 'CCY' ? (
        /* CCY Pairs quotes tab */
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* Refined Filter Toolbar */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-line-soft flex flex-wrap items-center gap-4">
            <div className="relative w-48 group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Фильтр валюты..."
                value={pairFilterQuery}
                onChange={(e) => setPairFilterQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 bg-surface-bright border border-line-soft rounded-lg text-[11px] font-sans focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="w-px h-6 bg-line-soft"></div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Источник:</span>
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="h-8 border border-line-soft rounded-lg bg-surface-bright text-[11px] font-bold px-2 pr-6 cursor-pointer focus:ring-0"
              >
                <option value="All">Все источники</option>
                <option value="MOEX">MOEX</option>
                <option value="REUTERS">Reuters</option>
                <option value="BLOOMBERG">Bloomberg</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Дата:</span>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-8 border border-line-soft rounded-lg bg-surface-bright text-[11px] font-bold px-2 pr-6 cursor-pointer focus:ring-0"
              >
                <option value="Today">Сегодня</option>
                <option value="T-1">Вчера (T-1)</option>
                <option value="Historical">Архив</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setPairFilterQuery(''); setSourceFilter('All'); setDateFilter('Today');
              }}
              className="ml-auto text-[10px] font-black text-primary hover:underline cursor-pointer uppercase tracking-widest"
            >
              Сбросить
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-line-soft flex flex-col flex-1 overflow-hidden">
            <div className="overflow-x-auto w-full p-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-surface-container-low border-b border-line-soft text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Базовая валюта</th>
                    <th className="py-2.5 px-4">Локальная валюта</th>
                    <th className="py-2.5 px-4 text-center">Источник</th>
                    <th className="py-2.5 px-4 text-right">Покупка (Bid)</th>
                    <th className="py-2.5 px-4 text-right">Продажа (Ask)</th>
                    <th className="py-2.5 px-4 text-right">Минимум</th>
                    <th className="py-2.5 px-4 text-right">Максимум</th>
                    <th className="py-2.5 px-4 text-right text-primary">Последний</th>
                    <th className="py-2.5 px-4 text-right">Спред (б.п.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft font-sans text-[13px] font-semibold text-on-surface tabular-nums">
                  {filteredQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-primary/5 transition-colors duration-150">
                      <td className="py-3 px-4 font-black text-primary">{q.foreign}</td>
                      <td className="py-3 px-4 text-on-surface-variant font-bold">{q.local}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-surface-container text-primary text-[10px] font-black uppercase tracking-widest border border-line-soft shadow-xs">
                          {q.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-on-surface">{q.bid.toFixed(4)}</td>
                      <td className="py-3 px-4 text-right font-bold text-on-surface">{q.ask.toFixed(4)}</td>
                      <td className="py-3 px-4 text-right text-on-surface-variant font-medium opacity-60">{q.low.toFixed(4)}</td>
                      <td className="py-3 px-4 text-right text-on-surface-variant font-medium opacity-60">{q.high.toFixed(4)}</td>
                      <td className="py-3 px-4 text-right font-black text-on-surface bg-primary/5 border-l border-r border-primary/5">{q.last.toFixed(4)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className={`flex items-center justify-end gap-1 font-black ${q.trend === 'up' ? 'text-pos' : q.trend === 'down' ? 'text-neg' : 'text-on-surface-variant'}`}>
                          {q.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : q.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                          {q.spreadBps.toFixed(1)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'CURVES' ? (
        /* Yield Curves subtab */
        <div className="flex flex-col lg:flex-row gap-5 animate-fadeIn">
          {/* Left list of curves */}
          <div className="w-full lg:w-[280px] bg-white border border-line-soft rounded-xl shadow-sm flex flex-col shrink-0 overflow-hidden">
            <div className="px-4 py-3 bg-surface-container-lowest border-b border-line-soft font-sans text-[11px] font-black text-primary uppercase tracking-widest">
              Список кривых OIS
            </div>
            <div className="p-2 space-y-1">
              {curves.map(curve => (
                <button
                  key={curve.id}
                  onClick={() => setSelectedCurveId(curve.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg font-sans text-[12px] text-left transition-all cursor-pointer ${
                    selectedCurveId === curve.id
                      ? 'bg-primary text-on-primary font-black shadow-md'
                      : 'hover:bg-primary/5 text-on-surface-variant hover:text-primary font-bold'
                  }`}
                >
                  <span className="font-mono">{curve.id}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${curve.status === 'Live' ? (selectedCurveId === curve.id ? 'bg-white' : 'bg-pos') : 'bg-warn'}`}></span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Area: Metadata & Nodes list */}
          <div className="flex-1 flex flex-col gap-5">
            
            {/* Interactive metadata specifications */}
            <div className="bg-white border border-line-soft rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-sans text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                   Спецификация {selectedCurve.id}
                </h3>
                <p className="font-sans text-[10px] text-on-surface-variant font-bold uppercase opacity-60">Алгоритм: {selectedCurve.buildProcedure}</p>
              </div>
              
              <div className="flex flex-wrap gap-3 text-[11px] font-black text-on-surface uppercase">
                <div className="bg-surface-container px-3 py-1.5 rounded-lg border border-line-soft shadow-xs">
                  <span className="text-on-surface-variant opacity-60 mr-2">Интерп:</span> {selectedCurve.interpolation}
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded-lg border border-line-soft shadow-xs">
                  <span className="text-on-surface-variant opacity-60 mr-2">Экстрап:</span> {selectedCurve.extrapolation}
                </div>
              </div>
            </div>

            {/* Zero Curve Nodes table */}
            <div className="bg-white border border-line-soft rounded-xl shadow-sm flex flex-col overflow-hidden text-on-surface">
              <div className="px-5 py-3 bg-surface-container-lowest border-b border-line-soft font-sans text-[11px] font-black text-primary uppercase tracking-widest">
                Узлы кривой котировок (Nodes)
              </div>
              <div className="overflow-x-auto w-full p-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low text-[10px] font-black text-on-surface-variant border-b border-line-soft uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Срок (Tenor)</th>
                      <th className="py-2.5 px-4">Дата погашения</th>
                      <th className="py-2.5 px-4 text-right">Ставка %</th>
                      <th className="py-2.5 px-4 text-right text-primary">Дисконт (DF)</th>
                      <th className="py-2.5 px-4">Инструмент-источник</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans text-[13px] font-semibold divide-y divide-line-soft tabular-nums">
                    {selectedCurve.nodes.map((node) => (
                      <tr key={node.tenor} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3 px-4 text-primary font-black">{node.tenor}</td>
                        <td className="py-3 px-4 text-on-surface-variant font-bold opacity-60">{node.date}</td>
                        <td className="py-3 px-4 text-right text-on-surface font-black">{node.rate.toFixed(4)}%</td>
                        <td className="py-3 px-4 text-right font-mono text-primary font-black bg-primary/5">{node.df.toFixed(6)}</td>
                        <td className="py-3 px-4 text-on-surface-variant font-bold opacity-60 uppercase text-[11px]">{node.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Mock tabs rendering simply */
        <div className="bg-white border border-line-soft p-20 text-center rounded-xl text-on-surface font-sans flex flex-col items-center gap-4 animate-fadeIn shadow-sm">
          <CircleDot className="w-10 h-10 text-primary opacity-20 animate-pulse" />
          <div>
            <div className="font-black text-sm uppercase tracking-widest text-primary">Справочник {activeSubTab}</div>
            <p className="text-[11px] font-bold text-on-surface-variant mt-2 uppercase opacity-60">Данные в процессе обработки MOEX шлюзом...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
