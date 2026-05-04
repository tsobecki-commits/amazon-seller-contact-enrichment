import type { EnrichmentResult, RegistryProvider, SellerRow } from './types.js';
import { buildRegistryQuery, shouldProcess } from './queue.js';
import { scoreCandidate, selectBestCandidate } from './scoring.js';
import { clean } from '../utils/normalize.js';

export async function enrichRow(row: SellerRow, provider: RegistryProvider, minConfidence: number): Promise<EnrichmentResult> {
  if (!shouldProcess(row)) return { ...row };

  const query = buildRegistryQuery(row);
  if (!query) {
    return {
      ...row,
      registry_fallback_needed: 'true',
      registry_status: 'manual_review_required',
      registry_notes: 'Missing business name or other searchable company identifier.'
    };
  }

  const request = {
    sellerId: clean(row['Seller ID'] || row.seller_id || row.SellerID),
    businessName: query,
    country: clean(row.Country || row.country || 'DE').toUpperCase(),
    vatId: clean(row.search_id_vat),
    registrationId: clean(row.search_id_reg)
  };

  const candidates = await provider.lookup(request);
  const scored = candidates.map((candidate) => scoreCandidate(query, candidate, [request.vatId, request.registrationId]));
  const best = selectBestCandidate(scored);

  if (!best || (best.registry_confidence || 0) < minConfidence) {
    return {
      ...row,
      registry_fallback_needed: 'true',
      registry_provider: provider.name,
      registry_query: query,
      registry_status: 'registry_checked_no_match',
      extraction_status: clean(row.extraction_status) || 'registry_checked_no_match',
      registry_notes: 'No confident provider match.'
    };
  }

  return {
    ...row,
    seller_email: best.registry_email || clean(row.seller_email),
    extraction_status: best.registry_email ? 'registry_email_found' : 'manual_review_required',
    registry_fallback_needed: 'true',
    registry_provider: best.registry_source,
    registry_query: query,
    registry_status: best.registry_email ? 'registry_match_found' : 'manual_review_required',
    registry_match_name: best.registry_match_name,
    registry_match_id: best.registry_match_id,
    registry_email: best.registry_email,
    registry_phone: best.registry_phone || '',
    registry_website: best.registry_website || '',
    registry_confidence: String(best.registry_confidence || 0),
    registry_notes: `Best match from ${best.registry_source} with confidence ${best.registry_confidence}.`
  };
}
