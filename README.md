# Earning Edge

Earning Edge is an earnings-season trading dashboard built on Base44. It surfaces companies with upcoming earnings, enriches them with options data, and classifies each name as bullish, bearish, or neutral using both a deterministic scoring engine and an AI assessment layer.

## What this repo does

This repository powers the Earning Edge frontend and its Base44-connected backend function workflow.

Core responsibilities:
- display upcoming earnings names and filters
- sync and refresh enriched stock data
- visualize expected move, max pain, call/put walls, and OTM positioning
- score each ticker with a deterministic options sentiment model
- generate an AI assessment constrained by precomputed market inputs

## Data flow

At a high level, the app works like this:

1. Nasdaq calendar functions collect upcoming earnings names
2. Google Sheet sync pulls in precomputed options and open-interest fields
3. price refresh and enrichment functions update spot price, expiration, ATM premiums, and expected move
4. the frontend renders dashboard views, stock detail modals, sentiment bars, and AI assessment output

This app is downstream from the scraper pipeline. The scraper and staging sheet feed the data model that Earning Edge consumes.

## Main areas in the repo

```text
base44/functions/
  enrichTickers/
  fetchNasdaqCalendar/
  fetchStockCandles/
  fetchWeekCalendar/
  getFinnhubCompanyNews/
  pruneWeekFromGoogleSheet/
  refreshPrices/
  syncAllWeeksFromGoogleSheet/
  syncFromGoogleSheet/

src/
  api/
  pages/
  components/dashboard/
  components/widgets/
```

## Key product features

- upcoming earnings dashboard
- detailed stock modal with TradingView chart and options context
- deterministic sentiment engine for bullish, bearish, and neutral classification
- AI assessment with structured JSON output and trade-idea guidance
- shortlist tracking
- economic calendar and heatmap views

## Important architecture notes

- The app uses Base44's SDK client and invokes Deno backend functions through `base44.functions.invoke(...)`.
- Several important dollar open-interest fields come from the staging Google Sheet rather than being computed in the frontend.
- The current system has historically used `expected_move` in more than one unit context. See `ARCHITECTURE.md` for the current behavior and recommended normalization direction.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This project is connected to Base44. Code changes live in GitHub, but deployment behavior may still depend on the Base44 publish workflow for the app environment.

## Recommended companion docs

- `ARCHITECTURE.md` for system flow and design notes

## Status

This is an active product repo, not a starter scaffold. The repository is focused on earnings and options intelligence, not general trading education or futures-only analytics.
