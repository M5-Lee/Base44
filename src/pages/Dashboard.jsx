
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Stock } from "@/api/entities";
import { Shortlist } from "@/api/entities";
import { AnalystTape } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils"; // Fixed import syntax
import { Star, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import StockTable from "../components/dashboard/StockTable";
import QuickStats from "../components/dashboard/QuickStats";
import DataHeader from "../components/dashboard/DataHeader";
import StockDetailsModal from "../components/dashboard/StockDetailsModal";

// ---------- helpers ----------
const iso = (d) => new Date(d).toISOString().slice(0, 10);

/** Parse human-readable market cap like "41.5B", "150M", "2.1T" into a number */
const parseHumanNumber = (s) => {
  if (!s) return null;
  const t = String(s).replace(/,/g, "").trim().toUpperCase();
  if (!t) return null;
  const m = t.match(/^([0-9]*\.?[0-9]+)\s*([KMBT]?)$/);
  if (!m) {
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  const val = parseFloat(m[1]);
  const mult = { "": 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[2]] ?? 1;
  const n = val * mult;
  return Number.isFinite(n) ? n : null;
};

/** Some function wrappers return {data}, others return the object itself */
const unwrapData = (res) => (res && res.data ? res.data : res || {});

// ---------- component ----------
export default function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [shortlistItems, setShortlistItems] = useState([]);
  const [analystTapes, setAnalystTapes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [includeGaps, setIncludeGaps] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // For quick visibility into what the server returned for the week
  const [weekMeta, setWeekMeta] = useState(null);
  const [weekMessage, setWeekMessage] = useState("");

  // Default selectedWeek to current Monday (YYYY-MM-DD)
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const day = today.getDay(); // 0 Sun ... 6 Sat
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    return iso(monday);
  });

  // ---- initial load of existing data (DB) ----
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [stocksData, shortlistData, tapesData] = await Promise.all([
          Stock.list("-earnings_date"),
          Shortlist.list(),
          AnalystTape.list()
        ]);
        setStocks(stocksData);
        setShortlistItems(shortlistData);
        setAnalystTapes(tapesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // ---- reusable refresher for DB-backed lists ----
  const loadData = useCallback(async () => {
    try {
      const [stocksData, shortlistData, tapesData] = await Promise.all([
        Stock.list("-earnings_date"),
        Shortlist.list(),
        AnalystTape.list()
      ]);
      setStocks(stocksData);
      setShortlistItems(shortlistData);
      setAnalystTapes(tapesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  // ---- LIVE REFRESH: calls functions -> writes to Stock -> reloads ----
  const refreshLiveData = useCallback(async (weekStart) => {
    setIsLoading(true);
    setWeekMessage("");
    setWeekMeta(null);
    try {
      // Build Monday–Friday range
      const start = new Date(weekStart + "T00:00:00");
      const end = new Date(start);
      end.setDate(start.getDate() + 4);
      const fromDate = iso(start);
      const toDate = iso(end);

      // 1) Calendar discovery (no hard cap filter at this stage)
      const { fetchWeekCalendar } = await import("@/api/functions");
      const weekResRaw = await fetchWeekCalendar({ fromDate, toDate });
      const weekRes = unwrapData(weekResRaw);

      // Expecting: { tickers: [{ticker, earnings_date}], meta?: {...} }
      const rawTickers = Array.isArray(weekRes.tickers) ? weekRes.tickers : [];
      const meta = weekRes.meta || null;
      setWeekMeta(meta);
      console.log("Calendar meta:", meta);

      // 1a) Deduplicate by earliest earnings_date
      const tickerMap = new Map();
      for (const item of rawTickers) {
        const t = (item?.ticker || item?.[0] || "").toString().toUpperCase();
        const d = item?.earnings_date || item?.[1];
        if (!t || !d) continue;
        if (!tickerMap.has(t) || d < tickerMap.get(t)) {
          tickerMap.set(t, d);
        }
      }
      const uniqueItems = Array.from(tickerMap.entries()).map(([ticker, earnings_date]) => ({ ticker, earnings_date }));

      if (!uniqueItems.length) {
        const msg = "No eligible earnings found for selected week.";
        console.log(msg, { fromDate, toDate, meta });
        setWeekMessage(msg);
        return;
      }

      // 2) Enrich WITHOUT a market-cap cutoff (show all tickers)
      const { enrichTickers } = await import("@/api/functions");
      const enrichResRaw = await enrichTickers({ items: uniqueItems, minMcap: 0 });
      const enrichRes = unwrapData(enrichResRaw);
      const enrichedRaw = Array.isArray(enrichRes.stocks) ? enrichRes.stocks : [];

      if (!enrichedRaw.length) {
        const msg = "No symbols returned from enrichment for the selected week (no market-cap filter applied).";
        console.error(msg, { fromDate, toDate, discovered: uniqueItems.length, meta: enrichRes?.meta });
        setWeekMessage(msg);
        return;
      }

      // 2a) Deduplicate enriched results by ticker (safety)
      const enrichedMap = new Map();
      for (const row of enrichedRaw) {
        if (!row?.ticker) continue;
        const key = row.ticker.toString().toUpperCase();
        if (!enrichedMap.has(key)) {
          enrichedMap.set(key, row);
        }
      }
      const enriched = Array.from(enrichedMap.values());

      // 3) Clear existing Stock rows inside the selected week window
      const existing = await Stock.list();
      const weekStartDate = new Date(fromDate + "T00:00:00");
      const weekEndDate = new Date(toDate);
      weekEndDate.setHours(23, 59, 59, 999);
      for (const s of existing) {
        if (!s?.earnings_date) continue;
        const ed = new Date(s.earnings_date + "T00:00:00");
        if (ed >= weekStartDate && ed <= weekEndDate) {
          await Stock.delete(s.id);
        }
      }

      // 4) Persist
      await Stock.bulkCreate(enriched);
      await loadData();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing live data:", error);
      setWeekMessage(error?.message || String(error));
    } finally {
      setIsLoading(false);
    }
  }, [loadData, setLastUpdated]);

  // Auto-refresh when week changes
  useEffect(() => {
    if (selectedWeek) {
      refreshLiveData(selectedWeek);
    }
  }, [selectedWeek, refreshLiveData]);

  const handleCSVUpload = useCallback(async (file) => {
    const { UploadFile, ExtractDataFromUploadedFile } = await import("@/api/integrations");
    try {
      setIsLoading(true);
      const uploadResult = await UploadFile({ file });

      // Simpler schema hint; extractor may still return a flat array of rows
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ticker: { type: "string" },
              company: { type: "string" },
              earnings_date: { type: "string" },
              spot: { type: "number" },
              expiry: { type: "string" },
              eps_est_cal: { type: "number" },
              avg_vol_3m: { type: "number" },
              wk52_low: { type: "number" },
              wk52_high: { type: "number" },
              mkt_cap: { type: "string" },
              price_target: { type: "number" },
              atm1_call_strike: { type: "number" },
              atm1_call_premium: { type: "number" },
              atm1_put_strike: { type: "number" },
              atm1_put_premium: { type: "number" }
            },
            required: ["ticker"]
          }
        }
      });

      // Accept both shapes: {stocks: [...]} or [...] or {data: [...]}
      const rows =
        Array.isArray(extractResult?.output?.stocks) ? extractResult.output.stocks :
        Array.isArray(extractResult?.output) ? extractResult.output :
        Array.isArray(extractResult?.output?.data) ? extractResult.output.data :
        [];

      if (!(extractResult.status === "success") || rows.length === 0) {
        console.error("CSV extraction failed or returned no rows:", extractResult?.details || extractResult);
        setIsLoading(false);
        return;
      }

      // Helper to coerce valid numbers
      const toNum = (v) => {
        const n = typeof v === "number" ? v : Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      // Map human market cap string (e.g., "41.5B") -> enum; if unknown, omit the field
      const catFromHuman = (s) => {
        if (!s) return undefined;
        const t = String(s).replace(/,/g, "").trim().toUpperCase();
        const m = t.match(/^([0-9]*\.?[0-9]+)\s*([KMBT]?)$/);
        let num = Number(t);
        if (!Number.isFinite(num) && m) {
          const val = parseFloat(m[1]);
          const mult = { "": 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[2]] ?? 1;
          num = val * mult;
        }
        if (!Number.isFinite(num)) return undefined;
        if (num >= 2e11) return "Mega Cap";
        if (num >= 1e10) return "Large Cap";
        if (num >= 2e9) return "Mid Cap";
        return "Small Cap";
      };

      // Clear existing stocks before import (same behavior as before)
      const existingStocks = await Stock.list();
      for (const stock of existingStocks) {
        await Stock.delete(stock.id);
      }

      // Build new records, omitting invalid/null fields to satisfy schema
      const newStocks = rows.map((row) => {
        const rec = {
          ticker: row.ticker || row.Ticker,
          company_name: row.company || row.company_name || row.Company || "Unknown",
          earnings_date: iso(row.earnings_date || row.date || row.EarningsDate),
          sector: "Technology", // placeholder (valid enum value)
          seasonality_bias: "Neutral",
          source: "CSV Upload"
        };

        const price = toNum(row.spot ?? row.price ?? row.current_price);
        if (price !== undefined) rec.current_price = price;

        const v = toNum(row.avg_vol_3m ?? row.volume);
        if (v !== undefined) rec.volume = v;

        const l = toNum(row.wk52_low);
        if (l !== undefined) rec.wk52_low = l;

        const h = toNum(row.wk52_high);
        if (h !== undefined) rec.wk52_high = h;

        const cp = toNum(row.atm1_call_premium);
        if (cp !== undefined) rec.call_premium = cp;

        const pp = toNum(row.atm1_put_premium);
        if (pp !== undefined) rec.put_premium = pp;

        const cs = toNum(row.atm1_call_strike);
        if (cs !== undefined) rec.nearest_atm_strike = cs;

        const expiry = row.expiry || row.chosen_expiration;
        if (expiry) rec.chosen_expiration = iso(expiry);

        const cat = catFromHuman(row.mkt_cap);
        if (cat) rec.market_cap = cat;

        return rec;
      }).filter(r => r.ticker && r.earnings_date); // ensure required fields

      if (newStocks.length === 0) {
        console.error("No valid stock rows after mapping.");
        setIsLoading(false);
        return;
      }

      await Stock.bulkCreate(newStocks);
      await loadData();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error processing CSV:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  // Derived: only the selected week’s stocks, with optional gap filtering and UI-level dedupe
  const processedStocks = useMemo(() => {
    const getWeekRange = (dateString) => {
      const d = new Date(dateString + "T00:00:00");
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      friday.setHours(23, 59, 59, 999);
      return { monday, friday };
    };

    const { monday: weekStart, friday: weekEnd } = getWeekRange(selectedWeek);

    const weekStocks = stocks
      .filter((stock) => {
        const earningsDate = new Date(stock.earnings_date + "T00:00:00");
        return earningsDate >= weekStart && earningsDate <= weekEnd;
      })
      .map((stock) => {
        const hasGap = !stock.current_price || !stock.expected_move;
        if (!includeGaps && hasGap) return null;
        return { ...stock, has_gap: hasGap };
      })
      .filter(Boolean);

    // Dedupe by ticker for the week (prefer most recently updated)
    const byTicker = new Map();
    for (const s of weekStocks) {
      const key = (s.ticker || "").toString().toUpperCase();
      if (!key) continue;
      const prev = byTicker.get(key);
      if (!prev) {
        byTicker.set(key, s);
      } else {
        const prevTime = new Date(prev.updated_date || prev.created_date || 0).getTime();
        const currTime = new Date(s.updated_date || s.created_date || 0).getTime();
        if (currTime > prevTime) byTicker.set(key, s);
      }
    }
    return Array.from(byTicker.values());
  }, [stocks, includeGaps, selectedWeek]);

  const handleAddToShortlist = async (stock) => {
    try {
      await Shortlist.create({
        ticker: stock.ticker,
        priority: 5,
        strategy: "Long Call"
      });
      loadData();
    } catch (error) {
      console.error("Error adding to shortlist:", error);
    }
  };

  const isInShortlist = (ticker) => {
    return shortlistItems.some((item) => item.ticker === ticker);
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Ticker", "Company", "Earnings Date", "Price", "Sector", "Expected Move", "Call Premium", "Put Premium", "Source"],
      ...processedStocks.map((stock) => [
        stock.ticker,
        stock.company_name,
        stock.earnings_date,
        stock.current_price,
        stock.sector,
        `${stock.expected_move || 0}%`,
        `$${(stock.call_premium || 0).toFixed(2)}`,
        `$${(stock.put_premium || 0).toFixed(2)}`,
        stock.source || "N/A"
      ])
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "earnings-screener.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (stock) => setSelectedStock(stock);

  // ---------- render ----------
  return (
    <div className="p-4 md:p-8 min-h-screen earnings-gradient">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Earnings Dashboard</h1>
            <p className="text-gray-400">Screen weekly earnings plays and find affordable options</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Switch id="include-gaps" checked={includeGaps} onCheckedChange={setIncludeGaps} />
              <Label htmlFor="include-gaps" className="text-gray-300">Include Gaps</Label>
            </div>
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Link to={createPageUrl("Shortlist")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Star className="w-4 h-4 mr-2" />
                Shortlist ({shortlistItems.length})
              </Button>
            </Link>
          </div>
        </div>

        <DataHeader
          lastUpdated={lastUpdated}
          recordsLoaded={stocks.length}
          onRefresh={() => refreshLiveData(selectedWeek)}
          onCSVUpload={handleCSVUpload}
        />

        {/* Week diagnostics — helps confirm calendar behavior at a glance */}
        <div className="w-full rounded-xl border border-gray-700 bg-gray-900/40 p-4">
          <div className="text-gray-300 text-sm flex flex-wrap gap-4">
            <div><span className="text-gray-400">Week:</span> <span className="font-mono">{selectedWeek} → {iso(new Date(new Date(selectedWeek).setDate(new Date(selectedWeek).getDate() + 4)))}</span></div>
            <div><span className="text-gray-400">Calendar rows:</span> <span className="font-mono">{weekMeta?.total_calendar_rows ?? "—"}</span></div>
            <div><span className="text-gray-400">Unique symbols:</span> <span className="font-mono">{weekMeta?.unique_symbols ?? "—"}</span></div>
            <div><span className="text-gray-400">≥ $10B kept:</span> <span className="font-mono">{weekMeta?.filtered_ge_10b ?? "—"}</span></div>
            {weekMessage ? (
              <div className="text-amber-400">Note: {weekMessage}</div>
            ) : null}
          </div>
        </div>

        <QuickStats stocks={processedStocks} />

        <StockTable
          stocks={processedStocks}
          isLoading={isLoading}
          onAddToShortlist={handleAddToShortlist}
          isInShortlist={isInShortlist}
          onRowClick={handleRowClick}
          analystTapes={analystTapes}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
        />

        <StockDetailsModal
          stock={selectedStock}
          analystTape={analystTapes.find((t) => t.ticker === selectedStock?.ticker)}
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      </div>
    </div>
  );
}
