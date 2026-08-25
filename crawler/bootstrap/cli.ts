import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildBootstrapCandidate, fixtureBootstrapResults } from './index';

if (!process.argv.includes('--fixture'))
  throw new Error(
    'Bootstrap live scope requires product decision. Use --fixture for deterministic bootstrap.',
  );

const csv = await fs.readFile(path.resolve('tests/fixtures/moi/transactions.csv'), 'utf8');
const result = await buildBootstrapCandidate({
  candidateRoot: path.resolve('data/bootstrap'),
  bootstrapId: 'fixture-bootstrap',
  results: fixtureBootstrapResults(csv, '2026-08-25T00:00:00.000Z'),
});
console.log(JSON.stringify(result.summary, null, 2));
