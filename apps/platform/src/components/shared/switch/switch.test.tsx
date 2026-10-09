import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Switch } from './switch';

describe(Switch, () => {
  it('names the switch by its aria label, not by the visible state text', () => {
    render(
      <Switch
        isChecked={true}
        onCheckedChange={vi.fn()}
        ariaLabel="Bookmarks"
        labels={{ on: 'Activée', off: 'Désactivée' }}
      />,
    );

    expect(screen.getByRole('switch', { name: 'Bookmarks' })).toBeChecked();
  });

  it('toggles when its state text is clicked', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        isChecked={false}
        onCheckedChange={onCheckedChange}
        ariaLabel="Bookmarks"
        labels={{ on: 'On', off: 'Off' }}
      />,
    );

    await userEvent.click(screen.getByText('Off'));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('toggles when its caption is clicked', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        isChecked={true}
        onCheckedChange={onCheckedChange}
        ariaLabel="Dry run"
        labels={{ caption: 'Dry run' }}
      />,
    );

    await userEvent.click(screen.getByText('Dry run'));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('toggles once when the track itself is clicked', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        isChecked={false}
        onCheckedChange={onCheckedChange}
        ariaLabel="Dry run"
        labels={{ caption: 'Dry run' }}
      />,
    );

    await userEvent.click(screen.getByRole('switch', { name: 'Dry run' }));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks on its caption while disabled', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        isChecked={false}
        onCheckedChange={onCheckedChange}
        ariaLabel="Dry run"
        labels={{ caption: 'Dry run' }}
        isDisabled={true}
      />,
    );

    await userEvent.click(screen.getByText('Dry run'));

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('switch', { name: 'Dry run' })).toBeDisabled();
  });
});
