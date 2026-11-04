import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  findAllowlistGrowth,
  findMissingEntries,
  findOverBudget,
  formatOverBudget,
  readFileTimings,
} from './check-test-budget.mjs';

const ROOT = '/repo';
const SLOW_FILE = 'apps/web/src/slow.test.tsx';
const FAST_FILE = 'apps/web/src/fast.test.ts';
const BUDGET = 15;

const report = (...files) =>
  JSON.stringify({
    testResults: files.map(([file, startTime, endTime]) => ({
      name: `${ROOT}/${file}`,
      startTime,
      endTime,
    })),
  });

describe('readFileTimings', () => {
  it('reads each file as a repo-relative path and its run time in seconds', () => {
    assert.deepEqual(readFileTimings(report([SLOW_FILE, 1000, 21500]), ROOT), [
      { file: SLOW_FILE, seconds: 20.5 },
    ]);
  });
});

describe('findOverBudget', () => {
  it('names a file over the default budget with its time and budget', () => {
    const timings = [
      { file: SLOW_FILE, seconds: 20.5 },
      { file: FAST_FILE, seconds: 2 },
    ];
    assert.deepEqual(findOverBudget(timings, {}, BUDGET), [
      { file: SLOW_FILE, seconds: 20.5, budget: BUDGET },
    ]);
  });

  it('passes an allowlisted file within its own budget', () => {
    const timings = [{ file: SLOW_FILE, seconds: 20.5 }];
    assert.deepEqual(findOverBudget(timings, { [SLOW_FILE]: 30 }, BUDGET), []);
  });

  it('fails an allowlisted file that outgrows its own budget', () => {
    const timings = [{ file: SLOW_FILE, seconds: 31 }];
    assert.deepEqual(findOverBudget(timings, { [SLOW_FILE]: 30 }, BUDGET), [
      { file: SLOW_FILE, seconds: 31, budget: 30 },
    ]);
  });

  it('passes a file exactly at its budget', () => {
    const timings = [{ file: FAST_FILE, seconds: BUDGET }];
    assert.deepEqual(findOverBudget(timings, {}, BUDGET), []);
  });
});

describe('formatOverBudget', () => {
  it('names the file, its time and the budget', () => {
    assert.equal(
      formatOverBudget({ file: SLOW_FILE, seconds: 20.54, budget: BUDGET }),
      'apps/web/src/slow.test.tsx took 20.5s, budget 15s',
    );
  });
});

describe('findAllowlistGrowth', () => {
  it('reports an entry the base ref does not have', () => {
    assert.deepEqual(findAllowlistGrowth({}, { [SLOW_FILE]: 30 }), [
      { file: SLOW_FILE, budget: 30, baseBudget: undefined },
    ]);
  });

  it('reports an entry whose budget rose', () => {
    assert.deepEqual(
      findAllowlistGrowth({ [SLOW_FILE]: 30 }, { [SLOW_FILE]: 40 }),
      [{ file: SLOW_FILE, budget: 40, baseBudget: 30 }],
    );
  });

  it('accepts a lowered budget and a removed entry', () => {
    assert.deepEqual(
      findAllowlistGrowth(
        { [SLOW_FILE]: 30, [FAST_FILE]: 20 },
        { [SLOW_FILE]: 25 },
      ),
      [],
    );
  });
});

describe('findMissingEntries', () => {
  it('names an entry whose file no longer exists', () => {
    const allowlist = { [SLOW_FILE]: 30, [FAST_FILE]: 20 };
    assert.deepEqual(
      findMissingEntries(allowlist, (file) => file === FAST_FILE),
      [SLOW_FILE],
    );
  });
});
