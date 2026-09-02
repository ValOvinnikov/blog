import { FONT_CHOICE } from '@blog/config';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FontPicker } from './font-picker';

describe(FontPicker, () => {
  it('renders every closed-set font option by its real name', () => {
    render(
      <FontPicker
        ariaLabel="Heading font"
        value={FONT_CHOICE.SPACE_GROTESK}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Space Grotesk')).toBeVisible();
    expect(screen.getByText('Newsreader')).toBeVisible();
    expect(screen.getByText('JetBrains Mono')).toBeVisible();
    expect(screen.getByText('Fraunces')).toBeVisible();
    expect(screen.getByText('Inter')).toBeVisible();
  });

  it("renders each option's name styled in its own resolved font family", () => {
    render(
      <FontPicker
        ariaLabel="Heading font"
        value={FONT_CHOICE.FRAUNCES}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Fraunces')).toHaveStyle({
      fontFamily: 'mock-fraunces-font-family',
    });
  });

  it('reports the newly picked font on click', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <FontPicker
        ariaLabel="Body font"
        value={FONT_CHOICE.NEWSREADER}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByText('Inter'));

    expect(handleChange).toHaveBeenCalledWith(FONT_CHOICE.INTER);
  });

  it('disables every option and stops reporting clicks when isDisabled is true', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <FontPicker
        ariaLabel="Body font"
        value={FONT_CHOICE.NEWSREADER}
        onChange={handleChange}
        isDisabled={true}
        aria-describedby="archived-notice"
      />,
    );

    const inter = screen.getByRole('radio', { name: 'Inter' });
    expect(inter).toHaveAttribute('aria-disabled', 'true');
    expect(inter.closest('[role="radiogroup"]')).toHaveAttribute(
      'aria-describedby',
      'archived-notice',
    );

    await user.click(screen.getByText('Inter'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
