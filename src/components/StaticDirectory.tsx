/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Search, CheckCircle, X, CircleDot, Globe, SortAsc
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
    { code: 'USD', name: 'Доллар США', basis: 'ACT/360', priority: 1, status: 'Active' },
    { code: 'EUR', name: 'Евро', basis: 'ACT/360', priority: 2, status: 'Active' },
    { code: 'RUB', name: 'Российский рубль', basis: 'ACT/365', priority: 3, status: 'Active' },
    { code: 'CNY', name: 'Китайский юань', basis: 'ACT/365', priority: 4, status: 'Active' },
    { code: 'GBP', name: 'Британский фунт', basis: 'ACT/365', priority: 5, status: 'Active' },
    { code: 'CHF', name: 'Швейцарский франк', basis: '30/360', priority: 6, status: 'Active' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newBasis, setNewBasis] = useState('ACT/360');

  const handleAddCurrency = (e: FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    
    const newItem: CurrencyItem = {
      code: newCode.toUpperCase(),
      name: newName,
      basis: newBasis,
      priority: currencies.length + 1,
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
      className="flex flex-col gap-5"
    >
      {/* Compact Header Row: Tabs (NO ICONS) */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-surface-bright p-2 rounded-xl border border-line-soft shadow-sm">
        <div className="flex bg-surface-container rounded-lg p-0.5 border border-line-soft items-center gap-1 flex-wrap">
          {[
            { label: 'СПРАВОЧНИК ВАЛЮТ', value: 'CCY' },
            { label: 'ПЛАВАЮЩИЕ ИНДЕКСЫ', value: 'INDICES' },
            { label: 'РЕЕСТР ОБЛИГАЦИЙ', value: 'BONDS' },
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
      </div>

      {activeSubTab === 'CCY' ? (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* Refined Toolbar */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-line-soft flex flex-wrap items-center gap-4">
            <div className="relative w-48 group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Поиск валюты..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 bg-surface-bright border border-line-soft rounded-lg text-[11px] font-sans focus:outline-none focus:border-primary transition-all"
              />
            </div>
            
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary text-on-primary text-[10px] font-black px-4 py-2 rounded-lg hover:bg-primary-light transition-all shadow-sm uppercase tracking-widest"
            >
              Добавить запись
            </button>

            <button className="ml-auto text-[10px] font-black text-on-surface-variant opacity-60 uppercase tracking-widest">
              Синхронизация: OK
            </button>
          </div>

          {/* Inline Add Form */}
          {showAddForm && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              onSubmit={handleAddCurrency} 
              className="p-5 bg-primary/5 border border-primary/20 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-primary uppercase tracking-widest">Код (ISO)</label>
                <input type="text" maxLength={3} required value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="CAD" className="border border-line rounded-lg p-2 text-xs font-black h-9 bg-white outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-primary uppercase tracking-widest">Наименование</label>
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Канадский доллар" className="border border-line rounded-lg p-2 text-xs font-bold h-9 bg-white outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-primary uppercase tracking-widest">Базис дней</label>
                <select value={newBasis} onChange={e => setNewBasis(e.target.value)} className="border border-line rounded-lg p-2 text-xs font-bold h-9 bg-white outline-none focus:border-primary">
                  <option value="ACT/360">ACT/360</option>
                  <option value="ACT/365">ACT/365</option>
                  <option value="30/360">30/360</option>
                </select>
              </div>
              <div className="flex gap-2 h-9">
                <button type="submit" className="flex-1 bg-pos text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90">Добавить</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-3 bg-white border border-line rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container">Отмена</button>
              </div>
            </motion.form>
          )}

          {/* Table Area */}
          <div className="bg-white rounded-xl shadow-sm border border-line-soft overflow-hidden">
            <div className="overflow-x-auto w-full p-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-line-soft text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-5">Код валюты</th>
                    <th className="py-2.5 px-5 text-left">Полное название</th>
                    <th className="py-2.5 px-5 text-left">Базис расчетов</th>
                    <th className="py-2.5 px-5 text-right">Приоритет</th>
                    <th className="py-2.5 px-5 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-[13px] font-semibold text-on-surface divide-y divide-line-soft">
                  {filteredCurrencies.map((c) => (
                    <tr key={c.code} className="hover:bg-primary/5 transition-all">
                      <td className="py-3 px-5 font-black text-primary font-mono">{c.code}</td>
                      <td className="py-3 px-5 text-on-surface-variant font-bold">{c.name}</td>
                      <td className="py-3 px-5 font-mono text-[12px] opacity-70">{c.basis}</td>
                      <td className="py-3 px-5 text-right font-mono text-[11px] tabular-nums opacity-60">{c.priority}</td>
                      <td className="py-3 px-5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pos/15 text-pos text-[10px] font-black uppercase tracking-tighter">
                          Активен
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'INDICES' ? (
        <div className="bg-white border border-line-soft p-20 text-center rounded-xl text-on-surface font-sans flex flex-col items-center gap-4 animate-fadeIn shadow-sm">
          <Globe className="w-10 h-10 text-primary opacity-20 animate-pulse" />
          <div>
            <div className="font-black text-sm uppercase tracking-widest text-primary">Справочник плавающих ставок</div>
            <p className="text-[11px] font-bold text-on-surface-variant mt-2 uppercase opacity-60">Отображается перечень индикаторов: RUONIA, SOFR, EURIBOR...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-line-soft p-20 text-center rounded-xl text-on-surface font-sans flex flex-col items-center gap-4 animate-fadeIn shadow-sm">
          <SortAsc className="w-10 h-10 text-primary opacity-20 animate-pulse" />
          <div>
            <div className="font-black text-sm uppercase tracking-widest text-primary">Реестр ценных бумаг</div>
            <p className="text-[11px] font-bold text-on-surface-variant mt-2 uppercase opacity-60">ОФЗ, корпоративные еврооблигации и суверенные выпуски.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
