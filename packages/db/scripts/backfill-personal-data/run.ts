import { pathToFileURL } from 'node:url';

import { getTableName } from 'drizzle-orm';

import { hasDryRunFlag } from '../lib/dry-run-flag';

import { backfillTarget } from './lib/backfill-target';
import {
  countPersonalDataGaps,
  type TPersonalDataCounts,
} from './lib/count-personal-data-gaps';
import {
  loadPersonalDataKeys,
  type TPersonalDataKeys,
} from './lib/personal-data-keys';
import { PERSONAL_DATA_TARGETS } from './lib/personal-data-targets';

export async function backfillPersonalData(
  keys: TPersonalDataKeys,
): Promise<TPersonalDataCounts> {
  const backfilled: TPersonalDataCounts = {};

  for (const target of PERSONAL_DATA_TARGETS) {
    backfilled[getTableName(target.table)] = await backfillTarget(target, keys);
  }

  return backfilled;
}

function report(label: string, counts: TPersonalDataCounts): void {
  for (const [table, total] of Object.entries(counts)) {
    console.warn(
      `backfill-personal-data: ${table} — ${total} row(s) ${label}.`,
    );
  }
}

function hasGaps(counts: TPersonalDataCounts): boolean {
  return Object.values(counts).some((total) => total > 0);
}

async function main(): Promise<void> {
  const keys = loadPersonalDataKeys();

  if (hasDryRunFlag(process.argv)) {
    report('to backfill', await countPersonalDataGaps());
    return;
  }

  report('backfilled', await backfillPersonalData(keys));

  const gaps = await countPersonalDataGaps();
  report('still missing an encrypted form or index', gaps);
  if (hasGaps(gaps)) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error('backfill-personal-data: unexpected failure:', error);
    process.exitCode = 1;
  });
}
