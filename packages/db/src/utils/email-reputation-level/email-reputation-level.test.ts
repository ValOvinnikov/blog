import {
  EMAIL_REPUTATION_LEVEL,
  EMAIL_REPUTATION_MIN_RESOLVED_COUNT,
  EMAIL_REPUTATION_THRESHOLDS,
} from '@blog/db/constants';

import { emailReputationLevel } from './email-reputation-level';

const EPSILON = 1e-9;
const { OK, WARN, SLOW, STOP } = EMAIL_REPUTATION_LEVEL;
const { bounceRate: BOUNCE, complaintRate: COMPLAINT } =
  EMAIL_REPUTATION_THRESHOLDS;

describe(emailReputationLevel, () => {
  it.each([
    [BOUNCE[WARN] - EPSILON, 0, OK],
    [BOUNCE[WARN], 0, WARN],
    [BOUNCE[SLOW] - EPSILON, 0, WARN],
    [BOUNCE[SLOW], 0, SLOW],
    [BOUNCE[STOP] - EPSILON, 0, SLOW],
    [BOUNCE[STOP], 0, STOP],
    [0, COMPLAINT[WARN] - EPSILON, OK],
    [0, COMPLAINT[WARN], WARN],
    [0, COMPLAINT[SLOW] - EPSILON, WARN],
    [0, COMPLAINT[SLOW], SLOW],
    [0, COMPLAINT[STOP] - EPSILON, SLOW],
    [0, COMPLAINT[STOP], STOP],
    [BOUNCE[WARN], COMPLAINT[STOP], STOP],
  ])(
    'maps a %d bounce rate and %d complaint rate to %s',
    (bounceRate, complaintRate, level) => {
      expect(
        emailReputationLevel({
          resolvedCount: EMAIL_REPUTATION_MIN_RESOLVED_COUNT,
          bounceRate,
          complaintRate,
        }),
      ).toBe(level);
    },
  );

  it('stays OK below the minimum resolved count, however high the rates', () => {
    expect(
      emailReputationLevel({
        resolvedCount: EMAIL_REPUTATION_MIN_RESOLVED_COUNT - 1,
        bounceRate: 1,
        complaintRate: 1,
      }),
    ).toBe(OK);
  });
});
