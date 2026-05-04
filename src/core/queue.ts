import type { SellerRow } from './types.js';
import { clean } from '../utils/normalize.js';

const TERMINAL_STATUSES = new Set(['email_found', 'email_not_found', 'registry_email_found', 'registry_checked_no_match']);

export function shouldProcess(row: SellerRow): boolean {
  const sellerId = clean(row['Seller ID'] || row.seller_id || row.SellerID);
  const businessName = clean(row['Business Name']);
  const email = clean(row.seller_email);
  const status = clean(row.extraction_status);

  if (!sellerId && !businessName) return false;
  if (email) return false;
  if (TERMINAL_STATUSES.has(status)) return false;
  return true;
}

export function buildRegistryQuery(row: SellerRow): string {
  return clean(row.registry_query || row['Business Name'] || row.Seller || row.seller);
}
