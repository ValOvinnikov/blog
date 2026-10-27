import { CONTENT_ALIGNMENT, SPACING_SCALE } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { toOperations } from './index';

describe(toOperations, () => {
  it('moves a stored Right to Center on a grid or list module', () => {
    const result = toOperations({
      _type: 'module_postLatest',
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    });

    expect(result).toEqual([
      at('contentAlignment', set(CONTENT_ALIGNMENT.CENTER)),
    ]);
  });

  it.each([CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER, undefined])(
    'leaves a stored %s alone',
    (contentAlignment) => {
      const result = toOperations({
        _type: 'module_sectionPages',
        contentAlignment,
      });

      expect(result).toEqual([]);
    },
  );

  it('keeps Right on a call to action', () => {
    const result = toOperations({
      _type: 'module_cta',
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    });

    expect(result).toEqual([]);
  });

  it('types an untyped call-to-action layout as ctaLayout', () => {
    const doc = {
      _type: 'module_cta',
      layout: { _type: undefined, spacingTop: SPACING_SCALE.SM },
    };

    const result = toOperations(doc);

    expect(result).toEqual([at(['layout', '_type'], set('ctaLayout'))]);
  });

  it.each([
    { title: 'no layout', layout: undefined },
    { title: 'an already typed layout', layout: { _type: 'ctaLayout' } },
  ])('leaves a call to action with $title alone', ({ layout }) => {
    const result = toOperations({ _type: 'module_cta', layout });

    expect(result).toEqual([]);
  });
});
