import { at, set } from 'sanity/migrate';

import { toOperations } from './index';

describe('narrow-module-content-alignment migration', () => {
  it('moves a stored Right to Center on a grid or list module', () => {
    expect(
      toOperations({ _type: 'module_postLatest', contentAlignment: 'RIGHT' }),
    ).toEqual([at('contentAlignment', set('CENTER'))]);
  });

  it.each(['LEFT', 'CENTER', undefined])(
    'leaves a stored %s alone',
    (contentAlignment) => {
      expect(
        toOperations({ _type: 'module_sectionPages', contentAlignment }),
      ).toEqual([]);
    },
  );

  it('keeps Right on a call to action', () => {
    expect(
      toOperations({ _type: 'module_cta', contentAlignment: 'RIGHT' }),
    ).toEqual([]);
  });

  it('types an untyped call-to-action layout as ctaLayout', () => {
    expect(
      toOperations({
        _type: 'module_cta',
        layout: { spacingTop: 'SM' },
      } as never),
    ).toEqual([at(['layout', '_type'], set('ctaLayout'))]);
  });

  it('leaves a call to action with no layout, or an already typed one, alone', () => {
    expect(toOperations({ _type: 'module_cta' })).toEqual([]);
    expect(
      toOperations({ _type: 'module_cta', layout: { _type: 'ctaLayout' } }),
    ).toEqual([]);
  });
});
