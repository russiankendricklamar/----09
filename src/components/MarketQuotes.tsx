/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, RefreshCw, Plus, Filter, Search, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, ArrowRightLeft, CircleDot, Info, Calendar, BarChart2
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
      className="flex flex-col gap-6"
    >
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-line-soft pb-4">
        <div>
          <h2 className="font-sans text-xl font-bold tracking-tight text-primary">Рыночные данные (Market Quotes)</h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1">
            Агрегированные котировки в режиме реального времени по зарегистрированным торговым площадкам.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-line-soft rounded bg-surface-bright hover:bg-surface-container flex items-center gap-1.5 font-sans text-xs font-semibold text-primary transition-colors cursor-pointer shadow-sm">
            <Download className="w-3.5 h-3.5" /> Экспорт CSV
          </button>
          <button className="px-3 py-1.5 border-none rounded bg-primary text-on-primary hover:bg-primary-container flex items-center gap-1.5 font-sans text-xs font-semibold transition-colors cursor-pointer shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Alert-монитор
          </button>
        </div>
      </div>

      {/* Segmented Control (Tabs) */}
      <div className="inline-flex p-[4px] bg-surface-container-low rounded border border-line-soft self-start gap-1">
        {[
          { label: 'CCY Pairs', value: 'CCY' },
          { label: 'Yield Curves', value: 'CURVES' },
          { label: 'Bonds', value: 'BONDS' },
          { label: 'Equities', value: 'EQUITIES' },
          { label: 'Indices', value: 'INDICES' },
        ].map((subTab) => (
          <button
            key={subTab.value}
            onClick={() => setActiveSubTab(subTab.value as any)}
            className={`px-4 py-1.5 rounded font-sans text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === subTab.value
                ? 'bg-surface-light shadow-[0_1px_2px_rgba(11,37,69,.08)] text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {subTab.label}
          </button>
        ))}
      </div>

      {/* Render subtab contents dynamically */}
      {activeSubTab === 'CCY' ? (
        /* CCY Pairs quotes tab */
        <div className="bg-surface-bright rounded shadow-[0_1px_2px_rgba(11,37,69,.05)] border border-line-soft flex flex-col flex-1 overflow-hidden">
          {/* Table Toolbar */}
          <div className="px-4 py-3.5 border-b border-line-soft bg-surface-bright flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline w-3.5 h-3.5" />
                <input 
                  type="text"
                  placeholder="Фильтр валюты..."
                  value={pairFilterQuery}
                  onChange={(e) => setPairFilterQuery(e.target.value)}
                  className="pl-7 pr-2 py-1 bg-surface-light border border-line rounded text-xs gap-1 font-sans focus:border-secondary w-40"
                />
              </div>
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="py-1 px-2 pr-8 bg-surface-light border border-line rounded text-xs font-sans h-8 cursor-pointer focus:ring-0"
              >
                <option value="All">All Sources</option>
                <option value="MOEX">MOEX</option>
                <option value="REUTERS">Reuters</option>
                <option value="BLOOMBERG">Bloomberg</option>
              </select>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="py-1 px-2 pr-8 bg-surface-light border border-line rounded text-xs font-sans h-8 cursor-pointer focus:ring-0"
              >
                <option value="Today">Today</option>
                <option value="T-1">T-1</option>
                <option value="Historical">Historical</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 text-outline-variant font-sans text-xs font-semibold">
              <span className="tabular-nums">Обновлено: 10:42:15 МСК</span>
              <button 
                onClick={handleRefreshClick}
                className="p-1 hover:bg-surface-container rounded text-primary transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-surface-container-low z-10 border-b border-line-soft text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Базовая валюта</th>
                  <th className="py-2.5 px-4 font-bold">Локальная валюта</th>
                  <th className="py-2.5 px-4 text-center">Источник</th>
                  <th className="py-2.5 px-4 text-right">Покупка (Bid)</th>
                  <th className="py-2.5 px-4 text-right">Продажа (Ask)</th>
                  <th className="py-2.5 px-4 text-right">Минимум</th>
                  <th className="py-2.5 px-4 text-right">Максимум</th>
                  <th className="py-2.5 px-4 text-right">Последний</th>
                  <th className="py-2.5 px-4 text-right">Спред (bps)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft font-sans text-[13px] font-semibold text-on-surface tabular-nums">
                {filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-surface-container-low transition-colors duration-150">
                    <td className="py-3 px-4 font-bold text-primary">{q.foreign}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{q.local}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-sm bg-surface-variant text-primary text-[10px] font-bold uppercase tracking-wider border border-line-soft">
                        {q.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{q.bid.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right font-medium">{q.ask.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right text-on-surface-variant font-medium">{q.low.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right text-on-surface-variant font-medium">{q.high.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right font-bold">{q.last.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className={`flex items-center justify-end gap-0.5 font-bold ${q.trend === 'up' ? 'text-pos' : q.trend === 'down' ? 'text-neg' : 'text-on-surface-variant'}`}>
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
      ) : activeSubTab === 'CURVES' ? (
        /* Yield Curves subtab */
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Bottom Left list of curves */}
          <div className="w-full lg:w-[280px] bg-surface-light border border-line-soft rounded-lg shadow-sm flex flex-col shrink-0">
            <div className="px-4 py-3 bg-surface-bright border-b border-line-soft font-sans text-xs font-bold text-on-surface">
              Список кривых доходности
            </div>
            <div className="p-2 space-y-1">
              {curves.map(curve => (
                <button
                  key={curve.id}
                  onClick={() => setSelectedCurveId(curve.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded font-sans text-[13px] text-left transition-colors cursor-pointer ${
                    selectedCurveId === curve.id
                      ? 'bg-surface-container text-primary font-bold shadow-sm'
                      : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="font-mono">{curve.id}</span>
                  <span className={`w-2 h-2 rounded-full ${curve.status === 'Live' ? 'bg-pos' : 'bg-warn'}`}></span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Area: Metadata & Nodes list */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Interactive metadata specifications */}
            <div className="bg-surface-light border border-line-soft rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-sans text-sm font-bold text-primary flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4" /> Спецификация {selectedCurve.id}
                </h3>
                <p className="font-sans text-[11px] text-on-surface-variant font-medium">Построен по алгоритму {selectedCurve.buildProcedure}</p>
              </div>
              
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-on-surface">
                <div className="bg-surface-container px-3 py-1.5 rounded border border-line-soft">
                  <span className="text-on-surface-variant mr-1">Интерполяция:</span> {selectedCurve.interpolation}
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded border border-line-soft">
                  <span className="text-on-surface-variant mr-1">Экстраполяция:</span> {selectedCurve.extrapolation}
                </div>
                <div className="bg-surface-container px-3 py-1.5 rounded border border-line-soft">
                  <span className="text-on-surface-variant mr-1">Актуальность:</span> {selectedCurve.lastBuilt}
                </div>
              </div>
            </div>

            {/* Zero Curve Nodes table */}
            <div className="bg-surface-light border border-line-soft rounded-lg shadow-sm flex flex-col overflow-hidden text-on-surface">
              <div className="px-4 py-3 bg-surface-container-low border-b border-line-soft font-sans text-xs font-bold text-primary uppercase tracking-wider">
                Узлы кривой котировок (Nodes list)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-bright text-[11px] font-bold text-on-surface-variant border-b border-line-soft">
                    <tr>
                      <th className="py-2.5 px-4">Срок (Tenor)</th>
                      <th className="py-2.5 px-4">Дата погашения</th>
                      <th className="py-2.5 px-4 text-right">Ставка r (Cont) %</th>
                      <th className="py-2.5 px-4 text-right">Дисконт-фактор (DF)</th>
                      <th className="py-2.5 px-4">Инструмент-источник котировки</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans text-[13px] font-medium divide-y divide-line-soft tabular-nums">
                    {selectedCurve.nodes.map((node) => (
                      <tr key={node.tenor} className="hover:bg-surface-container transition-colors font-medium">
                        <td className="py-3 px-4 text-primary font-bold">{node.tenor}</td>
                        <td className="py-3 px-4 text-on-surface-variant font-mono">{node.date}</td>
                        <td className="py-3 px-4 text-right text-on-surface font-semibold font-mono">{node.rate.toFixed(4)}%</td>
                        <td className="py-3 px-4 text-right font-mono text-primary font-semibold">{node.df.toFixed(6)}</td>
                        <td className="py-3 px-4 text-on-surface-variant font-mono">{node.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Bonds, Equities, Indices mock tabs rendering simply */
        <div className="bg-surface-light border border-line-soft p-12 text-center rounded-lg text-on-surface font-sans text-xs flex flex-col items-center gap-3">
          <CircleDot className="w-8 h-8 text-primary animate-pulse" />
          <div>
            <div className="font-bold text-sm">Справочники и котировки {activeSubTab}</div>
            <p className="text-on-surface-variant mt-1">Данные в процессе обработки МОEX/Reuters шлюзами...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
