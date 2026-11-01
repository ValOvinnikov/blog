import { faker } from '@faker-js/faker';
import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_CURRENT } from '@platform/testing/aria';
import { customRender, screen, within } from '@platform/testing/custom-render';

import { OnboardingRail } from './onboarding-rail';

faker.seed(6328);

const {
  steps: STEPS,
  stepsAriaLabel: STEPS_ARIA_LABEL,
  stepComplete: STEP_COMPLETE,
} = messages.onboardingForm;
const MOCK_SITE_SUMMARY = faker.lorem.words(3);

const MOCK_STEPS = Object.values(ONBOARDING_STEP).map((id) => ({
  id,
  label: STEPS[id],
  summary: id === ONBOARDING_STEP.SITE ? MOCK_SITE_SUMMARY : undefined,
}));

const setup = customRender(OnboardingRail, {
  steps: MOCK_STEPS,
  currentIndex: 1,
  accountEmail: undefined,
});

const getRows = () =>
  within(screen.getByRole('list', { name: STEPS_ARIA_LABEL })).getAllByRole(
    'listitem',
  );

describe(`<${OnboardingRail.name}/>`, () => {
  describe('past the first step', () => {
    beforeEach(() => {
      setup();
    });

    it('lists the steps as a named list with no navigation landmark', () => {
      const list = screen.getByRole('list', { name: STEPS_ARIA_LABEL });
      const navigation = screen.queryByRole('navigation');

      expect(list).toBeInTheDocument();
      expect(navigation).not.toBeInTheDocument();
    });

    it('announces a done step as complete, then its summary', () => {
      const [doneRow] = getRows();

      expect(doneRow).toHaveTextContent(
        `${STEPS.SITE}${STEP_COMPLETE}${MOCK_SITE_SUMMARY}`,
      );
    });

    it('marks only the current step as the current one', () => {
      const rows = getRows();
      const currentRows = rows.filter((row) => row.hasAttribute(ARIA_CURRENT));

      expect(currentRows).toEqual([rows[1]]);
      expect(rows[1]).toHaveAttribute(ARIA_CURRENT, 'step');
    });
  });

  describe('on the first step', () => {
    beforeEach(() => {
      setup({ currentIndex: 0 });
    });

    it('does not call any step complete', () => {
      const complete = screen.queryByText(STEP_COMPLETE);

      expect(complete).not.toBeInTheDocument();
    });
  });
});
