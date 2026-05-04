import 'dotenv/config';
import { Command } from 'commander';
import pLimit from 'p-limit';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readCsv, writeCsv } from './adapters/csv.js';
import { enrichRow } from './core/enrich.js';
import { buildDryRunReport, formatDryRunReport } from './core/report.js';
import { getProvider } from './providers/index.js';

const program = new Command();

program
  .name('amazon-seller-contact-enrichment')
  .description('Compliance-first seller contact enrichment CLI')
  .option('--input <path>', 'Input CSV path', process.env.INPUT_CSV || 'samples/sellers.csv')
  .option('--output <path>', 'Output CSV path', process.env.OUTPUT_CSV || 'samples/enriched.csv')
  .option('--report <path>', 'Dry-run markdown report path', 'samples/dry-run-report.md')
  .option('--provider <name>', 'Provider name: mock | registry-api', process.env.PROVIDER || 'mock')
  .option('--concurrency <number>', 'Concurrent provider lookups', process.env.CONCURRENCY || '2')
  .option('--min-confidence <number>', 'Minimum confidence threshold', process.env.MIN_CONFIDENCE || '0.70')
  .option('--dry-run', 'Only create a dry-run report; do not enrich or write output CSV', false)
  .parse(process.argv);

const options = program.opts();
const inputPath = String(options.input);
const outputPath = String(options.output);
const reportPath = String(options.report);
const dryRun = Boolean(options.dryRun);
const providerName = String(options.provider);
const concurrency = Number(options.concurrency);
const minConfidence = Number(options.minConfidence);

async function main() {
  const rows = await readCsv(inputPath);
  const report = buildDryRunReport(rows);
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, formatDryRunReport(report), 'utf8');

  console.log(`Dry-run report written to ${reportPath}`);
  console.log(`Total rows: ${report.totalRows}`);
  console.log(`Processable rows: ${report.processableRows}`);
  console.log(`Skipped rows: ${report.skippedRows}`);

  if (dryRun) return;

  const provider = getProvider(providerName);
  const limit = pLimit(concurrency);
  const enriched = await Promise.all(rows.map((row) => limit(() => enrichRow(row, provider, minConfidence))));

  await mkdir(dirname(outputPath), { recursive: true });
  await writeCsv(outputPath, enriched);
  console.log(`Enriched CSV written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
