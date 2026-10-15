import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import {
  BASELINE_PARTS_DIR,
  BASELINE_PATH,
  isUpdatingBaseline,
  readBaseline,
} from './baseline';

const mergeBaselineParts = () => {
  if (!isUpdatingBaseline() || !existsSync(BASELINE_PARTS_DIR)) return;
  const parts = readdirSync(BASELINE_PARTS_DIR).map(
    (fileName) =>
      JSON.parse(readFileSync(join(BASELINE_PARTS_DIR, fileName), 'utf8')) as {
        casePrefix: string;
        entries: string[];
      },
  );
  const rerunPrefixes = parts.map(({ casePrefix }) => casePrefix);
  const kept = readBaseline().filter(
    (entry) => !rerunPrefixes.some((prefix) => entry.startsWith(prefix)),
  );
  const merged = [...kept, ...parts.flatMap(({ entries }) => entries)].sort();
  writeFileSync(BASELINE_PATH, `${JSON.stringify(merged, null, 2)}\n`);
  rmSync(BASELINE_PARTS_DIR, { recursive: true });
};

export default mergeBaselineParts;
