import { appearanceToLayout } from './transform';

describe(appearanceToLayout, () => {
  it('maps spacingTop/spacingBottom and divider onto both dividerTop/dividerBottom', () => {
    const result = appearanceToLayout(
      {
        appearance: {
          spacingTop: 'LG',
          spacingBottom: 'LG',
          divider: true,
        },
      },
      { includeContainerWidth: false },
    );

    expect(result).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'LG',
      dividerTop: true,
      dividerBottom: true,
    });
  });

  it('carries containerWidth only when includeContainerWidth is true (module_newsletter)', () => {
    const result = appearanceToLayout(
      { appearance: { containerWidth: 'WIDE' } },
      { includeContainerWidth: true },
    );

    expect(result).toEqual({ containerWidth: 'WIDE' });
  });

  it('drops containerWidth for module_hero even when set on appearance', () => {
    const result = appearanceToLayout(
      { appearance: { containerWidth: 'WIDE' } },
      { includeContainerWidth: false },
    );

    expect(result).toEqual({});
  });

  it('never copies align', () => {
    const result = appearanceToLayout(
      { appearance: { align: 'START' } },
      { includeContainerWidth: true },
    );

    expect(result).toEqual({});
  });

  it('copies an explicit divider: false', () => {
    const result = appearanceToLayout(
      { appearance: { divider: false } },
      { includeContainerWidth: false },
    );

    expect(result).toEqual({ dividerTop: false, dividerBottom: false });
  });

  it('returns undefined when appearance is absent', () => {
    const result = appearanceToLayout({}, { includeContainerWidth: false });

    expect(result).toBeUndefined();
  });

  it('is idempotent — a doc that already has layout is left alone', () => {
    const result = appearanceToLayout(
      {
        appearance: { spacingTop: 'LG' },
        layout: { spacingTop: 'LG' },
      },
      { includeContainerWidth: false },
    );

    expect(result).toBeUndefined();
  });

  it('treats an explicit layout: null as not yet migrated', () => {
    const result = appearanceToLayout(
      {
        appearance: { spacingTop: 'LG' },
        layout: null,
      },
      { includeContainerWidth: false },
    );

    expect(result).toEqual({ spacingTop: 'LG' });
  });
});
