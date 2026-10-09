import { customRender, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { FieldStatus } from './field-status';

const setup = customRender(FieldStatus, {
  isCustomised: false,
  isUnsaved: false,
});

describe(`<${FieldStatus.name}/>`, () => {
  it('shows a default field with no unsaved mark and no reset', () => {
    setup({ onReset: vi.fn() });

    expect(screen.getByText('Default')).toBeVisible();
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reset' }),
    ).not.toBeInTheDocument();
  });

  it('announces an unsaved field', () => {
    setup({ isUnsaved: true });

    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('resets a customised field', async () => {
    const onReset = vi.fn();
    setup({ isCustomised: true, onReset });

    expect(screen.getByText('Customised')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onReset).toHaveBeenCalledOnce();
  });

  it('offers no reset when the field cannot be reset', () => {
    setup({ isCustomised: true });

    expect(
      screen.queryByRole('button', { name: 'Reset' }),
    ).not.toBeInTheDocument();
  });
});
