import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { RunErrorCard } from './run-error-card';

faker.seed(5994);

const MOCK_HEADLINE = faker.lorem.sentence();
const MOCK_BODY = faker.lorem.sentence();
const MOCK_NEXT_STEP = faker.lorem.sentence();
const MOCK_FAILED_STEP_LINE = faker.lorem.sentence();
const MOCK_TECHNICAL_DETAILS = faker.lorem.sentence();
const TECHNICAL_DETAILS_LABEL = 'Technical details';

const setup = customRender(RunErrorCard, {
  headline: MOCK_HEADLINE,
  body: MOCK_BODY,
  nextStep: MOCK_NEXT_STEP,
  technicalDetailsLabel: TECHNICAL_DETAILS_LABEL,
});

describe(`<${RunErrorCard.name}/>`, () => {
  it('announces the error with its headline as the card heading', () => {
    setup({ headingLevel: 3 });

    const alert = screen.getByRole('alert');
    const heading = screen.getByRole('heading', {
      level: 3,
      name: MOCK_HEADLINE,
    });
    const body = screen.getByText(MOCK_BODY);
    const nextStep = screen.getByText(MOCK_NEXT_STEP);

    expect(alert).toBeVisible();
    expect(heading).toBeVisible();
    expect(body).toBeVisible();
    expect(nextStep).toBeVisible();
  });

  it('names the failed step when one is given', () => {
    setup({ failedStepLine: MOCK_FAILED_STEP_LINE });

    const failedStep = screen.getByText(MOCK_FAILED_STEP_LINE);

    expect(failedStep).toBeVisible();
  });

  it('offers no technical details when there are none', () => {
    setup();

    const toggle = screen.queryByText(TECHNICAL_DETAILS_LABEL);

    expect(toggle).not.toBeInTheDocument();
  });

  it('offers the technical details when there are some', () => {
    setup({ technicalDetails: MOCK_TECHNICAL_DETAILS });

    const toggle = screen.getByText(TECHNICAL_DETAILS_LABEL);

    expect(toggle).toBeVisible();
  });
});
