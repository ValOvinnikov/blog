import {
  CONTRAST_STATUS,
  RELEASE_RUN_STATUS,
} from '@platform/constants/release';

import { isReleaseOverrideRequired, isReleaseRunActive } from './release-state';

describe(isReleaseOverrideRequired, () => {
  it.each([
    CONTRAST_STATUS.DUE,
    CONTRAST_STATUS.FAILED,
    CONTRAST_STATUS.RUNNING,
  ])(
    'requires an override when rendering changed and contrast is %s',
    (contrastStatus) => {
      expect(
        isReleaseOverrideRequired({ isRenderingChanged: true, contrastStatus }),
      ).toBe(true);
    },
  );

  it.each([CONTRAST_STATUS.GREEN, CONTRAST_STATUS.NONE])(
    'needs no override when contrast is %s',
    (contrastStatus) => {
      expect(
        isReleaseOverrideRequired({ isRenderingChanged: true, contrastStatus }),
      ).toBe(false);
    },
  );

  it('needs no override when no rendering path changed, whatever contrast says', () => {
    expect(
      isReleaseOverrideRequired({
        isRenderingChanged: false,
        contrastStatus: CONTRAST_STATUS.FAILED,
      }),
    ).toBe(false);
  });
});

describe(isReleaseRunActive, () => {
  it.each([
    [RELEASE_RUN_STATUS.DISPATCHED, true],
    [RELEASE_RUN_STATUS.RUNNING, true],
    [RELEASE_RUN_STATUS.SUCCEEDED, false],
    [RELEASE_RUN_STATUS.FAILED, false],
  ])('treats a %s run as active: %s', (status, isActive) => {
    expect(isReleaseRunActive(status)).toBe(isActive);
  });
});
