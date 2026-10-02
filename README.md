# Culf — Culture Fun

Culf discovers cultural events from permitted public signals, clusters evidence, scores candidates, and researches a shortlist. The public site only lists actually launched tokens. Upcoming launches and candidate data remain private to `/ops`.

## Structure

- `web/` React + Vite discovery site, token evidence pages, private operations UI. Deploy to Vercel with root directory `web`.
- `api/` FastAPI API and scheduled worker. Deploy to Railway with root directory `api` and `api/railway.toml`.
- `launcher/` isolated metadata preparation service. Deploy as a separate Railway service with root directory `launcher`; dry-run only, with no signing key or transaction submission path.
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
4. To exercise metadata preparation, run the separate launcher service with a random `LAUNCHER_API_TOKEN`. Set the same token and `LAUNCHER_URL` in the API. Add `PINATA_JWT` to the launcher only if you want it to pin generated artwork and JSON metadata; without it, the service returns an SVG preview and leaves metadata unpinned.

The worker starts with the API and polls at `POLLING_MINUTES`; individual connectors use their own polling cadence. `/health` reports service status. In `/ops`, use **Run source cycle** for immediate collection.

## Deploy

**Railway API:** set service root directory to `api`, attach PostgreSQL, then set `APP_ENV=production`, `DATABASE_URL`, `WEB_ORIGIN=https://<vercel-domain>`, a strong `OPS_API_KEY`, and `OPENAI_API_KEY`. Set `LAUNCHER_URL` to the private launcher service URL and set the matching `LAUNCHER_API_TOKEN`. Keep `LAUNCH_MODE=shadow`, `LAUNCH_ENABLED=false`, `PUMP_HOLDER_REWARDS_VERIFIED=false`, and `PUMP_SDK_ENABLED=false`.

**Railway launcher:** create a separate service with root directory `launcher` and `launcher/railway.toml`. Set a separate random `LAUNCHER_API_TOKEN`; copy it to the API service. Optionally set `PINATA_JWT` and `APP_ORIGIN`. The launcher intentionally has no Solana key, Pump SDK, or transaction-send code. Keep its endpoint private to the API service.

**Vercel web:** root directory `web`, set `VITE_API_URL=https://<railway-api-domain>`. The SPA rewrites token pages and `/ops`; `/ops` is excluded from indexing and not in public navigation. Set matching `WEB_ORIGIN` in Railway.

## Launch limitation

The launcher service currently prepares original SVG artwork and token metadata in dry-run mode only. With `PINATA_JWT`, it pins the SVG and metadata JSON to IPFS; without it, it returns the SVG preview and does not claim durable storage. It has no wallet, signing key, Pump SDK, or transaction-submit operation. The API records dry-run state and does not publish it as a launched token. Live launches still require a separately reviewed Pump.fun SDK adapter, restricted signer, persistent atomic daily and per-launch SOL caps, durable idempotency and reconciliation, transaction-state verification, and on-chain holder-rewards readback. Do not enable mainnet launches by changing environment flags: the live adapter remains hard-coded absent in `controls()`.

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
cd ../launcher
npm test
```
