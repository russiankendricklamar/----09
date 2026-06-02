/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  SlidersHorizontal, Check, AlertCircle, X, Search, Info, Edit2
} from 'lucide-react';
import { Deal, InstrumentType } from '../types';

interface TradeRegisterProps {
  deals: Deal[];
  onInspectDeal: (id: string) => void;
}

export default function TradeRegister({ deals, onInspectDeal }: TradeRegisterProps) {
  // Category tabs
  const [activeCategory, setActiveCategory] = useState<InstrumentType | 'CASHFLOWS'>('SPOT');
  const [viewMode, setViewMode] = useState<'Standard' | 'Dense'>('Standard');
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Verified' | 'Pending' | 'Failed'>('All');
  const [cptyQuery, setCptyQuery] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<keyof Deal>('id');
  const [sortAsc, setSortAsc] = useState(true);

  const categories: { label: string; value: InstrumentType | 'CASHFLOWS' }[] = [
    { label: 'СПОТ', value: 'SPOT' },
    { label: 'СВОП', value: 'SWAP' },
    { label: 'ФОРВАРД', value: 'FORWARD' },
    { label: 'ФЬЮЧЕРС', value: 'FUTURES' },
    { label: 'РЕПО', value: 'REPO' },
    { label: 'СВОПЫ (IRS)', value: 'IRS' },
    { label: 'FRA', value: 'FRA' },
  ];

  // Filtering deals
  const filteredDeals = deals.filter((deal) => {
    // 1. Filter by tab category
    if (activeCategory !== 'CASHFLOWS' && deal.type !== activeCategory) {
      return false;
    }
    
    // 2. Date Range filters
    if (startDate && deal.tradeDate < startDate) return false;
    if (endDate && deal.tradeDate > endDate) return false;

    // 3. Status filter
    if (statusFilter !== 'All' && deal.status !== statusFilter) return false;

    // 4. Counterparty query
    if (cptyQuery && !deal.counterparty.toLowerCase().includes(cptyQuery.toLowerCase())) return false;

    // 5. General Search (ID, extId)
    if (generalSearch) {
      const q = generalSearch.toLowerCase();
      const matchesId = deal.id.toLowerCase().includes(q) || deal.extId.toLowerCase().includes(q);
      if (!matchesId) return false;
    }

    return true;
  });

  // Sorting logic
  const handleSort = (field: keyof Deal) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined) return 1;
    if (valB === undefined) return -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      {/* Compact Header Row: Categories + Mode Switcher */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-surface-bright p-2 rounded-xl border border-line-soft shadow-sm">
        
        {/* Categories Tab Control */}
        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setActiveCategory(cat.value);
              }}
              className={`px-4 py-1.5 rounded-md font-sans text-[11px] font-black cursor-pointer transition-all ${
                activeCategory === cat.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Mode Control */}
        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1">
          <button 
            onClick={() => setViewMode('Standard')}
            className={`px-3 py-1.5 font-sans text-[11px] font-bold rounded-md cursor-pointer transition-all ${
              viewMode === 'Standard' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Стандарт
          </button>
          <button 
            onClick={() => setViewMode('Dense')}
            className={`px-3 py-1.5 font-sans text-[11px] font-bold rounded-md cursor-pointer transition-all ${
              viewMode === 'Dense' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Компакт
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Clean Style) */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-line-soft flex flex-wrap items-center gap-4">
        
        {/* Search */}
        <div className="relative w-48 group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Поиск по ID..."
            value={generalSearch}
            onChange={(e) => setGeneralSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-2.5 bg-surface-bright border border-line-soft rounded-lg text-[11px] font-sans focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="w-px h-6 bg-line-soft"></div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Статус:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 border border-line-soft rounded-lg bg-surface-bright text-[11px] font-bold px-2 pr-6 cursor-pointer focus:ring-0"
          >
            <option value="All">Все статусы</option>
            <option value="Verified">Проверена</option>
            <option value="Pending">В ожидании</option>
            <option value="Failed">Ошибка</option>
          </select>
        </div>

        {/* Counterparty */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Контрагент:</span>
          <input 
            type="text" 
            placeholder="Фильтр..."
            value={cptyQuery}
            onChange={(e) => setCptyQuery(e.target.value)}
            className="h-8 border border-line-soft rounded-lg bg-surface-bright text-[11px] font-bold px-2.5 w-32 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Период:</span>
          <div className="flex items-center bg-surface-bright border border-line-soft rounded-lg overflow-hidden h-8">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 text-[10px] font-bold outline-none cursor-pointer"
            />
            <span className="text-line-soft px-1">-</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 text-[10px] font-bold outline-none cursor-pointer"
            />
          </div>
        </div>

        <button 
          onClick={() => {
            setStartDate(''); setEndDate(''); setStatusFilter('All');
            setCptyQuery(''); setGeneralSearch('');
          }}
          className="ml-auto text-[10px] font-black text-primary hover:underline cursor-pointer uppercase tracking-widest"
        >
          Сбросить
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-grow bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-line-soft flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-sans text-[11px] font-black text-primary uppercase tracking-wider">
            Реестр сделок (Найдено: {sortedDeals.length.toLocaleString('ru-RU')})
          </h3>
          <button 
            className="p-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer shadow-xs" 
            title="Экспорт в Excel"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 bg-surface-container-low border-b border-line-soft text-[10px] font-black text-on-surface-variant uppercase tracking-wider z-10">
              <tr>
                <th onClick={() => handleSort('id')} className="py-2.5 px-4 cursor-pointer hover:bg-primary/5 transition-colors">
                  ID <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="py-2.5 px-4 text-center">Статус</th>
                <th onClick={() => handleSort('tradeDate')} className="py-2.5 px-4 cursor-pointer hover:bg-primary/5 transition-colors">
                  Дата <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                
                {activeCategory === 'REPO' ? (
                  <>
                    <th className="py-2.5 px-4">Залог / ISIN</th>
                    <th className="py-2.5 px-4 text-right">Сумма Ч.1</th>
                  </>
                ) : activeCategory === 'IRS' ? (
                  <>
                    <th className="py-2.5 px-4">Тип / Индекс</th>
                    <th className="py-2.5 px-4 text-right">Номинал</th>
                  </>
                ) : activeCategory === 'FRA' ? (
                  <>
                    <th className="py-2.5 px-4">Период (Tenor)</th>
                    <th className="py-2.5 px-4 text-right">Номинал</th>
                  </>
                ) : activeCategory === 'FUTURES' ? (
                  <>
                    <th className="py-2.5 px-4">Тип контракта</th>
                    <th className="py-2.5 px-4 text-right">Кол-во (лотов)</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-4">Купля</th>
                    <th className="py-2.5 px-4 text-right">Объем</th>
                  </>
                )}

                <th className="py-2.5 px-4 text-right">Курс/Ставка</th>
                <th className="py-2.5 px-4">Контрагент</th>
              </tr>
            </thead>
            <tbody className="font-sans text-[12px] font-medium text-on-surface divide-y divide-line-soft tabular-nums">
              {sortedDeals.map((deal) => (
                <tr 
                  key={deal.id}
                  onClick={() => onInspectDeal(deal.id)}
                  className={`hover:bg-primary/5 transition-colors cursor-pointer border-l-2 border-l-transparent hover:border-l-primary ${
                    viewMode === 'Dense' ? 'py-1' : 'py-2.5'
                  }`}
                >
                  <td className="py-2.5 px-4 font-bold text-primary font-mono">{deal.id}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      deal.status === 'Verified' ? 'bg-pos/15 text-pos' : deal.status === 'Pending' ? 'bg-warn/15 text-warn' : 'bg-neg/15 text-neg'
                    }`}>
                      {deal.status === 'Verified' ? 'Проверена' : deal.status === 'Pending' ? 'Ожидание' : 'Ошибка'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant font-mono">{deal.tradeDate}</td>

                  {activeCategory === 'REPO' ? (
                    <>
                      <td className="py-2.5 px-4">
                        <div className="font-bold">{deal.collateral}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">{deal.isin}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-on-surface">{(deal.leg1Total || 0).toLocaleString('ru-RU')}</td>
                    </>
                  ) : activeCategory === 'IRS' ? (
                    <>
                      <td className="py-2.5 px-4">
                        <div className="font-bold">{deal.leg1Type}</div>
                        <div className="text-[10px] text-on-surface-variant">{deal.leg1Index}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-black">{(deal.buyAmt || 0).toLocaleString('ru-RU')}</td>
                    </>
                  ) : activeCategory === 'FRA' ? (
                    <>
                      <td className="py-2.5 px-4 font-bold">3x6</td>
                      <td className="py-2.5 px-4 text-right font-black">{(deal.buyAmt || 0).toLocaleString('ru-RU')}</td>
                    </>
                  ) : activeCategory === 'FUTURES' ? (
                    <>
                      <td className="py-2.5 px-4 font-bold">SI-12.23</td>
                      <td className="py-2.5 px-4 text-right font-black">{(deal.buyAmt || 0).toLocaleString('ru-RU')}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-2.5 px-4 font-bold text-primary">{deal.buyCcy}</td>
                      <td className="py-2.5 px-4 text-right font-black">{(deal.buyAmt || 0).toLocaleString('ru-RU')}</td>
                    </>
                  )}

                  <td className="py-2.5 px-4 text-right font-black font-mono text-secondary">
                    {deal.rate !== undefined ? deal.rate.toFixed(deal.type === 'REPO' ? 2 : 4) : '-'}
                    {deal.type === 'REPO' ? '%' : ''}
                  </td>
                  <td className="py-2.5 px-4 truncate max-w-[150px] font-semibold text-on-surface-variant">{deal.counterparty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-line-soft flex items-center justify-between bg-surface-bright rounded-b-xl font-sans text-[11px] font-bold">
          <span className="text-on-surface-variant opacity-60 uppercase tracking-tighter">Показано {sortedDeals.length.toLocaleString('ru-RU')} из {filteredDeals.length.toLocaleString('ru-RU')}</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded text-outline-variant hover:bg-surface-container opacity-30 cursor-not-allowed" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-6 h-6 bg-primary text-on-primary rounded font-black text-[10px]">1</button>
            <button className="p-1 rounded text-outline-variant hover:bg-surface-container opacity-30 cursor-not-allowed" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
