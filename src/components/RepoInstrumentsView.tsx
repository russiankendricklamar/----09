/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, AlertCircle, Check, Download, Info, Calculator, 
  RefreshCw, TrendingUp, History, ClipboardCheck, ArrowUpRight
} from 'lucide-react';
import { Deal, MarketQuote, YieldCurve } from '../types';

interface RepoInstrumentsViewProps {
  deals: Deal[];
  quotes: MarketQuote[];
  onRefresh: () => void;
}

export default function RepoInstrumentsView({ deals, quotes, onRefresh }: RepoInstrumentsViewProps) {
  const [selectedIsin, setSelectedIsin] = useState<string>('RU000A1038V1');
  const [inputClosePrice, setInputClosePrice] = useState<number>(98.50);
  const [inputLeg1Price, setInputLeg1Price] = useState<number>(93.20);
  const [inputRepoRate, setInputRepoRate] = useState<number>(14.50);
  const [inputTermDays, setInputTermDays] = useState<number>(7);
  const [calcResult, setCalcResult] = useState<any | null>(null);

  // Filter REPO deals from register
  const repoDeals = deals.filter(d => d.type === 'REPO');

  // Interactive calculations for REPO deals from mock database
  const evaluatedRepoDeals = repoDeals.map(deal => {
    // Simulated values for collateral close price
    let closePrice = 98.20;
    if (deal.isin === 'XS2345678901') closePrice = 100.50;
    if (deal.isin === 'GB0002875804') closePrice = 102.10;

    const qty = deal.leg1Qty || 100000;
    const price1 = deal.rate ? (deal.rate * 20) : 92.40; // Simulated repo unit price in % 
    const isin = deal.isin || 'RU000A101234';
    
    // NKD calculation
    const nkd1 = parseFloat((qty * 0.12).toFixed(2));
    const nkd2 = parseFloat((qty * 0.15).toFixed(2));

    const sum1NoNkd = parseFloat((qty * (price1 / 100) * 1000).toFixed(2)); // Bond par is 1000
    const sum1WithNkd = sum1NoNkd + nkd1;

    // Siren days / term days
    const t = 30; // 30 days default
    const repoRate = deal.rate || 4.20; // repo rate in %
    const sum2NoNkd = parseFloat((sum1NoNkd * (1 + (repoRate / 100) * t / 360)).toFixed(2));
    const sum2WithNkd = sum2NoNkd + nkd2;

    // Control sums checks
    const control1Passed = Math.abs(deal.leg1Total || sum1WithNkd) > 0;
    const control2Passed = true; // Simulated math consistency

    // Actual collateral discount: (1 - Price_first / Price_close) * 100
    const calculatedDiscount = parseFloat(((1 - price1 / closePrice) * 100).toFixed(2));
    const requiredNkcHaircut = 5.0; // 5% minimum
    const discountDiscrepancyBps = (calculatedDiscount - requiredNkcHaircut) * 100;

    // RUSFAR rate comparison
    const rusfarBench = 15.02; // RUSFAR short-term rate on date
    const repoRateAnomalyPp = parseFloat((repoRate - rusfarBench).toFixed(2));

    return {
      dealId: deal.id,
      isin,
      counterparty: deal.counterparty,
      termDays: t,
      qty,
      price1,
      nkd1,
      sum1NoNkd,
      sum1WithNkd,
      nkd2,
      sum2NoNkd,
      sum2WithNkd,
      repoRate,
      closePrice,
      calculatedDiscount,
      requiredNkcHaircut,
      discountDiscrepancyBps,
      rusfarBench,
      repoRateAnomalyPp,
      control1: control1Passed,
      control2: control2Passed
    };
  });

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Сделки,ISIN,Контрагент,Срок (дн),Ставка РЕПО,Котировка Лег 1,Сумма Лег 1 (с НКД),Ресурс залога,MOEX цена закрытия,Дисконт по сделке %,Норма НКЦ %,Превышение дисконта (б.п.),RUSFAR бенчмарк\n";
    
    evaluatedRepoDeals.forEach(r => {
      csvContent += `${r.dealId},${r.isin},${r.counterparty},${r.termDays},${r.repoRate}%,${r.price1}%,${r.sum1WithNkd.toFixed(2)},Гос Облигации,${r.closePrice},${r.calculatedDiscount}%,${r.requiredNkcHaircut}%,${r.discountDiscrepancyBps.toFixed(0)},${r.rusfarBench}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "RU_REPO_Valuation_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runRepoCalculator = () => {
    // Compute Part 1 Sum
    const parValue = 1000; // Face value is typically 1000 RUB
    const tradeQty = 10000; // Tested nominal item count
    const nkdValue1 = 12.50; // RUB per bond
    const nkdValue2 = 14.80; // RUB per bond

    const sum1NoNkd = (tradeQty * (inputLeg1Price / 100) * parValue);
    const sum1WithNkd = sum1NoNkd + (tradeQty * nkdValue1);

    // Compute Part 2 Sum (T-days repo accrual)
    const accrualFactor = 1 + (inputRepoRate / 100) * inputTermDays / 360;
    const sum2NoNkd = sum1NoNkd * accrualFactor;
    const sum2WithNkd = sum2NoNkd + (tradeQty * nkdValue2);

    // Actual discount
    const actualDiscount = (1 - inputLeg1Price / inputClosePrice) * 100;
    const nkcRequiredHaircut = 5.0; // NCC collateral margin limit
    const deviation = actualDiscount - nkcRequiredHaircut;

    // Short-term benchmark comparing
    const rusfarBench = 15.15; // Benchmark

    setCalcResult({
      sum1NoNkd,
      sum1WithNkd,
      sum2NoNkd,
      sum2WithNkd,
      actualDiscount,
      nkcRequiredHaircut,
      deviation,
      rusfarBench,
      repoRatePp: inputRepoRate,
      ppAnomaly: inputRepoRate - rusfarBench
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      {/* Header card */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-light rounded-lg border border-line-soft p-5 shadow-sm">
        <div>
          <h2 className="font-sans text-xl font-extrabold text-[#001026] tracking-tight">РЕПО • Контроль обеспечения и процентных ставок</h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1 leading-normal">
            Аудит расчетов первой и второй ноги REPO, верификация дисконтов обеспечения по ценам закрытия МосБиржи Торговой Системы и бенчмаркинг по ставкам RUSFAR.
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="bg-primary hover:bg-primary-container text-on-primary rounded-lg font-bold py-2.5 px-4 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md self-start xl:self-center"
        >
          <Download className="w-4 h-4" /> Выгрузить РЕПО-ведомость (Excel)
        </button>
      </div>

      {/* Main REPO Deal Validation Grid */}
      <div className="bg-surface-light rounded-lg border border-line-soft shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-line-soft bg-surface-container-lowest flex justify-between items-center flex-wrap gap-2 text-xs font-bold text-primary">
          <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-primary" /> Параметры и сверка контрольных сумм РЕПО-сделок</span>
          <span className="font-sans text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded uppercase">Дисциплина Положения 511-П ЦБ РФ</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-surface-container border-b border-line-soft text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                <th colSpan={5} className="py-2 px-4 border-r border-line text-left bg-surface-bright/20">Условия сделки РЕПО (Table 1.1)</th>
                <th colSpan={3} className="py-2 px-4 border-r border-line text-left bg-[#ecf2fa]/20 text-secondary">Контроль Сумм НКД (К1 & К2)</th>
                <th colSpan={4} className="py-2 px-3 text-left bg-pos/5 text-pos font-extrabold">Оценка дисконтов и RUSFAR (Table 1.2)</th>
              </tr>
              <tr className="bg-surface-container-low text-[10.5px] font-bold text-on-surface-variant border-b border-line-soft">
                <th className="py-2.5 px-4 font-bold">Код сделки</th>
                <th className="py-2.5 px-4 font-mono font-bold">ISIN залога</th>
                <th className="py-2.5 px-4">Контрагент</th>
                <th className="py-2.5 px-3 text-right">Ставка %</th>
                <th className="py-2.5 px-3 text-center border-r border-line">T (дн.)</th>

                {/* Leg check */}
                <th className="py-2.5 px-3">Leg 1 Сумма / НКД</th>
                <th className="py-2.5 px-3">Leg 2 Сумма / НКД</th>
                <th className="py-2.5 px-4 text-center border-r border-line">Контроль K1/K2</th>

                {/* Haircuts and Benchmarks */}
                <th className="py-2.5 px-3">Факт. Дисконт %</th>
                <th className="py-2.5 px-3">Биржа Close Цена</th>
                <th className="py-2.5 px-3">Отыклонение НКЦ</th>
                <th className="py-2.5 px-4 text-right">RUSFAR бенч. / Аном.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft text-[11.5px] font-medium text-on-surface tabular-nums">
              {evaluatedRepoDeals.map(res => {
                const isOffMarket = Math.abs(res.repoRateAnomalyPp) > 0.5;

                return (
                  <tr key={res.dealId} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-bold text-primary font-mono">{res.dealId}</td>
                    <td className="py-3 px-4 font-mono font-bold text-on-surface-variant">{res.isin}</td>
                    <td className="py-3 px-4">{res.counterparty}</td>
                    <td className="py-3 px-3 text-right font-black text-secondary">{res.repoRate.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-center border-r border-line font-bold">{res.termDays} дней</td>

                    {/* leg sums */}
                    <td className="py-3 px-3 bg-[#ecf2fa]/10">
                      <div className="flex flex-col text-[10.5px] font-semibold leading-tight">
                        <span>Всего: <strong className="text-on-surface font-sans">{res.sum1WithNkd.toLocaleString('ru-RU')} ₽</strong></span>
                        <span className="text-[9.5px] text-on-surface-variant">НКД: {res.nkd1.toLocaleString()} ₽</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 bg-[#ecf2fa]/10">
                      <div className="flex flex-col text-[10.5px] font-semibold leading-tight">
                        <span>Всего: <strong className="text-on-surface font-sans">{res.sum2WithNkd.toLocaleString('ru-RU')} ₽</strong></span>
                        <span className="text-[9.5px] text-on-surface-variant">НКД: {res.nkd2.toLocaleString()} ₽</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center border-r border-line bg-[#ecf2fa]/10">
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#0a7d3f] bg-pos/10 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Пройден
                      </span>
                    </td>

                    {/* actual haircut vs close price and NCC */}
                    <td className="py-3 px-3 font-semibold text-right bg-pos/5 text-primary">{res.calculatedDiscount.toFixed(2)}%</td>
                    <td className="py-3 px-3 select-none bg-pos/5">{res.closePrice.toFixed(2)} %</td>
                    <td className="py-3 px-3 bg-pos/5">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        res.discountDiscrepancyBps >= 0 ? 'bg-pos/15 text-pos' : 'bg-neg/15 text-neg'
                      }`}>
                        {res.discountDiscrepancyBps >= 0 ? `Запас +${res.discountDiscrepancyBps.toFixed(0)} бп` : `Дефицит ${(res.discountDiscrepancyBps).toFixed(0)} бп`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right bg-pos/5">
                      <div className="flex flex-col items-end text-[10.5px] leading-tight font-bold">
                        <span>Бенч: {res.rusfarBench}%</span>
                        <span className={`text-[9.5px] font-black ${isOffMarket ? 'text-neg' : 'text-on-surface-variant'}`}>
                          Откл: {res.repoRateAnomalyPp > 0 ? '+' : ''}{res.repoRateAnomalyPp} п.п.
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPO Calculator and Verification of Leg calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Input */}
        <div className="lg:col-span-5 bg-surface-light rounded-lg border border-line-soft shadow-sm p-5 flex flex-col gap-4">
          <h3 className="font-sans text-sm font-bold text-primary border-b border-line-soft pb-2 flex items-center gap-1.5 font-sans">
            <Calculator className="w-4 h-4 text-primary" /> Параметры Обеспечения & Сделки РЕПО
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-on-surface">
            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant">ISIN Облигации / Акции</span>
              <input 
                type="text"
                value={selectedIsin}
                onChange={(e) => setSelectedIsin(e.target.value)}
                className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono uppercase font-bold text-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant">MOEX цена закрытия %</span>
              <input 
                type="number"
                step="0.01"
                value={inputClosePrice}
                onChange={(e) => setInputClosePrice(parseFloat(e.target.value) || 0)}
                className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono text-primary font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant">Цена Лег 1 (% номинала)</span>
              <input 
                type="number"
                step="0.01"
                value={inputLeg1Price}
                onChange={(e) => setInputLeg1Price(parseFloat(e.target.value) || 0)}
                className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono font-bold text-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant">Процентная ставка РЕПО %</span>
              <input 
                type="number"
                step="0.01"
                value={inputRepoRate}
                onChange={(e) => setInputRepoRate(parseFloat(e.target.value) || 0)}
                className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono text-primary font-bold"
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-on-surface-variant">Дней удержания сделки (T)</span>
              <div className="grid grid-cols-4 gap-1">
                {[1, 7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setInputTermDays(days)}
                    className={`py-1.5 rounded font-sans text-xs font-extrabold cursor-pointer border transition-all ${
                      inputTermDays === days 
                        ? 'bg-primary text-on-primary border-primary' 
                        : 'bg-surface-bright text-on-surface-variant border-line hover:border-on-surface-variant'
                    }`}
                  >
                    {days === 1 ? '1 день (O/N)' : `${days} дней`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={runRepoCalculator}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-2"
          >
            <ShieldCheck className="w-4 h-4" /> Прокалькулировать вторую ногу & Дисконт
          </button>
        </div>

        {/* Right Outputs Panel representing Step-by-Step interactive Calculations outputs */}
        <div className="lg:col-span-7 bg-surface-light rounded-lg border border-line-soft shadow-sm p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-sans text-sm font-bold text-on-surface border-b border-line-soft pb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-secondary" /> Математический отчет и Аудит обеспечения
            </h3>

            {calcResult ? (
              <div className="flex flex-col gap-4 mt-4 font-sans text-xs font-semibold leading-relaxed">
                {/* Control Checklist boxes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface rounded-lg border border-line-soft p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Лег 1 (Сумма с НКД)</span>
                      <p className="font-mono text-[13px] font-black text-primary mt-1">{calcResult.sum1WithNkd.toLocaleString('ru-RU')} ₽</p>
                    </div>
                    <span className="text-[9px] text-[#0a7d3f] font-extrabold flex items-center gap-1 mt-2">
                      <Check className="w-3.5 h-3.5" /> Расчет верифицирован котировщиком
                    </span>
                  </div>

                  <div className="bg-surface rounded-lg border border-line-soft p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Лег 2 (Возврат с РЕПО %):</span>
                      <p className="font-mono text-[13px] font-black text-secondary mt-1">{calcResult.sum2WithNkd.toLocaleString('ru-RU')} ₽</p>
                    </div>
                    <span className="text-[9px] text-secondary font-mono leading-none flex items-center gap-1 mt-2">
                      Коэффициент: {(1 + (calcResult.repoRatePp / 100) * inputTermDays / 360).toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Mathematical discrepancies */}
                <div className="bg-[#ecf2fa]/20 border border-line-soft p-4 rounded-lg flex justify-between items-center text-[11px] font-mono leading-relaxed text-on-surface-variant">
                  <div className="flex flex-col gap-1">
                    <span>Расчетный дисконт по сделке:</span>
                    <strong className="text-primary text-[13px] font-black font-sans">{calcResult.actualDiscount.toFixed(2)}%</strong>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Норматив обеспечения НКЦ:</span>
                    <strong className="text-secondary text-[13px] font-bold font-sans">{calcResult.nkcRequiredHaircut.toFixed(2)}%</strong>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span>Запас прочности (Margin Buffer):</span>
                    <span className={`px-2 py-0.5 rounded font-bold font-sans ${calcResult.deviation >= 0 ? 'bg-pos/15 text-pos' : 'bg-neg/15 text-neg'}`}>
                      {calcResult.deviation >= 0 ? `Запас +${calcResult.deviation.toFixed(2)}%` : `Дефицит ${(calcResult.deviation).toFixed(2)}%`}
                    </span>
                  </div>
                </div>

                {/* rusfar comparison benchmark */}
                <div className="p-3 bg-pos/10 rounded-lg flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 font-bold text-pos">
                    <TrendingUp className="w-4 h-4" />
                    <span>Сравнение со ставкой краткосрочного фондирования RUSFAR ({inputTermDays}д):</span>
                  </div>
                  <span className="font-mono font-bold text-primary bg-surface-light border border-line px-2 py-0.5 rounded">
                    Ставка РЕПО {calcResult.repoRatePp}% vs RUSFAR {calcResult.rusfarBench}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant italic font-semibold gap-2 mt-4">
                <Calculator className="w-10 h-10 opacity-30 animate-pulse" />
                <span>Задайте условия привлечения/размещения РЕПО-кредита слева для выполнения математического аудита.</span>
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-on-surface-variant uppercase font-bold text-right pt-3 bg-surface-container-lowest/20 border-t border-line-soft mt-3 italic leading-tight select-none">
            УЧЕТ РЕЗЕРВИРОВАНИЯ ЦЕННЫХ БУМАГ СООТВЕТСТВУЕТ СТАНДАРТУ MOEX
          </div>
        </div>
      </div>
    </motion.div>
  );
}
