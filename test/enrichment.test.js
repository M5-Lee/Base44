import { describe, it, expect } from 'vitest';
import { enrichTickers } from '../src/services/enrichment.js';

const makeAdapters = (overrides = {}) => ({
  getQuote: async (t) => ({ price: 123.45, change: 1.23, asOf: '2024-01-01T00:00:00.000Z' }),
  getMarketCap: async (t) => 50e9,
  getAtmOption: async (t, { direction }) => ({ premium: direction === 'call' ? 2.22 : 1.11, strike: 100 }),
  getAnalystSummary: async (t) => ({ sentiment: 'Bullish', notes: `${t} note` }),
  ...overrides,
});

describe('enrichTickers', () => {
  it('enriches tickers with normalized fields', async () => {
    const events = [
      { ticker: 'aapl', earnings_date: '2025-09-10' },
      { ticker: 'MSFT', earnings_date: '2025-09-11' },
    ];
    const rows = await enrichTickers(events, { mcapMin: 10e9 }, makeAdapters());
    expect(rows.length).toBe(2);
    for (const r of rows) {
      expect(r.ticker).toBe(r.ticker.toUpperCase());
      expect(r.marketCap).toBe(50e9);
      expect(r.price).toBe(123.45);
      expect(r.atmCall).toBe(2.22);
      expect(r.atmPut).toBe(1.11);
      expect(r.analyst).toBeTypeOf('string');
      expect(r.asOf).toMatch(/T/);
      // DB-friendly mirrors
      expect(r.current_price).toBe(123.45);
      expect(r.call_premium).toBe(2.22);
      expect(r.put_premium).toBe(1.11);
    }
  });

  it('returns empty for empty or malformed input', async () => {
    expect(await enrichTickers(undefined, {}, makeAdapters())).toEqual([]);
    expect(await enrichTickers([], {}, makeAdapters())).toEqual([]);
    const bad = [{}, { date: '2025-01-01' }, 42, null];
    expect(await enrichTickers(bad, {}, makeAdapters())).toEqual([]);
  });

  it('dedupes same ticker and keeps earliest earnings_date', async () => {
    const events = [
      { ticker: 'TSLA', earnings_date: '2025-09-15' },
      { ticker: 'tsla', earnings_date: '2025-09-12' },
      { ticker: 'TSLA', earnings_date: '2025-09-20' },
    ];
    const rows = await enrichTickers(events, {}, makeAdapters());
    expect(rows.length).toBe(1);
    expect(rows[0].ticker).toBe('TSLA');
    expect(rows[0].earnings_date).toBe('2025-09-12');
  });

  it('filters by market cap threshold', async () => {
    const events = [ 'LOWCAP', 'HIGHCAP' ];
    const adapters = makeAdapters({
      getMarketCap: async (t) => (t === 'HIGHCAP' ? 20e9 : 5e9),
    });
    const rows = await enrichTickers(events, { mcapMin: 10e9 }, adapters);
    expect(rows.length).toBe(1);
    expect(rows[0].ticker).toBe('HIGHCAP');
    expect(rows[0].marketCap).toBe(20e9);
  });
});

