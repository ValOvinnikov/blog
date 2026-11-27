import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import {
  completeAddressStep,
  reachReview,
} from '@platform/testing/onboarding/address-step';
import {
  ACCENT_LABEL,
  clickBack,
  clickContinue,
  completeSiteStep,
  editFromReview,
  MOCK_CONTINUE,
  setup,
  stepHeading,
  STEPS,
} from '@platform/testing/onboarding/onboarding-view';
import { isAccentHueAccessible } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

vi.mock('@shinefold/config', async () =>
  (await import('@platform/testing/accent-hue-guard')).mockAccentHueGuard(),
);

const MOCK_ACCENT_SLIDER = { name: ACCENT_LABEL };
const {
  presetLabel: PRESET_LABEL,
  fieldErrors: { accentHueInaccessible: ACCENT_HUE_INACCESSIBLE },
} = messages.onboardingForm;

describe(`<${OnboardingView.name}/> with a refused accent hue`, () => {
  let user: UserEvent;

  const refuseAndMoveAccent = async () => {
    vi.mocked(isAccentHueAccessible).mockReturnValue(false);
    const slider = screen.getByRole('slider', MOCK_ACCENT_SLIDER);
    await user.click(slider);
    await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);
    return slider;
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(isAccentHueAccessible).mockReturnValue(true);
    setup();
  });

  describe('on the look step', () => {
    let slider: HTMLElement;

    beforeEach(async () => {
      await completeSiteStep(user);
      await completeAddressStep(user);
      slider = await refuseAndMoveAccent();
    });

    it('describes the accent slider with the unreadable-hue error', () => {
      expect(slider).toHaveAccessibleDescription(ACCENT_HUE_INACCESSIBLE);
    });

    it('keeps Continue disabled and stays on the look step', async () => {
      await clickContinue(user);

      const continueButton = screen.getByRole('button', MOCK_CONTINUE);
      const heading = stepHeading(STEPS.LOOK);

      expect(continueButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      expect(heading).toBeVisible();
    });
  });

  it('sends Continue from an earlier step back to the look step, not to review', async () => {
    await reachReview(user);
    await editFromReview(user, PRESET_LABEL);
    await refuseAndMoveAccent();
    await clickBack(user);
    await clickContinue(user);

    const heading = stepHeading(STEPS.LOOK);

    expect(heading).toBeVisible();
  });
});
