// Fixture-based tests for check-migration-index-collision's journal parsing
// and comparison helpers, mirroring check-turbo-env-sync.test.mjs's approach:
// inline journal strings instead of the real repo files, so the cases stay
// pinned once `packages/db/migrations` has moved on past them.
//
// The one exception is the last case, which deliberately reads the real
// README: the failure message names a heading in another file, and nothing
// else would notice that heading being renamed out from under it.
//
// Run with `node --test scripts/check-migration-index-collision.test.mjs`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  BASE_REF,
  findCollisions,
  formatReport,
  readJournalTags,
  RENUMBER_DOC,
  RENUMBER_SECTION,
} from './check-migration-index-collision.mjs';

const journal = (...tags) =>
  JSON.stringify({
    version: '7',
    dialect: 'postgresql',
    entries: tags.map((tag, idx) => ({
      idx,
      version: '7',
      when: 1788452128031 + idx,
      tag,
      breakpoints: true,
    })),
  });

const BASE = journal('0000_enable_pgvector_extension', '0001_cultured_ego');

describe('readJournalTags', () => {
  it('maps every entry idx to its tag', () => {
    assert.deepEqual(
      [...readJournalTags(BASE)],
      [
        [0, '0000_enable_pgvector_extension'],
        [1, '0001_cultured_ego'],
      ],
    );
  });

  it('treats a journal with no entries as empty', () => {
    assert.equal(readJournalTags(JSON.stringify({ version: '7' })).size, 0);
  });
});

describe('findCollisions', () => {
  it('reports an index that carries a different tag on each side', () => {
    const head = journal('0000_enable_pgvector_extension', '0001_loud_wallow');

    assert.deepEqual(
      findCollisions(readJournalTags(BASE), readJournalTags(head)),
      [{ idx: 1, baseTag: '0001_cultured_ego', headTag: '0001_loud_wallow' }],
    );
  });

  it('stays silent when the branch adds no migration', () => {
    assert.deepEqual(
      findCollisions(readJournalTags(BASE), readJournalTags(BASE)),
      [],
    );
  });

  it('stays silent when the branch appends under a free index', () => {
    const head = journal(
      '0000_enable_pgvector_extension',
      '0001_cultured_ego',
      '0002_mighty_leo',
    );

    assert.deepEqual(
      findCollisions(readJournalTags(BASE), readJournalTags(head)),
      [],
    );
  });

  it('stays silent when the branch is simply behind the base', () => {
    const head = journal('0000_enable_pgvector_extension');

    assert.deepEqual(
      findCollisions(readJournalTags(BASE), readJournalTags(head)),
      [],
    );
  });

  it('reports every colliding index, lowest first', () => {
    // The shape #2717 documents: PR #2697 lost the race at 0024 and again at
    // 0025, the second time against a migration that had itself already been
    // renumbered.
    const base = journal(
      ...Array.from(
        { length: 24 },
        (_, idx) => `${String(idx).padStart(4, '0')}_shared`,
      ),
      '0024_faithful_kree',
      '0025_clumsy_killer_shrike',
    );
    const head = journal(
      ...Array.from(
        { length: 24 },
        (_, idx) => `${String(idx).padStart(4, '0')}_shared`,
      ),
      '0024_easy_maddog',
      '0025_mysterious_union_jack',
    );

    assert.deepEqual(
      findCollisions(readJournalTags(base), readJournalTags(head)),
      [
        {
          idx: 24,
          baseTag: '0024_faithful_kree',
          headTag: '0024_easy_maddog',
        },
        {
          idx: 25,
          baseTag: '0025_clumsy_killer_shrike',
          headTag: '0025_mysterious_union_jack',
        },
      ],
    );
  });
});

describe('formatReport', () => {
  const report = formatReport([
    { idx: 24, baseTag: '0024_faithful_kree', headTag: '0024_easy_maddog' },
  ]);

  it('names both migrations and the index they share', () => {
    assert.match(report, /index 0024/);
    assert.match(report, /0024_faithful_kree/);
    assert.match(report, /0024_easy_maddog/);
  });

  it('says which side each migration is on', () => {
    assert.ok(report.includes(`0024_faithful_kree on ${BASE_REF}`));
    assert.ok(report.includes('0024_easy_maddog on this branch'));
  });

  it('points at the renumber procedure', () => {
    assert.match(report, /packages\/db\/README\.md/);
    assert.match(report, /db:generate/);
  });

  it('names a section heading that still exists in that document', () => {
    const doc = readFileSync(
      new URL(`../${RENUMBER_DOC}`, import.meta.url),
      'utf8',
    );

    assert.ok(
      doc.includes(`### ${RENUMBER_SECTION}`),
      `${RENUMBER_DOC} has no "### ${RENUMBER_SECTION}" heading for the failure message to point at.`,
    );
  });
});
