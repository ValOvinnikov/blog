import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Accordion } from './accordion';

faker.seed(123);

const ARIA_EXPANDED = 'aria-expanded';

const MOCK_FIRST_ITEM = {
  label: faker.lorem.sentence(),
  content: faker.lorem.paragraph(),
};
const MOCK_SECOND_ITEM = {
  label: faker.lorem.sentence(),
  content: faker.lorem.paragraph(),
};
const MOCK_THIRD_ITEM = {
  label: faker.lorem.sentence(),
  content: faker.lorem.paragraph(),
};
const MOCK_ITEMS = [MOCK_FIRST_ITEM, MOCK_SECOND_ITEM, MOCK_THIRD_ITEM];

const renderAccordion = () =>
  renderElement(
    <Accordion>
      {MOCK_ITEMS.map((item) => (
        <Accordion.Item key={item.label}>
          <Accordion.Trigger>{item.label}</Accordion.Trigger>
          <Accordion.Panel>{item.content}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>,
  );

describe(`<${Accordion.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    renderAccordion();
  });

  it('renders each trigger as a button inside a level-3 heading', () => {
    const heading = screen.getByRole('heading', {
      level: 3,
      name: MOCK_FIRST_ITEM.label,
    });
    const button = screen.getByRole('button', { name: MOCK_FIRST_ITEM.label });
    expect(button).toBeVisible();
    expect(heading).toContainElement(button);
  });

  it('opens the panel and flips aria-expanded when its trigger is activated', async () => {
    const trigger = screen.getByRole('button', { name: MOCK_FIRST_ITEM.label });
    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');

    await user.click(trigger);

    const panel = screen.getByText(MOCK_FIRST_ITEM.content);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(panel).toBeVisible();
  });

  it('leaves an already-open item open when a second item is opened', async () => {
    const firstTrigger = screen.getByRole('button', {
      name: MOCK_FIRST_ITEM.label,
    });
    const secondTrigger = screen.getByRole('button', {
      name: MOCK_SECOND_ITEM.label,
    });

    await user.click(firstTrigger);
    await user.click(secondTrigger);

    const firstPanel = screen.getByText(MOCK_FIRST_ITEM.content);
    const secondPanel = screen.getByText(MOCK_SECOND_ITEM.content);

    expect(firstTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(secondTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(firstPanel).toBeVisible();
    expect(secondPanel).toBeVisible();
  });
});
