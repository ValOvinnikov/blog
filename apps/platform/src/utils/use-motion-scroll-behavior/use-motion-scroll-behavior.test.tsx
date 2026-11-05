import { MEDIA_QUERY } from '@platform/constants/media-query';
import { stubMatchingMediaQuery } from '@platform/testing/match-media';
import { renderHook } from '@testing-library/react';

import { useMotionScrollBehavior } from './use-motion-scroll-behavior';

describe(useMotionScrollBehavior, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls smoothly by default', () => {
    const { result } = renderHook(useMotionScrollBehavior);

    expect(result.current).toBe('smooth');
  });

  it('scrolls instantly when the reader prefers reduced motion', () => {
    stubMatchingMediaQuery(MEDIA_QUERY.REDUCED_MOTION);

    const { result } = renderHook(useMotionScrollBehavior);

    expect(result.current).toBe('instant');
  });
});
