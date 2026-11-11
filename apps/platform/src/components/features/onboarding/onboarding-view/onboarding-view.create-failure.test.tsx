import { ACTION_OUTCOME } from '@blog/config';
import { ONBOARDING_SCROLL_AREA_TEST_ID } from '@platform/constants/onboarding';
import { SIGN_UP_REFUSAL } from '@platform/constants/sign-up';
import { screen } from '@platform/testing/custom-render';
import { reachReview } from '@platform/testing/onboarding/address-step';
import {
  acceptAndCreate,
  createSiteMock,
  FULL_TIER,
  FULL_TIER_TITLE,
  MOCK_ACCEPTANCE,
  MOCK_CREATE,
  MOCK_SITE_ADDRESS,
  RAIL_TIER,
  RAIL_TIER_TITLE,
  renderInTier,
  TRY_AGAIN_LATER,
} from '@platform/testing/onboarding/onboarding-view';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

const PHONE_TIER_TITLE = 'on a phone';

describe.each([
  [FULL_TIER_TITLE, FULL_TIER],
  [RAIL_TIER_TITLE, RAIL_TIER],
  [PHONE_TIER_TITLE, []],
])(`<${OnboardingView.name}/> refused Create site %s`, (_tier, queries) => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    createSiteMock.mockReset();
    createSiteMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
    });
    renderInTier(queries);
    await reachReview(user);
    await acceptAndCreate(user);
    await screen.findByRole('button', MOCK_CREATE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the failure once, just before Create site and outside the scrolled fields', () => {
    const failure = screen.getByRole('alert');
    const scrollArea = screen.getByTestId(ONBOARDING_SCROLL_AREA_TEST_ID);
    const createButton = screen.getByRole('button', MOCK_CREATE);

    expect(failure).toHaveTextContent(TRY_AGAIN_LATER);
    expect(scrollArea).not.toContainElement(failure);
    expect(failure.compareDocumentPosition(createButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('keeps what the user entered', () => {
    const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);
    const [address] = screen.getAllByText(MOCK_SITE_ADDRESS);

    expect(acceptance).toBeChecked();
    expect(address).toBeVisible();
  });
});
