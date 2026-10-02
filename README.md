# Culf — Culture Fun

Culf discovers cultural events from permitted public signals, clusters evidence, scores candidates, and researches a shortlist. The public site only lists actually launched tokens. Upcoming launches and candidate data remain private to `/ops`.

## Structure

- `web/` React + Vite discovery site, token evidence pages, private operations UI. Deploy to Vercel with root directory `web`.
- `api/` FastAPI API and scheduled worker. Deploy to Railway with root directory `api` and `api/railway.toml`.
- `docs/` source register and live-launch gate checklist.

## Run locally

1. From `api/`, create a venv, install requirements, and run the API:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
   pip install -r requirements.txt
   cp ../.env.example .env
   # Set a strong OPS_API_KEY; retain shadow mode and LAUNCH_ENABLED=false
   uvicorn app.main:app --reload --port 8000
   ```

   Local default is SQLite. For deployment use a PostgreSQL URL in `DATABASE_URL`.

2. In `web/`, run `cp .env.example .env`, `npm install`, and `npm run dev`. Open `http://localhost:5173`; operations is at `/ops`.

3. Add `OPENAI_API_KEY` to research shortlist candidates via the Responses API web-search tool and the `omni-moderation-latest` moderation endpoint. Without the key, the app stays in shadow mode; no live launch can pass controls.

The worker starts with the API and polls at `POLLING_MINUTES`; individual connectors use their own polling cadence. `/health` reports service status. In `/ops`, use **Run source cycle** for immediate collection.

## Deploy

**Railway API:** set service root directory to `api`, attach PostgreSQL, then set `APP_ENV=production`, `DATABASE_URL`, `WEB_ORIGIN=https://<vercel-domain>`, a strong `OPS_API_KEY`, and `OPENAI_API_KEY`. Keep `LAUNCH_MODE=shadow`, `LAUNCH_ENABLED=false`, `PUMP_HOLDER_REWARDS_VERIFIED=false`, and `PUMP_SDK_ENABLED=false`.

**Vercel web:** root directory `web`, set `VITE_API_URL=https://<railway-api-domain>`. The SPA rewrites token pages and `/ops`; `/ops` is excluded from indexing and not in public navigation. Set matching `WEB_ORIGIN` in Railway.

## Launch limitation

This clean-repo build intentionally has no Pump.fun transaction signer, SDK adapter, token metadata pinning, or live swap-fee collection. The launch route always returns HTTP 501 if gates pass and submits no transaction. It cannot silently fall back to a regular coin. Implement and review the adapter, persistent artwork metadata, signer isolation, atomic daily and per-launch SOL caps, idempotency, transaction-state verification, and holder-rewards readback before any mainnet use. The server hard-codes the adapter as absent in `controls()`; enabling a config flag alone cannot arm launches.

The configured maximum is five launches per day. Eligibility defaults are score ≥68 and two independent non-calendar source families. Operator approval cannot override failed score or safety checks. All material operations are recorded in the audit table.

## Verify

```bash
cd api
pip install -r requirements.txt pytest
pytest -q
python -m compileall -q app
cd ../web
npm install
npm run build
```
