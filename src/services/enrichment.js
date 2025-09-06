import defaultMarketData from './marketData.js';

function toISO(dateLike) {
  if (!dateLike) return undefined;
  try {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

function humanizeNumber(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  const units = [
    { v: 1e12, s: 'T' },
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' },
  ];
  for (const u of units) {
    if (n >= u.v) return `${(n / u.v).toFixed(1)}${u.s}`;
  }
  return String(Math.round(n));
}

/**
 * Pure enrichment pipeline for earnings events.
 * @param {Array} events - Array of events: string tickers or {ticker, earnings_date?}
 * @param {Object} opts - Options: { mcapMin?: number }
 * @param {Object} adapters - Optional adapters for market data
 * @returns {Promise<Array>} Enriched rows
 */
export async function enrichTickers(events, opts = {}, adapters = defaultMarketData) {
  const { mcapMin = 10e9 } = opts;
  const { getQuote, getMarketCap, getAtmOption, getAnalystSummary } = adapters;

  // Normalize inputs → {ticker, earnings_date?}
  const norm = Array.isArray(events) ? events : [];
  const pre = norm.map((ev) => {
    if (!ev) return null;
    if (typeof ev === 'string') return { ticker: ev };
    if (typeof ev === 'object') {
      const t = ev.ticker ?? ev.symbol ?? ev[0];
      const d = ev.earnings_date ?? ev.date ?? ev[1];
      return t ? { ticker: t, earnings_date: toISO(d) } : null;
    }
    return null;
  }).filter(Boolean);

  // Uppercase + dedupe by ticker; prefer earliest earnings_date if multiple
  const byTicker = new Map();
  for (const item of pre) {
    const key = String(item.ticker || '').toUpperCase().trim();
    if (!key) continue;
    const d = item.earnings_date;
    if (!byTicker.has(key)) byTicker.set(key, { ticker: key, earnings_date: d });
    else if (d && (!byTicker.get(key).earnings_date || d < byTicker.get(key).earnings_date)) {
      byTicker.set(key, { ticker: key, earnings_date: d });
    }
  }
  const unique = Array.from(byTicker.values());
  if (unique.length === 0) return [];

  // Fetch market caps first, then filter
  const caps = await Promise.all(unique.map(u => getMarketCap(u.ticker).catch(() => undefined)));
  const kept = unique.filter((u, i) => {
    const cap = caps[i];
    return typeof cap === 'number' && Number.isFinite(cap) && cap >= mcapMin;
  });
  if (kept.length === 0) return [];

  // Enrich remaining symbols in parallel
  const quoteP = kept.map(u => getQuote(u.ticker).catch(() => ({ price: undefined, change: undefined, asOf: undefined })));
  const callP = kept.map(u => getAtmOption(u.ticker, { direction: 'call' }).catch(() => ({ premium: undefined })));
  const putP = kept.map(u => getAtmOption(u.ticker, { direction: 'put' }).catch(() => ({ premium: undefined })));
  const analP = kept.map(u => getAnalystSummary(u.ticker).catch(() => ({ sentiment: undefined, notes: undefined })));

  const [quotes, calls, puts, analyses] = await Promise.all([
    Promise.all(quoteP),
    Promise.all(callP),
    Promise.all(putP),
    Promise.all(analP),
  ]);

  // Build final rows (include both generic and DB-friendly fields)
  const nowIso = new Date().toISOString();
  return kept.map((u, i) => {
    const marketCap = caps[unique.indexOf(u)];
    const q = quotes[i] || {};
    const c = calls[i] || {};
    const p = puts[i] || {};
    const a = analyses[i] || {};

    const price = q.price;
    const atmCall = c.premium;
    const atmPut = p.premium;
    const analyst = a?.sentiment || a?.notes || undefined;
    const asOf = q.asOf || nowIso;

    const row = {
      ticker: u.ticker,
      earnings_date: u.earnings_date, // keep if provided
      marketCap,
      price,
      change: q.change,
      atmCall,
      atmPut,
      analyst,
      asOf,
      // DB-friendly mirrors to avoid UI mapping gaps
      current_price: price,
      call_premium: atmCall,
      put_premium: atmPut,
      analyst_sentiment: a?.sentiment,
      source: 'Enrichment',
      mkt_cap: humanizeNumber(marketCap),
    };

    // Drop undefined keys
    for (const k of Object.keys(row)) {
      if (row[k] === undefined || row[k] === null) delete row[k];
    }
    return row;
  });
}

export default { enrichTickers };

