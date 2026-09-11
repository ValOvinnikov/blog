import { at, set, unset } from 'sanity/migrate';

import {
  moveHeroStatementHeadingFields,
  renameRequiredHeadingBlockType,
} from './index';

describe(renameRequiredHeadingBlockType, () => {
  it('rewrites headingBlock._type from requiredHeadingBlock to headingBlock', () => {
    const result = renameRequiredHeadingBlockType({
      headingBlock: { _type: 'requiredHeadingBlock' },
    });

    expect(result).toEqual([at('headingBlock._type', set('headingBlock'))]);
  });

  it('is keyed off headingBlock._type, not the document type — applies the same to page_post, module_cta and module_newsletter shapes', () => {
    const shape = { headingBlock: { _type: 'requiredHeadingBlock' } };

    expect(renameRequiredHeadingBlockType(shape)).toEqual([
      at('headingBlock._type', set('headingBlock')),
    ]);
  });

  it('is idempotent — a doc already on headingBlock is left alone', () => {
    const result = renameRequiredHeadingBlockType({
      headingBlock: { _type: 'headingBlock' },
    });

    expect(result).toBeUndefined();
  });

  it('is a no-op for a doc with no headingBlock at all', () => {
    const result = renameRequiredHeadingBlockType({});

    expect(result).toBeUndefined();
  });
});

describe(moveHeroStatementHeadingFields, () => {
  it('moves heading and supportingText onto headingBlock, then unsets both', () => {
    const result = moveHeroStatementHeadingFields({
      heading: 'We build things.',
      supportingText: 'Carefully, with intent.',
    });

    expect(result).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'headingBlock',
          heading: 'We build things.',
          supportingText: 'Carefully, with intent.',
        }),
      ),
      at('heading', unset()),
      at('supportingText', unset()),
    ]);
  });

  it('omits supportingText from the built value and its unset when absent', () => {
    const result = moveHeroStatementHeadingFields({
      heading: 'We build things.',
    });

    expect(result).toEqual([
      at(
        'headingBlock',
        set({ _type: 'headingBlock', heading: 'We build things.' }),
      ),
      at('heading', unset()),
    ]);
  });

  it('is idempotent — a doc already on headingBlock is left alone, even with legacy fields still present', () => {
    const result = moveHeroStatementHeadingFields({
      heading: 'Old',
      headingBlock: { _type: 'headingBlock', heading: 'Already moved' },
    });

    expect(result).toBeUndefined();
  });

  it('is a no-op for a doc with neither heading nor headingBlock', () => {
    const result = moveHeroStatementHeadingFields({});

    expect(result).toBeUndefined();
  });
});
