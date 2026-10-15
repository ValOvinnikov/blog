import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const BASELINE_PATH = join(import.meta.dirname, '../baseline.json');
export const BASELINE_PARTS_DIR = join(
  import.meta.dirname,
  '../.baseline-parts',
);

export const isUpdatingBaseline = () =>
  process.env.CONTRAST_UPDATE_BASELINE === '1';

export const readBaseline = (): string[] =>
  JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as string[];

export const entriesForCase = (baseline: string[], casePrefix: string) =>
  baseline.filter((entry) => entry.startsWith(casePrefix));

export const writeBaselinePart = (casePrefix: string, entries: string[]) => {
  mkdirSync(BASELINE_PARTS_DIR, { recursive: true });
  const fileName = createHash('sha1').update(casePrefix).digest('hex');
  writeFileSync(
    join(BASELINE_PARTS_DIR, `${fileName}.json`),
    JSON.stringify({ casePrefix, entries }),
  );
};
