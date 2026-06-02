/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Settings2, Sliders, Shield, BellRing, Save, CheckCircle2,
  Trash2, RefreshCw, Layers, ShieldCheck, CornerDownRight, Landmark
} from 'lucide-react';

export default function SettingsView() {
  const [spotLimit, setSpotLimit] = useState<number>(15);
  const [swapLimit, setSwapLimit] = useState<number>(30);
  const [fwdLimit, setFwdLimit] = useState<number>(45);
  const [repoLimit, setRepoLimit] = useState<number>(25);
  const [irsLimit, setIrsLimit] = useState<number>(50);

  const [preTradeCheck, setPreTradeCheck] = useState<boolean>(true);
  const [notifyOffMarket, setNotifyOffMarket] = useState<boolean>(true);
  const [maxDevLimit, setMaxDevLimit] = useState<number>(120);

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load criteria on mount
  useEffect(() => {
    const savedSpot = localStorage.getItem('parr_spot_limit');
    if (savedSpot) setSpotLimit(Number(savedSpot));
    const savedSwap = localStorage.getItem('parr_swap_limit');
    if (savedSwap) setSwapLimit(Number(savedSwap));
    const savedFwd = localStorage.getItem('parr_fwd_limit');
    if (savedFwd) setFwdLimit(Number(savedFwd));
    const savedRepo = localStorage.getItem('parr_repo_limit');
    if (savedRepo) setRepoLimit(Number(savedRepo));
    const savedIrs = localStorage.getItem('parr_irs_limit');
    if (savedIrs) setIrsLimit(Number(savedIrs));
  }, []);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('parr_spot_limit', String(spotLimit));
    localStorage.setItem('parr_swap_limit', String(swapLimit));
    localStorage.setItem('parr_fwd_limit', String(fwdLimit));
    localStorage.setItem('parr_repo_limit', String(repoLimit));
    localStorage.setItem('parr_irs_limit', String(irsLimit));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    setSpotLimit(15);
    setSwapLimit(30);
    setFwdLimit(45);
    setRepoLimit(25);
    setIrsLimit(50);
    setMaxDevLimit(120);
    setPreTradeCheck(true);
    setNotifyOffMarket(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Page Title */}
      <div>
        <h2 className="font-sans text-xl font-bold tracking-tight text-primary">Конфигурация параметров лимитов</h2>
        <p className="font-sans text-xs text-on-surface-variant mt-1">
          Настройка максимально допустимых отклонений от рыночных цен и сопутствующих правил комплаенса
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Area: Deviation tolerances settings (8 columns) */}
        <div className="col-span-12 lg:col-span-8 bg-surface-light p-6 rounded-lg border border-line-soft shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-line-soft pb-3 shrink-0">
            <Sliders className="w-4 h-4 text-primary" />
            <h3 className="font-sans text-sm font-bold text-on-surface">Пороговые параметры отклонений (Deviation limits in bps)</h3>
          </div>

          <div className="space-y-4">
            {/* Spot FX Limit */}
            <div className="flex items-center justify-between p-4 border border-line-soft rounded hover:bg-surface bg-surface-bright transition-all">
              <div>
                <span className="font-sans text-xs font-bold text-primary block">FX SPOT Tolerance limit</span>
                <span className="font-sans text-[11px] text-on-surface-variant">Максимально допустимый спред между котировкой MOEX и сделкой до флага "вне рынка"</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={spotLimit}
                  onChange={(e) => setSpotLimit(Number(e.target.value))}
                  className="w-20 border border-line rounded px-2 py-1 text-xs font-sans text-center h-8 font-bold"
                />
                <span className="font-sans text-xs font-bold text-on-surface-variant w-8">bps</span>
              </div>
            </div>

            {/* Swap Limit */}
            <div className="flex items-center justify-between p-4 border border-line-soft rounded hover:bg-surface bg-surface-bright transition-all">
              <div>
                <span className="font-sans text-xs font-bold text-primary block">FX SWAP Forward Points delta limit</span>
                <span className="font-sans text-[11px] text-on-surface-variant">Разница форвардных пунктов ближней и дальней частей контракта</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={swapLimit}
                  onChange={(e) => setSwapLimit(Number(e.target.value))}
                  className="w-20 border border-line rounded px-2 py-1 text-xs font-sans text-center h-8 font-bold"
                />
                <span className="font-sans text-xs font-bold text-on-surface-variant w-8">bps</span>
              </div>
            </div>

            {/* Forward Limit */}
            <div className="flex items-center justify-between p-4 border border-line-soft rounded hover:bg-surface bg-surface-bright transition-all">
              <div>
                <span className="font-sans text-xs font-bold text-primary block">FX FORWARD Out of bounds rate</span>
                <span className="font-sans text-[11px] text-on-surface-variant">Максимально допустимое отклонение теоретических форвардных кривых</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={fwdLimit}
                  onChange={(e) => setFwdLimit(Number(e.target.value))}
                  className="w-20 border border-line rounded px-2 py-1 text-xs font-sans text-center h-8 font-bold"
                />
                <span className="font-sans text-xs font-bold text-on-surface-variant w-8">bps</span>
              </div>
            </div>

            {/* Repo Limit */}
            <div className="flex items-center justify-between p-4 border border-line-soft rounded hover:bg-surface bg-surface-bright transition-all">
              <div>
                <span className="font-sans text-xs font-bold text-primary block">REPO Collateral Margin Discount limit</span>
                <span className="font-sans text-[11px] text-on-surface-variant">Предельная величина дисконтирования РЕПО под ОФЗ/Акции</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={repoLimit}
                  onChange={(e) => setRepoLimit(Number(e.target.value))}
                  className="w-20 border border-line rounded px-2 py-1 text-xs font-sans text-center h-8 font-bold"
                />
                <span className="font-sans text-xs font-bold text-on-surface-variant w-8">bps</span>
              </div>
            </div>

            {/* Interest Rate Swap Limit */}
            <div className="flex items-center justify-between p-4 border border-line-soft rounded hover:bg-surface bg-surface-bright transition-all">
              <div>
                <span className="font-sans text-xs font-bold text-primary block">Interest Rate Swap Curve Deviation</span>
                <span className="font-sans text-[11px] text-on-surface-variant">Предел разницы ставок с плавающим купоном (RUONIA / SOFR / EURIBOR)</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={irsLimit}
                  onChange={(e) => setIrsLimit(Number(e.target.value))}
                  className="w-20 border border-line rounded px-2 py-1 text-xs font-sans text-center h-8 font-bold"
                />
                <span className="font-sans text-xs font-bold text-on-surface-variant w-8">bps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Security / general compliance settings (4 columns) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-light p-6 rounded-lg border border-line-soft shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-line-soft pb-3 shrink-0">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-sans text-sm font-bold text-on-surface">Комплаенс аудит</h3>
            </div>

            <div className="space-y-4">
              {/* Toggle switch for pretrade checks */}
              <label className="flex items-start gap-3 cursor-pointer group p-1">
                <input 
                  type="checkbox"
                  checked={preTradeCheck}
                  onChange={(e) => setPreTradeCheck(e.target.checked)}
                  className="rounded-sm border-line text-primary focus:ring-primary w-4 h-4 mt-0.5" 
                />
                <div>
                  <span className="font-sans text-xs font-bold text-on-surface group-hover:text-primary block transition-colors">Pre-Trade Regulatory Audit</span>
                  <span className="font-sans text-[10.5px] text-on-surface-variant block mt-0.5">Включить автоматическую проверку MiFID II / EMIR комплаенса перед сделками</span>
                </div>
              </label>

              {/* Toggle alert notifications */}
              <label className="flex items-start gap-3 cursor-pointer group p-1">
                <input 
                  type="checkbox"
                  checked={notifyOffMarket}
                  onChange={(e) => setNotifyOffMarket(e.target.checked)}
                  className="rounded-sm border-line text-primary focus:ring-primary w-4 h-4 mt-0.5" 
                />
                <div>
                  <span className="font-sans text-xs font-bold text-on-surface group-hover:text-primary block transition-colors">Мгновенный Alert-мониторинг</span>
                  <span className="font-sans text-[10.5px] text-on-surface-variant block mt-0.5">Отправлять срочные уведомления при возникновении внерыночных исключений</span>
                </div>
              </label>

              {/* Numeric target margin boundaries */}
              <div className="space-y-1.5 mt-2">
                <span className="font-sans text-xs font-bold text-on-surface-variant block uppercase tracking-wider">Максимальный жесткий лимит</span>
                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min={50}
                    max={200}
                    step={5}
                    value={maxDevLimit}
                    onChange={(e) => setMaxDevLimit(Number(e.target.value))}
                    className="flex-grow cursor-pointer"
                  />
                  <span className="font-sans text-xs font-bold text-primary font-mono select-none text-right w-14 tabular-nums">{maxDevLimit} bps</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Save Buttons */}
          <div className="bg-surface-light p-4 rounded-lg border border-line-soft shadow-sm flex flex-col gap-3">
            <button 
              type="submit"
              className="w-full bg-primary text-on-primary text-xs font-bold py-2.5 rounded shadow-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2 cursor-pointer h-10"
            >
              <Save className="w-4 h-4" /> Сохранить настройки
            </button>
            <button 
              type="button"
              onClick={handleReset}
              className="w-full bg-surface-bright text-on-surface border border-line text-xs font-semibold py-2 rounded hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5 cursor-pointer h-10"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Сбросить по умолчанию
            </button>

            {/* Triggered Success flag */}
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-1.5 text-xs text-pos font-bold bg-pos/10 p-2 rounded mt-1 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Конфигурация успешно сохранена!
              </motion.div>
            )}
          </div>

        </div>

      </form>
    </motion.div>
  );
}
