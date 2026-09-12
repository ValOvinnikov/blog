import { at, set, setIfMissing, unset } from 'sanity/migrate';

import migration, {
  buildLegacyIndexHeadingPatches,
  type TLegacyIndexHeadingDoc,
} from './index';

const runDocument = (doc: Record<string, unknown>) =>
  migration.migrate.document?.(
    // @ts-expect-error -- only the fields the migration reads are needed
    doc,
  );

describe(buildLegacyIndexHeadingPatches, () => {
  it('moves an orphaned heading into headingBlock.heading, then unsets it', () => {
    const doc: TLegacyIndexHeadingDoc = { heading: 'Browse by tag' };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.heading', set('Browse by tag')),
      at('heading', unset()),
    ]);
  });

  it('moves an orphaned supportingText into headingBlock.supportingText, then unsets it', () => {
    const doc: TLegacyIndexHeadingDoc = {
      supportingText: 'Find posts by keyword.',
    };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.supportingText', set('Find posts by keyword.')),
      at('supportingText', unset()),
    ]);
  });

  it('moves both fields across in one pass when both are orphaned', () => {
    const doc: TLegacyIndexHeadingDoc = {
      heading: 'Browse by tag',
      supportingText: 'Find posts by keyword.',
    };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.heading', set('Browse by tag')),
      at('headingBlock.supportingText', set('Find posts by keyword.')),
      at('heading', unset()),
      at('supportingText', unset()),
    ]);
  });

  it('only unsets the legacy heading when headingBlock.heading already has its own value', () => {
    const doc: TLegacyIndexHeadingDoc = {
      heading: 'Old copy, never read',
      headingBlock: { heading: 'Browse by tag' },
    };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('heading', unset()),
    ]);
  });

  it('only unsets the legacy supportingText when headingBlock.supportingText already has its own value', () => {
    const doc: TLegacyIndexHeadingDoc = {
      supportingText: 'Old copy, never read',
      headingBlock: { supportingText: 'Find posts by keyword.' },
    };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('supportingText', unset()),
    ]);
  });

  it('never moves a blank legacy heading — unsets it without touching headingBlock', () => {
    const doc: TLegacyIndexHeadingDoc = { heading: '' };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('heading', unset()),
    ]);
  });

  it('produces no patches once both legacy fields are already absent', () => {
    const doc: TLegacyIndexHeadingDoc = {
      headingBlock: { heading: 'Browse by tag' },
    };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([]);
  });
});

describe('drop deprecated index heading fields document() wiring', () => {
  it('page_tagIndex: moves an orphaned heading across before unsetting it', () => {
    const result = runDocument({
      _id: 'page_tagIndex',
      _type: 'page_tagIndex',
      heading: 'Browse by tag',
    });

    expect(result).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.heading', set('Browse by tag')),
      at('heading', unset()),
    ]);
  });

  it('page_topicIndex: moves an orphaned heading across before unsetting it', () => {
    const result = runDocument({
      _id: 'page_topicIndex',
      _type: 'page_topicIndex',
      heading: 'Browse by topic',
    });

    expect(result).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.heading', set('Browse by topic')),
      at('heading', unset()),
    ]);
  });

  it('unsets both legacy fields with no move when headingBlock already carries its own copy', () => {
    const result = runDocument({
      _id: 'page_tagIndex',
      _type: 'page_tagIndex',
      heading: 'Old copy, never read',
      supportingText: 'Old copy, never read',
      headingBlock: {
        heading: 'Browse by tag',
        supportingText: 'Find posts by keyword.',
      },
    });

    expect(result).toEqual([
      at('heading', unset()),
      at('supportingText', unset()),
    ]);
  });

  it('is a clean no-op once already migrated', () => {
    const migrated = {
      _id: 'page_tagIndex',
      _type: 'page_tagIndex',
      headingBlock: { heading: 'Browse by tag' },
    };

    expect(runDocument(migrated)).toEqual([]);
    expect(runDocument(migrated)).toEqual([]);
  });
});
