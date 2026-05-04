# Amazon seller contact enrichment

Compliance-first repository for enriching SmartScout/Amazon seller exports with business contact data.

This repo implements a controlled enrichment pipeline:

1. Read seller rows from CSV or Google Sheets.
2. Skip rows that already have `seller_email` or terminal statuses.
3. Build a company lookup query from `Business Name`, country and optional IDs.
4. Query approved registry/contact providers.
5. Score candidates using name, ID and email confidence rules.
6. Write enrichment fields and a status trail back to the dataset.

## Scope

This project is designed for authorized data sources only: internally owned data, approved provider APIs, official registries where access terms allow automation, and Amazon SP-API where your application and use case are authorized.

It does not include access-control evasion, hidden session reuse, fingerprint manipulation, proxy rotation, or other restricted-access techniques.

## Repository structure

```text
src/
  cli.ts                         CLI entrypoint
  core/                          queue, scoring, schema, enrichment logic
  adapters/                      CSV and Google Sheets I/O
  providers/                     registry provider interface and adapters
  utils/                         normalization helpers
n8n/                             importable n8n workflow notes and exports
samples/                         sample input and output
.github/workflows/ci.yml         basic CI
```

## Quick start

```bash
cp .env.example .env
npm install
npm run sample
```

Output will be written to `samples/enriched.csv`.

## Production provider configuration

Start with `src/providers/registryApiProvider.ts`. Configure a licensed provider endpoint in `.env`:

```bash
PROVIDER=registry-api
REGISTRY_API_BASE_URL=https://your-approved-provider.example/search
REGISTRY_API_KEY=...
REGISTRY_AUTH_MODE=bearer
```

The adapter expects a provider response containing fields similar to:

```json
{
  "companyName": "Example GmbH",
  "registrationNumber": "HRB 12345",
  "email": "kontakt@example.de",
  "phone": "+49...",
  "website": "https://example.de"
}
```

Extend `normalizeRegistryPayload()` if your provider uses different field names.

## Input columns

Recommended minimum columns:

- `Seller ID`
- `Seller`
- `Business Name`
- `Country`
- `URL`
- `seller_email`
- `extraction_status`

Optional matching columns:

- `search_id_vat`
- `search_id_reg`

## Output columns

The pipeline appends or updates:

- `seller_email`
- `extraction_status`
- `registry_fallback_needed`
- `registry_provider`
- `registry_query`
- `registry_status`
- `registry_match_name`
- `registry_match_id`
- `registry_email`
- `registry_phone`
- `registry_website`
- `registry_confidence`
- `registry_notes`

## Status model

- `email_found` - email was already present or provided by an approved source.
- `source_access_limited` - source could not be processed automatically under allowed access rules.
- `pending_registry_lookup` - row is queued for provider lookup.
- `registry_email_found` - approved registry source returned a confident email match.
- `registry_checked_no_match` - provider checked but no confident match was found.
- `manual_review_required` - ambiguous or low-confidence result.

## n8n integration

The `n8n/` directory contains notes for adapting the current n8n workflow into the registry enrichment flow.

## Data protection notes

Before production use, document lawful basis, source license, retention period, unsubscribe/suppression handling, and manual review rules for low-confidence matches.
