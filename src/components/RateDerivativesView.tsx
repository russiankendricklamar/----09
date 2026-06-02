/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  GitCommit, Activity, BarChart3, Calculator, HelpCircle, ArrowUpRight,
  TrendingUp, TableCellsSplit, RefreshCw, FileText, Check, AlertCircle 
} from 'lucide-react';
import { Deal, YieldCurve, CurveNode } from '../types';
import { interpolateRate, calculateDF, TENOR_DAYS } from '../utils/valuationMath';

interface RateDerivativesViewProps {
  deals: Deal[];
  curves: YieldCurve[];
  onRefresh: () => void;
}

export default function RateDerivativesView({ deals, curves, onRefresh }: RateDerivativesViewProps) {
  const [selectedCurveId, setSelectedCurveId] = useState<string>(curves[0]?.id || 'RUB_KEY_OIS');
  const [calcTermDays, setCalcTermDays] = useState<number>(45);
  const [interpolationMath, setInterpolationMath] = useState<any | null>(null);

  // Filter IRS deals from trade registry
  const irsDeals = deals.filter(d => d.type === 'IRS');

  const activeCurve = curves.find(c => c.id === selectedCurveId) || curves[0];

  const handleInterpolate = () => {
    if (!activeCurve) return;

    const result = interpolateRate(calcTermDays, activeCurve);
    const df = calculateDF(result.r, calcTermDays);

    setInterpolationMath({
      term: calcTermDays,
      curveName: activeCurve.id,
      interpolatedRate: result.r,
      df,
      lowNode: {
        tenor: result.tenorMin,
        days: TENOR_DAYS[result.tenorMin] || 1,
        rate: result.rMin
      },
      highNode: {
        tenor: result.tenorMax,
        days: TENOR_DAYS[result.tenorMax] || 360,
        rate: result.rMax
      },
      method: activeCurve.interpolation
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      {/* Header element */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-light rounded-lg border border-line-soft p-5 shadow-sm">
        <div>
          <h2 className="font-sans text-xl font-extrabold text-[#001026] tracking-tight">Процентные деривативы & Модели кривых доходности OIS</h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1 leading-normal">
            Интерполяция бескупонных нулевых ставок денежного рынка, факторные матрицы OIS дисконтирования и учет соглашений IRS / Валютно-процентных свопов CIRS.
          </p>
        </div>

        <button 
          onClick={onRefresh}
          className="bg-primary hover:bg-primary-container text-on-primary rounded-lg font-bold py-2.5 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Перестроить сплайны кривых
        </button>
      </div>

      {/* IRS Deals Multi-Grid view */}
      <div className="bg-surface-light rounded-lg border border-line-soft shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-line-soft bg-surface-container-lowest flex justify-between items-center flex-wrap gap-2 text-xs font-bold text-primary">
          <span className="flex items-center gap-1.5"><TableCellsSplit className="w-4 h-4 text-primary" /> Соглашения об обмене процентными ставками IRS (Interest Rate Swaps)</span>
          <span className="font-sans text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">Портфель производных инструментов</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container border-b border-line-soft text-[10.5px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                <th className="py-2.5 px-4">Код договора</th>
                <th className="py-2.5 px-4">Контрагент</th>
                <th className="py-2.5 px-4">Номинал обмена</th>
                <th className="py-2.5 px-4">Валюта</th>
                <th className="py-2.5 px-3">Нога 1 (Фикс / Спред)</th>
                <th className="py-2.5 px-3">Нога 2 (Плав. индекс)</th>
                <th className="py-2.5 px-3 text-right">Ставка сделки %</th>
                <th className="py-2.5 px-4 text-right text-primary">Справ. Стоимость (ЦБ) руб.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft text-[11.5px] font-medium text-on-surface tabular-nums">
              {irsDeals.map(deal => (
                <tr key={deal.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-4 font-bold text-primary font-mono">{deal.id}</td>
                  <td className="py-3 px-4">{deal.counterparty}</td>
                  <td className="py-3 px-4 font-bold text-on-surface font-sans">
                    {(deal.buyAmt || 10000000).toLocaleString('ru-RU')} {deal.currency}
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">{deal.currency}</td>
                  <td className="py-3 px-3">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10.5px] font-extrabold">
                      {deal.leg1Type} ({deal.leg1RateSpread || '-'})
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10.5px] font-extrabold">
                      {deal.leg2Type} ({deal.leg2Index || 'SOFR'})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-secondary">
                    {deal.rate?.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right font-black text-primary font-mono">
                    {(deal.pv).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Curve Nodes view and Interpolator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Zero Curves list */}
        <div className="lg:col-span-5 bg-surface-light rounded-lg border border-line-soft shadow-sm p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-line pb-2.5">
            <h3 className="font-sans text-xs font-black uppercase text-on-surface tracking-wider leading-none">Таблица узлов бескупонных кривых OIS</h3>
            
            <select 
              value={selectedCurveId}
              onChange={(e) => {
                setSelectedCurveId(e.target.value);
                setInterpolationMath(null);
              }}
              className="border border-line rounded text-[11px] bg-surface bg-surface-bright font-bold py-1 px-1.5 focus:outline-none focus:border-primary"
            >
              {curves.map(c => (
                <option key={c.id} value={c.id}>{c.currency} - {c.id}</option>
              ))}
            </select>
          </div>

          <div className="overflow-y-auto max-h-[340px] border border-line-soft rounded-lg">
            <table className="w-full text-left leading-normal text-[11.5px] font-sans">
              <thead className="bg-[#ecf2fa]/20 border-b border-line-soft font-extrabold text-[#365e9f] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 px-3">Срок (Tenor)</th>
                  <th className="py-2 px-3">Календарь узла</th>
                  <th className="py-2 px-3 text-right">Нулевая ставка %</th>
                  <th className="py-2 px-3 text-right">Фактор DF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft text-on-surface font-semibold font-mono text-[11px]">
                {activeCurve?.nodes.map((node, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors leading-tight">
                    <td className="py-2 px-3 text-primary font-bold">{node.tenor}</td>
                    <td className="py-2 px-3 text-[10.5px] font-sans text-on-surface-variant font-medium">{node.date}</td>
                    <td className="py-2 px-3 text-right text-secondary font-extrabold">{node.rate.toFixed(4)}%</td>
                    <td className="py-2 px-3 text-right text-on-surface-variant">{node.df.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-[#ecf2fa]/10 p-3 rounded-lg border border-line-soft/80 flex flex-col gap-1 text-[10px] font-semibold text-on-surface-variant font-sans">
            <div>Процедура сбора: <strong className="text-on-surface font-medium">{activeCurve?.buildProcedure}</strong></div>
            <div>Метод сплайна: <strong className="text-on-surface font-medium">{activeCurve?.interpolation}</strong></div>
          </div>
        </div>

        {/* Step-by-Step Spline interpolator */}
        <div className="lg:col-span-7 bg-surface-light rounded-lg border border-line-soft shadow-sm p-4 flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-sans text-xs font-black uppercase text-on-surface tracking-wider border-b border-line pb-2.5 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-primary" /> Пошаговый интерполятор процентных ставок
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* Inputs */}
              <div className="bg-surface rounded-lg border border-line-soft p-4 flex flex-col gap-3 justify-center">
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-on-surface-variant font-bold">Целевой срок (дней до расчетов T)</span>
                  <input 
                    type="range"
                    min="1"
                    max="360"
                    value={calcTermDays}
                    onChange={(e) => setCalcTermDays(parseInt(e.target.value) || 1)}
                    className="accent-primary cursor-pointer w-full mt-2"
                  />
                  <div className="flex justify-between font-bold text-[10px] text-on-surface-variant mt-1.5 leading-none">
                    <span>1 день</span>
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-black">{calcTermDays} дней</span>
                    <span>360 дней</span>
                  </div>
                </div>

                <button 
                  onClick={handleInterpolate}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2 rounded-md text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-1"
                >
                  <GitCommit className="w-3.5 h-3.5" /> Интерполировать ставку
                </button>
              </div>

              {/* Math explanations layout */}
              <div className="bg-[#ecf2fa]/20 rounded-lg border border-line-soft p-4 flex flex-col gap-2 font-sans text-xs font-semibold select-none">
                <div className="text-[10px] uppercase font-black text-secondary tracking-wider">Математические факторы узлов:</div>
                
                {interpolationMath ? (
                  <div className="space-y-2 text-[10.5px] font-mono leading-normal mt-1 text-on-surface-variant">
                    <div className="flex justify-between font-sans">
                      <span>Левая грань ({interpolationMath.lowNode.tenor}):</span>
                      <span className="text-on-surface font-bold">{interpolationMath.lowNode.days}д ({interpolationMath.lowNode.rate}%)</span>
                    </div>
                    <div className="flex justify-between font-sans">
                      <span>Правая грань ({interpolationMath.highNode.tenor}):</span>
                      <span className="text-on-surface font-bold">{interpolationMath.highNode.days}д ({interpolationMath.highNode.rate}%)</span>
                    </div>
                    
                    <div className="border-t border-line-soft pt-1.5 mt-1 text-[11px] font-black text-primary font-sans">
                      Интерполированная r({calcTermDays}д) =
                      <p className="font-mono text-[12px] bg-slate-100 p-1.5 rounded mt-1 border border-line-soft text-on-surface leading-normal text-right">
                        {interpolationMath.interpolatedRate.toFixed(4)}%
                      </p>
                    </div>

                    <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant font-sans pt-1">
                      <span>Дисконт множитель DF:</span>
                      <strong className="text-secondary font-mono">{interpolationMath.df.toFixed(7)}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-on-surface-variant h-full italic">
                    <Activity className="w-8 h-8 opacity-30 animate-pulse mb-1.5" />
                    <span>Нажмите "Интерполировать" для вычисления значений и отображения матрицы.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step-by-step custom formula explaining */}
            {interpolationMath && (
              <div className="bg-surface-container-lowest border border-line-soft p-3 rounded-lg font-mono text-[10.5px] leading-relaxed text-on-surface-variant mt-4">
                <div className="font-sans text-[9px] uppercase font-black text-[#365e9f] tracking-widest mb-1.5">Формула линейного сплайна паритетов:</div>
                <code>
                  r(T) = r_low + (r_high - r_low) * (T - T_low) / (T_high - T_low)
                  <br />
                  r({calcTermDays}д) = {interpolationMath.lowNode.rate}% + ({interpolationMath.highNode.rate}% - {interpolationMath.lowNode.rate}%) * ({calcTermDays} - {interpolationMath.lowNode.days}) / ({interpolationMath.highNode.days} - {interpolationMath.lowNode.days}) = {interpolationMath.interpolatedRate.toFixed(4)}%
                </code>
              </div>
            )}
          </div>

          <div className="text-[10px] text-on-surface-variant uppercase font-bold text-right pt-2.5 border-t border-line-soft italic leading-tight select-none">
            ГЕНЕРАЦИЯ СПЛАЙН-МАТРИЦ СООТВЕТСТВУЕТ СТАНДАРТУ ISDA OIS
          </div>
        </div>
      </div>
    </motion.div>
  );
}
