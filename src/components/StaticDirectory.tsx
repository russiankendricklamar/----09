/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Download, Plus, Search, HelpCircle, Route, SortAsc,
  CheckCircle, Globe, Terminal, Building2, Check, X
} from 'lucide-react';

interface CurrencyItem {
  code: string;
  name: string;
  basis: string;
  priority: number;
  status: 'Active' | 'Inactive';
}

export default function StaticDirectory() {
  const [activeSubTab, setActiveSubTab] = useState<'CCY' | 'INDICES' | 'BONDS' | 'OTHER'>('CCY');
  
  // Custom interactive local currency master lists
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([
    { code: 'USD', name: 'US Dollar', basis: 'ACT/360', priority: 1, status: 'Active' },
    { code: 'EUR', name: 'Euro', basis: 'ACT/360', priority: 2, status: 'Active' },
    { code: 'RUB', name: 'Russian Ruble', basis: 'ACT/365', priority: 3, status: 'Active' },
    { code: 'CNY', name: 'Chinese Yuan', basis: 'ACT/365', priority: 4, status: 'Active' },
    { code: 'GBP', name: 'British Pound', basis: 'ACT/365', priority: 5, status: 'Active' },
    { code: 'CHF', name: 'Swiss Franc', basis: '30/360', priority: 6, status: 'Active' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Fields for adding a new item mock
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newBasis, setNewBasis] = useState('ACT/360');
  const [newPriority, setNewPriority] = useState(7);

  const handleAddCurrency = (e: FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    
    const newItem: CurrencyItem = {
      code: newCode.toUpperCase(),
      name: newName,
      basis: newBasis,
      priority: Number(newPriority),
      status: 'Active'
    };

    setCurrencies([...currencies, newItem]);
    setNewCode('');
    setNewName('');
    setShowAddForm(false);
  };

  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Page header and tab controls */}
      <div className="flex flex-col gap-4">
        <h2 className="font-sans text-xl font-bold tracking-tight text-primary">Статические справочники и метаданные</h2>
        
        {/* Segmented control tabs */}
        <div className="inline-flex bg-surface-container-low p-1 rounded border border-line-soft gap-1 self-start shadow-inner">
          <button
            onClick={() => setActiveSubTab('CCY')}
            className={`px-4 py-1.5 rounded font-sans text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'CCY'
                ? 'bg-surface-light shadow text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Currencies Master
          </button>
          <button
            onClick={() => setActiveSubTab('INDICES')}
            className={`px-4 py-1.5 rounded font-sans text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'INDICES'
                ? 'bg-surface-light shadow text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Floating Indices
          </button>
          <button
            onClick={() => setActiveSubTab('BONDS')}
            className={`px-4 py-1.5 rounded font-sans text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'BONDS'
                ? 'bg-surface-light shadow text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Registered Bonds
          </button>
        </div>
      </div>

      {activeSubTab === 'CCY' ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Left Area: Currency Master List (Spans 8 columns) */}
          <div className="col-span-12 lg:col-span-8 bg-surface-light rounded-lg shadow-sm border border-line-soft flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-line-soft flex justify-between items-center bg-surface-bright flex-wrap gap-4">
              <h3 className="font-sans text-sm font-bold text-primary">Currency Master list</h3>
              
              {/* Toolbar search + button */}
              <div className="flex gap-2.5 items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-outline-variant w-3.5 h-3.5" />
                  <input 
                    type="text"
                    placeholder="Найти валюту..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-2 py-1 border border-line rounded font-sans text-xs text-primary focus:outline-none focus:border-primary-container bg-surface-light w-40 h-8"
                  />
                </div>
                
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded hover:bg-primary-container transition-all flex items-center gap-1 cursor-pointer h-8"
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить
                </button>
              </div>
            </div>

            {/* Inline add currency subform */}
            {showAddForm && (
              <form onSubmit={handleAddCurrency} className="p-4 bg-surface-container border-b border-line-soft grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Код (e.g. CAD)</label>
                  <input 
                    type="text" 
                    maxLength={3} 
                    required 
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="CAD"
                    className="border border-line rounded p-1.5 text-xs font-sans h-8 w-full uppercase focus:ring-0" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Название валюты</label>
                  <input 
                    type="text" 
                    required 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Canadian Dollar"
                    className="border border-line rounded p-1.5 text-xs font-sans h-8 w-full focus:ring-0" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Базис дней (Basis)</label>
                  <select 
                    value={newBasis}
                    onChange={e => setNewBasis(e.target.value)}
                    className="border border-line rounded p-1.5 text-xs font-sans h-8 w-full focus:ring-0"
                  >
                    <option value="ACT/360">ACT/360</option>
                    <option value="ACT/365">ACT/365</option>
                    <option value="30/360">30/360</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-pos text-on-error px-4 h-8 rounded text-xs font-bold hover:opacity-90 flex-1">
                    Ok
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="bg-surface-light border border-line px-3 h-8 rounded text-xs hover:bg-surface-container">
                    Отмена
                  </button>
                </div>
              </form>
            )}

            {/* List Table */}
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-low text-[11px] font-bold text-on-surface-variant border-b border-line-soft">
                  <tr>
                    <th className="py-2.5 px-5 text-left">Код (CCY)</th>
                    <th className="py-2.5 px-5 text-left">Полное название</th>
                    <th className="py-2.5 px-5 text-left">Временной базис</th>
                    <th className="py-2.5 px-5 text-right">Приоритет</th>
                    <th className="py-2.5 px-5 text-center">Статус</th>
                    <th className="py-2.5 px-5 text-center">Связанные шлюзы</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-[13px] font-semibold text-primary divide-y divide-line-soft">
                  {filteredCurrencies.map((c) => (
                    <tr key={c.code} className="hover:bg-surface-container transition-all">
                      <td className="py-3 px-5 font-bold text-primary font-mono">{c.code}</td>
                      <td className="py-3 px-5 text-left text-on-surface-variant font-medium">{c.name}</td>
                      <td className="py-3 px-5 text-left text-on-surface-variant font-medium">{c.basis}</td>
                      <td className="py-3 px-5 text-right font-mono text-xs tabular-nums">{c.priority}</td>
                      <td className="py-3 px-5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pos/15 text-pos text-[11px] font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-3 text-secondary">
                          <button className="hover:text-primary transition-all cursor-pointer" title="Bloomberg Terminal Link">
                            <Terminal className="w-4 h-4" />
                          </button>
                          <button className="hover:text-primary transition-all cursor-pointer" title="CBRF Russian Central Bank Link">
                            <Building2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Area: Spans 4 columns holding reference material */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            {/* Logic instructions card */}
            <div className="bg-surface-light rounded-lg shadow-sm border border-line-soft flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-line-soft bg-surface-bright flex items-center gap-2">
                <Route className="w-4 h-4 text-secondary" />
                <h3 className="font-sans text-sm font-bold text-primary">Cross-Rate Logic Matrix</h3>
              </div>
              <div className="p-5 font-sans text-xs font-semibold text-on-surface-variant leading-relaxed">
                <p className="mb-2">Система автоматически рассчитывает недоступные кросс-курсы через базовый якорь <span className="text-primary font-bold">USD</span>.</p>
                <div className="bg-surface-container-low border border-line rounded p-3 mt-4">
                  <span className="text-[10px] font-bold text-primary block uppercase mb-1">Формула кросс-расчёта</span>
                  <code className="font-mono text-[10.5px] text-primary block bg-surface-light p-2.5 border border-line-soft rounded whitespace-pre">
                    IF (CCY1 = 'USD') THEN Rate = Base(CCY2)<br />
                    ELSE Rate = Base(CCY1) / Base(CCY2)
                  </code>
                </div>
              </div>
            </div>

            {/* Priority metadata levels */}
            <div className="bg-surface-light rounded-lg shadow-sm border border-line-soft flex flex-col overflow-hidden flex-grow">
              <div className="px-5 py-4 border-b border-line-soft bg-surface-bright flex justify-between items-center">
                <h3 className="font-sans text-sm font-bold text-primary">Приоритет котирования</h3>
                <SortAsc className="w-4 h-4 text-outline" />
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-line-soft/40 pb-2.5 font-sans text-[12.5px] font-semibold text-on-surface">
                  <span className="text-on-surface-variant">Tier 1 (Majors)</span>
                  <span className="text-primary font-bold">USD, EUR, GBP, JPY</span>
                </div>
                <div className="flex justify-between items-center border-b border-line-soft/40 pb-2.5 font-sans text-[12.5px] font-semibold text-on-surface">
                  <span className="text-on-surface-variant">Tier 2 (Regional)</span>
                  <span className="text-primary font-bold">RUB, CNY, INR</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 font-sans text-[12.5px] font-semibold text-on-surface">
                  <span className="text-on-surface-variant">Tier 3 (Exotics)</span>
                  <span className="text-primary font-bold">ZAR, TRY, BRL</span>
                </div>
                <p className="font-sans text-[10px] text-outline text-center mt-2">
                  Приоритет влияет на порядок вычисления спреда в биржевой сетке.
                </p>
              </div>
            </div>

          </div>
        </div>
      ) : activeSubTab === 'INDICES' ? (
        <div className="bg-surface-light border border-line-soft p-12 text-center rounded-lg text-on-surface font-sans text-xs flex flex-col items-center gap-3">
          <Globe className="w-8 h-8 text-primary animate-pulse" />
          <div>
            <div className="font-bold text-sm">Справочники плавающих ставок (Floating Indices)</div>
            <p className="text-on-surface-variant mt-1">Отображается перечень индикаторов: RUONIA, SOFR, EURIBOR, LIBOR...</p>
          </div>
        </div>
      ) : (
        <div className="bg-surface-light border border-line-soft p-12 text-center rounded-lg text-on-surface font-sans text-xs flex flex-col items-center gap-3">
          <SortAsc className="w-8 h-8 text-primary animate-pulse" />
          <div>
            <div className="font-bold text-sm">Реестр зарегистрированных ценных бумаг (Bonds)</div>
            <p className="text-on-surface-variant mt-1">ОФЗ, корпоративные еврооблигации Минфина РФ, суверенные выпуски.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
