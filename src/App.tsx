/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Landmark, ReceiptText, BarChart3, MenuSquare, Menu,
  HelpCircle, LogOut, Bell, Search, 
  Terminal, ShieldCheck, X, ArrowUpRight,
  Globe, Coins, Percent, RefreshCw
} from 'lucide-react';
import { ActiveTab, Deal, MarketQuote, YieldCurve } from './types';
import { INITIAL_DEALS, MARKET_QUOTES, YIELD_CURVES } from './data/mockData';

// Component imports
import Overview from './components/Overview';
import TradeRegister from './components/TradeRegister';
import MarketQuotes from './components/MarketQuotes';
import StaticDirectory from './components/StaticDirectory';
import FxDerivativesView from './components/FxDerivativesView';
import RepoInstrumentsView from './components/RepoInstrumentsView';
import InterestInstrumentsView from './components/InterestInstrumentsView';
import { Logo } from './components/Logo';
import { DealDetailPanel } from './components/DealDetailPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  // Secondary toggle for Analytics tab: 'summary' (Оперативная сводка) or 'valuation' (Отчёт справедливой стоимости)
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'summary' | 'valuation'>('summary');
  
  // App state
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [quotes, setQuotes] = useState<MarketQuote[]>(MARKET_QUOTES);
  const [curves, setCurves] = useState<YieldCurve[]>(YIELD_CURVES);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global deal inspection
  const [inspectedDealId, setInspectedDealId] = useState<string | null>(null);

  const tabTitles: Record<ActiveTab, string> = {
    overview: 'Оперативная сводка',
    fx_derivatives: 'Валютные деривативы',
    repo_instruments: 'Сделки РЕПО',
    rate_derivatives: 'Процентные деривативы',
    deals: 'Импорт & Сделки (Live)',
    market_data: 'Рыночные котировки',
    directories: 'Справочники',
  };

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleInspectDeal = (id: string) => {
    setInspectedDealId(id);
  };

  const activeInspectedDeal = deals.find(d => d.id === inspectedDealId) || null;

  return (
    <div className="min-h-screen bg-bg-page-light text-on-surface flex flex-row antialiased">
      
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-primary/45 z-40 md:hidden cursor-pointer"
        />
      )}

      {/* SideNavBar Component */}
      <aside className={`fixed left-0 top-0 h-full ${isSidebarCollapsed ? 'w-[72px]' : 'w-[248px]'} bg-primary text-on-primary shadow-lg flex flex-col py-4 z-50 transition-all duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex border-r border-primary/20`}>
        
        {/* Mobile menu close button */}
        <div className="md:hidden flex justify-end px-4 mb-4">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3">
          
          {/* TAB 1: Overview */}
          <button 
            onClick={() => selectTab('overview')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={isSidebarCollapsed ? 'Сводка' : ''}
          >
            <span>Сводка</span>
          </button>
 
          {/* TAB 2: FX Derivatives */}
          <button 
            onClick={() => selectTab('fx_derivatives')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'fx_derivatives'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={isSidebarCollapsed ? 'Валютные деривативы' : ''}
          >
            <span>Валютные деривативы</span>
          </button>
 
          {/* TAB 3: REPO Instruments */}
          <button 
            onClick={() => selectTab('repo_instruments')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'repo_instruments'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={isSidebarCollapsed ? 'Сделки РЕПО' : ''}
          >
            <span>Сделки РЕПО</span>
          </button>
 
          {/* TAB 4: Interest Instruments */}
          <button 
            onClick={() => selectTab('rate_derivatives')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'rate_derivatives'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={isSidebarCollapsed ? 'Процентные деривативы' : ''}
          >
            <span>Процентные деривативы</span>
          </button>
 
          {/* TAB 5: Deals Register */}
          <button 
            onClick={() => selectTab('deals')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'deals'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={isSidebarCollapsed ? 'Импорт & Сделки (Live)' : ''}
          >
            <span>Импорт & Сделки (Live)</span>
          </button>
 
          {/* TAB 6: Market Data */}
          <button 
            onClick={() => selectTab('market_data')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'market_data'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={isSidebarCollapsed ? 'Рыночные котировки' : ''}
          >
            <span>Рыночные котировки</span>
          </button>
 
          {/* TAB 7: Directories */}
          <button 
            onClick={() => selectTab('directories')}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'directories'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={isSidebarCollapsed ? 'Справочники' : ''}
          >
            <span>Справочники</span>
          </button>
 
        </nav>
      </aside>

      {/* Main Content Area Wrapper */}
      <div 
        className="flex-1 flex flex-col min-h-screen relative transition-all duration-300 ease-in-out"
        style={{ marginLeft: isMobileMenuOpen ? 0 : (isSidebarCollapsed ? '72px' : '248px') }}
      >
        
        {/* TopNavBar Component */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6 bg-surface-bright border-b border-line-soft shrink-0 shadow-sm">
          
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-3">
              {/* Toggle Sidebar Button (Desktop) */}
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1.5 hover:bg-surface-container rounded-lg text-primary cursor-pointer transition-colors"
                title={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
              >
                <Menu className="w-4.5 h-4.5" />
              </button>

              {/* Hamburger menu for mobile */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 hover:bg-surface-container rounded-lg text-primary cursor-pointer transition-colors"
                title="Открыть меню"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
              
              <Logo className="w-32 h-auto transition-all duration-300" />
            </div>

            <div className="hidden xl:block w-px h-5 bg-line-soft"></div>

            <div className="hidden md:flex flex-col leading-tight">
              <h1 className="font-sans text-[13px] font-black text-on-surface tracking-tight uppercase">
                {tabTitles[activeTab]}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-sans text-[8px] text-on-surface-variant font-bold tracking-widest uppercase opacity-60">Аналитика ПФИ</span>
              </div>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            
            {/* Global Search (more compact) */}
            <div className="hidden lg:block relative group max-w-[280px] w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Поиск по реестру..."
                className="pl-8 pr-3 h-8 w-full bg-surface-container/40 border border-line-soft rounded-lg text-[12px] font-sans focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
              />
            </div>

            <div className="w-[1.5px] h-4 bg-line-soft hidden lg:block"></div>

            <div className="flex items-center gap-3">
              <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full relative transition-colors cursor-pointer group">
                <Bell className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-neg rounded-full border-2 border-surface-bright"></span>
              </button>
              
              <div className="flex items-center gap-2.5 pl-2 border-l border-line-soft h-8">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-sans text-xs font-black shadow-inner">
                  П
                </div>
                <div className="hidden xl:block text-left select-none leading-none">
                  <div className="font-sans text-[11px] font-black text-on-surface">Пользователь</div>
                  <div className="font-sans text-[8px] font-bold text-on-surface-variant opacity-50 mt-0.5">Аналитик ПФИ</div>
                </div>
              </div>
            </div>

          </div>

        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-[1600px] mx-auto w-full"
            >
              {activeTab === 'overview' && (
                <Overview 
                  deals={deals} 
                  quotes={quotes} 
                  curves={curves} 
                  onNavigate={setActiveTab}
                  onRefresh={() => {}}
                  onInspectDeal={handleInspectDeal}
                />
              )}
              {activeTab === 'fx_derivatives' && (
                <FxDerivativesView 
                  deals={deals} 
                  quotes={quotes} 
                  curves={curves} 
                  onRefresh={() => {}}
                  onInspectDeal={handleInspectDeal}
                />
              )}
              {activeTab === 'repo_instruments' && (
                <RepoInstrumentsView 
                  deals={deals} 
                  quotes={quotes} 
                  onRefresh={() => {}}
                  onInspectDeal={handleInspectDeal}
                />
              )}
              {activeTab === 'rate_derivatives' && (
                <InterestInstrumentsView 
                  deals={deals} 
                  curves={curves} 
                  onRefresh={() => {}}
                  onInspectDeal={handleInspectDeal}
                />
              )}
              {activeTab === 'deals' && (
                <TradeRegister 
                  deals={deals} 
                  onInspectDeal={handleInspectDeal}
                />
              )}
              {activeTab === 'market_data' && (
                <MarketQuotes 
                  quotes={quotes} 
                  curves={curves} 
                  onRefresh={() => {}}
                />
              )}
              {activeTab === 'directories' && <StaticDirectory />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Deal Detail Overlay */}
        <AnimatePresence>
          {activeInspectedDeal && (
            <DealDetailPanel 
              deal={activeInspectedDeal} 
              onClose={() => setInspectedDealId(null)} 
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
