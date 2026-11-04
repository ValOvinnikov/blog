import {
  createAfterChangingSiteType,
  createSiteMock,
  MOCK_CONSOLE_LOOK,
  reachReview,
  setup,
  SITE_TYPES,
} from '@platform/testing/onboarding/onboarding-view';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  describe('on review', () => {
    beforeEach(async () => {
      await reachReview(user);
    });

    it.each([SITE_TYPES.DOCS, SITE_TYPES.BLANK])(
      'starts a %s site on the Console preset',
      async (siteType) => {
        await createAfterChangingSiteType(user, siteType);

        expect(createSiteMock).toHaveBeenCalledWith(
          expect.objectContaining(MOCK_CONSOLE_LOOK),
        );
      },
    );
  });
});
