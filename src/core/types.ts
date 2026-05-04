export type SellerRow = Record<string, string>;

export interface RegistryLookupRequest {
  sellerId: string;
  businessName: string;
  country: string;
  vatId?: string;
  registrationId?: string;
}

export interface RegistryCandidate {
  registry_match_name: string;
  registry_match_id: string;
  registry_email: string;
  registry_phone?: string;
  registry_website?: string;
  registry_source: string;
  registry_confidence?: number;
  raw_payload?: unknown;
}

export interface RegistryProvider {
  name: string;
  lookup(request: RegistryLookupRequest): Promise<RegistryCandidate[]>;
}

export type EnrichmentResult = SellerRow & {
  seller_email?: string;
  extraction_status?: string;
  registry_fallback_needed?: string;
  registry_provider?: string;
  registry_query?: string;
  registry_status?: string;
  registry_match_name?: string;
  registry_match_id?: string;
  registry_email?: string;
  registry_phone?: string;
  registry_website?: string;
  registry_confidence?: string;
  registry_notes?: string;
};
