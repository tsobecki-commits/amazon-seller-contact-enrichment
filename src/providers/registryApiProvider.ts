import type { RegistryCandidate, RegistryLookupRequest, RegistryProvider } from '../core/types.js';
import { clean } from '../utils/normalize.js';

function normalizeRegistryPayload(payload: any, source: string): RegistryCandidate[] {
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [payload];

  return records.map((record: any) => ({
    registry_match_name: clean(record.companyName || record.legalName || record.name || record.title || record.company),
    registry_match_id: clean(record.registrationNumber || record.companyNumber || record.vatId || record.vat || record.hrb || record.id),
    registry_email: clean(record.email || record.contactEmail || record.mail),
    registry_phone: clean(record.phone || record.contactPhone || record.telephone),
    registry_website: clean(record.website || record.url || record.domain),
    registry_source: source,
    raw_payload: record
  }));
}

export function createRegistryApiProvider(): RegistryProvider {
  const baseUrl = process.env.REGISTRY_API_BASE_URL;
  const apiKey = process.env.REGISTRY_API_KEY;
  const authMode = process.env.REGISTRY_AUTH_MODE || 'bearer';

  if (!baseUrl) throw new Error('REGISTRY_API_BASE_URL is required for registry-api provider.');
  if (!apiKey) throw new Error('REGISTRY_API_KEY is required for registry-api provider.');

  return {
    name: 'registry-api',
    async lookup(request: RegistryLookupRequest) {
      const url = new URL(baseUrl);
      url.searchParams.set('q', request.businessName);
      url.searchParams.set('country', request.country || 'DE');
      if (request.vatId) url.searchParams.set('vat_id', request.vatId);
      if (request.registrationId) url.searchParams.set('reg_id', request.registrationId);
      if (request.sellerId) url.searchParams.set('seller_id', request.sellerId);
      if (authMode === 'query') url.searchParams.set('api_key', apiKey);

      const response = await fetch(url, {
        headers: authMode === 'bearer' ? { Authorization: `Bearer ${apiKey}` } : undefined
      });

      if (!response.ok) {
        throw new Error(`Registry provider failed with HTTP ${response.status}`);
      }

      const payload = await response.json();
      return normalizeRegistryPayload(payload, 'registry-api');
    }
  };
}
