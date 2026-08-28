import { unzipSync } from 'fflate';
import { parsePresaleProjects } from './parser';
import { normalizePresaleProject } from './normalizer';
import type { PresaleProject } from '../../../shared/domain';

export async function collectPresaleProjects(
  url: string,
  fetchImpl: typeof fetch = fetch,
  updatedAt = new Date().toISOString(),
): Promise<PresaleProject[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { accept: 'application/zip' } });
    if (!response.ok) throw new Error(`PRESALE_REGISTRY_HTTP:${response.status}`);
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
    const manifest = new TextDecoder().decode(files['manifest.csv']);
    const cityByFile = new Map<string, string>();
    for (const line of manifest.split(/\r?\n/).slice(1)) {
      const [name, , description] = line.split(',');
      if (name && description?.includes('臺北市')) cityByFile.set(name, '臺北市');
      if (name && description?.includes('新北市')) cityByFile.set(name, '新北市');
    }
    return [...cityByFile.entries()]
      .filter(([name]) => name.endsWith('_lvr_buildcase.csv'))
      .flatMap(([name, city]) => parsePresaleProjects(new TextDecoder().decode(files[name]), name, city).map((row) => normalizePresaleProject(row, updatedAt)));
  } finally { clearTimeout(timeout); }
}
