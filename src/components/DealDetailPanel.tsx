/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, FileText, Calendar, Building2, Landmark, Tag, CheckCircle2, AlertCircle, Clock, ArrowRightLeft } from 'lucide-react';
import { Deal } from '../types';

interface DealDetailPanelProps {
  deal: Deal | null;
  onClose: () => void;
}

export const DealDetailPanel = ({ deal, onClose }: DealDetailPanelProps) => {
  if (!deal) return null;

  const StatusIcon = deal.status === 'Verified' ? CheckCircle2 : deal.status === 'Failed' ? AlertCircle : Clock;
  const statusColor = deal.status === 'Verified' ? 'text-pos' : deal.status === 'Failed' ? 'text-neg' : 'text-warn';

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-primary/20 backdrop-blur-sm cursor-pointer"
      />

      {/* Side Panel */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-[500px] bg-white h-full shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-surface-bright border-b border-line-soft flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-primary/5 ${statusColor}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans text-sm font-black text-on-surface uppercase tracking-tight leading-none">Детализация сделки</h2>
              <p className="font-mono text-[11px] font-bold text-primary mt-1.5">{deal.id} <span className="text-on-surface-variant/40 ml-1">({deal.extId})</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Status and Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-line-soft shadow-sm">
              <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Статус проверки</div>
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                <span className={`text-xs font-black uppercase ${statusColor}`}>
                  {deal.status === 'Verified' ? 'Подтверждена' : deal.status === 'Pending' ? 'В ожидании' : 'Ошибка'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-line-soft shadow-sm">
              <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Отклонение</div>
              <div className={`text-xs font-black tabular-nums ${Math.abs(deal.deltaToMarket) > 1.0 ? 'text-neg' : 'text-pos'}`}>
                {deal.deltaToMarket > 0 ? '+' : ''}{deal.deltaToMarket.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Primary Attributes */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-primary uppercase tracking-widest border-b border-line-soft pb-2 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Основные параметры
            </h3>
            <div className="grid grid-cols-1 gap-y-3.5">
              <DetailRow label="Контрагент" value={deal.counterparty} icon={Building2} />
              <DetailRow label="Тип инструмента" value={deal.type} icon={Landmark} highlight />
              <DetailRow label="Валюта сделки" value={deal.currency} icon={ArrowRightLeft} />
              <DetailRow label="Дата сделки" value={deal.tradeDate} icon={Calendar} mono />
              <DetailRow label="Дата расчетов" value={deal.settleDate} icon={Calendar} mono />
            </div>
          </section>

          {/* Financials section */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-primary uppercase tracking-widest border-b border-line-soft pb-2 flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5" /> Финансовые условия
            </h3>
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 space-y-4">
               <div className="flex justify-between items-end">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase">Номинал / Сумма</div>
                  <div className="text-lg font-black text-primary tabular-nums">
                    {(deal.buyAmt || 0).toLocaleString('ru-RU')} <span className="text-[10px] font-bold text-on-surface-variant">{deal.buyCcy || deal.currency}</span>
                  </div>
               </div>
               <div className="flex justify-between items-end pt-3 border-t border-primary/10">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase">Курс / Ставка</div>
                  <div className="text-lg font-black text-on-surface tabular-nums">
                    {deal.rate?.toFixed(4)}
                  </div>
               </div>
               <div className="flex justify-between items-center pt-3 border-t border-primary/10">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase">Оценка PV (тыс. руб)</div>
                  <div className="px-3 py-1 bg-white rounded-lg border border-primary/20 shadow-sm text-sm font-black text-primary tabular-nums">
                    {deal.pv.toLocaleString('ru-RU')}
                  </div>
               </div>
            </div>
          </section>

          {/* Instrument Specific */}
          {(deal.type === 'REPO' || deal.type === 'IRS') && (
            <section className="space-y-4">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-widest border-b border-line-soft pb-2">
                Специфические параметры {deal.type}
              </h3>
              <div className="grid grid-cols-1 gap-y-3">
                {deal.type === 'REPO' && (
                  <>
                    <DetailRow label="Объект залога" value={deal.collateral || '-'} />
                    <DetailRow label="ISIN" value={deal.isin || '-'} mono />
                    <DetailRow label="Вторая нога" value={`${(deal.leg2Total || 0).toLocaleString('ru-RU')} ${deal.currency}`} />
                  </>
                )}
                {deal.type === 'IRS' && (
                  <>
                    <DetailRow label="Нога 1" value={`${deal.leg1Type} (${deal.leg1Index})`} />
                    <DetailRow label="Нога 2" value={`${deal.leg2Type} (${deal.leg2RateSpread})`} />
                  </>
                )}
              </div>
            </section>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-line-soft flex gap-3 shrink-0 bg-surface-bright">
           <button className="flex-1 bg-surface-bright border border-line-soft text-primary font-black py-2.5 rounded-lg text-xs hover:bg-surface-container transition-all cursor-pointer">
              Скачать PDF
           </button>
           <button className="flex-1 bg-primary text-on-primary font-black py-2.5 rounded-lg text-xs hover:bg-primary-light transition-all shadow-md cursor-pointer">
              Подтвердить вручную
           </button>
        </div>
      </motion.div>
    </div>
  );
};

const DetailRow = ({ label, value, icon: Icon, highlight, mono }: any) => (
  <div className="flex items-center justify-between gap-4 py-0.5">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-on-surface-variant opacity-40" />}
      <span className="text-[11px] font-bold text-on-surface-variant">{label}:</span>
    </div>
    <span className={`text-[12px] ${highlight ? 'font-black text-primary' : 'font-semibold text-on-surface'} ${mono ? 'font-mono' : ''}`}>
      {value}
    </span>
  </div>
);
