import { at, setIfMissing, unset } from 'sanity/migrate';

import {
  moveHeadingFieldsToSectionHeader,
  movePostListTitleToSectionHeader,
} from './index';

describe(moveHeadingFieldsToSectionHeader, () => {
  it('moves module_cta heading + text onto sectionHeader and unsets both', () => {
    const result = moveHeadingFieldsToSectionHeader({
      heading: 'Get Started',
      text: 'Join the newsletter today.',
    });

    expect(result).toEqual([
      at(
        'sectionHeader',
        setIfMissing({
          heading: 'Get Started',
          supportingText: 'Join the newsletter today.',
        }),
      ),
      at('heading', unset()),
      at('text', unset()),
    ]);
  });

  it('moves module_newsletter heading + description onto sectionHeader and unsets both', () => {
    const result = moveHeadingFieldsToSectionHeader({
      heading: 'Stay in the loop',
      description: 'One email a week, no spam.',
    });

    expect(result).toEqual([
      at(
        'sectionHeader',
        setIfMissing({
          heading: 'Stay in the loop',
          supportingText: 'One email a week, no spam.',
        }),
      ),
      at('heading', unset()),
      at('description', unset()),
    ]);
  });

  it('only unsets fields that were actually present on the doc', () => {
    const result = moveHeadingFieldsToSectionHeader({ heading: 'Get Started' });

    expect(result).toEqual([
      at('sectionHeader', setIfMissing({ heading: 'Get Started' })),
      at('heading', unset()),
    ]);
  });

  it('is idempotent — a doc already migrated (sectionHeader set) is left alone', () => {
    const result = moveHeadingFieldsToSectionHeader({
      heading: 'Get Started',
      text: 'Join today.',
      sectionHeader: { heading: 'Get Started', supportingText: 'Join today.' },
    });

    expect(result).toBeUndefined();
  });

  it('documents the known edge case: no heading and no text/description is left alone', () => {
    const result = moveHeadingFieldsToSectionHeader({});

    expect(result).toBeUndefined();
  });
});

describe(movePostListTitleToSectionHeader, () => {
  it('copies title onto sectionHeader without touching title', () => {
    const result = movePostListTitleToSectionHeader({ title: 'Latest Posts' });

    expect(result).toEqual([
      at('sectionHeader', setIfMissing({ heading: 'Latest Posts' })),
    ]);
  });

  it('is idempotent — a doc already migrated (sectionHeader set) is left alone', () => {
    const result = movePostListTitleToSectionHeader({
      title: 'Latest Posts',
      sectionHeader: { heading: 'Latest Posts' },
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined for a doc with no title', () => {
    const result = movePostListTitleToSectionHeader({});

    expect(result).toBeUndefined();
  });
});
