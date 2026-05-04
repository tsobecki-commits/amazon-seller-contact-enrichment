import type { EnrichmentResult, SellerRow } from './types.js';
import { buildRegistryQuery, shouldProcess } from './queue.js';
import { clean } from '../utils/normalize.js';

export interface DryRunReport {
  totalRows: number;
  processableRows: number;
  skippedRows: number;
  missingBusinessNameRows: number;
  existingEmailRows: number;
  terminalStatusRows: number;
  countries: Record<string, number>;
  recommendedActions: Array<{
    sellerId: string;
    seller: string;
    businessName: string;
    country: string;
    action: string;
    reason: string;
  }>;
}

const TERMINAL_STATUSES = new Set(['email_found', 'email_not_found', 'registry_email_found', 'registry_checked_no_match']);

export function buildDryRunReport(rows: SellerRow[]): DryRunReport {
  const report: DryRunReport = {
    totalRows: rows.length,
    processableRows: 0,
    skippedRows: 0,
    missingBusinessNameRows: 0,
    existingEmailRows: 0,
    terminalStatusRows: 0,
    countries: {},
    recommendedActions: []
  };

  for (const row of rows) {
    const sellerId = clean(row['Seller ID'] || row.seller_id || row.SellerID);
    const seller = clean(row.Seller || row.seller);
    const businessName = buildRegistryQuery(row);
    const country = clean(row.Country || row.country || 'UNKNOWN').toUpperCase();
    const email = clean(row.seller_email);
    const status = clean(row.extraction_status);

    report.countries[country || 'UNKNOWN'] = (report.countries[country || 'UNKNOWN'] || 0) + 1;

    let action = 'enrich_via_registry_provider';
    let reason = 'Business name and country are available.';

    if (email) {
      report.existingEmailRows += 1;
      action = 'skip';
      reason = 'seller_email already exists.';
    } else if (TERMINAL_STATUSES.has(status)) {
      report.terminalStatusRows += 1;
      action = 'skip';
      reason = `Terminal status already set: ${status}.`;
    } else if (!businessName || businessName === '0') {
      report.missingBusinessNameRows += 1;
      action = 'manual_review_required';
      reason = 'Missing usable Business Name.';
    }

    if (shouldProcess(row) && action === 'enrich_via_registry_provider') {
      report.processableRows += 1;
    } else {
      report.skippedRows += 1;
    }

    report.recommendedActions.push({ sellerId, seller, businessName, country, action, reason });
  }

  return report;
}

export function formatDryRunReport(report: DryRunReport): string {
  const countryLines = Object.entries(report.countries)
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => `- ${country}: ${count}`)
    .join('\n');

  const actionLines = report.recommendedActions
    .map((item) => `- ${item.sellerId || 'NO_ID'} | ${item.seller || 'NO_SELLER'} | ${item.businessName || 'NO_BUSINESS_NAME'} | ${item.country}: ${item.action} (${item.reason})`)
    .join('\n');

  return [
    '# Dry run report',
    '',
    `Total rows: ${report.totalRows}`,
    `Processable rows: ${report.processableRows}`,
    `Skipped rows: ${report.skippedRows}`,
    `Missing business name rows: ${report.missingBusinessNameRows}`,
    `Existing email rows: ${report.existingEmailRows}`,
    `Terminal status rows: ${report.terminalStatusRows}`,
    '',
    '## Countries',
    countryLines || '- none',
    '',
    '## Recommended actions',
    actionLines || '- none',
    ''
  ].join('\n');
}
