# Earning Edge Architecture

## System overview

Earning Edge is an earnings intelligence dashboard that combines three layers:

1. Data ingestion layer
2. Backend function layer
3. Frontend analytics and visualization

## Layer 1 – Data ingestion

External sources include:

- Nasdaq earnings calendar
- options chains via Tradier
- Yahoo price data
- Google Sheets staging data

A separate scraper pipeline gathers, enriches, and stages data before it reaches the application.

## Layer 2 – Backend functions

Base44 serverless functions handle the orchestration of data updates.

Examples include:

- fetchNasdaqCalendar
- enrichTickers
- refreshPrices
- syncFromGoogleSheet
- fetchStockCandles

These functions normalize and update the stock entities used by the frontend.

## Layer 3 – Frontend application

The frontend is a Vite + React SPA built on Base44's SDK.

Key UI features:

- earnings dashboard
- stock detail modal
- deterministic sentiment engine
- AI trade idea assessment

## Sentiment model

The deterministic model uses several inputs:

- OTM dollar skew
- dollar PCR
- call and put walls
- expected move
- max pain relationship

The model produces a bullish, bearish, or neutral bias score.

## AI layer

The AI assessment layer does not replace the deterministic model. It consumes the model output and structured options fields to generate a narrative explanation and trade idea.

## Known design considerations

Important technical notes:

- Expected move currently appears in multiple formats across the pipeline.
- Several options positioning fields originate from the Google Sheet staging layer.
- Deterministic scoring logic is duplicated across multiple UI components and may eventually be centralized.

## Relationship to other projects

This repo is part of a broader ecosystem:

- Scraper repo – collects and prepares options and earnings data
- ES Trader Intel – futures intelligence dashboard
- TradeMastery – trading education platform

Each project focuses on a different part of the trading workflow.
