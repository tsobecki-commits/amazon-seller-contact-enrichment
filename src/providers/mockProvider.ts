import type { RegistryLookupRequest, RegistryProvider } from '../core/types.js';

export const mockProvider: RegistryProvider = {
  name: 'mock-provider',
  async lookup(request: RegistryLookupRequest) {
    if (!request.businessName) return [];

    return [
      {
        registry_match_name: request.businessName,
        registry_match_id: request.registrationId || request.vatId || `MOCK-${request.sellerId || 'UNKNOWN'}`,
        registry_email: `contact@${request.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'example'}.test`,
        registry_phone: '',
        registry_website: '',
        registry_source: 'mock-provider',
        raw_payload: { request }
      }
    ];
  }
};
