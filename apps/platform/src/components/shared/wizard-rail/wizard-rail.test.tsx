import { faker } from '@faker-js/faker';
import { ARIA_CURRENT } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';

import { WizardRail } from './wizard-rail';

faker.seed(5995);

const mockStep = () => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
});

const MOCK_STEPS = [mockStep(), mockStep(), mockStep()];
const MOCK_ARIA_LABEL = faker.lorem.words(2);

const setup = customRender(WizardRail, {
  steps: MOCK_STEPS,
  activeIndex: 1,
  ariaLabel: MOCK_ARIA_LABEL,
});

describe(`<${WizardRail.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it.each(MOCK_STEPS)('renders the $title step and its description', (step) => {
    const title = screen.getByText(step.title);
    const description = screen.getByText(step.description);

    expect(title).toBeVisible();
    expect(description).toBeVisible();
  });

  it('marks only the active step as the current step', () => {
    const [firstItem, activeItem, lastItem] = screen.getAllByRole('listitem');

    expect(activeItem).toHaveAttribute(ARIA_CURRENT, 'step');
    expect(firstItem).not.toHaveAttribute(ARIA_CURRENT);
    expect(lastItem).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('names the step list with the given label', () => {
    const list = screen.getByRole('list', { name: MOCK_ARIA_LABEL });

    expect(list).toBeVisible();
  });

  it('is a list, not a navigation landmark', () => {
    const navigation = screen.queryByRole('navigation');

    expect(navigation).not.toBeInTheDocument();
  });
});
