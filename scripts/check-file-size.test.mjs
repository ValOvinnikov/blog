import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BUDGET,
  countNonBlankLines,
  findProblems,
  measure,
  ratchetBaseline,
} from './check-file-size.mjs';

const COMPONENT = 'apps/web/src/components/card/card.tsx';
const HOOK = 'apps/web/src/hooks/use-thing/use-thing.ts';
const MODULE = 'apps/web/src/context/toast-provider/toast-store.ts';
const DB_SCRIPT = 'packages/db/scripts/seed-tenant.ts';
const MOVED = 'apps/web/src/context/toast/toast-store.ts';
const BASELINED_LINES = 384;
const FULL_TREE = { checkMissing: true };
const NAMED_FILES = { checkMissing: false };

const textOf = (lineCount) => 'const x = 1;\n\n'.repeat(lineCount);

const measureOne = (file, lineCount) =>
  measure([file], () => textOf(lineCount));

describe('countNonBlankLines', () => {
  it('skips empty and whitespace-only lines', () => {
    assert.equal(countNonBlankLines('a\n\n  \n\tb\n'), 2);
  });
});

describe('measure', () => {
  it('budgets a component, a hook and any other module by kind', () => {
    assert.deepEqual(
      [COMPONENT, HOOK, MODULE].map((file) => measureOne(file, 2)[0].budget),
      [BUDGET.COMPONENT, BUDGET.HOOK, BUDGET.MODULE],
    );
  });

  it('measures packages/db/scripts alongside src folders', () => {
    assert.equal(measureOne(DB_SCRIPT, 2).length, 1);
  });

  it('ignores files outside the scanned roots', () => {
    assert.deepEqual(measureOne('scripts/check-file-size.ts', 999), []);
  });

  it('passes every exempt kind at any length', () => {
    const exempt = [
      'packages/ui/src/components/atoms/button/button-variants.ts',
      'packages/ui/src/components/atoms/icon/icon-registry.ts',
      'packages/studio/src/schema-types/documents/post/post.ts',
      'packages/studio/src/schema-types/objects/link/link.ts',
      'packages/studio/src/schema-types/modules/hero/hero.ts',
      'packages/config/src/sanity/generated/types.ts',
      'apps/web/src/components/card/card.test.tsx',
      'packages/service/src/posts/get-post.test.ts',
      'apps/web/src/components/card/card.stories.tsx',
    ];
    const measured = measure(exempt, () => textOf(1000));
    assert.deepEqual(findProblems(measured, {}, FULL_TREE), []);
  });
});

describe('findProblems', () => {
  it('fails a new component one line over budget, naming its count and budget', () => {
    const problems = findProblems(
      measureOne(COMPONENT, BUDGET.COMPONENT + 1),
      {},
      FULL_TREE,
    );
    assert.equal(problems.length, 1);
    assert.match(
      problems[0],
      new RegExp(`^${COMPONENT} has 151 .* budget is 150`),
    );
  });

  it('passes a new file exactly at its budget', () => {
    assert.deepEqual(
      findProblems(measureOne(HOOK, BUDGET.HOOK), {}, FULL_TREE),
      [],
    );
  });

  it('passes a baselined file at its recorded count', () => {
    assert.deepEqual(
      findProblems(
        measureOne(MODULE, BASELINED_LINES),
        { [MODULE]: BASELINED_LINES },
        FULL_TREE,
      ),
      [],
    );
  });

  it('fails a baselined file that grows by one line', () => {
    const problems = findProblems(
      measureOne(MODULE, BASELINED_LINES + 1),
      { [MODULE]: BASELINED_LINES },
      FULL_TREE,
    );
    assert.equal(problems.length, 1);
    assert.match(
      problems[0],
      /grew to 385 .* baseline of 384; .* budget is 120/,
    );
  });

  it('fails a baselined file that shrank until its entry is lowered', () => {
    const problems = findProblems(
      measureOne(MODULE, BASELINED_LINES - 1),
      { [MODULE]: BASELINED_LINES },
      FULL_TREE,
    );
    assert.equal(problems.length, 1);
    assert.match(problems[0], /shrank to 383 .* --update/);
  });

  it('fails a baseline entry whose file is gone on a full-tree run', () => {
    const problems = findProblems([], { [MODULE]: BASELINED_LINES }, FULL_TREE);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /--update/);
  });

  it('leaves other baseline entries alone when checking named files', () => {
    assert.deepEqual(
      findProblems([], { [MODULE]: BASELINED_LINES }, NAMED_FILES),
      [],
    );
  });
});

describe('findProblems on a branch', () => {
  const baselined = { [MODULE]: BASELINED_LINES };
  const branch = (touched) => ({
    ...FULL_TREE,
    touched: new Map(touched),
    baseBaseline: baselined,
  });

  it('fails a touched baselined file that did not shrink, saying to extract', () => {
    const problems = findProblems(
      measureOne(MODULE, BASELINED_LINES),
      baselined,
      branch([[MODULE, MODULE]]),
    );
    assert.equal(problems.length, 1);
    assert.match(
      problems[0],
      /^apps\/web\/.* budget of 120 .* without shrinking it .*Extract the part you changed/,
    );
  });

  it('passes a touched baselined file that shrank and lowered its entry', () => {
    const shrunk = BASELINED_LINES - 1;
    assert.deepEqual(
      findProblems(
        measureOne(MODULE, shrunk),
        { [MODULE]: shrunk },
        branch([[MODULE, MODULE]]),
      ),
      [],
    );
  });

  it('passes an untouched baselined file at its recorded count', () => {
    assert.deepEqual(
      findProblems(measureOne(MODULE, BASELINED_LINES), baselined, branch([])),
      [],
    );
  });

  it('fails a touched over-budget file hand-added to the baseline', () => {
    const lines = BUDGET.MODULE + 1;
    const problems = findProblems(
      measureOne(MODULE, lines),
      { [MODULE]: lines },
      { ...FULL_TREE, touched: new Map([[MODULE, MODULE]]), baseBaseline: {} },
    );
    assert.equal(problems.length, 1);
    assert.match(problems[0], /not in the base branch's/);
  });

  it('ignores a touched within-budget file absent from the base baseline', () => {
    assert.deepEqual(
      findProblems(
        measureOne(MODULE, BUDGET.MODULE),
        {},
        {
          ...FULL_TREE,
          touched: new Map([[MODULE, MODULE]]),
          baseBaseline: {},
        },
      ),
      [],
    );
  });

  it('leaves out the shrank report for an edited file mid-extraction', () => {
    assert.deepEqual(
      findProblems(measureOne(MODULE, BASELINED_LINES - 1), baselined, {
        ...NAMED_FILES,
        reportsShrink: false,
      }),
      [],
    );
  });

  it('still fails an edited file that grew', () => {
    const problems = findProblems(
      measureOne(MODULE, BASELINED_LINES + 1),
      baselined,
      { ...NAMED_FILES, reportsShrink: false },
    );
    assert.match(problems[0], /grew to/);
  });

  it('suggests git mv for a moved file git does not know about', () => {
    const problems = findProblems(
      measureOne(MOVED, BUDGET.MODULE + 1),
      {},
      FULL_TREE,
    );
    assert.match(problems[0], /git mv/);
  });

  it('judges an edited moved file against its old path on the base branch', () => {
    const problems = findProblems(
      measureOne(MOVED, BASELINED_LINES),
      { [MOVED]: BASELINED_LINES },
      branch([[MOVED, MODULE]]),
    );
    assert.equal(problems.length, 1);
    assert.match(problems[0], /without shrinking it/);
  });

  it('asks to move the entry of a moved baselined file', () => {
    const problems = findProblems(
      measureOne(MOVED, BASELINED_LINES),
      baselined,
      { ...FULL_TREE, moves: new Map([[MODULE, MOVED]]) },
    );
    assert.equal(problems.length, 1);
    assert.match(problems[0], /moved to .* --update/);
  });
});

describe('ratchetBaseline', () => {
  it("carries a moved file's entry to its new path", () => {
    const measured = measureOne(MOVED, BASELINED_LINES);
    const options = { ...FULL_TREE, moves: new Map([[MODULE, MOVED]]) };
    const next = ratchetBaseline(
      measured,
      { [MODULE]: BASELINED_LINES },
      options,
    );
    assert.deepEqual(next, { [MOVED]: BASELINED_LINES });
    assert.deepEqual(findProblems(measured, next, options), []);
  });

  it('lowers a shrunk entry so the check passes afterwards', () => {
    const measured = measureOne(MODULE, BASELINED_LINES - 10);
    const next = ratchetBaseline(
      measured,
      { [MODULE]: BASELINED_LINES },
      FULL_TREE,
    );
    assert.deepEqual(next, { [MODULE]: BASELINED_LINES - 10 });
    assert.deepEqual(findProblems(measured, next, FULL_TREE), []);
  });

  it('removes an entry once its file is within budget', () => {
    const measured = measureOne(MODULE, BUDGET.MODULE);
    assert.deepEqual(
      ratchetBaseline(measured, { [MODULE]: BASELINED_LINES }, FULL_TREE),
      {},
    );
  });

  it('never raises a grown entry', () => {
    const measured = measureOne(MODULE, BASELINED_LINES + 5);
    assert.deepEqual(
      ratchetBaseline(measured, { [MODULE]: BASELINED_LINES }, FULL_TREE),
      { [MODULE]: BASELINED_LINES },
    );
  });

  it('never adds a new over-budget file', () => {
    const measured = measureOne(COMPONENT, BUDGET.COMPONENT + 1);
    assert.deepEqual(ratchetBaseline(measured, {}, FULL_TREE), {});
  });

  it('removes an entry whose file is gone on a full-tree run', () => {
    assert.deepEqual(
      ratchetBaseline([], { [MODULE]: BASELINED_LINES }, FULL_TREE),
      {},
    );
  });
});
