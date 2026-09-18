import { DISPLAY_MODE } from '@blog/config/constants';

import { displayModeField } from './display-mode-field';

describe('displayModeField', () => {
  it('names a string field defaulting to GRID', () => {
    const field = displayModeField();

    expect(field.name).toBe('displayMode');
    expect(field.type).toBe('string');
    expect(field.initialValue).toBe(DISPLAY_MODE.GRID);
  });

  it('lists both display modes as a dropdown', () => {
    const field = displayModeField();

    expect(field.options?.layout).toBe('dropdown');
    expect(field.options?.list).toEqual([
      { title: 'Grid', value: DISPLAY_MODE.GRID },
      { title: 'Carousel', value: DISPLAY_MODE.CAROUSEL },
    ]);
  });

  it('defines no validation rule', () => {
    const field = displayModeField();

    expect(field.validation).toBeUndefined();
  });
});
