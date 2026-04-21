// Adapter surface for market data. These are stubbed implementations
// that can be replaced later with Yahoo/QuantData wiring.

export async function getQuote(ticker) {
  const sym = String(ticker || "").toUpperCase();
  const now = new Date();
  // Simple deterministic stub based on ticker chars
  let hash = 0;
  for (let i = 0; i < sym.length; i++) hash = (hash * 31 + sym.charCodeAt(i)) >>> 0;
  const base = 20 + (hash % 300); // $20..$320
  const change = ((hash % 200) - 100) / 100; // -1.00 .. +1.00
  return { price: Number(base.toFixed(2)), change: Number(change.toFixed(2)), asOf: now.toISOString() };
}

export async function getMarketCap(ticker) {
  const sym = String(ticker || "").toUpperCase();
  // Deterministic market cap: make some small, some large
  const letter = sym.charCodeAt(0) || 65;
  const bucket = letter % 5;
  const caps = [5e9, 12e9, 35e9, 120e9, 800e9];
  return caps[bucket];
}

// direction: "call" | "put"
export async function getAtmOption(ticker, { direction = "call" } = {}) {
  const sym = String(ticker || "").toUpperCase();
  let hash = 0;
  for (let i = 0; i < sym.length; i++) hash = (hash * 33 + sym.charCodeAt(i)) >>> 0;
  const premium = (hash % 500) / 100; // 0.00 .. 5.00
  const strike = Math.round((20 + (hash % 300)) / 5) * 5;
  return { premium: Number(premium.toFixed(2)), strike };
}

export async function getAnalystSummary(ticker) {
  const sym = String(ticker || "").toUpperCase();
  const sentiments = ["Bullish", "Neutral", "Bearish"];
  const idx = (sym.charCodeAt(0) || 65) % sentiments.length;
  return { sentiment: sentiments[idx], notes: `${sym} analyst summary (stub)` };
}

export default {
  getQuote,
  getMarketCap,
  getAtmOption,
  getAnalystSummary,
};

