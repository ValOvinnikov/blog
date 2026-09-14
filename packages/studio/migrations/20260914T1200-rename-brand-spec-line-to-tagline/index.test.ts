import { at, set, unset } from 'sanity/migrate';

import { renameSpecLineToTagline } from './index';

describe(renameSpecLineToTagline, () => {
  it('moves specLine to tagline and rewrites its _type', () => {
    const result = renameSpecLineToTagline({
      brand: {
        specLine: {
          _type: 'specLine',
          items: ['Software', 'Backend'],
          separator: 'DOT',
        },
      },
    });

    expect(result).toEqual([
      at(
        'brand.tagline',
        set({
          _type: 'brandTagline',
          items: ['Software', 'Backend'],
          separator: 'DOT',
        }),
      ),
      at('brand.specLine', unset()),
    ]);
  });

  it('leaves a doc alone when tagline is already set', () => {
    const result = renameSpecLineToTagline({
      brand: {
        specLine: { _type: 'specLine', items: ['Software'], separator: 'DOT' },
        tagline: { _type: 'brandTagline', items: ['Backend'] },
      },
    });

    expect(result).toBeUndefined();
  });

  it('is idempotent — a doc with no specLine is left alone', () => {
    const result = renameSpecLineToTagline({ brand: {} });

    expect(result).toBeUndefined();
  });

  it('is a no-op when the document has no brand at all', () => {
    const result = renameSpecLineToTagline({});

    expect(result).toBeUndefined();
  });
});
