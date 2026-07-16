import { describe, expect, it } from 'vitest';

import {
  appliedIdsFromLedger,
  buildLedgerEntry,
  compareMigrationIds,
  computePending,
  formatTimestamp,
  isTimestamped,
  slugify,
  slugOf,
  sortMigrationIds,
  timestampedId,
} from './migrate-lib.mjs';

describe(slugify, () => {
  it('lowercases and dash-separates free text', () => {
    expect(slugify('unify links')).toBe('unify-links');
  });

  it('strips non-alphanumeric characters and collapses runs of them', () => {
    expect(slugify('  Fix  Author -- Refs!! ')).toBe('fix-author-refs');
  });

  it('passes an already-dashed slug through unchanged', () => {
    expect(slugify('already-dashed')).toBe('already-dashed');
  });
});

describe(formatTimestamp, () => {
  it('formats a UTC date as YYYYMMDDTHHmm', () => {
    const date = new Date('2026-07-10T12:05:30.000Z');
    expect(formatTimestamp(date)).toBe('20260710T1205');
  });
});

describe(timestampedId, () => {
  it('prepends the UTC timestamp to the slugified name', () => {
    const date = new Date('2026-07-10T12:00:00.000Z');
    expect(timestampedId('unify links', date)).toBe(
      '20260710T1200-unify-links',
    );
  });
});

describe(isTimestamped, () => {
  it('recognizes a timestamped id', () => {
    expect(isTimestamped('20260710T1200-unify-links')).toBe(true);
  });

  it('recognizes a legacy (un-timestamped) id as not timestamped', () => {
    expect(isTimestamped('unify-links')).toBe(false);
  });
});

describe(slugOf, () => {
  it('strips the timestamp prefix from a timestamped id', () => {
    expect(slugOf('20260710T1200-unify-links')).toBe('unify-links');
  });

  it('returns a legacy id unchanged', () => {
    expect(slugOf('unify-links')).toBe('unify-links');
  });
});

describe(compareMigrationIds, () => {
  it('orders a legacy id before any timestamped id', () => {
    expect(compareMigrationIds('unify-links', '20260101T0000-a')).toBe(-1);
    expect(compareMigrationIds('20260101T0000-a', 'unify-links')).toBe(1);
  });

  it('orders two timestamped ids chronologically', () => {
    expect(
      compareMigrationIds('20260101T0000-a', '20260710T1200-b'),
    ).toBe(-1);
  });

  it('orders two legacy ids lexicographically', () => {
    expect(compareMigrationIds('alpha', 'beta')).toBe(-1);
  });

  it('treats identical ids as equal', () => {
    expect(compareMigrationIds('20260101T0000-a', '20260101T0000-a')).toBe(0);
  });
});

describe(sortMigrationIds, () => {
  it('sorts legacy ids before timestamped ids, each chronologically/lexicographically', () => {
    const ids = [
      '20260710T1200-unify-links',
      'legacy-b',
      '20260101T0000-fix-author',
      'legacy-a',
    ];

    expect(sortMigrationIds(ids)).toEqual([
      'legacy-a',
      'legacy-b',
      '20260101T0000-fix-author',
      '20260710T1200-unify-links',
    ]);
  });

  it('does not mutate the input array', () => {
    const ids = ['b', 'a'];
    sortMigrationIds(ids);
    expect(ids).toEqual(['b', 'a']);
  });
});

describe(appliedIdsFromLedger, () => {
  it('extracts ids from a ledger document', () => {
    const ledger = {
      _id: 'migrationState',
      _type: 'migrationState',
      applied: [
        { id: 'legacy-a', runAt: '2026-01-01T00:00:00.000Z', sha: 'abc' },
        { id: '20260710T1200-unify-links', runAt: '2026-07-10T12:05:00.000Z', sha: 'def' },
      ],
    };

    expect(appliedIdsFromLedger(ledger)).toEqual([
      'legacy-a',
      '20260710T1200-unify-links',
    ]);
  });

  it('returns an empty array for a ledger with no applied entries', () => {
    expect(appliedIdsFromLedger({ applied: [] })).toEqual([]);
  });

  it('returns an empty array when the ledger does not exist yet', () => {
    expect(appliedIdsFromLedger(undefined)).toEqual([]);
  });
});

describe(computePending, () => {
  it('returns folder migrations not yet in the ledger, in run order', () => {
    const folderIds = ['20260710T1200-b', 'legacy-a', '20260101T0000-a'];
    const appliedIds = ['legacy-a'];

    expect(computePending(folderIds, appliedIds)).toEqual([
      '20260101T0000-a',
      '20260710T1200-b',
    ]);
  });

  it('is a safe no-op when the folder has no migrations', () => {
    expect(computePending([], [])).toEqual([]);
  });

  it('returns an empty array when everything is already applied (idempotent)', () => {
    const folderIds = ['legacy-a', '20260101T0000-a'];
    const appliedIds = ['legacy-a', '20260101T0000-a'];

    expect(computePending(folderIds, appliedIds)).toEqual([]);
  });
});

describe(buildLedgerEntry, () => {
  it('builds an applied[] entry with the given id, runAt, and sha', () => {
    expect(
      buildLedgerEntry('20260710T1200-unify-links', {
        runAt: '2026-07-10T12:05:00.000Z',
        sha: 'abc123',
      }),
    ).toEqual({
      id: '20260710T1200-unify-links',
      runAt: '2026-07-10T12:05:00.000Z',
      sha: 'abc123',
    });
  });

  it('tolerates a missing sha (e.g. no git checkout available)', () => {
    expect(
      buildLedgerEntry('legacy-a', {
        runAt: '2026-01-01T00:00:00.000Z',
        sha: undefined,
      }),
    ).toEqual({
      id: 'legacy-a',
      runAt: '2026-01-01T00:00:00.000Z',
      sha: undefined,
    });
  });
});
