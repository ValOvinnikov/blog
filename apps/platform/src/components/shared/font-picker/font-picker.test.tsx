import { FONT_CHOICE } from '@blog/config';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FontPicker } from './font-picker';

describe(FontPicker, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the current font on the trigger, set in its own font family', () => {
    render(
      <FontPicker
        ariaLabel="Heading font"
        value={FONT_CHOICE.FRAUNCES}
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: 'Heading font' });
    expect(trigger).toHaveTextContent('Fraunces');
    expect(screen.getByText('Fraunces')).toHaveStyle({
      fontFamily: 'mock-fraunces-font-family',
    });
  });

  it('lists every closed-set font by its real name, each in its own font family, marking the current one', async () => {
    render(
      <FontPicker
        ariaLabel="Heading font"
        value={FONT_CHOICE.SPACE_GROTESK}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Heading font' }));

    expect(
      await screen.findByRole('option', { name: 'Space Grotesk' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Newsreader' })).toBeVisible();
    expect(
      screen.getByRole('option', { name: 'JetBrains Mono' }),
    ).toBeVisible();
    expect(screen.getByRole('option', { name: 'Inter' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Fraunces' })).toHaveTextContent(
      'Fraunces',
    );
    expect(
      screen.getByText('Fraunces', { selector: '[role="option"] *' }),
    ).toHaveStyle({ fontFamily: 'mock-fraunces-font-family' });
  });

  it('reports the font chosen from the list, and the trigger then shows it', async () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <FontPicker
        ariaLabel="Body font"
        value={FONT_CHOICE.NEWSREADER}
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Body font' }));
    await user.click(await screen.findByRole('option', { name: 'Inter' }));

    expect(handleChange).toHaveBeenCalledWith(FONT_CHOICE.INTER);

    rerender(
      <FontPicker
        ariaLabel="Body font"
        value={FONT_CHOICE.INTER}
        onChange={handleChange}
      />,
    );

    expect(
      screen.getByRole('combobox', { name: 'Body font' }),
    ).toHaveTextContent('Inter');
  });

  it('picks a font with the arrow keys and Enter', async () => {
    const handleChange = vi.fn();
    render(
      <FontPicker
        ariaLabel="Body font"
        value={FONT_CHOICE.SPACE_GROTESK}
        onChange={handleChange}
      />,
    );

    screen.getByRole('combobox', { name: 'Body font' }).focus();
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(handleChange).toHaveBeenCalledWith(FONT_CHOICE.NEWSREADER);
  });

  it('is disabled and described by the given notice when isDisabled is true', async () => {
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

    const trigger = screen.getByRole('combobox', { name: 'Body font' });
    expect(trigger).toHaveAttribute('aria-describedby', 'archived-notice');

    await user.click(trigger);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
