import { SITE_TYPE } from '@blog/config';
import { reachReview } from '@platform/testing/onboarding/address-step';
import {
  acceptAndCreate,
  changeSiteTypeFromReview,
  createAfterChangingSiteType,
  createSiteMock,
  MOCK_CREATE_SITE_INPUT,
  MOCK_EDITORIAL_LOOK,
  pickSiteType,
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

  it('creates the site type the user picks', async () => {
    await pickSiteType(user, SITE_TYPES.PORTFOLIO);
    await reachReview(user);
    await acceptAndCreate(user);

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      siteType: SITE_TYPE.PORTFOLIO,
    });
  });

  describe('on review', () => {
    beforeEach(async () => {
      await reachReview(user);
    });

    it('returns to the Editorial preset when switching back from Docs', async () => {
      await changeSiteTypeFromReview(user, SITE_TYPES.DOCS);
      await createAfterChangingSiteType(user, SITE_TYPES.PERSONAL);

      expect(createSiteMock).toHaveBeenCalledWith(
        expect.objectContaining(MOCK_EDITORIAL_LOOK),
      );
    });
  });
});
