import { PRESET_ID } from '@blog/config';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import { ARIA_VALUENOW } from '@platform/testing/aria';
import { screen } from '@platform/testing/custom-render';
import {
  ACCENT_LABEL,
  acceptAndCreate,
  clickContinue,
  completeAddressStep,
  completeSiteStep,
  CONSOLE_PRESET,
  createAfterChangingSiteType,
  createSiteMock,
  MOCK_CONSOLE_LOOK,
  MOCK_CONTINUE,
  MOCK_CREATE,
  MOCK_CREATE_SITE_INPUT,
  MOCK_EDITORIAL_LOOK,
  setup,
  SITE_TYPES,
} from '@platform/testing/onboarding/onboarding-view';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action');

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action');

const MOCK_ACCENT_SLIDER = { name: ACCENT_LABEL };

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  describe('on the address step', () => {
    beforeEach(async () => {
      await completeSiteStep(user);
    });

    describe('on the look step', () => {
      beforeEach(async () => {
        await completeAddressStep(user);
      });

      it('replaces Continue with a separate Create site button on reaching review', async () => {
        const continueButton = screen.getByRole('button', MOCK_CONTINUE);
        await user.click(continueButton);

        const createButton = screen.getByRole('button', MOCK_CREATE);

        expect(createButton).toBeVisible();
        expect(continueButton).not.toBeInTheDocument();
      });

      it('restyles the preview for the preset the user picks', async () => {
        const before = screen
          .getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID)
          .getAttribute('style');
        const consolePreset = screen.getByRole('radio', {
          name: CONSOLE_PRESET,
        });
        await user.click(consolePreset);
        const after = screen
          .getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID)
          .getAttribute('style');

        expect(after).not.toBe(before);
      });

      it('keeps the accent the user moved when the site type changes', async () => {
        const accentSlider = screen.getByRole('slider', MOCK_ACCENT_SLIDER);
        await user.click(accentSlider);
        await user.keyboard('{ArrowRight}');
        const movedHue = Number(accentSlider.getAttribute(ARIA_VALUENOW));
        await clickContinue(user);
        await createAfterChangingSiteType(user, SITE_TYPES.DOCS);

        expect(movedHue).not.toBe(MOCK_EDITORIAL_LOOK.accentHue);
        expect(createSiteMock).toHaveBeenCalledWith(
          expect.objectContaining({
            preset: PRESET_ID.EDITORIAL,
            accentHue: movedHue,
          }),
        );
      });

      describe('with Console picked', () => {
        beforeEach(async () => {
          const consolePreset = screen.getByRole('radio', {
            name: CONSOLE_PRESET,
          });
          await user.click(consolePreset);
          await clickContinue(user);
        });

        it('starts from the accent of the preset the user picks', async () => {
          await acceptAndCreate(user);

          expect(createSiteMock).toHaveBeenCalledWith({
            ...MOCK_CREATE_SITE_INPUT,
            ...MOCK_CONSOLE_LOOK,
          });
        });

        it('keeps the preset the user picked when the site type changes', async () => {
          await createAfterChangingSiteType(user, SITE_TYPES.PORTFOLIO);

          expect(createSiteMock).toHaveBeenCalledWith(
            expect.objectContaining(MOCK_CONSOLE_LOOK),
          );
        });
      });
    });
  });
});
