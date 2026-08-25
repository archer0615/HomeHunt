import path from 'node:path';
import { promoteBootstrapCandidate } from './index';

const args = process.argv.slice(2);
const index = args.indexOf('--candidate');
const candidate = index >= 0 ? args[index + 1] : undefined;
if (!candidate)
  throw new Error('Usage: npm run data:bootstrap:promote -- --candidate <bootstrapId>');

await promoteBootstrapCandidate({
  candidateDir: path.resolve('data/bootstrap', candidate),
  dataRoot: path.resolve('data'),
  publicationRoot: path.resolve('public/data'),
});
console.log(JSON.stringify({ candidate, promoted: true, target: 'initial known-good' }));
