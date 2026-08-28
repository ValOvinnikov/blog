import { PRESET_ID } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { PresetPicker } from './preset-picker';

const render = renderWithIntl;

describe(PresetPicker, () => {
  it('renders both presets and marks the current value selected', () => {
    render(<PresetPicker value={PRESET_ID.EDITORIAL} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Editorial' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: 'Console' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('reports the newly picked preset on click', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PresetPicker value={PRESET_ID.CONSOLE} onChange={handleChange} />);

    await user.click(screen.getByRole('radio', { name: 'Editorial' }));

    expect(handleChange).toHaveBeenCalledWith(PRESET_ID.EDITORIAL);
  });
});
