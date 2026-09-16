import { BRAND_VARIANT } from '@blog/config/constants';

import { moduleSubtitle } from './module-subtitle';

describe(moduleSubtitle, () => {
  it('joins the brand variant and the detail with a middle dot', () => {
    expect(moduleSubtitle(BRAND_VARIANT.BRAND_PRIMARY, 'Limit: 3')).toBe(
      'Brand Primary · Limit: 3',
    );
  });

  it('shows the brand variant alone when there is no detail', () => {
    expect(moduleSubtitle(BRAND_VARIANT.PRIMARY, undefined)).toBe('Primary');
  });

  it('shows the detail alone when no brand variant is set', () => {
    expect(moduleSubtitle(undefined, 'Limit: 3')).toBe('Limit: 3');
  });

  it('is undefined when nothing is set', () => {
    expect(moduleSubtitle(undefined, undefined)).toBeUndefined();
  });
});
