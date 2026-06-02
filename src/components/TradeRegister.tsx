/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  SlidersHorizontal, Check, AlertCircle, X, Search, Info
} from 'lucide-react';
import { Deal, InstrumentType } from '../types';

interface TradeRegisterProps {
  deals: Deal[];
}

export default function TradeRegister({ deals }: TradeRegisterProps) {
  // Category tabs
  const [activeCategory, setActiveCategory] = useState<InstrumentType | 'CASHFLOWS'>('SPOT');
  const [viewMode, setViewMode] = useState<'Standard' | 'Dense'>('Standard');
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Verified' | 'Pending' | 'Failed'>('All');
  const [cptyQuery, setCptyQuery] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');

  // Selected trade for expanding/inspecting full deal attributes
  const [inspectedDealId, setInspectedDealId] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<keyof Deal>('id');
  const [sortAsc, setSortAsc] = useState(true);

  const categories: { label: string; value: InstrumentType | 'CASHFLOWS' }[] = [
    { label: 'SPOT', value: 'SPOT' },
    { label: 'SWAP', value: 'SWAP' },
    { label: 'Forward', value: 'FORWARD' },
    { label: 'REPO', value: 'REPO' },
    { label: 'IRS / CIRS', value: 'IRS' },
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

  // Inspected deal object
  const inspectedDeal = deals.find(d => d.id === inspectedDealId) || null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="font-sans text-xl font-bold tracking-tight text-primary">Реестр сделок (Сделки)</h2>
          
          <div className="flex bg-surface-container rounded p-0.5 border border-line-soft items-center">
            <button 
              onClick={() => setViewMode('Standard')}
              className={`px-3 py-1 font-sans text-xs font-semibold rounded cursor-pointer transition-all ${
                viewMode === 'Standard' 
                  ? 'bg-surface-light shadow text-primary font-bold' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Standard
            </button>
            <button 
              onClick={() => setViewMode('Dense')}
              className={`px-3 py-1 font-sans text-xs font-semibold rounded cursor-pointer transition-all ${
                viewMode === 'Dense' 
                  ? 'bg-surface-light shadow text-primary font-bold' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Dense
            </button>
          </div>
        </div>

        {/* Segmented Category Control */}
        <div className="bg-surface-container-low p-1 rounded inline-flex border border-line-soft gap-1 self-start shadow-inner">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setActiveCategory(cat.value);
                setInspectedDealId(null);
              }}
              className={`px-4 py-1.5 rounded font-sans text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat.value
                  ? 'bg-surface-light shadow-[0_1px_2px_rgba(11,37,69,0.05)] text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Complex Filter Toolbar */}
      <div className="bg-surface-light p-4 rounded-lg shadow-[0_1px_2px_rgba(11,37,69,0.05)] border border-line-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Main search */}
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="Поиск по ID..."
              value={generalSearch}
              onChange={(e) => setGeneralSearch(e.target.value)}
              className="w-full border border-line rounded bg-surface-container-lowest text-xs font-sans text-on-surface focus:outline-none focus:border-secondary h-8 pl-8 pr-2"
            />
          </div>

          <div className="w-px h-6 bg-line hidden md:block"></div>

          {/* Date range inputs */}
          <div className="flex items-center gap-1 text-xs text-on-surface-variant font-bold">
            <span>Date:</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-line rounded bg-surface-bright text-[11px] font-semibold text-on-surface py-1 px-1.5 h-8 w-28 tabular-nums cursor-pointer"
            />
            <span>-</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-line rounded bg-surface-bright text-[11px] font-semibold text-on-surface py-1 px-1.5 h-8 w-28 tabular-nums cursor-pointer"
            />
          </div>

          <div className="w-px h-6 bg-line hidden md:block"></div>

          {/* Status selector */}
          <div className="flex items-center gap-1 text-xs text-on-surface-variant font-bold">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-line rounded bg-surface-container-lowest text-xs font-sans font-semibold text-on-surface focus:ring-0 py-1 pl-2 pr-6 h-8 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="w-px h-6 bg-line hidden md:block"></div>

          {/* Cpty input */}
          <div className="flex items-center gap-1 text-xs text-on-surface-variant font-bold">
            <span>CPTY:</span>
            <input 
              type="text"
              placeholder="Фильтр контрагентов..."
              value={cptyQuery}
              onChange={(e) => setCptyQuery(e.target.value)}
              className="border border-line rounded bg-surface-bright text-xs font-semibold text-on-surface py-1 px-2 h-8 w-36 focus:ring-0 placeholder:text-outline-variant"
            />
          </div>

        </div>

        <div className="flex items-center gap-2 self-end">
          <button 
            type="button" 
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setStatusFilter('All');
              setCptyQuery('');
              setGeneralSearch('');
            }}
            className="px-3 py-1.5 border border-line text-on-surface h-8 rounded text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* Main Container: Split or Full List */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Table layout */}
        <div className="flex-grow bg-surface-light rounded-lg border border-line-soft shadow-[0_1px_2px_rgba(11,37,69,.05)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-line-soft flex justify-between items-center bg-surface-container-lowest shrink-0">
            <h3 className="font-sans text-sm font-bold text-on-surface">
              {activeCategory} Register ({sortedDeals.length} items found)
            </h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" title="Export CSV">
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 bg-surface-container-low border-b border-line-soft text-[11px] font-bold text-on-surface-variant z-10 shadow-[0_1px_0_var(--color-line-soft)]">
                <tr>
                  <th onClick={() => handleSort('id')} className="py-3 px-4 cursor-pointer hover:bg-surface-container-high transition-colors whitespace-nowrap">
                    ID <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-70" />
                  </th>
                  <th onClick={() => handleSort('extId')} className="py-3 px-4 cursor-pointer hover:bg-surface-container-high transition-colors whitespace-nowrap">
                    Ext ID <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-70" />
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">Status</th>
                  <th onClick={() => handleSort('tradeDate')} className="py-3 px-4 cursor-pointer hover:bg-surface-container-high transition-colors whitespace-nowrap">
                    Trade Date <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-70" />
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">Settle Date</th>
                  
                  {activeCategory === 'REPO' ? (
                    <>
                      <th className="py-3 px-4 whitespace-nowrap">Залог / ISIN</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Номинал 1-й части</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Сумма во 2-й части</th>
                    </>
                  ) : activeCategory === 'IRS' ? (
                    <>
                      <th className="py-3 px-4 whitespace-nowrap">Leg 1 Type / Index</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Номинал</th>
                      <th className="py-3 px-4 whitespace-nowrap">Leg 2 Type</th>
                    </>
                  ) : activeCategory === 'SWAP' ? (
                    <>
                      <th className="py-3 px-4 whitespace-nowrap">Leg 1 Buy CCY / Amt</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Leg 2 Pay Amt</th>
                      <th className="py-3 px-4 whitespace-nowrap">Leg 2 Date</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4 whitespace-nowrap">Buy Leg</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Buy Amt</th>
                      <th className="py-3 px-4 whitespace-nowrap">Sell Leg</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Sell Amt</th>
                    </>
                  )}

                  <th className="py-3 px-4 text-right whitespace-nowrap">Rate</th>
                  <th className="py-3 px-4">Counterparty</th>
                </tr>
              </thead>
              <tbody className="font-sans text-[13px] font-medium divide-y divide-line-soft tabular-nums">
                {sortedDeals.map((deal) => {
                  const isOpened = inspectedDealId === deal.id;
                  return (
                    <tr 
                      key={deal.id}
                      onClick={() => setInspectedDealId(deal.id)}
                      className={`hover:bg-surface-container border-l-2 transition-colors cursor-pointer ${
                        viewMode === 'Dense' ? 'py-1.5' : 'py-3'
                      } ${isOpened ? 'bg-surface-container border-l-primary' : 'border-l-transparent'}`}
                    >
                      <td className="py-2.5 px-4 font-bold text-primary font-mono">{deal.id}</td>
                      <td className="py-2.5 px-4 text-on-surface-variant font-mono">{deal.extId || '-'}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          deal.status === 'Verified'
                            ? 'bg-pos/15 text-pos'
                            : deal.status === 'Pending'
                              ? 'bg-warn/15 text-warn'
                              : 'bg-neg/15 text-neg'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            deal.status === 'Verified' ? 'bg-pos' : deal.status === 'Pending' ? 'bg-warn' : 'bg-neg'
                          }`}></span>
                          {deal.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-on-surface-variant">{deal.tradeDate}</td>
                      <td className="py-2.5 px-4 text-on-surface-variant">{deal.settleDate}</td>

                      {activeCategory === 'REPO' ? (
                        <>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-on-surface">{deal.collateral}</div>
                            <div className="text-[11px] text-on-surface-variant font-mono">{deal.isin}</div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-on-surface">{deal.leg1Total?.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right font-medium text-on-surface">{deal.leg2Total?.toLocaleString()}</td>
                        </>
                      ) : activeCategory === 'IRS' ? (
                        <>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-on-surface">{deal.leg1Type}</div>
                            <div className="text-[11px] text-on-surface-variant font-semibold">{deal.leg1Index}</div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-on-surface">{deal.buyAmt?.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-on-surface">{deal.leg2Type} ({deal.leg2RateSpread})</td>
                        </>
                      ) : activeCategory === 'SWAP' ? (
                        <>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-primary mr-1">{deal.buyCcy}</span> 
                            {deal.buyAmt?.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-on-surface">
                            {deal.sellAmt?.toLocaleString() || deal.leg2Total?.toLocaleString() || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-on-surface-variant">{deal.leg2Date}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-4 font-bold text-primary">{deal.buyCcy}</td>
                          <td className="py-2.5 px-4 text-right font-medium">{deal.buyAmt?.toLocaleString()}</td>
                          <td className="py-2.5 px-4 font-bold text-on-surface-variant">{deal.sellCcy}</td>
                          <td className="py-2.5 px-4 text-right font-medium text-on-surface-variant">{deal.sellAmt?.toLocaleString()}</td>
                        </>
                      )}

                      <td className="py-2.5 px-4 text-right font-bold font-mono">
                        {deal.rate !== undefined ? deal.rate.toFixed(deal.type === 'REPO' ? 2 : 4) : '-'}
                        {deal.type === 'REPO' ? '%' : ''}
                      </td>
                      <td className="py-2.5 px-4 truncate max-w-[150px]" title={deal.counterparty}>{deal.counterparty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-line-soft flex items-center justify-between bg-surface-bright rounded-b-lg font-sans text-xs">
            <span className="text-on-surface-variant">Showing 1-{sortedDeals.length} of {filteredDeals.length} records</span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded text-outline-variant hover:bg-surface-container cursor-not-allowed" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 bg-primary text-on-primary rounded font-bold">1</button>
              <button className="p-1 rounded text-outline-variant hover:bg-surface-container cursor-not-allowed" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detailed inspected deal sidebar card */}
        <AnimatePresence>
          {inspectedDeal && (
            <motion.div 
              layoutId={inspectedDealId || ''}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full lg:w-[320px] bg-surface-light border border-line-soft shadow-[0_4px_16px_rgba(11,37,69,0.06)] rounded-lg p-5 flex flex-col gap-4 self-start"
            >
              <div className="flex justify-between items-start border-b border-line-soft pb-3">
                <div>
                  <h4 className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">Спецификация сделки</h4>
                  <div className="font-sans text-sm font-semibold text-primary font-mono mt-1">{inspectedDeal.id}</div>
                </div>
                <button 
                  onClick={() => setInspectedDealId(null)}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 my-1 text-xs font-semibold text-on-surface">
                <div className="flex justify-between border-b border-line-soft/40 pb-2">
                  <span className="text-on-surface-variant">Контрагент:</span>
                  <span className="text-right">{inspectedDeal.counterparty}</span>
                </div>
                <div className="flex justify-between border-b border-line-soft/40 pb-2">
                  <span className="text-on-surface-variant">Тип инструмента:</span>
                  <span>{inspectedDeal.type}</span>
                </div>
                <div className="flex justify-between border-b border-line-soft/40 pb-2">
                  <span className="text-on-surface-variant">Дата заключения:</span>
                  <span className="font-mono">{inspectedDeal.tradeDate}</span>
                </div>
                <div className="flex justify-between border-b border-line-soft/40 pb-2">
                  <span className="text-on-surface-variant">Дата расчетов/Settle:</span>
                  <span className="font-mono">{inspectedDeal.settleDate}</span>
                </div>

                {/* Instrument specific attributes rendering */}
                {inspectedDeal.type === 'REPO' && (
                  <div className="bg-surface p-3 rounded border border-line-soft flex flex-col gap-2 mt-2">
                    <div className="font-bold text-primary text-[10.5px] uppercase tracking-wider">Параметры залога и РЕПО</div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Collateral:</span>
                      <span>{inspectedDeal.collateral}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">ISIN:</span>
                      <span className="font-mono">{inspectedDeal.isin}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Leg 1 Dir/Qty:</span>
                      <span>{inspectedDeal.leg1Dir === 'B' ? 'Покупка' : 'Продажа'} / {inspectedDeal.leg1Qty?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Leg 2 Total:</span>
                      <span className="font-bold">{inspectedDeal.leg2Total?.toLocaleString()} {inspectedDeal.currency}</span>
                    </div>
                  </div>
                )}

                {inspectedDeal.type === 'SWAP' && (
                  <div className="bg-surface p-3 rounded border border-line-soft flex flex-col gap-2 mt-2">
                    <div className="font-bold text-primary text-[10.5px] uppercase tracking-wider">Параметры СВОП-сделки</div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Leg 1 Buy Ccy/Amt:</span>
                      <span>{inspectedDeal.buyCcy} / {inspectedDeal.buyAmt?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Leg 2 Sell Ccy/Amt:</span>
                      <span>{inspectedDeal.sellCcy} / {inspectedDeal.sellAmt?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Far Leg Pay Date:</span>
                      <span className="font-mono">{inspectedDeal.leg2Date}</span>
                    </div>
                  </div>
                )}

                {inspectedDeal.type === 'IRS' && (
                  <div className="bg-surface p-3 rounded border border-line-soft flex flex-col gap-2 mt-2">
                    <div className="font-bold text-primary text-[10.5px] uppercase tracking-wider">Параметры IRS договора</div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Leg 1 Type / Index:</span>
                      <span>{inspectedDeal.leg1Type} / {inspectedDeal.leg1Index}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Leg 2 Type / Spread:</span>
                      <span>{inspectedDeal.leg2Type} / {inspectedDeal.leg2RateSpread}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-on-surface-variant">Номинал договора:</span>
                      <span className="font-bold">{inspectedDeal.buyAmt?.toLocaleString()} {inspectedDeal.currency}</span>
                    </div>
                  </div>
                )}

                {inspectedDeal.pv !== undefined && (
                  <div className="mt-4 pt-3.5 border-t border-line-soft flex justify-between items-center">
                    <span className="font-bold text-on-surface-variant flex items-center gap-1">
                      Оценка PV <Info className="w-3.5 h-3.5 text-outline cursor-pointer" />
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">
                      {inspectedDeal.pv.toLocaleString()} k RUB
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
