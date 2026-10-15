import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import {
  BASELINE_PARTS_DIR,
  isUpdatingBaseline,
  readBaseline,
  type TCaseBaseline,
  writeBaseline,
} from './baseline';
import { listModuleStoryIds } from './storybook-static';

const mergeBaselineParts = () => {
  if (!isUpdatingBaseline() || !existsSync(BASELINE_PARTS_DIR)) return;
  const storyIds = new Set(listModuleStoryIds());
  const baseline = Object.fromEntries(
    Object.entries(readBaseline()).filter(([caseKey]) =>
      storyIds.has(caseKey.split(' | ')[0] ?? ''),
    ),
  );
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
