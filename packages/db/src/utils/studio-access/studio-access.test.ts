import { STUDIO_ACCESS } from '@shinefold/config/constants';
import { OWNER_ACCESS_STALL_AFTER_MS } from '@shinefold/db/constants';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { MOCK_SANITY_USER_ID } from '@shinefold/db/testing/sanity-management-client/fixtures';

import { hasStudioInviteStalled, studioAccessOf } from './studio-access';

describe(studioAccessOf, () => {
  it('is ready once the invite is accepted and the Sanity user recorded', () => {
    expect(
      studioAccessOf(
        { inviteAcceptedAt: MOCK_NOW, sanityUserId: MOCK_SANITY_USER_ID },
        true,
      ),
    ).toBe(STUDIO_ACCESS.READY);
  });

  it.each([
    { inviteAcceptedAt: MOCK_NOW, sanityUserId: null },
    { inviteAcceptedAt: null, sanityUserId: MOCK_SANITY_USER_ID },
  ])(
    'is activating with only half of the acceptance recorded',
    (acceptance) => {
      expect(studioAccessOf(acceptance, true)).toBe(STUDIO_ACCESS.ACTIVATING);
    },
  );

  it('is stalled or sent before acceptance, by the stall check', () => {
    const pending = { inviteAcceptedAt: null, sanityUserId: null };

    expect(studioAccessOf(pending, true)).toBe(STUDIO_ACCESS.STALLED);
    expect(studioAccessOf(pending, false)).toBe(STUDIO_ACCESS.INVITE_SENT);
  });
});

describe(hasStudioInviteStalled, () => {
  it('stalls an invite once the stall window has passed', () => {
    const sentAt = new Date(MOCK_NOW.getTime() - OWNER_ACCESS_STALL_AFTER_MS);

    expect(hasStudioInviteStalled(sentAt, MOCK_NOW)).toBe(true);
  });

  it('keeps a recent invite, or none at all, from stalling', () => {
    const sentAt = new Date(
      MOCK_NOW.getTime() - OWNER_ACCESS_STALL_AFTER_MS + 1,
    );

    expect(hasStudioInviteStalled(sentAt, MOCK_NOW)).toBe(false);
    expect(hasStudioInviteStalled(null, MOCK_NOW)).toBe(false);
  });
});
