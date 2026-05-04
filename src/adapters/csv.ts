import { createReadStream, createWriteStream } from 'node:fs';
import { parse } from '@fast-csv/parse';
import { format } from '@fast-csv/format';
import type { EnrichmentResult, SellerRow } from '../core/types.js';

export async function readCsv(path: string): Promise<SellerRow[]> {
  return new Promise((resolve, reject) => {
    const rows: SellerRow[] = [];

    createReadStream(path)
      .pipe(parse({ headers: true, ignoreEmpty: true, trim: true }))
      .on('error', reject)
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows));
  });
}

export async function writeCsv(path: string, rows: EnrichmentResult[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = format({ headers: true });
    const output = createWriteStream(path);

    output.on('finish', resolve);
    output.on('error', reject);
    stream.on('error', reject);

    stream.pipe(output);
    for (const row of rows) stream.write(row);
    stream.end();
  });
}
