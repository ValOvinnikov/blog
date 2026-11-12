import { EMAIL_REPUTATION_LEVEL } from '@blog/db/constants';

import { emailReputationLevel } from './email-reputation-level';

describe(emailReputationLevel, () => {
  it.each([
    [0.0199, 0, EMAIL_REPUTATION_LEVEL.OK],
    [0.02, 0, EMAIL_REPUTATION_LEVEL.WARN],
    [0.03, 0, EMAIL_REPUTATION_LEVEL.SLOW],
    [0.04, 0, EMAIL_REPUTATION_LEVEL.STOP],
    [0, 0.000499, EMAIL_REPUTATION_LEVEL.OK],
    [0, 0.0005, EMAIL_REPUTATION_LEVEL.WARN],
    [0, 0.0008, EMAIL_REPUTATION_LEVEL.SLOW],
    [0, 0.001, EMAIL_REPUTATION_LEVEL.STOP],
    [0.02, 0.001, EMAIL_REPUTATION_LEVEL.STOP],
  ])(
    'maps a %d bounce rate and %d complaint rate to %s',
    (bounceRate, complaintRate, level) => {
      expect(
        emailReputationLevel({ resolvedCount: 20, bounceRate, complaintRate }),
      ).toBe(level);
    },
  );

  it('stays OK until 20 emails have an outcome, however high the rates', () => {
    expect(
      emailReputationLevel({
        resolvedCount: 19,
        bounceRate: 1,
        complaintRate: 1,
      }),
    ).toBe(EMAIL_REPUTATION_LEVEL.OK);
  });
});
