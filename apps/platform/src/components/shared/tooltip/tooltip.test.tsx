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

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows its label at once when the trigger receives keyboard focus', async () => {
    renderTooltip();

    await user.tab();
    const tooltip = screen.getByText(MOCK_LABEL);

    expect(tooltip).toBeInTheDocument();
  });

  it('shows its label after hovering the trigger', async () => {
    renderTooltip();
    const trigger = screen.getByRole('button', { name: MOCK_LABEL });

    await user.hover(trigger);
    const tooltip = await screen.findByText(MOCK_LABEL, {}, HOVER_TIMEOUT);

    expect(tooltip).toBeInTheDocument();
  });

  it('leaves the trigger its own name as the only announcement', async () => {
    renderTooltip();

    await user.tab();
    const tooltip = await screen.findByText(MOCK_LABEL);
    const trigger = screen.getByRole('button', { name: MOCK_LABEL });

    expect(tooltip).toHaveAttribute(ARIA_HIDDEN, 'true');
    expect(trigger).not.toHaveAccessibleDescription();
  });

  it('closes on Escape', async () => {
    renderTooltip();
    await user.tab();
    await screen.findByText(MOCK_LABEL);

    await user.keyboard('{Escape}');

    await expectTooltipClosed();
  });

  it('closes when the trigger loses focus', async () => {
    renderTooltip();
    await user.tab();
    await screen.findByText(MOCK_LABEL);

    await user.tab();

    await expectTooltipClosed();
  });

  it('closes when the trigger is activated', async () => {
    renderTooltip();
    await user.tab();
    await screen.findByText(MOCK_LABEL);

    await user.keyboard('{Enter}');

    await expectTooltipClosed();
  });

  it('closes when the pointer leaves the trigger', async () => {
    renderTooltip();
    const trigger = screen.getByRole('button', { name: MOCK_LABEL });
    await user.hover(trigger);
    await screen.findByText(MOCK_LABEL, {}, HOVER_TIMEOUT);

    await user.unhover(trigger);

    await expectTooltipClosed();
  });
});
