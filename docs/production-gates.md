# Live launch gates

Run in shadow mode and review false positives before considering any live launch. Before implementing an automatic signer:

1. Use the current official Pump.fun SDK create-v2 path and require holder rewards to be explicitly true. Verify the on-chain coin state after submission; never fall back to regular coins.
2. Isolate signing in a restricted service or KMS, outside the API, worker, web app, and AI service. Use instruction allowlists and small balances.
3. Create original, brand-safe art and pin metadata durably. Verify URI content before submitting a transaction.
4. Enforce duplicate idempotency, max five launches/day, per-launch and daily SOL caps atomically at the signer. API display flags are not spending controls.
5. Confirm finalized transaction status, mint, SOL pairing, holder-rewards mode, and tx signature before setting launch state to `launched`.
6. Recheck Pump.fun terms and fees, source-provider permissions, market-data terms, platform fee rules, and local requirements for Japan, Nigeria, and the US.

The launch route deliberately returns `501` until a reviewed signer adapter exists. Source outages, unavailable AI research/moderation, database errors, or unclear safety results must hold launches.
