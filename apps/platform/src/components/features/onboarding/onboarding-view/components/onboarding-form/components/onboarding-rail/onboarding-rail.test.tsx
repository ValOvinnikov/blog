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

describe(`<${OnboardingRail.name}/>`, () => {
  it('lists the steps as a named list with no navigation landmark', () => {
    setup();

    const list = screen.getByRole('list', { name: STEPS_ARIA_LABEL });
    const navigation = screen.queryByRole('navigation');

    expect(list).toBeInTheDocument();
    expect(navigation).not.toBeInTheDocument();
  });

  it('announces a done step as complete, then its summary', () => {
    setup();

    const [doneRow] = within(
      screen.getByRole('list', { name: STEPS_ARIA_LABEL }),
    ).getAllByRole('listitem');

    expect(doneRow).toHaveTextContent(
      `${STEPS.SITE}${STEP_COMPLETE}${MOCK_SITE_SUMMARY}`,
    );
  });

  it('marks only the current step as the current one', () => {
    setup();

    const rows = within(
      screen.getByRole('list', { name: STEPS_ARIA_LABEL }),
    ).getAllByRole('listitem');
    const currentRows = rows.filter((row) => row.hasAttribute(ARIA_CURRENT));

    expect(currentRows).toEqual([rows[1]]);
    expect(rows[1]).toHaveAttribute(ARIA_CURRENT, 'step');
  });

  it('does not call a step complete before it is done', () => {
    setup({ currentIndex: 0 });

    const complete = screen.queryByText(STEP_COMPLETE);

    expect(complete).not.toBeInTheDocument();
  });
});
