import { DEPTH } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { SegmentedControl } from './segmented-control';

const options = [
  { value: DEPTH.SKIM, label: '30s' },
  { value: DEPTH.READ, label: 'Read' },
  { value: DEPTH.DEEP, label: 'Deep' },
];

const setup = customRender(SegmentedControl, {
  options,
  value: DEPTH.READ,
  onChange: vi.fn(),
  ariaLabel: 'Reading depth',
});

describe(`<${SegmentedControl.name}/>`, () => {
  it('renders a radiogroup with the given ariaLabel', () => {
    setup();
    expect(
      screen.getByRole('radiogroup', { name: 'Reading depth' }),
    ).toBeVisible();
  });

  it('renders one radio per option with its label', () => {
    setup();
    for (const option of options) {
      expect(screen.getByRole('radio', { name: option.label })).toBeVisible();
    }
  });

  it('marks the option matching value as checked, and the rest as unchecked', () => {
    setup();
    expect(screen.getByRole('radio', { name: 'Read' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: '30s' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('radio', { name: 'Deep' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('only the checked option is in the tab order', () => {
    setup();
    expect(screen.getByRole('radio', { name: 'Read' })).toHaveAttribute(
      'tabIndex',
      '0',
    );
    expect(screen.getByRole('radio', { name: '30s' })).toHaveAttribute(
      'tabIndex',
      '-1',
    );
  });

  it('calls onChange with the clicked option value', async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.click(screen.getByRole('radio', { name: 'Deep' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(DEPTH.DEEP);
  });

  it('does not manage its own state — re-checks only after value is updated by the caller', async () => {
    const onChange = vi.fn();
    const { rerender } = setup({ onChange });
    await userEvent.click(screen.getByRole('radio', { name: 'Deep' }));
    expect(screen.getByRole('radio', { name: 'Deep' })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    rerender(
      <SegmentedControl
        options={options}
        value={DEPTH.DEEP}
        onChange={onChange}
        ariaLabel="Reading depth"
      />,
    );
    expect(screen.getByRole('radio', { name: 'Deep' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('moves focus and selection to the next option on ArrowRight, wrapping from the last option to the first', async () => {
    const onChange = vi.fn();
    setup({ onChange, value: DEPTH.DEEP });
    screen.getByRole('radio', { name: 'Deep' }).focus();

    await userEvent.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith(DEPTH.SKIM);
    expect(screen.getByRole('radio', { name: '30s' })).toHaveFocus();
  });

  it('moves focus and selection to the previous option on ArrowLeft, wrapping from the first option to the last', async () => {
    const onChange = vi.fn();
    setup({ onChange, value: DEPTH.SKIM });
    screen.getByRole('radio', { name: '30s' }).focus();

    await userEvent.keyboard('{ArrowLeft}');

    expect(onChange).toHaveBeenCalledWith(DEPTH.DEEP);
    expect(screen.getByRole('radio', { name: 'Deep' })).toHaveFocus();
  });

  it('treats ArrowDown the same as ArrowRight, and ArrowUp the same as ArrowLeft', async () => {
    const onChange = vi.fn();
    const { rerender } = setup({ onChange, value: DEPTH.READ });
    screen.getByRole('radio', { name: 'Read' }).focus();

    await userEvent.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith(DEPTH.DEEP);
    expect(screen.getByRole('radio', { name: 'Deep' })).toHaveFocus();

    // Simulate the caller applying the change before the next key press —
    // a purely controlled component re-derives currentIndex from `value`.
    rerender(
      <SegmentedControl
        options={options}
        value={DEPTH.DEEP}
        onChange={onChange}
        ariaLabel="Reading depth"
      />,
    );
    screen.getByRole('radio', { name: 'Deep' }).focus();

    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(DEPTH.READ);
    expect(screen.getByRole('radio', { name: 'Read' })).toHaveFocus();
  });

  it('ignores non-navigation keys', async () => {
    const onChange = vi.fn();
    setup({ onChange, value: DEPTH.READ });
    screen.getByRole('radio', { name: 'Read' }).focus();

    await userEvent.keyboard('a');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'segmented-control' });
    expect(screen.getByTestId('segmented-control')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    setup({ className: 'custom-class' });
    expect(screen.getByRole('radiogroup')).toHaveClass('custom-class');
  });

  it('is not disabled by default', () => {
    setup();
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    for (const option of options) {
      expect(screen.getByRole('radio', { name: option.label })).toBeEnabled();
    }
  });

  it('marks the group and every option disabled when isDisabled is true', () => {
    setup({ isDisabled: true });
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    for (const option of options) {
      expect(screen.getByRole('radio', { name: option.label })).toBeDisabled();
    }
  });

  it('does not call onChange on click while disabled', async () => {
    const onChange = vi.fn();
    setup({ onChange, isDisabled: true });
    await userEvent.click(screen.getByRole('radio', { name: 'Deep' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange on arrow-key navigation while disabled', async () => {
    const onChange = vi.fn();
    setup({ onChange, isDisabled: true, value: DEPTH.READ });
    screen.getByRole('radio', { name: 'Read' }).focus();

    await userEvent.keyboard('{ArrowRight}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('still shows the current value as checked while disabled', () => {
    setup({ isDisabled: true, value: DEPTH.DEEP });
    expect(screen.getByRole('radio', { name: 'Deep' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('associates an external description via aria-describedby', () => {
    setup({ isDisabled: true, 'aria-describedby': 'plan-lock-reason' });
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-describedby',
      'plan-lock-reason',
    );
  });
});
