/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InstrumentType = 'SPOT' | 'SWAP' | 'FORWARD' | 'REPO' | 'IRS' | 'FRA' | 'FUTURES';

export interface Deal {
  id: string;
  extId: string;
  type: InstrumentType;
  tradeDate: string;
  settleDate: string;
  status: 'Verified' | 'Pending' | 'Failed';
  counterparty: string;
  currency: string;
  pv: number; // in thousand RUB
  deltaToMarket: number; // in percent or bps
  rate?: number;
  
  // Specific instrument properties
  buyCcy?: string;
  buyAmt?: number;
  sellCcy?: string;
  sellAmt?: number;
  
  // Repo specific properties
  collateral?: string;
  isin?: string;
  leg1Date?: string;
  leg1Dir?: 'B' | 'S';
  leg1Qty?: number;
  leg1Total?: number;
  leg2Date?: string;
  leg2Dir?: 'B' | 'S';
  leg2Qty?: number;
  leg2Total?: number;
  
  // IRS specific properties
  leg1Type?: 'Fixed' | 'Float';
  leg1RateSpread?: string;
  leg1Index?: string;
  leg2Type?: 'Fixed' | 'Float';
  leg2RateSpread?: string;
  leg2Index?: string;
}

export interface MarketQuote {
  id: string; // e.g. "USD/RUB"
  foreign: string;
  local: string;
  date: string;
  source: 'MOEX' | 'REUTERS' | 'BLOOMBERG';
  bid: number;
  ask: number;
  low: number;
  high: number;
  last: number;
  spreadBps: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CurveNode {
  tenor: string;
  date: string;
  rate: number; // zero rate %
  df: number;   // discount factor
  source: string;
}

export interface YieldCurve {
  id: string;
  currency: 'RUB' | 'USD' | 'EUR' | 'CNY';
  status: 'Live' | 'Stale' | 'Offline';
  nodes: CurveNode[];
  lastBuilt: string;
  buildProcedure: string;
  interpolation: string;
  extrapolation: string;
}

export type ActiveTab = 'overview' | 'fx_derivatives' | 'repo_instruments' | 'rate_derivatives' | 'deals' | 'market_data' | 'directories';
