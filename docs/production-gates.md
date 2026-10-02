# Live launch gates

Run in shadow mode and review false positives before considering any live launch. Before implementing an automatic signer:

1. The current launcher is preparation-only: it has no key and contains no transaction broadcast code. Keep `LAUNCH_MODE=shadow`, `LAUNCH_ENABLED=false`, and holder-reward verification false.
2. Test the metadata dry-run with no `PINATA_JWT`, then with a restricted Pinata JWT. Verify artwork and metadata CIDs, downloaded content, escaping, and the Culf event URL before considering a live adapter.
3. For a future live adapter, use the current official Pump.fun SDK create-v2 path and require holder rewards to be explicitly true. Verify the on-chain coin state after submission; never fall back to regular coins.
4. Isolate signing in a restricted service or KMS, outside the API, worker, web app, and AI service. Use instruction allowlists and small balances.
5. Enforce duplicate idempotency, max five launches/day, per-launch and daily SOL caps atomically at the signer. API display flags are not spending controls.
6. Confirm finalized transaction status, mint, SOL pairing, holder-rewards mode, and transaction signature before setting launch state to `launched`.
7. Recheck Pump.fun terms and fees, source-provider permissions, market-data terms, platform fee rules, and local requirements for Japan, Nigeria, and the US.

The operations launch action currently calls the isolated preparation service and records a `dry_run` result. It does not create or list a token. No live signer adapter exists. Source outages, unavailable AI research/moderation, database errors, or unclear safety results must hold launches.
