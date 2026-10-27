import {
  mockRawHeroLayout,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';

import { toLayout } from './to-layout';

describe(toLayout, () => {
  it.each([null, undefined])('returns undefined for a %s raw layout', (raw) => {
    const result = toLayout(raw);

    expect(result).toBeUndefined();
  });

  it('maps a fully authored layout one to one', () => {
    const raw = mockRawWideLayout();

    const result = toLayout(raw);

    expect(result).toEqual(raw);
  });

  it('leaves each unset field undefined with no default', () => {
    const result = toLayout(
      mockRawWideLayout({
        spacingTop: null,
        spacingBottom: null,
        containerWidth: null,
        dividerTop: null,
        dividerBottom: null,
      }),
    );

    expect(result).toEqual({
      spacingTop: undefined,
      spacingBottom: undefined,
      containerWidth: undefined,
      dividerTop: undefined,
      dividerBottom: undefined,
    });
  });

  it('leaves the container width undefined for a layout that has none', () => {
    const raw = mockRawHeroLayout();

    const result = toLayout(raw);

    expect(result).toEqual({ ...raw, containerWidth: undefined });
  });
});
