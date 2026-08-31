import { parse } from 'csv-parse/sync';
import type { RawPresaleProject } from './types';

export function parsePresaleProjects(
  csv: string,
  sourceFile: string,
  city: string,
): RawPresaleProject[] {
  const rows = parse(csv, { columns: true, skip_empty_lines: true, bom: true }) as Record<
    string,
    string
  >[];
  return rows.map((raw) => ({ sourceFile, city, raw }));
}
