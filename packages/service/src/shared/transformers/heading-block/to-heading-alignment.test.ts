import { CONTENT_ALIGNMENT } from '@blog/config';

import { toHeadingAlignment } from './to-heading-alignment';

describe(toHeadingAlignment, () => {
  it.each([CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER])(
    'passes %s through',
    (alignment) => {
      expect(toHeadingAlignment(alignment)).toBe(alignment);
    },
  );

  it('falls back to LEFT for a page saved before the field existed', () => {
    expect(toHeadingAlignment(null)).toBe(CONTENT_ALIGNMENT.LEFT);
  });
});
