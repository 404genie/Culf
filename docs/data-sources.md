# Initial source register

All provider terms, commercial-use permission, feed uptime, and attribution requirements must be rechecked before production. The `sources` table stores owner, usage note, family, cadence, enablement, health, and errors.

| Source | Purpose | Regions | Family / constraint |
|---|---|---|---|
| GDELT DOC API | Global news signals | Japan, Nigeria, US | GDELT family; publisher domain maps to direct-feed family for overlap dedupe |
| Wikimedia Pageviews | Prior-day top articles | Japan (ja), Nigeria/US (en) | Attention proxy only, not proof of popularity |
| NHK World RSS | News headlines/links | Japan | Retain attribution; independent family `news_nhk` |
| Japan Times RSS | News headlines/links | Japan | Verify feed and commercial terms |
| Premium Times RSS | News headlines/links | Nigeria | Verify feed and commercial terms |
| AP US News RSS | News headlines/links | US | Verify URL and use terms |
| Nager.Date | Public holiday context | Japan, Nigeria, US | Calendar signal can never qualify by itself |

Google Trends, Bluesky, Mastodon, Reddit, TikTok Creative Center, and Know Your Meme are not enabled. Don't count syndicated copies as independent confirmations.
