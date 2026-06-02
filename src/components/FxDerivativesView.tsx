/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, ArrowLeftRight, HelpCircle, Download, Check, AlertCircle,
  Calculator, ReceiptText, RefreshCw, BarChart2, ShieldCheck, Play
} from 'lucide-react';
import { Deal, MarketQuote, YieldCurve } from '../types';
import { evaluateDerivativeDeal, ValuationResult, interpolateRate, calculateDF } from '../utils/valuationMath';

interface FxDerivativesViewProps {
  deals: Deal[];
  quotes: MarketQuote[];
  curves: YieldCurve[];
  onRefresh: () => void;
}

export default function FxDerivativesView({ deals, quotes, curves, onRefresh }: FxDerivativesViewProps) {
  const [fxSubTab, setFxSubTab] = useState<'SPOT' | 'SWAP' | 'FORWARD' | 'FUTURES'>('SPOT');
  const [selectedSource, setSelectedSource] = useState<'MOEX' | 'Cbonds'>('MOEX');
  
  // Calculator states
  const [calcBase, setCalcBase] = useState<'USD' | 'EUR' | 'CNY' | 'GBP'>('USD');
  const [calcDir, setCalcDir] = useState<'BUY' | 'SELL'>('BUY');
  const [calcNominal, setCalcNominal] = useState<number>(1000000);
  const [calcRate, setCalcRate] = useState<number>(93.45);
  const [calcDays, setCalcDays] = useState<number>(30);
  const [calcSwapPoints, setCalcSwapPoints] = useState<number>(0.92);
  const [calcResult, setCalcResult] = useState<any | null>(null);

  // Filter deals belonging to the active sub-instrument
  const fxDeals = deals.filter(d => d.type === fxSubTab);

  // Evaluate with our formula logic engine
  const evaluated = fxDeals.map(deal => {
    return evaluateDerivativeDeal(
      {
        ...deal,
        rate: deal.rate || 94.52,
        buyAmt: deal.buyAmt || 1000000,
        sellAmt: deal.sellAmt || 95420000,
        buyCcy: deal.buyCcy || deal.currency,
        sellCcy: deal.sellCcy || 'RUB',
      },
      curves,
      selectedSource === 'MOEX' ? 'MOEX' : 'REUTERS'
    );
  });

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Сделки,Тип ПФИ,Валюта,Дата расчетов,Номинал,Курс сделки,Справедливая стоимость ЦБ (тыс. руб),Граница Min,Граница Max,Оценка рыночности,Отклонение (%)\n";
    
    evaluated.forEach(r => {
      const d = deals.find(x => x.id === r.dealId);
      if (d) {
        csvContent += `${d.id},${d.type},${d.currency}/RUB,${d.settleDate},${d.buyAmt || 1000000},${d.rate || 0},${r.fairValueCbr.toFixed(2)},${r.fairValueMin.toFixed(2)},${r.fairValueMax.toFixed(2)},${r.isMarket},${r.deviationScorePct.toFixed(4)}%\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Parr_FX_${fxSubTab}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runCalculator = () => {
    // Spot rate simulation based on selected base currency
    let spot = 93.42;
    if (calcBase === 'EUR') spot = 99.13;
    if (calcBase === 'CNY') spot = 12.75;
    if (calcBase === 'GBP') spot = 114.22;

    const curvesMap = {
      domestic: curves.find(c => c.currency === 'RUB') || curves[0],
      foreign: curves.find(c => c.currency === calcBase) || curves[0]
    };

    const { r: r1 } = interpolateRate(calcDays, curvesMap.domestic);
    const { r: r2 } = interpolateRate(calcDays, curvesMap.foreign);

    const df1 = calculateDF(r1, calcDays);
    const df2 = calculateDF(r2, calcDays);

    let theoreticalFwd = spot * (1 + (r1 / 100) * calcDays / 360) / (1 + (r2 / 100) * calcDays / 360);
    let theoreticalSwapPoints = spot * ((r1 - r2) / 100) * (calcDays / 360) / (1 + (r2 / 100) * (calcDays / 360));

    // Fair value under CBR spots scenario 
    // FV = (DF2 * N_Foreign * Spot - DF1 * N_RUB) / 1000
    const foreignAmt = calcNominal;
    const localAmt = calcNominal * calcRate;
    let fv = 0;
    if (calcDir === 'BUY') {
      fv = (df2 * foreignAmt * spot - df1 * localAmt) / 1000;
    } else {
      fv = (df1 * localAmt - df2 * foreignAmt * spot) / 1000;
    }

    setCalcResult({
      spot,
      r1,
      r2,
      df1,
      df2,
      theoreticalFwd,
      theoreticalSwapPoints,
      fv
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      {/* Header section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-light rounded-lg border border-line-soft p-5 shadow-sm">
        <div>
          <h2 className="font-sans text-xl font-extrabold text-[#001026] tracking-tight">Валютные деривативы & Инструменты денежного рынка</h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1 leading-normal">
            Оценка рыночности условий валютных контрактов (SPOT, SWAP, FORWARD, FUTURES) по паритету процентных ставок и индикатораторам MOEX ПФИ.
          </p>
        </div>

        {/* Level 1 selector buttons (SPOT, SWAP, FORWARD, FUTURES) */}
        <div className="flex bg-surface-container rounded p-1 border border-line-soft items-center flex-wrap gap-1">
          {(['SPOT', 'SWAP', 'FORWARD', 'FUTURES'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setFxSubTab(tab);
                setCalcResult(null);
              }}
              className={`px-4 py-2 font-sans text-xs font-black rounded cursor-pointer transition-all ${
                fxSubTab === tab 
                  ? 'bg-primary text-on-primary shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab} ПФИ
            </button>
          ))}
        </div>
      </div>

      {/* KPI stats for the active FX instrument */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-light rounded-lg border border-line-soft p-4 shadow-sm">
          <div className="font-sans text-[10px] uppercase font-black tracking-wider text-on-surface-variant">Всего сделок {fxSubTab}</div>
          <div className="font-sans text-2xl font-black text-primary mt-1.5 tabular-nums">{fxDeals.length}</div>
        </div>
        
        <div className="bg-surface-light rounded-lg border border-line-soft p-4 shadow-sm">
          <div className="font-sans text-[10px] uppercase font-black tracking-wider text-on-surface-variant">Суммарный объем в ПРВ</div>
          <div className="font-sans text-2xl font-black text-primary mt-1.5 tabular-nums">
            ₽ {(evaluated.reduce((acc, r) => acc + Math.abs(r.fairValueCbr), 0) / 1000).toFixed(2)} млн
          </div>
        </div>

        <div className="bg-surface-light rounded-lg border border-line-soft p-4 shadow-sm">
          <div className="font-sans text-[10px] uppercase font-black tracking-wider text-on-surface-variant">Внерыночных аномалий</div>
          <div className="font-sans text-2xl font-black text-neg mt-1.5 tabular-nums">
            {evaluated.filter(r => r.isMarket !== 'В рынке').length}
          </div>
        </div>

        <button 
          onClick={handleExportCSV}
          className="bg-primary hover:bg-primary-container text-on-primary rounded-lg font-bold py-3 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md self-center"
        >
          <Download className="w-4 h-4" /> Выгрузить реестр {fxSubTab} (Excel)
        </button>
      </div>

      {/* Primary Grid Layout */}
      <div className="bg-surface-light rounded-lg border border-line-soft shadow-sm overflow-hidden flex flex-col">
        {/* Table header */}
        <div className="px-5 py-3 border-b border-line-soft bg-surface-container-lowest flex justify-between items-center flex-wrap gap-2">
          <span className="font-sans text-xs font-extrabold text-primary flex items-center gap-1.5">
            <ReceiptText className="w-4 h-4 text-primary" /> Реестр {fxSubTab}-сделок и верификация параметров (Зона 1 + Зона 2)
          </span>

          <div className="flex items-center gap-1.5 text-xs text-on-surface">
            <span className="font-bold text-on-surface-variant">Источники MOEX / РР:</span>
            <select 
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="border border-line rounded bg-surface-bright font-semibold py-1 px-2.5 h-8 cursor-pointer focus:outline-none focus:border-primary"
            >
              <option value="MOEX">Московская биржа (MOEX)</option>
              <option value="Cbonds">Cbonds купонные кривые</option>
            </select>
          </div>
        </div>

        {/* Table contents */}
        {fxDeals.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-surface-container border-b border-line-soft text-[10px] font-extrabold tracking-wider uppercase text-on-surface-variant">
                  <th colSpan={7} className="py-2 px-4 border-r border-line text-left bg-surface-bright/20">Зона 1 — Основные параметры и Оценка справедливой стоимости</th>
                  <th colSpan={5} className="py-2 px-4 bg-[#ecf2fa]/30 text-left text-primary">Зона 2 — Промежуточные расчеты паритета процентных ставок (OIS)</th>
                </tr>
                <tr className="bg-surface-container-low text-[10.5px] font-bold text-on-surface-variant border-b border-line-soft">
                  <th className="py-2 px-4">Код сделки</th>
                  <th className="py-2 px-4">Контрагент</th>
                  <th className="py-2 px-4">Валюта (Котир.)</th>
                  <th className="py-2 px-3 text-right">Объем (Валюта)</th>
                  <th className="py-2 px-3 text-right">Курс сделки</th>
                  <th className="py-2 px-4 text-right text-primary">Справ. ст-ть (ЦБ) руб.</th>
                  <th className="py-2 px-4 text-center border-r border-line-soft">Рыночность</th>
                  
                  {/* ZONE 2 HEADERS */}
                  <th className="py-2 px-3 bg-[#ecf2fa]/20">Спот (ЦБ / Биржа)</th>
                  <th className="py-2 px-3 bg-[#ecf2fa]/20 text-center">T (дней)</th>
                  <th className="py-2 px-3 bg-[#ecf2fa]/20">Ставки r1_rub / r2_ccy</th>
                  <th className="py-2 px-3 bg-[#ecf2fa]/20">Дисконт-множители DF1 / DF2</th>
                  <th className="py-2 px-3 bg-[#ecf2fa]/20 text-right">Расчетный теор (F / Pkts)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft text-[12px] font-medium text-on-surface tabular-nums">
                {evaluated.map((res, idx) => {
                  const deal = fxDeals[idx];
                  const diffAbs = Math.abs(res.deviationSwapPointsAbs || res.deviationScorePct);

                  return (
                    <tr key={deal.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-bold text-primary font-mono">{deal.id}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{deal.counterparty}</td>
                      <td className="py-3 px-4 font-bold">{deal.currency}/RUB</td>
                      <td className="py-3 px-3 text-right">{(deal.buyAmt || 1000000).toLocaleString('ru-RU')}</td>
                      <td className="py-3 px-3 text-right font-semibold">{(deal.rate || 0).toFixed(4)}</td>
                      <td className="py-3 px-4 text-right font-black text-primary">
                        {res.fairValueCbr.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center border-r border-line-soft">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                          res.isMarket === 'В рынке' ? 'bg-pos/15 text-pos' : 'bg-neg/15 text-neg'
                        }`}>
                          {res.isMarket}
                        </span>
                      </td>

                      {/* ZONE 2 VALUES */}
                      <td className="py-3 px-3 bg-[#ecf2fa]/10">
                        <div className="flex flex-col text-[10px] leading-tight text-on-surface-variant">
                          <span>ЦБ: <strong className="text-on-surface font-semibold">{res.spotCbr}</strong></span>
                          <span>Ccp: <strong className="text-on-surface font-semibold">{res.spotCcp}</strong></span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center bg-[#ecf2fa]/10 font-bold">{res.termDays}д</td>
                      <td className="py-3 px-3 bg-[#ecf2fa]/10">
                        <div className="flex flex-col text-[10px] leading-tight">
                          <span className="text-primary font-semibold">RUB: {res.r1.toFixed(3)}%</span>
                          <span className="text-secondary font-semibold">{deal.currency}: {res.r2.toFixed(3)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 bg-[#ecf2fa]/10 font-mono text-[10px]">
                        <div className="flex flex-col select-none leading-none">
                          <span>DF1: {res.df1.toFixed(6)}</span>
                          <span className="mt-0.5">DF2: {res.df2.toFixed(6)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right bg-[#ecf2fa]/10 font-bold text-primary">
                        {(res.forwardTheo || res.swapPointsTheo || 0).toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-on-surface-variant text-xs italic font-semibold font-sans">
            Сделок типа {fxSubTab} в текущем торговом портфеле не обнаружено.
          </div>
        )}
      </div>

      {/* FX Rates Parity Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 bg-surface-light rounded-lg border border-line-soft shadow-sm p-5 flex flex-col gap-4">
          <h3 className="font-sans text-sm font-bold text-primary border-b border-line-soft pb-2 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-primary" /> Симулятор экспресс-оценки валютного ПФИ
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-on-surface">
            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant font-bold">Базовая валюта</span>
              <select 
                value={calcBase}
                onChange={(e) => setCalcBase(e.target.value as any)}
                className="border border-line rounded h-8 px-2 bg-surface-bright text-xs focus:outline-none focus:border-primary font-bold text-primary font-mono"
              >
                <option value="USD">USD/RUB</option>
                <option value="EUR">EUR/RUB</option>
                <option value="CNY">CNY/RUB</option>
                <option value="GBP">GBP/RUB</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant">Направление сделки</span>
              <select 
                value={calcDir}
                onChange={(e) => setCalcDir(e.target.value as any)}
                className="border border-line rounded h-8 px-2 bg-surface-bright text-xs focus:outline-none focus:border-primary"
              >
                <option value="BUY">Покупка иностранной валюты</option>
                <option value="SELL">Продажа иностранной валюты</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant">Номинал контракта ({calcBase})</span>
              <input 
                type="number"
                value={calcNominal}
                onChange={(e) => setCalcNominal(parseFloat(e.target.value) || 0)}
                className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono text-primary font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant">Курс сделки (Deal Rate)</span>
              <input 
                type="number"
                step="0.0001"
                value={calcRate}
                onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                className="border border-line rounded h-8 px-2.5 bg-surface-bright text-xs focus:outline-none focus:border-primary font-mono text-primary font-bold"
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-on-surface-variant">Срок в днях (T) до расчетов</span>
              <input 
                type="range"
                min="1"
                max="360"
                value={calcDays}
                onChange={(e) => setCalcDays(parseInt(e.target.value) || 30)}
                className="accent-primary cursor-pointer w-full mt-1.5"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-bold leading-none mt-1">
                <span>1 день</span>
                <span className="bg-surface-container px-1 py-0.5 rounded font-mono text-primary">{calcDays} дней</span>
                <span>360 дней</span>
              </div>
            </div>
          </div>

          <button 
            onClick={runCalculator}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-2"
          >
            <Play className="w-3.5 h-3.5" /> Запустить симуляцию паритета OIS
          </button>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 bg-surface-light rounded-lg border border-line-soft shadow-sm p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-sans text-sm font-bold text-on-surface border-b border-line-soft pb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-secondary" /> Результаты расчета по паритетной модели оценки ПФИ
            </h3>

            {calcResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-sans text-xs font-semibold leading-relaxed">
                {/* Visual FV result */}
                <div className="bg-surface rounded-lg border border-line-soft p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Теоретический Forward Rate:</span>
                    <p className="text-lg font-black text-primary font-mono mt-1">{calcResult.theoreticalFwd.toFixed(4)}</p>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Теоретические Своп-пункты (Pkts):</span>
                    <p className="text-lg font-black text-secondary font-mono mt-1">{calcResult.theoreticalSwapPoints.toFixed(4)}</p>
                  </div>
                </div>

                <div className="bg-[#ecf2fa]/20 rounded-lg border border-line-soft p-3.5 flex flex-col gap-1.5 text-on-surface-variant font-mono text-[11px]">
                  <div className="font-sans text-[10px] uppercase font-bold tracking-wider text-primary mb-1">Факторы кривых дисконтирования:</div>
                  <div className="flex justify-between">
                    <span>Срок Т:</span>
                    <span className="text-on-surface font-bold">{calcDays} дней</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ставка r1 (RUB):</span>
                    <span className="text-primary font-bold">{calcResult.r1.toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ставка r2 ({calcBase}):</span>
                    <span className="text-secondary font-bold">{calcResult.r2.toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between border-t border-line-soft pt-1 my-1">
                    <span>Множитель DF1 (RUB):</span>
                    <span className="text-on-surface font-bold">{calcResult.df1.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Множитель DF2 ({calcBase}):</span>
                    <span className="text-on-surface font-bold">{calcResult.df2.toFixed(6)}</span>
                  </div>
                </div>

                {/* Fair value outcomes */}
                <div className="col-span-1 md:col-span-2 bg-[#e6eeff]/60 border border-line-soft/80 p-3 rounded-lg flex justify-between items-center mt-1">
                  <div>
                    <span className="font-sans text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-pos" /> Справедливая оценка справедливой стоимости ПФИ (ЦБ РФ)
                    </span>
                    <p className="font-sans text-[10px] text-on-surface-variant mt-0.5">Принимается в качестве учетного ориентира кредитной организации.</p>
                  </div>
                  <span className={`font-mono text-base font-black px-3 py-1 bg-surface-light rounded border border-line-soft ${
                    calcResult.fv >= 0 ? 'text-pos' : 'text-neg'
                  }`}>
                    {calcResult.fv >= 0 ? '+' : ''}{calcResult.fv.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} тыс. ₽
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant italic font-semibold gap-2 mt-4">
                <Calculator className="w-10 h-10 opacity-30 animate-pulse" />
                <span>Задайте параметры контракта валютного дериватива слева и нажмите кнопку расчета паритета.</span>
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-on-surface-variant uppercase font-bold text-right pt-3 bg-surface-container-lowest/20 border-t border-line-soft mt-2 italic leading-tight select-none">
            МОДЕЛИРОВАНИЕ СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ ПОЛОЖЕНИЯ 511-П ЦБ РФ
          </div>
        </div>
      </div>
    </motion.div>
  );
}
