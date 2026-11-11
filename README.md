# milestone3.hrm — Prova SDR recruiting site (Milestone 3)

Static careers landing for Prova’s Sales Development Representative role, plus a HubSpot recruiting CRM view.

**Site name / hostname title:** `milestone3.hrm`  
**Company site:** [https://prova.education](https://prova.education)  
**Live (GitHub Pages):** [https://giannakr.github.io/milestone3.hrm/](https://giannakr.github.io/milestone3.hrm/)

## Shared password

**Password:** `TAER26`

Client-side gate only (fine for consulting review). Unlock is **not** persisted — every open/refresh requires the password again.

## What’s in this repo

| Path | Purpose |
|------|---------|
| `index.html` | Password gate + careers landing |
| `crm.html` | HubSpot connection UI + recruiting CRM |
| `styles.css` | Visual system (logo-derived) |
| `gate.js` | Gate + placeholder Apply behavior |
| `hubspot-ui.js` | Client for `/api/hubspot/*` with sample-data fallback |
| `prova-logo.png` | Official Prova logo |
| `job-board-posting.md` | Handshake / LinkedIn-ready copy |
| `server.mjs` | Node server (static + HubSpot API routes) |
| `lib/hubspot.mjs` | Server-only HubSpot client + mock data |
| `package.json` | `npm start` → `node server.mjs` |

## Hosting model (important)

**GitHub Pages is static.** It cannot safely call HubSpot with a secret from the browser.

| Host | Careers site | HubSpot API |
|------|--------------|-------------|
| GitHub Pages (`giannakr.github.io/milestone3.hrm`) | Works | **Mock / sample data only** — no `HUBSPOT_ACCESS_TOKEN` |
| Cursor-published app (`prova-careers`) | Works | **Live** when `HUBSPOT_ACCESS_TOKEN` is set in Cursor Secrets |

- Browser code only calls **our** `/api/hubspot/status` and `/api/hubspot/recruiting` endpoints.
- The server reads `process.env.HUBSPOT_ACCESS_TOKEN` and never sends the token to the client.
- When the token is unset or the API host is missing (Pages), the UI shows **labeled sample data**.

### Local server (mock unless you set the env var yourself)

```bash
npm start
# → http://127.0.0.1:3000/
```

Or static-only: `python3 -m http.server 8765 --bind 127.0.0.1` (CRM page stays in sample mode).

## HubSpot setup (for Gianna / Prova)

**Never paste the HubSpot access token into chat.** Add it only in Cursor Secrets UI.

1. In HubSpot: **Settings → Integrations → Private Apps → Create**.
2. Enable read scopes for contacts and deals (e.g. `crm.objects.contacts.read`, `crm.objects.deals.read`).
3. Create the app and copy the access token **once**.
4. In Cursor: open **Cloud Agents → Secrets** (or the app publish dialog’s secrets list) and set:
   - Name: `HUBSPOT_ACCESS_TOKEN`
   - Value: the private app token  
   Bind it to the **prova-careers** published app (already declared via `bind-app-secrets`).
5. Confirm / republish the Cursor app if prompted. Prefer **private** or **team** visibility while the API proxies HubSpot.
6. Optional CRM hygiene: tag SDR candidates with “SDR hiring” or a custom contact property `prova_recruiting_tag` so the recruiting view can filter.

The agent never needs the raw key value on the VM — mock mode works until the secret is available to the published host.

## API (Cursor / local Node only)

| Endpoint | Returns |
|----------|---------|
| `GET /api/hubspot/status` | Connection check: token present?, live vs mock, account summary |
| `GET /api/hubspot/recruiting` | Contacts/candidates, deal/pipeline stages, notes (or sample payload) |

## Brand notes

- **Site title:** `milestone3.hrm` alongside the Prova logo.
- **Palette:** Cobalt `#3B6DFF` + charcoal + cool paper; linear, lighter chrome.
- **Type:** Source Serif 4 + Figtree.
- **Apply CTA:** still provisional (“Coming soon — application email TBA”).

## Pages URLs

- Careers: https://giannakr.github.io/milestone3.hrm/
- Recruiting CRM (sample on Pages): https://giannakr.github.io/milestone3.hrm/crm.html
