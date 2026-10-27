import {
  CONTRAST_STATUS,
  RELEASE_RUN_STATUS,
} from '@platform/constants/release';

import { isReleaseOverrideRequired, isReleaseRunActive } from './release-state';

describe(isReleaseOverrideRequired, () => {
  it.each([
    [true, CONTRAST_STATUS.DUE, true],
    [true, CONTRAST_STATUS.FAILED, true],
    [true, CONTRAST_STATUS.RUNNING, true],
    [true, CONTRAST_STATUS.GREEN, false],
    [true, CONTRAST_STATUS.NONE, false],
    [false, CONTRAST_STATUS.FAILED, false],
  ])(
    'with rendering changed %s and contrast %s, an override is required: %s',
    (isRenderingChanged, contrastStatus, isRequired) => {
      expect(
        isReleaseOverrideRequired({ isRenderingChanged, contrastStatus }),
      ).toBe(isRequired);
    },
  );
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
