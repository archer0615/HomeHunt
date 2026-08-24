import path from 'node:path';
import { ListingLifecycleStore } from '../lifecycle/store';
import { createTransactionRepository } from '../persistence/sqlite';
import { publicationInputFromStores, publishData } from './index';

const args = process.argv.slice(2);
const valueAfter = (name: string) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const databasePath = valueAfter('--db');
if (!databasePath)
  throw new Error(
    'Usage: npm run data:publish -- --db <canonical.sqlite> [--output <public/data>] [--allow-empty]',
  );
const output = valueAfter('--output') ?? path.join('public', 'data');
const lifecycleStore = new ListingLifecycleStore(databasePath);
const transactionRepository = createTransactionRepository(databasePath);
try {
  const result = await publishData(
    publicationInputFromStores(lifecycleStore, transactionRepository),
    { targetDir: output, allowEmpty: args.includes('--allow-empty') },
  );
  console.log(
    JSON.stringify({ event: 'publication.success', output: path.resolve(output), ...result }),
  );
} finally {
  transactionRepository.close();
  lifecycleStore.close();
}
