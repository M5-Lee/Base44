// Simple local stub for the earnings calendar to unblock local dev.
// Adjust as needed while testing enrichment.

export async function fetchWeekCalendar({ fromDate, toDate } = {}) {
  const today = new Date();
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  const base = fromDate || iso(today);
  const next = toDate || iso(new Date(today.setDate(today.getDate() + 4)));

  const tickers = [
    { ticker: "AAPL", earnings_date: base },
    { ticker: "MSFT", earnings_date: base },
    { ticker: "AAPL", earnings_date: next }, // duplicate on purpose
    { ticker: "LOWC", earnings_date: base }, // will be filtered if mcapMin=10B
  ];
  return { tickers, meta: { fromDate: base, toDate: next, total_calendar_rows: tickers.length, unique_symbols: 3 } };
}

