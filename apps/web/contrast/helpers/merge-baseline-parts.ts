import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import {
  BASELINE_PARTS_DIR,
  isUpdatingBaseline,
  readBaseline,
  type TCaseBaseline,
  writeBaseline,
} from './baseline';

const mergeBaselineParts = () => {
  if (!isUpdatingBaseline() || !existsSync(BASELINE_PARTS_DIR)) return;
  const baseline = readBaseline();
  readdirSync(BASELINE_PARTS_DIR).forEach((fileName) => {
    const { caseKey, caseBaseline } = JSON.parse(
      readFileSync(join(BASELINE_PARTS_DIR, fileName), 'utf8'),
    ) as { caseKey: string; caseBaseline: TCaseBaseline };
    baseline[caseKey] = caseBaseline;
  });
  writeBaseline(baseline);
  rmSync(BASELINE_PARTS_DIR, { recursive: true });
};

export default mergeBaselineParts;
