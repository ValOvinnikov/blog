import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import { Disclosure } from './disclosure';

faker.seed(5995);

const ARIA_EXPANDED = 'aria-expanded';

const MOCK_SUMMARY = faker.lorem.word();
const MOCK_BODY = faker.lorem.sentence();
const MOCK_SUMMARY_TAIL = faker.lorem.word();

const setup = customRender(Disclosure, {
  summary: MOCK_SUMMARY,
  children: <p>{MOCK_BODY}</p>,
});

const ControlledDisclosure = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Disclosure summary={MOCK_SUMMARY} isOpen={isOpen} onOpenChange={setIsOpen}>
      <p>{MOCK_BODY}</p>
    </Disclosure>
  );
};

describe(`<${Disclosure.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the summary as a collapsed button and hides the content', () => {
    setup();

    const trigger = screen.getByRole('button', { name: MOCK_SUMMARY });
    const body = screen.getByText(MOCK_BODY);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(body).not.toBeVisible();
  });

  it('renders the trigger inside a heading of the given level', () => {
    setup({ headingLevel: 2 });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_SUMMARY,
    });

    expect(heading).toBeVisible();
  });

  it('toggles from inside its heading', async () => {
    setup({ headingLevel: 3 });

    const trigger = screen.getByRole('button', { name: MOCK_SUMMARY });
    await user.click(trigger);

    const body = screen.getByText(MOCK_BODY);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(body).toBeVisible();
  });

  it('renders no heading without a heading level', () => {
    setup();

    const heading = screen.queryByRole('heading');

    expect(heading).not.toBeInTheDocument();
  });

  it('toggles open and closed on click', async () => {
    setup();

    const trigger = screen.getByRole('button', { name: MOCK_SUMMARY });
    const body = screen.getByText(MOCK_BODY);

    await user.click(trigger);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(body).toBeVisible();

    await user.click(trigger);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(body).not.toBeVisible();
  });

  it.each(['{Enter}', ' '])('toggles with the %s key', async (key) => {
    setup();

    await user.tab();
    const trigger = screen.getByRole('button', { name: MOCK_SUMMARY });

    expect(trigger).toHaveFocus();

    await user.keyboard(key);
    const body = screen.getByText(MOCK_BODY);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(body).toBeVisible();
  });

  it('renders the trigger with no content', () => {
    setup({ children: null });

    const trigger = screen.getByRole('button', { name: MOCK_SUMMARY });

    expect(trigger).toBeVisible();
  });

  it('renders a non-text summary', () => {
    setup({
      summary: (
        <span>
          {MOCK_SUMMARY} <span>{MOCK_SUMMARY_TAIL}</span>
        </span>
      ),
    });

    const summaryTail = screen.getByText(MOCK_SUMMARY_TAIL);

    expect(summaryTail).toBeVisible();
  });

  describe('controlled', () => {
    it.each([
      [false, 'false'],
      [true, 'true'],
    ])('reflects an open state of %s', (isOpen, expanded) => {
      setup({ isOpen, onOpenChange: vi.fn() });

      const trigger = screen.getByRole('button', { name: MOCK_SUMMARY });

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, expanded);
    });

    it('reports the next open state without opening on its own', async () => {
      const onOpenChange = vi.fn();
      setup({ isOpen: false, onOpenChange });

      const trigger = screen.getByRole('button', { name: MOCK_SUMMARY });
      await user.click(trigger);

      const body = screen.getByText(MOCK_BODY);

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(body).not.toBeVisible();
    });

    it('opens when the caller feeds the reported state back in', async () => {
      renderWithIntl(<ControlledDisclosure />);

      const trigger = screen.getByRole('button', { name: MOCK_SUMMARY });
      await user.click(trigger);

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });
});
