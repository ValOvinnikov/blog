import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { Accordion } from './accordion';

faker.seed(123);

const firstItem = {
  label: faker.lorem.sentence(),
  content: faker.lorem.paragraph(),
};
const secondItem = {
  label: faker.lorem.sentence(),
  content: faker.lorem.paragraph(),
};
const thirdItem = {
  label: faker.lorem.sentence(),
  content: faker.lorem.paragraph(),
};
const items = [firstItem, secondItem, thirdItem];

const renderAccordion = () =>
  renderElement(
    <Accordion>
      {items.map((item) => (
        <Accordion.Item key={item.label}>
          <Accordion.Trigger>{item.label}</Accordion.Trigger>
          <Accordion.Panel>{item.content}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>,
  );

describe(`<${Accordion.name}/>`, () => {
  it('renders each trigger as a button inside a level-3 heading', () => {
    renderAccordion();

    const heading = screen.getByRole('heading', {
      level: 3,
      name: firstItem.label,
    });
    const button = screen.getByRole('button', { name: firstItem.label });
    expect(button).toBeVisible();
    expect(heading).toContainElement(button);
  });

  it('opens the panel and flips aria-expanded when its trigger is activated', async () => {
    const user = userEvent.setup();
    renderAccordion();

    const trigger = screen.getByRole('button', { name: firstItem.label });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(firstItem.content)).toBeVisible();
  });

  it('leaves an already-open item open when a second item is opened', async () => {
    const user = userEvent.setup();
    renderAccordion();

    const firstTrigger = screen.getByRole('button', { name: firstItem.label });
    const secondTrigger = screen.getByRole('button', {
      name: secondItem.label,
    });

    await user.click(firstTrigger);
    await user.click(secondTrigger);

    expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(firstItem.content)).toBeVisible();
    expect(screen.getByText(secondItem.content)).toBeVisible();
  });
});
