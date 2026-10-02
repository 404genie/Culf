import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 8080);
const API_TOKEN = process.env.LAUNCHER_API_TOKEN || '';
const PINATA_JWT = process.env.PINATA_JWT || '';
const APP_ORIGIN = process.env.APP_ORIGIN || 'https://culf.example';
const MAX_BODY_BYTES = 128_000;
const seen = new Map();

export function digest(value) { return createHash('sha256').update(value).digest('hex'); }
function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
export function artwork(title, region) {
  const safeTitle = escapeXml(title.slice(0, 58));
  const safeRegion = escapeXml(region.toUpperCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ef784d"/><stop offset="1" stop-color="#f1bc7c"/></linearGradient><pattern id="p" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#fff" opacity=".25"/></pattern></defs><rect width="1000" height="1000" fill="#f5efe3"/><circle cx="710" cy="310" r="340" fill="url(#g)"/><circle cx="710" cy="310" r="340" fill="url(#p)"/><path d="M0 790Q290 610 510 800T1000 730V1000H0Z" fill="#18221f"/><text x="76" y="112" fill="#18221f" font-family="Arial,sans-serif" font-size="34" font-weight="700" letter-spacing="8">CULF · CULTURE FUN</text><text x="76" y="730" fill="#f5efe3" font-family="Arial,sans-serif" font-size="24" letter-spacing="5">${safeRegion} · CULTURAL MOMENT</text><text x="76" y="815" fill="#fffaf1" font-family="Arial,sans-serif" font-size="58" font-weight="700">${safeTitle}</text><text x="76" y="900" fill="#d6d0c5" font-family="Arial,sans-serif" font-size="23" letter-spacing="4">ORIGINAL CULF ARTWORK</text></svg>`;
}

async function pinFile(bytes, filename, mimeType) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeType }), filename);
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST', headers: { Authorization: `Bearer ${PINATA_JWT}` }, body: form,
  });
  if (!response.ok) throw new Error(`Pinata file upload failed (${response.status})`);
  const result = await response.json();
  if (!result.IpfsHash) throw new Error('Pinata returned no content identifier');
  return `ipfs://${result.IpfsHash}`;
}

async function pinJson(value, name) {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST', headers: { Authorization: `Bearer ${PINATA_JWT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinataMetadata: { name }, pinataContent: value }),
  });
  if (!response.ok) throw new Error(`Pinata metadata upload failed (${response.status})`);
  const result = await response.json();
  if (!result.IpfsHash) throw new Error('Pinata returned no metadata identifier');
  return `ipfs://${result.IpfsHash}`;
}

export function validate(input) {
  const required = ['event_id', 'idempotency_key', 'name', 'symbol', 'event_title', 'summary', 'region', 'category'];
  for (const key of required) if (input[key] === undefined || input[key] === null || String(input[key]).trim() === '') throw new Error(`Missing ${key}`);
  if (!Number.isInteger(input.event_id) || input.event_id < 1) throw new Error('Invalid event_id');
  if (String(input.name).length > 32 || String(input.symbol).length > 13) throw new Error('Token name or symbol exceeds limits');
  if (String(input.summary).length > 2500 || String(input.event_title).length > 240) throw new Error('Event text exceeds limits');
  if (String(input.idempotency_key).length > 120) throw new Error('Invalid idempotency key');
}

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(data), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(data);
}

export function authorized(header, token = API_TOKEN) {
  if (!token || !header?.startsWith('Bearer ')) return false;
  const actual = Buffer.from(header.slice(7)); const expected = Buffer.from(token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, service: 'culf-launcher', mode: 'dry-run', pinning_configured: Boolean(PINATA_JWT) });
  if (req.method !== 'POST' || req.url !== '/v1/launch/dry-run') return json(res, 404, { error: 'not_found' });
  if (!authorized(req.headers.authorization)) return json(res, 401, { error: 'unauthorized' });
  let raw = ''; let bytes = 0;
  try {
    for await (const chunk of req) { bytes += chunk.length; if (bytes > MAX_BODY_BYTES) return json(res, 413, { error: 'payload_too_large' }); raw += chunk; }
    const input = JSON.parse(raw); validate(input);
    const idem = req.headers['idempotency-key'];
    if (idem !== input.idempotency_key) return json(res, 422, { error: 'idempotency_key_mismatch' });
    const payloadHash = digest(JSON.stringify(input));
    const prior = seen.get(idem);
    if (prior) return prior.hash === payloadHash ? json(res, 200, prior.result) : json(res, 409, { error: 'idempotency_conflict' });

    const svg = artwork(String(input.event_title), String(input.region));
    const artHash = digest(svg);
    let imageUri = null; let metadataUri = null;
    if (PINATA_JWT) {
      imageUri = await pinFile(Buffer.from(svg), `culf-${input.event_id}.svg`, 'image/svg+xml');
      const metadata = {
        name: String(input.name), symbol: String(input.symbol),
        description: `${String(input.summary)}\n\nDetected by Culf on ${String(input.detected_at || 'an unrecorded date')}. Culf's event evidence is shown on ${APP_ORIGIN}. This is an automatically prepared cultural-event token; it is not affiliated with the event or named parties.`,
        image: imageUri,
        external_url: `${APP_ORIGIN}/token/${encodeURIComponent(String(input.event_slug || input.event_id))}`,
        attributes: [
          { trait_type: 'Region', value: String(input.region) },
          { trait_type: 'Category', value: String(input.category) },
          { trait_type: 'Artwork', value: 'Original Culf artwork' },
        ],
        properties: { category: 'image', files: [{ uri: imageUri, type: 'image/svg+xml' }] },
      };
      metadataUri = await pinJson(metadata, `culf-event-${input.event_id}-metadata`);
    }
    const result = {
      mode: 'dry-run', event_id: input.event_id, idempotency_key: idem,
      metadata_uri: metadataUri, image_uri: imageUri, artwork_sha256: artHash,
      artwork_preview_svg: PINATA_JWT ? undefined : svg,
      artwork_pinned: Boolean(imageUri), metadata_pinned: Boolean(metadataUri),
      holder_rewards_live_transaction: false,
      holder_rewards_required_for_future_live_adapter: true,
      transaction_submitted: false, signer_accessed: false,
      note: PINATA_JWT ? 'Artwork and metadata pinned. No wallet was accessed and no transaction was submitted.' : 'Artwork preview generated. Configure PINATA_JWT to pin metadata. No wallet was accessed and no transaction was submitted.',
    };
    seen.set(idem, { hash: payloadHash, result });
    return json(res, 200, result);
  } catch (error) {
    return json(res, 422, { error: 'dry_run_failed', message: String(error?.message || error).slice(0, 240), transaction_submitted: false });
  }
});

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  server.listen(PORT, '0.0.0.0', () => console.log(`Culf launcher listening on ${PORT} (dry-run only)`));
}
