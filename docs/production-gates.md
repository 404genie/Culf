# Live launch gates

## Candidate score definitions

The score is a weighted summary, not an automatic launch decision. It uses velocity 22%, corroboration 25%, freshness 20%, geography 10%, clarity 13%, and humor 10%. Candidates must also score at least 68, have at least two independent source families, and pass the separate safety and research gates.

- **Velocity:** Counts distinct source-family/hour observations in the latest six hours against the preceding 66 hours. Syndicated copies from the same family in one hour count once. Wikipedia pageview growth contributes when two snapshots exist. Before a baseline exists, recent family-hour activity gets a conservative provisional score; it is not described as measured acceleration.
- **Corroboration:** Counts independent source families: 0 for none, 35 for one, 75 for two, 90 for three, and 100 for four or more. Repeated URLs or syndicated copies from one family do not add families.
- **Freshness:** Averages the freshest supporting item from each family. Scores decline from 100 for evidence within an hour, to 85 at six hours, 50 at 24 hours, and 0 at 72 hours. Calendar-only evidence is excluded.
- **Geographic breadth:** Scores the number of Culf launch regions represented: one of three is 33, two is 67, and all three is 100.
- **Clarity:** Combines event-title specificity with overlap between the terms used by independent source families. A single family cannot receive the agreement portion of the score.
- **Humor:** Rates harmless, evidence-based meme potential from cited facts, focusing on irony, absurdity, and relatability. OpenAI assigns this during research; before that, it is neutral at 50. Research begins once at least two independent source families provide fresh evidence and deterministic checks pass, before the final 68-point score gate. The worker researches up to 12 candidates per cycle, so queued candidates may temporarily remain at 50 while their status is `researching`. Humor affects the final score, but cannot bypass the two-family, freshness, safety, citation, or total-score requirements. Tragedy, harm, and mockery of vulnerable people score 0. The rating and short rationale are stored for review.

The current score is a shadow-mode aid. Review source evidence and decision reasons before changing weights or eligibility thresholds.

Run in shadow mode and review false positives before considering any live launch. Before implementing an automatic signer:

1. The current launcher is preparation-only: it has no key and contains no transaction broadcast code. Keep `LAUNCH_MODE=shadow`, `LAUNCH_ENABLED=false`, and holder-reward verification false.
2. Test the metadata dry-run with no `PINATA_JWT`, then with a restricted Pinata JWT. Verify artwork and metadata CIDs, downloaded content, escaping, and the Culf event URL before considering a live adapter.
3. For a future live adapter, use the current official Pump.fun SDK create-v2 path and require holder rewards to be explicitly true. Verify the on-chain coin state after submission; never fall back to regular coins.
4. Isolate signing in a restricted service or KMS, outside the API, worker, web app, and AI service. Use instruction allowlists and small balances.
5. Enforce duplicate idempotency, max five launches/day, per-launch and daily SOL caps atomically at the signer. API display flags are not spending controls.
6. Confirm finalized transaction status, mint, SOL pairing, holder-rewards mode, and transaction signature before setting launch state to `launched`.
7. Recheck Pump.fun terms and fees, source-provider permissions, market-data terms, platform fee rules, and local requirements for Japan, Nigeria, and the US.

The operations launch action currently calls the isolated preparation service and records a `dry_run` result. It does not create or list a token. No live signer adapter exists. Source outages, unavailable AI research/moderation, database errors, or unclear safety results must hold launches.
