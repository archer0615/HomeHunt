import { promises as fs } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const index = args.indexOf('--run');
const runId = index >= 0 ? args[index + 1] : undefined;
if (!runId) throw new Error('Usage: npm run data:refresh:promote -- --run <runId>');

const root = path.resolve('data');
const candidate = path.join(root, 'refresh-candidates', runId);
const sourceDb = path.join(candidate, 'canonical.sqlite');
const sourcePublication = path.join(candidate, 'publication');
const targetDb = path.join(root, 'canonical.sqlite');
const targetPublication = path.resolve('public/data');
await fs.access(sourceDb);
await fs.access(path.join(sourcePublication, 'metadata.json'));
const metadata = JSON.parse(await fs.readFile(path.join(sourcePublication, 'metadata.json'), 'utf8')) as { appDataVersion?: string; counts?: unknown };
if (!metadata.appDataVersion) throw new Error('promotion refused: candidate metadata is invalid');
const dbStage = `${targetDb}.promote-${runId}`;
const publicationStage = `${targetPublication}.promote-${runId}`;
await fs.rm(dbStage, { force: true });
await fs.rm(publicationStage, { recursive: true, force: true });
await fs.copyFile(sourceDb, dbStage);
await fs.cp(sourcePublication, publicationStage, { recursive: true });
const oldDb = `${targetDb}.previous-${runId}`;
const oldPublication = `${targetPublication}.previous-${runId}`;
try {
  await fs.rm(oldDb, { force: true });
  await fs.rm(oldPublication, { recursive: true, force: true });
  try { await fs.rename(targetDb, oldDb); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  try { await fs.rename(targetPublication, oldPublication); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  await fs.rename(dbStage, targetDb);
  await fs.rename(publicationStage, targetPublication);
  await fs.rm(oldDb, { force: true });
  await fs.rm(oldPublication, { recursive: true, force: true });
  console.log(JSON.stringify({ runId, promoted: true, appDataVersion: metadata.appDataVersion, counts: metadata.counts }));
} catch (error) {
  await fs.rm(dbStage, { force: true });
  await fs.rm(publicationStage, { recursive: true, force: true });
  throw error;
}
