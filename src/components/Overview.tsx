/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCw, Download, 
  CheckCircle, AlertTriangle, Landmark, ReceiptText, MoreVertical,
  ChevronRight, ArrowUpRight, Check, Play, User2, Clock
} from 'lucide-react';
import { Deal, MarketQuote, YieldCurve } from '../types';

interface OverviewProps {
  deals: Deal[];
  quotes: MarketQuote[];
  curves: YieldCurve[];
  onNavigate: (tab: any) => void;
  onRefresh: () => void;
}

export default function Overview({ deals, quotes, curves, onNavigate, onRefresh }: OverviewProps) {
  const [selectedCcyCurve, setSelectedCcyCurve] = useState<'RUB' | 'USD' | 'EUR' | 'CNY'>('RUB');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate high-level stats
  const totalDealsCount = deals.length;
  
  // Conformity calculation (verified vs total)
  const verifiedDeals = deals.filter(d => d.status === 'Verified').length;
  const conformityPercentage = totalDealsCount > 0 ? ((verifiedDeals / totalDealsCount) * 100).toFixed(1) : '0';
  
  // Off-market list
  const offMarketDeals = deals.filter(d => d.deltaToMarket > 1.0 || d.status === 'Failed' || d.id === 'FX-2023-1003');
  const offMarketCount = offMarketDeals.length;

  // Total PV (Volume) - convert in a nice sum
  const totalVolumeRUB = deals.reduce((acc, d) => acc + (d.pv || 0), 0);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onRefresh();
    }, 600);
  };

  const activeCurve = curves.find(c => c.currency === selectedCcyCurve) || curves[0];

  const maxRateVal = activeCurve && activeCurve.nodes && activeCurve.nodes.length > 0
    ? Math.max(...activeCurve.nodes.map(n => n.rate))
    : 16.0;

  let maxY = 16.0;
  let ticks = ['16.0%', '12.0%', '8.0%', '4.0%', '0.0%'];
  if (maxRateVal <= 4.1) {
    maxY = 4.0;
    ticks = ['4.0%', '3.0%', '2.0%', '1.0%', '0.0%'];
  } else if (maxRateVal <= 6.1) {
    maxY = 6.0;
    ticks = ['6.0%', '4.5%', '3.0%', '1.5%', '0.0%'];
  } else if (maxRateVal <= 10.1) {
    maxY = 10.0;
    ticks = ['10.0%', '7.5%', '5.0%', '2.5%', '0.0%'];
  } else {
    maxY = 18.0;
    ticks = ['18.0%', '13.5%', '9.0%', '4.5%', '0.0%'];
  }

  // Generate SVG path points
  const pointsCurrent = activeCurve && activeCurve.nodes ? activeCurve.nodes.map((node, i) => {
    const cx = activeCurve.nodes.length > 1 ? (i / (activeCurve.nodes.length - 1)) * 1000 : 0;
    const cy = 90 - (node.rate / maxY) * 80;
    return { x: cx, y: cy };
  }) : [];

  const pointsWeekAgo = activeCurve && activeCurve.nodes ? activeCurve.nodes.map((node, i) => {
    const cx = activeCurve.nodes.length > 1 ? (i / (activeCurve.nodes.length - 1)) * 1000 : 0;
    const rate = Math.max(0, node.rate - 0.4);
    const cy = 90 - (rate / maxY) * 80;
    return { x: cx, y: cy };
  }) : [];

  const pointsMonthAgo = activeCurve && activeCurve.nodes ? activeCurve.nodes.map((node, i) => {
    const cx = activeCurve.nodes.length > 1 ? (i / (activeCurve.nodes.length - 1)) * 1000 : 0;
    const rate = Math.max(0, node.rate - 0.9);
    const cy = 90 - (rate / maxY) * 80;
    return { x: cx, y: cy };
  }) : [];

  const pathCurrent = pointsCurrent.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const pathWeekAgo = pointsWeekAgo.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const pathMonthAgo = pointsMonthAgo.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const areaPathCurrent = pathCurrent ? `${pathCurrent} L 1000,90 L 0,90 Z` : '';


  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Page Title Area */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-primary">Оперативная сводка</h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1">Данные обновлены сегодня в реальном времени</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-surface-light border border-line rounded font-sans text-xs font-semibold text-primary hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Экспорт
          </button>
          <button 
            onClick={handleRefreshClick}
            className="px-4 py-1.5 bg-primary text-on-primary rounded font-sans text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Обновить
          </button>
        </div>
      </div>

      {/* KPI Grid (4 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Всего сделок */}
        <div className="bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-xs font-semibold text-on-surface-variant">Всего сделок</span>
            <ReceiptText className="w-5 h-5 text-info" />
          </div>
          <div className="flex items-end justify-between">
            <div className="font-sans text-3xl font-extrabold text-on-surface tracking-tight tabular-nums">{totalDealsCount}</div>
            <div className="flex items-center gap-0.5 text-pos text-[11px] font-bold bg-pos/10 px-1.5 py-0.5 rounded tabular-nums">
              <TrendingUp className="w-3 h-3" /> +18
            </div>
          </div>
          <div className="mt-4 h-8 w-full bg-surface-container-low rounded overflow-hidden relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path d="M0,25 L10,20 L20,22 L30,15 L40,18 L50,10 L60,12 L70,5 L80,8 L90,2 L100,0" fill="none" opacity="0.6" stroke="#1f4a8a" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        {/* KPI 2: Соответствие рынку */}
        <div className="bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-xs font-semibold text-on-surface-variant">Соответствие рынку</span>
            <CheckCircle className="w-5 h-5 text-pos" />
          </div>
          <div className="flex items-end justify-between">
            <div className="font-sans text-3xl font-extrabold text-on-surface tracking-tight tabular-nums">{conformityPercentage}<span className="text-lg font-normal text-on-surface-variant ml-0.5">%</span></div>
            <div className="font-sans text-[11px] text-on-surface-variant font-medium">Цель: 95%</div>
          </div>
          <div className="mt-4 w-full h-1.5 bg-line-soft rounded-full overflow-hidden">
            <div className="h-full bg-pos rounded-full transition-all duration-500" style={{ width: `${conformityPercentage}%` }}></div>
          </div>
        </div>

        {/* KPI 3: Внерыночные */}
        <div className="bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-xs font-semibold text-on-surface-variant">Внерыночные сделки</span>
            <AlertTriangle className="w-5 h-5 text-neg" />
          </div>
          <div className="flex items-end justify-between">
            <div className="font-sans text-3xl font-extrabold text-neg tracking-tight tabular-nums">{offMarketCount}</div>
            <div className="flex items-center gap-0.5 text-neg text-[11.5px] font-bold bg-neg/10 px-1.5 py-0.5 rounded">
              Alert
            </div>
          </div>
          <div className="mt-4 h-8 w-full bg-surface-container-low rounded overflow-hidden relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path d="M0,5 L10,8 L20,6 L30,12 L40,10 L50,15 L60,18 L70,22 L80,20 L90,28 L100,26" fill="none" opacity="0.6" stroke="#b80020" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        {/* KPI 4: Общий Объем (PV) */}
        <div className="bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="font-sans text-xs font-semibold text-on-surface-variant">Взвешенный PV</span>
            <Landmark className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex items-end justify-between">
            <div className="font-sans text-2xl font-extrabold text-on-surface tracking-tight tabular-nums">
              {(totalVolumeRUB / 1000).toFixed(1)} <span className="text-xs font-normal text-on-surface-variant">млрд ₽</span>
            </div>
            <div className="flex items-center gap-0.5 text-pos text-[11px] font-bold bg-pos/10 px-1.5 py-0.5 rounded tabular-nums">
              +2.1%
            </div>
          </div>
          <div className="mt-4 w-full h-1.5 bg-line-soft rounded-full overflow-hidden flex">
            <div className="h-full bg-primary" style={{ width: '45%' }}></div>
            <div className="h-full bg-secondary" style={{ width: '35%' }}></div>
            <div className="h-full bg-secondary-container" style={{ width: '20%' }}></div>
          </div>
        </div>
      </div>

      {/* Two Column Split: Table & Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Market Conformity Table */}
        <div className="lg:col-span-7 bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-line-soft flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-sans text-sm font-bold text-on-surface">Анализ соответствия по типам ПФИ</h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"><MoreVertical className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-line-soft text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                <tr>
                  <th className="py-3 px-5">Тип инструмента</th>
                  <th className="py-3 px-5 text-right">Сделок</th>
                  <th className="py-3 px-5 text-right">Объем (млн)</th>
                  <th className="py-3 px-5">Соответствие (%)</th>
                </tr>
              </thead>
              <tbody className="font-sans text-[13px] font-medium text-on-surface divide-y divide-line-soft tabular-nums">
                <tr className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => onNavigate('deals')}>
                  <td className="py-3 px-5 font-semibold text-primary">FX SPOT</td>
                  <td className="py-3 px-5 text-right">312</td>
                  <td className="py-3 px-5 text-right">45,200</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-right font-bold">99.1%</span>
                      <div className="w-24 h-1.5 bg-line-soft rounded-full overflow-hidden">
                        <div className="h-full bg-pos" style={{ width: '99.1%' }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => onNavigate('deals')}>
                  <td className="py-3 px-5 font-semibold text-primary">FX SWAP</td>
                  <td className="py-3 px-5 text-right">184</td>
                  <td className="py-3 px-5 text-right">62,850</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-right font-bold">98.5%</span>
                      <div className="w-24 h-1.5 bg-line-soft rounded-full overflow-hidden">
                        <div className="h-full bg-pos" style={{ width: '98.5%' }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => onNavigate('deals')}>
                  <td className="py-3 px-5 font-semibold text-primary">FX FORWARD</td>
                  <td className="py-3 px-5 text-right">86</td>
                  <td className="py-3 px-5 text-right">21,400</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-right font-bold">94.2%</span>
                      <div className="w-24 h-1.5 bg-line-soft rounded-full overflow-hidden">
                        <div className="h-full bg-warn" style={{ width: '94.2%' }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => onNavigate('deals')}>
                  <td className="py-3 px-5 font-semibold text-primary">REPO</td>
                  <td className="py-3 px-5 text-right">115</td>
                  <td className="py-3 px-5 text-right">38,100</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-right font-bold">97.8%</span>
                      <div className="w-24 h-1.5 bg-line-soft rounded-full overflow-hidden">
                        <div className="h-full bg-pos" style={{ width: '97.8%' }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => onNavigate('deals')}>
                  <td className="py-3 px-5 font-semibold text-primary">IRS / CIRS</td>
                  <td className="py-3 px-5 text-right">45</td>
                  <td className="py-3 px-5 text-right">16,850</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-right font-bold text-neg font-extrabold">88.4%</span>
                      <div className="w-24 h-1.5 bg-line-soft rounded-full overflow-hidden">
                        <div className="h-full bg-neg" style={{ width: '88.4%' }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Exchange Rates */}
        <div className="lg:col-span-5 bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-line-soft flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-sans text-sm font-bold text-on-surface">Курсы ЦБ РФ &amp; Индикаторы</h3>
            <span className="font-sans text-[10.5px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">T+1</span>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4">
            {quotes.filter(q => q.source === 'MOEX').map((quote) => (
              <div 
                key={quote.id}
                className="flex items-center justify-between p-3.5 border border-line-soft rounded hover:bg-surface-container-low transition-all cursor-default"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-sans text-xs text-primary font-bold">
                    {quote.foreign}
                  </div>
                  <div>
                    <div className="font-sans text-[13.5px] font-semibold text-on-surface">{quote.id}</div>
                    <div className="font-sans text-[10.5px] text-on-surface-variant">Биржевой курс MOEX</div>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="font-sans text-[13.5px] font-bold text-on-surface">{quote.last.toFixed(4)}</div>
                  <div className={`font-sans text-[10.5px] flex items-center justify-end gap-0.5 mt-0.5 ${quote.trend === 'up' ? 'text-pos' : 'text-neg'}`}>
                    {quote.trend === 'up' ? '▲' : '▼'} {quote.trend === 'up' ? '+' : '-'}{((quote.spreadBps / 1000) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Width Yield Curve Visualizer */}
      <div className="bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-line-soft flex justify-between items-center bg-surface-container-lowest">
          <div className="flex items-center gap-5">
            <h3 className="font-sans text-sm font-bold text-on-surface">Ключевые Кривые Доходности (Zero Coupon)</h3>
            
            {/* Segmented control to select currency curve */}
            <div className="flex bg-surface-container-low p-1 rounded border border-line-soft">
              {curves.map((curve) => (
                <button
                  key={curve.currency}
                  onClick={() => setSelectedCcyCurve(curve.currency)}
                  className={`px-3.5 py-1 font-sans text-xs font-semibold rounded transition-all cursor-pointer ${
                    selectedCcyCurve === curve.currency 
                      ? 'bg-surface-light shadow-sm text-primary font-bold' 
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {curve.currency}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-5 font-sans text-[11px] text-on-surface-variant font-medium">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <span className="w-3.5 h-0.5 bg-primary block"></span> Текущая (Spot)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-secondary block"></span> -1 Неделя
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="w-3.5 h-[1.5px] bg-[#c4c6cf] block"></span> -1 Месяц
            </div>
          </div>
        </div>

        {/* Dynamic and fully scaled interactive SVG curve chart */}
        <div className="p-6 h-[280px] w-full relative">
          <div className="absolute left-4 top-6 bottom-9 w-10 flex flex-col justify-between text-right font-sans text-[10.5px] text-on-surface-variant font-medium tabular-nums">
            {ticks.map((tick, idx) => (
              <span key={idx}>{tick}</span>
            ))}
          </div>

          <div className="absolute left-16 right-6 bottom-3 h-5 flex justify-between items-end font-sans text-[10.5px] text-on-surface-variant font-bold px-2">
            {activeCurve.nodes.map(node => (
              <span key={node.tenor} className="w-full text-center">{node.tenor}</span>
            ))}
          </div>

          {/* Grid lines behind curve */}
          <div className="absolute left-16 right-6 top-6 bottom-9 border-l border-b border-line-soft flex flex-col justify-between pointer-events-none">
            <div className="w-full border-t border-line-soft/40 h-0"></div>
            <div className="w-full border-t border-line-soft/40 h-0"></div>
            <div className="w-full border-t border-line-soft/40 h-0"></div>
            <div className="w-full border-t border-line-soft/40 h-0"></div>
            <div className="w-full border-t border-line-soft/40 h-0"></div>
          </div>

          {/* Interactive Curve Plot */}
          <svg className="absolute left-16 right-6 top-6 bottom-9 w-[calc(100%-88px)] h-[calc(100%-52px)] overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 100">
            {/* SVG Definitions for Gradients */}
            <defs>
              <linearGradient id="curve-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0b2545" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0b2545" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* -1 Month (Tertiary) line */}
            {pathMonthAgo && (
              <path 
                d={pathMonthAgo} 
                fill="none" 
                stroke="#c4c6cf" 
                strokeWidth="1.5" 
                opacity="0.5"
                className="transition-all duration-300"
              />
            )}
            
            {/* -1 Week (Secondary) line */}
            {pathWeekAgo && (
              <path 
                d={pathWeekAgo} 
                fill="none" 
                stroke="#365e9f" 
                strokeWidth="1.5" 
                opacity="0.4"
                className="transition-all duration-300"
              />
            )}

            {/* Gradient Area under current curve */}
            {areaPathCurrent && (
              <path
                d={areaPathCurrent}
                fill="url(#curve-gradient)"
                className="transition-all duration-300"
              />
            )}

            {/* Main Interactive Curve */}
            {pathCurrent && (
              <path 
                d={pathCurrent} 
                fill="none" 
                stroke="#0b2545" 
                strokeWidth="2.5"
                className="transition-all duration-300"
              />
            )}

            {/* Render Nodes as dots */}
            {pointsCurrent.map((p, i) => {
              const node = activeCurve.nodes[i];
              return (
                <g key={node.tenor} className="group/node cursor-pointer">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="#0b2545" 
                    className="hover:scale-150 transition-all filter drop-shadow" 
                  />
                  <foreignObject x={p.x - 30} y={p.y - 30} width="60" height="24" className="overflow-visible hidden group-hover/node:block pointer-events-none">
                    <div className="bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1 rounded shadow text-center w-full">
                      {node.rate.toFixed(3)}%
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Grid: Off-market & Status Logs & Activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
        {/* Term/Off-market List */}
        <div className="bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] flex flex-col h-[300px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line-soft bg-surface-container-lowest flex justify-between items-center">
            <h3 className="font-sans text-sm font-bold text-on-surface flex items-center gap-3">
              Исключения в ПФИ
              <span className="bg-neg text-on-error font-sans text-[10.5px] font-bold px-2.5 py-0.5 rounded-full tabular-nums">
                {offMarketCount}
              </span>
            </h3>
          </div>
          <div className="overflow-y-auto flex-grow p-3 flex flex-col gap-2">
            {offMarketDeals.map((deal) => (
              <div 
                key={deal.id}
                onClick={() => onNavigate('deals')}
                className="p-3 rounded hover:bg-surface-container-low cursor-pointer flex justify-between items-center group transition-colors border border-transparent hover:border-line-soft"
              >
                <div>
                  <div className="font-sans text-xs font-semibold text-primary group-hover:underline tabular-nums">
                    {deal.id} ({deal.type})
                  </div>
                  <div className="font-sans text-[10.5px] text-on-surface-variant mt-1">
                    Отклонение: <span className="text-neg font-bold tabular-nums">+{deal.deltaToMarket.toFixed(2)}%</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-outline-variant group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Process Status log */}
        <div className="bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] flex flex-col h-[300px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line-soft bg-surface-container-lowest">
            <h3 className="font-sans text-sm font-bold text-on-surface">Статус загрузки данных</h3>
          </div>
          <div className="overflow-y-auto flex-grow p-5">
            <div className="relative border-l border-line-soft ml-2.5 space-y-5 pb-2">
              <div className="relative pl-5">
                <div className="absolute w-2.5 h-2.5 bg-pos rounded-full -left-[5px] top-1.5 ring-4 ring-surface-light"></div>
                <div className="font-sans text-xs font-semibold text-on-surface">Импорт данных MOEX (SPOT)</div>
                <div className="font-sans text-[10.5px] text-on-surface-variant mt-1">Завершено • 14:25:10 МСК</div>
              </div>
              <div className="relative pl-5">
                <div className="absolute w-2.5 h-2.5 bg-pos rounded-full -left-[5px] top-1.5 ring-4 ring-surface-light"></div>
                <div className="font-sans text-xs font-semibold text-on-surface">Сделки из BackOffice (SWAP)</div>
                <div className="font-sans text-[10.5px] text-on-surface-variant mt-1">Завершено • 14:15:00 МСК</div>
              </div>
              <div className="relative pl-5">
                <div className="absolute w-2.5 h-2.5 bg-warn rounded-full -left-[5px] top-1.5 ring-4 ring-surface-light animate-pulse"></div>
                <div className="font-sans text-xs font-semibold text-on-surface">Кривые доходности (OIS)</div>
                <div className="font-sans text-[10.5px] text-warn font-semibold mt-1">В процессе выполнения (75%) • 14:10:00</div>
              </div>
            </div>
          </div>
        </div>

        {/* User activities summary */}
        <div className="bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] flex flex-col h-[300px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line-soft bg-surface-container-lowest">
            <h3 className="font-sans text-sm font-bold text-on-surface">Активность пользователей</h3>
          </div>
          <div className="overflow-y-auto flex-grow p-3 flex flex-col gap-3">
            <div className="flex gap-3.5 p-2.5 rounded hover:bg-surface-container-low transition-colors">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-sans text-xs font-bold uppercase shrink-0">
                ИВ
              </div>
              <div>
                <div className="font-sans text-xs text-on-surface">
                  <span className="font-bold">Иванов В.</span> подтвердил сделку <span className="font-semibold text-primary">FX-2023-1001</span> (исключение)
                </div>
                <div className="font-sans text-[10.5px] text-on-surface-variant mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 5 мин назад
                </div>
              </div>
            </div>
            <div className="flex gap-3.5 p-2.5 rounded hover:bg-surface-container-low transition-colors">
              <div className="w-8 h-8 rounded-full bg-surface-tint text-on-primary flex items-center justify-center font-sans text-xs font-bold uppercase shrink-0">
                СМ
              </div>
              <div>
                <div className="font-sans text-xs text-on-surface">
                  <span className="font-bold">Смирнова М.</span> обновила конфигурацию лимитов SWAP
                </div>
                <div className="font-sans text-[10.5px] text-on-surface-variant mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 18 мин назад
                </div>
              </div>
            </div>
            <div className="flex gap-3.5 p-2.5 rounded hover:bg-surface-container-low transition-colors">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-sans text-xs font-bold uppercase shrink-0">
                АП
              </div>
              <div>
                <div className="font-sans text-xs text-on-surface">
                  <span className="font-bold">Петров А.</span> запустил перерасчет справедливой стоимости
                </div>
                <div className="font-sans text-[10.5px] text-on-surface-variant mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 1 час назад
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
