/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { YieldCurve } from '../types';

// Currency hierarchy table from requirements (lower rank means higher priority as base currency)
export const CURRENCY_HIERARCHY: Record<string, number> = {
  'XDR': 0, 'XAU': 1, 'GLD': 2, 'EUR': 3, 'GBP': 4, 'AUD': 5, 'NZD': 6,
  'USD': 7, 'CAD': 8, 'CHF': 9, 'TRY': 10, 'DKK': 11, 'NOK': 12, 'ZAR': 13,
  'SEK': 14, 'CNY': 15, 'CNH': 16, 'BRL': 17, 'HKD': 18, 'INR': 19, 'CZK': 20,
  'KZT': 21, 'JPY': 22, 'BYN': 23, 'SGD': 24, 'KRW': 25, 'HUF': 26, 'RON': 27,
  'AZN': 28, 'BGN': 29, 'UZS': 30, 'KGS': 31, 'MDL': 32, 'PLN': 33, 'TMT': 34,
  'TJS': 35, 'UAH': 36, 'AMD': 37, 'GEL': 38, 'RUB': 39
};

// Map typical tenors to days
export const TENOR_DAYS: Record<string, number> = {
  '1D': 1, 'O/N': 1,
  '1W': 7,
  '2W': 14,
  '1M': 30,
  '2M': 60,
  '3M': 90,
  '6M': 180,
  '9M': 270,
  '1Y': 360, '12M': 360,
  '2Y': 720,
  '5Y': 1800,
  '10Y': 3600,
  '30Y': 10800
};

// Tenor Mapping bounds
export interface TenorBounds {
  tenorMin: string;
  tenorMax: string;
  daysMin: number;
  daysMax: number;
}

export function getTenorBounds(days: number): TenorBounds {
  if (days < 0) days = 0;
  if (days <= 6) {
    return { tenorMin: '1D', tenorMax: '1W', daysMin: 1, daysMax: 7 };
  } else if (days <= 13) {
    return { tenorMin: '1W', tenorMax: '2W', daysMin: 7, daysMax: 14 };
  } else if (days <= 29) {
    return { tenorMin: '2W', tenorMax: '1M', daysMin: 14, daysMax: 30 };
  } else if (days <= 59) {
    return { tenorMin: '1M', tenorMax: '2M', daysMin: 30, daysMax: 60 };
  } else if (days <= 89) {
    return { tenorMin: '2M', tenorMax: '3M', daysMin: 60, daysMax: 90 };
  } else if (days <= 179) {
    return { tenorMin: '3M', tenorMax: '6M', daysMin: 90, daysMax: 180 };
  } else if (days <= 269) {
    return { tenorMin: '6M', tenorMax: '9M', daysMin: 180, daysMax: 270 };
  } else if (days <= 359) {
    return { tenorMin: '9M', tenorMax: '12M', daysMin: 270, daysMax: 360 };
  } else {
    return { tenorMin: '12M', tenorMax: '12M', daysMin: 360, daysMax: 360 };
  }
}

// Linear Rate Interpolator
export function interpolateRate(days: number, curve: YieldCurve): { r: number; tenorMin: string; tenorMax: string; rMin: number; rMax: number } {
  const bounds = getTenorBounds(days);
  
  // Find node rates in curves or fall back to sensible initial values
  const nodes = curve?.nodes || [];
  
  const nodeMin = nodes.find(n => n.tenor.toUpperCase() === bounds.tenorMin.toUpperCase() || (bounds.tenorMin === '1D' && n.tenor.toUpperCase() === '1D')) 
    || nodes[0] 
    || { rate: 15.0 };
    
  const nodeMax = nodes.find(n => n.tenor.toUpperCase() === bounds.tenorMax.toUpperCase() || (bounds.tenorMax === '12M' && n.tenor.toUpperCase() === '1Y'))
    || nodes[nodes.length - 1] 
    || { rate: 15.0 };

  const rMin = nodeMin.rate;
  const rMax = nodeMax.rate;

  if (bounds.daysMax === bounds.daysMin) {
    return { r: rMin, tenorMin: bounds.tenorMin, tenorMax: bounds.tenorMax, rMin, rMax };
  }

  // Linear formula: r(T) = r_low + (r_high - r_low) * (T - T_low) / (T_high - T_low)
  const r = rMin + (rMax - rMin) * (days - bounds.daysMin) / (bounds.daysMax - bounds.daysMin);

  return { r, tenorMin: bounds.tenorMin, tenorMax: bounds.tenorMax, rMin, rMax };
}

// Determine pair base/quote according to priority
export function getDeterminedPair(ccyA: string, ccyB: string): { pair: string; base: string; quote: string; isReversed: boolean } {
  const rankA = CURRENCY_HIERARCHY[ccyA.toUpperCase()] !== undefined ? CURRENCY_HIERARCHY[ccyA.toUpperCase()] : 99;
  const rankB = CURRENCY_HIERARCHY[ccyB.toUpperCase()] !== undefined ? CURRENCY_HIERARCHY[ccyB.toUpperCase()] : 99;
  
  if (rankA <= rankB) {
    return { pair: `${ccyA}/${ccyB}`, base: ccyA, quote: ccyB, isReversed: false };
  } else {
    return { pair: `${ccyB}/${ccyA}`, base: ccyB, quote: ccyA, isReversed: true };
  }
}

// Discount Factor = 1 / (1 + r * T / 360) (where rate is decimal, e.g. 15% -> 0.15)
export function calculateDF(ratePercent: number, days: number): number {
  return 1 / (1 + (ratePercent / 100) * days / 360);
}

// Theoretical Swap difference: Spot * (r1 - r2) * T/360 / (1 + r2 * T/360)
export function calculateTheoreticalSwapPoints(spot: number, r1: number, r2: number, days: number): number {
  const rate1 = r1 / 100; // domestic ccy rate
  const rate2 = r2 / 100; // foreign ccy rate
  const dev = days / 360;
  return spot * (rate1 - rate2) * dev / (1 + rate2 * dev);
}

// Theoretical Forward: Spot * (1 + r1 * T/360) / (1 + r2 * T/360)
export function calculateTheoreticalForward(spot: number, r1: number, r2: number, days: number): number {
  const rate1 = r1 / 100;
  const rate2 = r2 / 100;
  const dev = days / 360;
  return spot * (1 + rate1 * dev) / (1 + rate2 * dev);
}

// Full derivative valuation engine
export interface ValuationResult {
  dealId: string;
  type: string;
  currency: string;
  
  // ZONA 1: Primary outcomes
  fairValueCbr: number;
  fairValueMin: number;
  fairValueMax: number;
  isMarket: boolean | string;
  deviationScorePct: number;
  deviationSwapPointsAbs?: number;
  
  // ZONA 2: Calculations Audit
  spotCbr: number;
  spotMin: number;
  spotMax: number;
  spotCcp: number;
  
  termDays: number;
  r1: number; // interpolated internal rate
  r2: number; // interpolated external rate
  df1: number; // discount factor 1
  df2: number; // discount factor 2
  
  swapPointsDeal?: number;
  swapPointsMin?: number;
  swapPointsMax?: number;
  swapPointsTheo?: number;
  
  forwardDeal?: number;
  forwardMin?: number;
  forwardMax?: number;
  forwardTheo?: number;

  k1_control?: boolean;
  k2_control?: boolean;
  discountDeal_repo?: number;
  discountNkc_repo?: number;
  discountDev_repo?: number;
  rusfarRate_repo?: number;
  rusfarDev_repo?: number;
}

export function evaluateDerivativeDeal(
  deal: {
    id: string;
    type: string;
    currency: string;
    rate?: number;
    buyAmt?: number;
    sellAmt?: number;
    buyCcy?: string;
    sellCcy?: string;
    tradeDate: string;
    settleDate: string;
    leg1Date?: string;
    leg2Date?: string;
    leg1Qty?: number;
    leg1Total?: number;
    leg2Qty?: number;
    leg2Total?: number;
    isin?: string;
    collateral?: string;
  },
  curves: YieldCurve[],
  source: 'MOEX' | 'REUTERS' | 'BLOOMBERG'
): ValuationResult {
  // Mock standard rates for evaluation if none found
  let spotCbr = 93.42;
  let spotMin = 93.10;
  let spotMax = 93.85;
  let spotCcp = 93.4575;
  
  if (deal.currency === 'EUR') {
    spotCbr = 99.13; spotMin = 98.80; spotMax = 99.45; spotCcp = 99.135;
  } else if (deal.currency === 'CNY') {
    spotCbr = 12.75; spotMin = 12.70; spotMax = 12.80; spotCcp = 12.7525;
  } else if (deal.currency === 'GBP') {
    spotCbr = 114.22; spotMin = 113.80; spotMax = 114.80; spotCcp = 114.25;
  }

  // Calculate term days T
  let termDays = 30;
  if (deal.type === 'REPO') {
    if (deal.leg1Date && deal.leg2Date) {
      termDays = Math.max(1, Math.round((new Date(deal.leg2Date).getTime() - new Date(deal.leg1Date).getTime()) / (1000 * 3600 * 24)));
    }
  } else if (deal.type === 'SWAP') {
    if (deal.leg1Date && deal.leg2Date) {
      termDays = Math.max(1, Math.round((new Date(deal.leg2Date).getTime() - new Date(deal.leg1Date).getTime()) / (1000 * 3600 * 24)));
    }
  } else {
    // SPOT & FORWARD
    if (deal.tradeDate && deal.settleDate) {
      termDays = Math.max(1, Math.round((new Date(deal.settleDate).getTime() - new Date(deal.tradeDate).getTime()) / (1000 * 3600 * 24)));
    }
  }

  // Fetch yield curves
  const curvesMap = {
    domestic: curves.find(c => c.currency === 'RUB') || curves[0],
    foreign: curves.find(c => c.currency === deal.currency) || curves[0]
  };

  const { r: r1 } = interpolateRate(termDays, curvesMap.domestic);
  const { r: r2 } = interpolateRate(termDays, curvesMap.foreign);

  const df1 = calculateDF(r1, termDays);
  const df2 = calculateDF(r2, termDays);

  // Direction determination
  // (In standard FX pairs RUB has lower priority, so determined is currency/RUB, reversed has foreign as base)
  const buyAmt = deal.buyAmt || 1000000;
  const sellAmt = deal.sellAmt || 95420000;
  const rateDeal = deal.rate || (sellAmt / buyAmt) || 95.42;

  const isBuyForeign = deal.buyCcy === deal.currency;
  
  let fairValueCbr = 0;
  let fairValueMin = 0;
  let fairValueMax = 0;
  let isMarket: boolean | string = true;
  let deviationScorePct = 0;
  let result: ValuationResult;

  if (deal.type === 'SPOT') {
    // Spot deviation simply compares deal rate vs MOEX min and max spot bounds
    if (rateDeal >= spotMin && rateDeal <= spotMax) {
      isMarket = 'В рынке';
      deviationScorePct = 0;
    } else if (rateDeal < spotMin) {
      deviationScorePct = parseFloat(((rateDeal - spotMin) / spotMin * 100).toFixed(4));
      isMarket = `откл: ${deviationScorePct.toFixed(2)}%`;
    } else {
      deviationScorePct = parseFloat(((rateDeal - spotMax) / spotMax * 100).toFixed(4));
      isMarket = `откл: +${deviationScorePct.toFixed(2)}%`;
    }

    // FV calculations: (DF1 * Sum_RUB - DF2 * Sum_Foreign * Spot) / 1000
    // If buying foreign: FV = (DF2 * N_Foreign * Spot - DF1 * N_RUB) / 1000
    // If selling foreign: FV = (DF1 * N_RUB - DF2 * N_Foreign * Spot) / 1000
    if (isBuyForeign) {
      fairValueCbr = (df2 * buyAmt * spotCbr - df1 * sellAmt) / 1000;
      fairValueMin = (df2 * buyAmt * spotMin - df1 * sellAmt) / 1000;
      fairValueMax = (df2 * buyAmt * spotMax - df1 * sellAmt) / 1000;
    } else {
      fairValueCbr = (df1 * buyAmt - df2 * sellAmt * spotCbr) / 1000;
      fairValueMin = (df1 * buyAmt - df2 * sellAmt * spotMin) / 1000;
      fairValueMax = (df1 * buyAmt - df2 * sellAmt * spotMax) / 1000;
    }

    result = {
      dealId: deal.id,
      type: 'SPOT',
      currency: deal.currency,
      fairValueCbr, fairValueMin, fairValueMax,
      isMarket, deviationScorePct,
      spotCbr, spotMin, spotMax, spotCcp,
      termDays, r1, r2, df1, df2
    };

  } else if (deal.type === 'FORWARD') {
    const forwardTheo = calculateTheoreticalForward(spotCcp, r1, r2, termDays);
    const forwardMin = calculateTheoreticalForward(spotMin, r1 - 0.2, r2 + 0.2, termDays);
    const forwardMax = calculateTheoreticalForward(spotMax, r1 + 0.2, r2 - 0.2, termDays);

    if (rateDeal >= forwardMin && rateDeal <= forwardMax) {
      isMarket = 'В рынке';
      deviationScorePct = 0;
    } else if (rateDeal < forwardMin) {
      deviationScorePct = parseFloat(((rateDeal - forwardMin) / spotCcp * 100).toFixed(4));
      isMarket = `откл: ${deviationScorePct.toFixed(2)}%`;
    } else {
      deviationScorePct = parseFloat(((rateDeal - forwardMax) / spotCcp * 100).toFixed(4));
      isMarket = `откл: +${deviationScorePct.toFixed(2)}%`;
    }

    // Forward fair values
    if (isBuyForeign) {
      const nomForeign = deal.buyAmt || 1000000;
      const nomRub = deal.sellAmt || 95420000;
      fairValueCbr = (df2 * nomForeign * spotCbr - df1 * nomRub) / 1000;
      fairValueMin = (df2 * nomForeign * spotMin - df1 * nomRub) / 1000;
      fairValueMax = (df2 * nomForeign * spotMax - df1 * nomRub) / 1000;
    } else {
      const nomForeign = deal.sellAmt || 1000000;
      const nomRub = deal.buyAmt || 95420000;
      fairValueCbr = (df1 * nomRub - df2 * nomForeign * spotCbr) / 1000;
      fairValueMin = (df1 * nomRub - df2 * nomForeign * spotMin) / 1000;
      fairValueMax = (df1 * nomRub - df2 * nomForeign * spotMax) / 1000;
    }

    result = {
      dealId: deal.id,
      type: 'FORWARD',
      currency: deal.currency,
      fairValueCbr, fairValueMin, fairValueMax,
      isMarket, deviationScorePct,
      spotCbr, spotMin, spotMax, spotCcp,
      termDays, r1, r2, df1, df2,
      forwardDeal: rateDeal,
      forwardMin, forwardMax, forwardTheo
    };

  } else if (deal.type === 'SWAP') {
    // Leg 2 price - Leg 1 price is the actual Swap Difference
    const rateLeg1 = deal.rate || 94.5;
    const rateLeg2 = (deal.leg2Total && deal.leg2Qty) ? deal.leg2Total / deal.leg2Qty : (rateLeg1 + 0.95);
    const swapPointsDeal = rateLeg2 - rateLeg1;

    const swapPointsTheo = calculateTheoreticalSwapPoints(spotCcp, r1, r2, termDays);
    const swapPointsMin = calculateTheoreticalSwapPoints(spotCcp, r1 - 0.2, r2 + 0.2, termDays);
    const swapPointsMax = calculateTheoreticalSwapPoints(spotCcp, r1 + 0.2, r2 - 0.2, termDays);

    if (swapPointsDeal >= swapPointsMin && swapPointsDeal <= swapPointsMax) {
      isMarket = 'В рынке';
      deviationScorePct = 0;
    } else {
      deviationScorePct = parseFloat(((swapPointsDeal - swapPointsTheo) / spotCcp * 100).toFixed(4));
      isMarket = `${deviationScorePct > 0 ? '+' : ''}${deviationScorePct.toFixed(2)}% отп.`;
    }

    const swapDeviationAbs = swapPointsDeal - swapPointsTheo;

    // Swap Fair Values: difference between discounted cash flows of both legs
    if (isBuyForeign) {
      fairValueCbr = (df2 * buyAmt * spotCbr - df1 * sellAmt) / 1000;
      fairValueMin = (df2 * buyAmt * spotMin - df1 * sellAmt) / 1000;
      fairValueMax = (df2 * buyAmt * spotMax - df1 * sellAmt) / 1000;
    } else {
      fairValueCbr = (df1 * buyAmt - df2 * sellAmt * spotCbr) / 1000;
      fairValueMin = (df1 * buyAmt - df2 * sellAmt * spotMin) / 1000;
      fairValueMax = (df1 * buyAmt - df2 * sellAmt * spotMax) / 1000;
    }

    result = {
      dealId: deal.id,
      type: 'SWAP',
      currency: deal.currency,
      fairValueCbr, fairValueMin, fairValueMax,
      isMarket, deviationScorePct,
      spotCbr, spotMin, spotMax, spotCcp,
      termDays, r1, r2, df1, df2,
      swapPointsDeal, swapPointsMin, swapPointsMax, swapPointsTheo,
      deviationSwapPointsAbs: swapDeviationAbs
    };

  } else {
    // REPO
    const repoRateDeal = deal.rate || 14.5;
    const rusfarRate_repo = 15.15; // Benchmark short term rusfar
    const rusfarDev_repo = repoRateDeal - rusfarRate_repo;

    // Collateral evaluations
    const closePrice = 98.50; // default MOEX close bonds %
    const firstLegPrice = (deal.leg1Total && deal.leg1Qty) ? (deal.leg1Total / deal.leg1Qty) : 95.00;
    const discountDeal_repo = (1 - firstLegPrice / closePrice) * 100;
    const discountNkc_repo = 5.0; // NCC Required Risk Parameter Hair-cut %
    const discountDev_repo = discountDeal_repo - discountNkc_repo;

    // Control sums
    // leg1Total verify
    const leg1Qty = deal.leg1Qty || 100000;
    const k1_control = Math.abs((deal.leg1Total || 0) - (leg1Qty * firstLegPrice)) < 1.0;
    // leg2Total verify: should equal leg1Total * (1 + rate * T / 360) 
    const calculatedLeg2Total = (deal.leg1Total || 0) * (1 + (repoRateDeal / 100) * termDays / 360);
    const k2_control = Math.abs((deal.leg2Total || 0) - calculatedLeg2Total) < 1000.0;

    isMarket = Math.abs(rusfarDev_repo) < 1.0 ? 'В рынке' : `откл: ${rusfarDev_repo.toFixed(2)} п.п.`;

    result = {
      dealId: deal.id,
      type: 'REPO',
      currency: deal.currency,
      fairValueCbr: 520, fairValueMin: 480, fairValueMax: 560, // Collateralized valuation mock
      isMarket,
      deviationScorePct: rusfarDev_repo,
      spotCbr, spotMin, spotMax, spotCcp,
      termDays, r1, r2, df1, df2,
      k1_control, k2_control,
      discountDeal_repo, discountNkc_repo, discountDev_repo,
      rusfarRate_repo, rusfarDev_repo
    };
  }

  return result;
}

