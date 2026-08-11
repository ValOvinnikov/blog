import {
  headingFieldsToSectionHeader,
  postListTitleToSectionHeader,
} from './transform';

describe(headingFieldsToSectionHeader, () => {
  it('maps module_cta heading + text onto heading + supportingText', () => {
    const result = headingFieldsToSectionHeader({
      heading: 'Get Started',
      text: 'Join the newsletter today.',
    });

    expect(result).toEqual({
      heading: 'Get Started',
      supportingText: 'Join the newsletter today.',
    });
  });

  it('maps module_newsletter heading + description onto heading + supportingText', () => {
    const result = headingFieldsToSectionHeader({
      heading: 'Stay in the loop',
      description: 'One email a week, no spam.',
    });

    expect(result).toEqual({
      heading: 'Stay in the loop',
      supportingText: 'One email a week, no spam.',
    });
  });

  it('omits supportingText when neither text nor description is set', () => {
    const result = headingFieldsToSectionHeader({ heading: 'Get Started' });

    expect(result).toEqual({ heading: 'Get Started' });
  });

  it('is idempotent — a doc that already has sectionHeader is left alone', () => {
    const result = headingFieldsToSectionHeader({
      heading: 'Get Started',
      sectionHeader: { heading: 'Get Started' },
    });

    expect(result).toBeUndefined();
  });

  it('documents the known edge case: neither heading nor text/description leaves nothing to move', () => {
    const result = headingFieldsToSectionHeader({});

    expect(result).toBeUndefined();
  });
});

describe(postListTitleToSectionHeader, () => {
  it('copies title onto sectionHeader.heading', () => {
    const result = postListTitleToSectionHeader({ title: 'Latest Posts' });

    expect(result).toEqual({ heading: 'Latest Posts' });
  });

  it('is idempotent — a doc that already has sectionHeader is left alone', () => {
    const result = postListTitleToSectionHeader({
      title: 'Latest Posts',
      sectionHeader: { heading: 'Latest Posts' },
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined for a doc with no title', () => {
    const result = postListTitleToSectionHeader({});

    expect(result).toBeUndefined();
  });
});
