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

  it('defaults the description to the posts wording', () => {
    expect(displayModeField().description).toBe(
      'Grid lays the posts out in rows. Carousel puts them in a single row the reader can swipe or step through.',
    );
  });

  it('uses a supplied description over the default', () => {
    expect(
      displayModeField({ description: 'Grid lays the cards out in rows.' })
        .description,
    ).toBe('Grid lays the cards out in rows.');
  });
});
