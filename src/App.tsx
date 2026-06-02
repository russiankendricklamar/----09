/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Landmark, ReceiptText, BarChart3, MenuSquare, Menu,
  Settings2, HelpCircle, LogOut, Bell, Settings, Search, 
  Terminal, ShieldCheck, Sparkles, Send, X, ArrowUpRight,
  Globe, Coins, Percent
} from 'lucide-react';
import { ActiveTab, Deal, MarketQuote, YieldCurve } from './types';
import { INITIAL_DEALS, MARKET_QUOTES, YIELD_CURVES } from './data/mockData';

// Component imports
import Overview from './components/Overview';
import ValuationReport from './components/ValuationReport';
import TradeRegister from './components/TradeRegister';
import MarketQuotes from './components/MarketQuotes';
import StaticDirectory from './components/StaticDirectory';
import SettingsView from './components/SettingsView';
import FxDerivativesView from './components/FxDerivativesView';
import RepoInstrumentsView from './components/RepoInstrumentsView';
import RateDerivativesView from './components/RateDerivativesView';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  // Secondary toggle for Analytics tab: 'summary' (Оперативная сводка) or 'valuation' (Отчёт справедливой стоимости)
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'summary' | 'valuation'>('summary');
  
  // App state
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [quotes, setQuotes] = useState<MarketQuote[]>(MARKET_QUOTES);
  const [curves, setCurves] = useState<YieldCurve[]>(YIELD_CURVES);
  const [env, setEnv] = useState<'PROD_MAIN' | 'CMPN_ENV'>('PROD_MAIN');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // AI assistant drawer state
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Приветствую! Я автоматизированный аналитический ассистент Банка России. Задайте любой вопрос по справедливой стоимости сделок ПФИ, теоретическим кривым доходности OIS или методологии оценки.'
    }
  ]);

  // Support popup
  const [showSupport, setShowSupport] = useState(false);

  const triggerReset = () => {
    localStorage.clear();
    setDeals(INITIAL_DEALS);
    setQuotes(MARKET_QUOTES);
    setCurves(YIELD_CURVES);
    window.location.reload();
  };

  const handleAiSend = (e: FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: aiInput
    };

    setMessages(prev => [...prev, userMsg]);
    const normalizedInput = aiInput.toLowerCase();
    setAiInput('');

    // Pre-baked expert answers mimicking professional analysis
    setTimeout(() => {
      let responseText = '';
      if (normalizedInput.includes('формул') || normalizedInput.includes('formula') || normalizedInput.includes('расчет')) {
        responseText = 'Для оценки SPOT/FORWARD используется базовая модель:\n`PV = (Market_Rate - Deal_Rate) * Notional * DF`.\nПри расчете IRS дисконтируются все будущие фиксированные и плавающие потоки по кривой OIS Zero Coupon.';
      } else if (normalizedInput.includes('1003') || normalizedInput.includes('failed') || normalizedInput.includes('отклон')) {
        responseText = 'Сделка FX-2023-1003 (CNY/RUB) была отклонена системой (Failed), так как курс сделки равен 13.8500 при рыночном курсе 13.5000. Отклонение составляет +2.45%, что существенно превышает установленный лимит толерантности в 15 bps!';
      } else if (normalizedInput.includes('крив') || normalizedInput.includes('ois') || normalizedInput.includes('curve')) {
        responseText = 'Кривые Zero Coupon импортируются из MOEX/ЦБ РФ. Текущий дисконтированный спред USD_S23_OIS показывает стабильность на уровне 5.38% на 3-месячном горизонте.';
      } else {
        responseText = 'Я проанализировал текущий портфель сделок. Обнаружено 22 внерыночных отклонения. Наибольший комплаенс-риск связан со сделками по процентным контрактам IRS/CIRS с превышением лимита на +45 bps.';
      }

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'assistant',
        text: responseText
      }]);
    }, 705);
  };

  const currentYear = new Date().getFullYear();

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

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
      <aside className={`fixed left-0 top-0 h-full w-[248px] bg-primary text-on-primary shadow-lg flex flex-col py-6 z-50 transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex border-r border-primary-container`}>
        
        {/* Nav Header */}
        <div className="px-5 mb-8 flex items-center justify-between gap-2.5">
          <div className="flex flex-col gap-1 w-full">
            {/* 100% Client-side reliable vector brand logo — circular emblem and serif text */}
            <div className="flex items-center gap-2.5">
              <div className="p-1 px-1.5 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-9 h-9 text-white" fill="currentColor">
                  {/* Detailed double headed eagle - Russian Central Bank emblem style */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4.5" />
                  <path d="M50,22 L51.5,23.5 L52.5,22 C53.5,20.5 56,17.5 58,19 C60,20.5 59.5,24 57,25.5 L59.5,27.5 L60.5,26 C62,24 65.5,20 67.5,22 C69.5,24 67.5,28.5 64.5,30 C69,30 73.5,25.5 76,27.5 C78.5,29.5 76.5,33.5 73,35 C77.5,35 81,31 83.5,33.5 C86,36 81.5,41 77.5,41 C82.5,42.5 86.5,40.5 88,44.5 C89.5,48.5 86,52 82,53 C85,55 86.5,59.5 84,62.5 C81.5,65.5 77.5,65 74.5,60.5 C76,64.5 74,68.5 70.5,70 C67,71.5 65.5,66 64.5,61.5 C64,65.5 61,68 58.5,69 C56,70 55,65.5 54.5,61 C53.5,65 52,69.5 50,76.5 C48,69.5 46.5,65 45.5,61 C45,65.5 44,70 41.5,69 C39,68 36,65.5 35.5,61.5 C34.5,66 33,71.5 29.5,70 C26,68.5 24,64.5 25.5,60.5 C22.5,65 18.5,65.5 16,62.5 C13.5,59.5 15,55 18,53 C14,52 10.5,48.5 12,44.5 C13.5,40.5 17.5,42.5 22.5,41 C18.5,41 14,36 16.5,33.5 C19,31 22.5,35 27,35 C23.5,33.5 21.5,29.5 24,27.5 C26.5,25.5 31,30 35.5,30 C32.5,28.5 30.5,24 32.5,22 C34.5,20 38,24 39.5,26 L40.5,27.5 L43,25.5 C40.5,24 40,20.5 42,19 C44,17.5 46.5,20.5 47.5,22 L48.5,23.5 L50,22 Z" />
                  <path d="M41,44 L59,44 M43,48 L57,48 M45,52 L55,52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M40,56 L44,61" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M60,56 L56,61" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-[15.5px] font-bold text-white tracking-wide leading-none uppercase select-none">Банк России</span>
              </div>
            </div>
            
            <p className="font-sans text-[8.5px] text-slate-300/80 font-black tracking-widest leading-none mt-1.5 uppercase select-none">Аналитика ПФИ</p>
          </div>
          {/* Close button inside sidebar on mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3">
          
          {/* TAB 1: Overview */}
          <button 
            onClick={() => selectTab('overview')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white/10 text-white border-l-2 border-secondary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Сводка (Dashboard)</span>
          </button>
 
          {/* TAB 2: FX Derivatives */}
          <button 
            onClick={() => selectTab('fx_derivatives')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'fx_derivatives'
                ? 'bg-white/10 text-white border-l-2 border-secondary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Валютные инструменты</span>
          </button>
 
          {/* TAB 3: REPO Instruments */}
          <button 
            onClick={() => selectTab('repo_instruments')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'repo_instruments'
                ? 'bg-white/10 text-white border-l-2 border-secondary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Инструменты РЕПО</span>
          </button>
 
          {/* TAB 4: Rate Derivatives */}
          <button 
            onClick={() => selectTab('rate_derivatives')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'rate_derivatives'
                ? 'bg-white/10 text-white border-l-2 border-secondary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Процентные ставки & Кривые</span>
          </button>
 
          {/* TAB 5: Deals Register */}
          <button 
            onClick={() => selectTab('deals')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'deals'
                ? 'bg-white/10 text-white border-l-2 border-secondary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Импорт & Сделки (Live)</span>
          </button>
 
          {/* TAB 6: Market Data */}
          <button 
            onClick={() => selectTab('market_data')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'market_data'
                ? 'bg-white/10 text-white border-l-2 border-secondary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Рыночные котировки</span>
          </button>
 
          {/* TAB 7: Directories */}
          <button 
            onClick={() => selectTab('directories')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'directories'
                ? 'bg-white/10 text-white border-l-2 border-secondary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MenuSquare className="w-4 h-4" />
            <span>Справочники</span>
          </button>
 
          {/* TAB 8: Configuration */}
          <button 
            onClick={() => selectTab('configuration')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'configuration'
                ? 'bg-white/10 text-white border-l-2 border-secondary shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Параметры</span>
          </button>
 
        </nav>
 
        {/* Footer Navigation */}
        <div className="px-3 border-t border-white/10 pt-4 flex flex-col gap-1.5 mt-auto">
          
          {/* Support toggle */}
          <button 
            onClick={() => {
              setShowSupport(true);
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2 text-[#cad8ed] hover:text-white rounded-lg text-left font-sans text-xs font-bold hover:bg-[#004b87]/30 transition-all cursor-pointer w-full"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Поддержка</span>
          </button>
 
          {/* Exit / Reset */}
          <button 
            onClick={() => {
              triggerReset();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2 text-[#cad8ed] hover:text-white rounded-lg text-left font-sans text-xs font-bold hover:bg-[#004b87]/30 transition-all cursor-pointer w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Сброс данных</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col ml-0 md:ml-[248px] min-h-screen relative overflow-x-hidden">
        
        {/* TopNavBar Component */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-surface-bright border-b border-line-soft shrink-0">
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Hamburger helper for mobile screens */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-surface-container rounded-lg text-on-surface-variant cursor-pointer transition-colors"
              title="Открыть меню"
            >
              <Menu className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            
            <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>

            <div className="w-[1.5px] h-5 bg-line-soft"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary text-on-primary flex items-center justify-center font-sans text-xs font-bold">
                AA
              </div>
              <div className="hidden sm:block text-left select-none">
                <div className="font-sans text-[11.5px] font-bold text-on-surface">Андрей Антонов</div>
                <div className="font-sans text-[9.5px] font-semibold text-on-surface-variant leading-none">Комплаенс-контроль</div>
              </div>
            </div>

          </div>

        </header>

        {/* Scrollable Canvas for views */}
        <main className="flex-1 p-4 md:p-6">
          
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                {/* Visual subtab controller inside Overview tab to allow toggling summary dashboard vs valuation tables */}
                <div className="flex gap-6 border-b border-line-soft">
                  <button
                    onClick={() => setAnalyticsSubTab('summary')}
                    className={`pb-3 font-sans text-xs font-bold tracking-tight cursor-pointer transition-all border-b-2 ${
                      analyticsSubTab === 'summary' 
                        ? 'border-primary text-primary font-extrabold' 
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Аналитическая Сводка (Dashboard)
                  </button>
                  <button
                    onClick={() => setAnalyticsSubTab('valuation')}
                    className={`pb-3 font-sans text-xs font-bold tracking-tight cursor-pointer transition-all border-b-2 ${
                      analyticsSubTab === 'valuation' 
                        ? 'border-primary text-primary font-extrabold' 
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Аудиторский отчет (Valuation Excel)
                  </button>
                </div>

                {analyticsSubTab === 'summary' ? (
                  <Overview 
                    deals={deals} 
                    quotes={quotes} 
                    curves={curves}
                    onNavigate={(tab) => {
                      if (tab === 'deals') setActiveTab('deals');
                    }}
                    onRefresh={() => {
                      // Mock refreshing data
                      const shiftedDeals = deals.map(d => ({
                        ...d,
                        pv: d.pv * (1 + (Math.random() - 0.5) * 0.02)
                      }));
                      setDeals(shiftedDeals);
                    }}
                  />
                ) : (
                  <ValuationReport deals={deals} quotes={quotes} curves={curves} />
                )}
              </div>
            )}

            {activeTab === 'fx_derivatives' && (
              <FxDerivativesView 
                deals={deals} 
                quotes={quotes} 
                curves={curves} 
                onRefresh={() => {
                  const shiftedQuotes = quotes.map(q => ({
                    ...q,
                    last: q.last * (1 + (Math.random() - 0.5) * 0.01)
                  }));
                  setQuotes(shiftedQuotes);
                }}
              />
            )}

            {activeTab === 'repo_instruments' && (
              <RepoInstrumentsView 
                deals={deals} 
                quotes={quotes} 
                onRefresh={() => {
                  const shiftedDeals = deals.map(d => ({
                    ...d,
                    pv: d.pv * (1 + (Math.random() - 0.5) * 0.02)
                  }));
                  setDeals(shiftedDeals);
                }} 
              />
            )}

            {activeTab === 'rate_derivatives' && (
              <RateDerivativesView 
                deals={deals} 
                curves={curves} 
                onRefresh={() => {
                  // Rebuilding curve factors
                  const shiftedCurves = curves.map(c => ({
                    ...c,
                    nodes: c.nodes.map(n => ({
                      ...n,
                      rate: n.rate + (Math.random() - 0.5) * 0.05
                    }))
                  }));
                  setCurves(shiftedCurves);
                }} 
              />
            )}

            {activeTab === 'deals' && (
              <TradeRegister deals={deals} />
            )}

            {activeTab === 'market_data' && (
              <MarketQuotes 
                quotes={quotes} 
                curves={curves}
                onRefresh={() => {
                  const shiftedQuotes = quotes.map(q => ({
                    ...q,
                    last: q.last * (1 + (Math.random() - 0.5) * 0.01)
                  }));
                  setQuotes(shiftedQuotes);
                }}
              />
            )}

            {activeTab === 'directories' && (
              <StaticDirectory />
            )}

            {activeTab === 'configuration' && (
              <SettingsView />
            )}
          </AnimatePresence>

        </main>

        {/* Sliding Side AI Copilot Assistant Drawer */}
        <AnimatePresence>
          {showAiAssistant && (
            <>
              {/* Backdrop lock */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAiAssistant(false)}
                className="fixed inset-0 bg-primary z-50 cursor-pointer"
              ></motion.div>

              {/* Chat panel drawer */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-surface-light z-50 shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Assistant header */}
                <div className="p-4 bg-primary text-on-primary flex items-center justify-between shrink-0 shadow-md">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#abc7ff]" />
                    <div>
                      <h3 className="font-sans text-sm font-bold leading-normal">Аналитический Копилот</h3>
                      <p className="font-sans text-[10px] text-on-primary-container leading-none font-semibold">ИИ Помощник</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAiAssistant(false)}
                    className="p-1 px-1.5 hover:bg-white/10 rounded text-on-primary-container hover:text-on-primary transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages scroll box */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className={`p-3 rounded-lg text-xs leading-normal font-semibold shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-primary text-on-primary rounded-tr-none' 
                          : 'bg-surface-container text-on-surface rounded-tl-none border border-line-soft'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fast prompts suggestions */}
                <div className="px-4 py-2 border-t border-line-soft flex flex-wrap gap-1.5 shrink-0 bg-surface">
                  <button 
                    onClick={() => setAiInput('Объясни формулу Spot')}
                    className="text-[10.5px] font-semibold text-primary bg-surface-light hover:bg-surface-container border border-line-soft py-1 px-2 rounded-sm cursor-pointer shadow-sm"
                  >
                    Формула Spot
                  </button>
                  <button 
                    onClick={() => setAiInput('Почему сделка FX-2023-1003 вне рынка?')}
                    className="text-[10.5px] font-semibold text-primary bg-surface-light hover:bg-surface-container border border-line-soft py-1 px-2 rounded-sm cursor-pointer shadow-sm"
                  >
                    Исключение 1003
                  </button>
                  <button 
                    onClick={() => setAiInput('Предельный лимит на IRS?')}
                    className="text-[10.5px] font-semibold text-primary bg-surface-light hover:bg-surface-container border border-line-soft py-1 px-2 rounded-sm cursor-pointer shadow-sm"
                  >
                    Лимит на IRS
                  </button>
                </div>

                {/* Form submit input spacer */}
                <form onSubmit={handleAiSend} className="p-3 bg-surface-bright border-t border-line-soft flex gap-2 shrink-0">
                  <input 
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Напишите вопрос аналитику..."
                    className="flex-grow border border-line rounded px-3 py-1.5 text-xs text-on-surface bg-surface-light focus:outline-none focus:border-primary h-9"
                  />
                  <button 
                    type="submit"
                    className="bg-primary text-on-primary w-9 h-9 rounded flex items-center justify-center shrink-0 hover:bg-primary-container transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Support Modal dialog */}
        <AnimatePresence>
          {showSupport && (
            <div className="fixed inset-0 bg-primary/40 flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-light rounded-lg border border-line p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-on-surface"
              >
                <div className="flex justify-between items-center border-b border-line-soft pb-2">
                  <h3 className="font-sans text-sm font-bold text-primary">Служба технической поддержки</h3>
                  <button onClick={() => setShowSupport(false)} className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 font-sans text-xs font-semibold leading-relaxed">
                  <p>Если у вас возникли неполадки при расчете кривых Zero Coupon, экспорте отчетов или получении котировок, обратитесь по контактам ниже:</p>
                  
                  <div className="bg-surface-container p-3 rounded border border-line-soft space-y-1 text-[11.5px] tabular-nums text-primary font-semibold">
                    <div>Телефон поддержки: 8-800-PARR-SUP</div>
                    <div>Email: support-parr@cbr.ru</div>
                    <div>Внутренний шлюз: COMPN-140-52</div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSupport(false)}
                  className="w-full bg-primary text-on-primary py-2 rounded text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer mt-2"
                >
                  Закрыть
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
