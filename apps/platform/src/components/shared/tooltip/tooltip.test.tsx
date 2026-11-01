import { faker } from '@faker-js/faker';
import { ARIA_HIDDEN } from '@platform/testing/aria';
import { render, screen, waitFor } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Tooltip } from './tooltip';

faker.seed(6370);

const MOCK_LABEL = faker.lorem.words(2);
const HOVER_TIMEOUT = { timeout: 2000 };

const renderTooltip = () =>
  render(
    <>
      <Tooltip
        label={MOCK_LABEL}
        trigger={<button type="button" aria-label={MOCK_LABEL} />}
      />
      <button type="button">{faker.lorem.word()}</button>
    </>,
  );

const expectTooltipClosed = () =>
  waitFor(() => {
    const tooltip = screen.queryByText(MOCK_LABEL);

    expect(tooltip).not.toBeInTheDocument();
  });

describe(`<${Tooltip.name}/>`, () => {
  let user: UserEvent;
  let trigger: HTMLElement;

  beforeEach(() => {
    user = userEvent.setup();
    renderTooltip();
    trigger = screen.getByRole('button', { name: MOCK_LABEL });
  });

  it('shows its label at once when the trigger receives keyboard focus', async () => {
    await user.tab();
    const tooltip = screen.getByText(MOCK_LABEL);

    expect(tooltip).toBeInTheDocument();
  });

  describe('once opened by keyboard focus', () => {
    beforeEach(async () => {
      await user.tab();
      await screen.findByText(MOCK_LABEL);
    });

    it('leaves the trigger its own name as the only announcement', () => {
      const tooltip = screen.getByText(MOCK_LABEL);

      expect(tooltip).toHaveAttribute(ARIA_HIDDEN, 'true');
      expect(trigger).not.toHaveAccessibleDescription();
    });

    it('closes on Escape', async () => {
      await user.keyboard('{Escape}');

      await expectTooltipClosed();
    });

    it('closes when the trigger loses focus', async () => {
      await user.tab();

      await expectTooltipClosed();
    });

    it('closes when the trigger is activated', async () => {
      await user.keyboard('{Enter}');

      await expectTooltipClosed();
    });
  });

  describe('once opened by hover', () => {
    beforeEach(async () => {
      await user.hover(trigger);
      await screen.findByText(MOCK_LABEL, {}, HOVER_TIMEOUT);
    });

    it('shows its label after the hover delay', () => {
      const tooltip = screen.getByText(MOCK_LABEL);

      expect(tooltip).toBeInTheDocument();
    });

    it('closes when the pointer leaves the trigger', async () => {
      await user.unhover(trigger);

      await expectTooltipClosed();
    });
  });
});
