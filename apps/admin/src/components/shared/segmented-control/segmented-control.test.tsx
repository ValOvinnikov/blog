import { render, screen } from '@admin/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { SegmentedControl } from './segmented-control';

type TDensity = 'compact' | 'comfortable';

const options: { value: TDensity; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
];

describe(SegmentedControl, () => {
  it('renders a group with the given ariaLabel and one option per entry', () => {
    render(
      <SegmentedControl<TDensity>
        ariaLabel="Density"
        options={options}
        value="compact"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('group', { name: 'Density' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Compact' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Comfortable' })).toBeVisible();
  });

  it('marks the option matching value as pressed, and the rest as not pressed', () => {
    render(
      <SegmentedControl<TDensity>
        ariaLabel="Density"
        options={options}
        value="comfortable"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Comfortable' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Compact' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onChange with the clicked option value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl<TDensity>
        ariaLabel="Density"
        options={options}
        value="compact"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Comfortable' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('comfortable');
  });

  it('does not call onChange when clicking the already-selected option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl<TDensity>
        ariaLabel="Density"
        options={options}
        value="compact"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Compact' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not manage its own state — stays pressed only once value is updated by the caller', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <SegmentedControl<TDensity>
        ariaLabel="Density"
        options={options}
        value="compact"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Comfortable' }));
    expect(screen.getByRole('button', { name: 'Comfortable' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    rerender(
      <SegmentedControl<TDensity>
        ariaLabel="Density"
        options={options}
        value="comfortable"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Comfortable' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('marks the group and every option disabled when isDisabled is true', () => {
    render(
      <SegmentedControl<TDensity>
        ariaLabel="Density"
        options={options}
        value="compact"
        onChange={vi.fn()}
        isDisabled={true}
      />,
    );

    expect(screen.getByRole('group', { name: 'Density' })).toHaveAttribute(
      'data-disabled',
    );
    for (const option of options) {
      expect(screen.getByRole('button', { name: option.label })).toBeDisabled();
    }
  });

  it('does not call onChange on click while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl<TDensity>
        ariaLabel="Density"
        options={options}
        value="compact"
        onChange={onChange}
        isDisabled={true}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Comfortable' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a single option without throwing', () => {
    expect(() =>
      render(
        <SegmentedControl<TDensity>
          ariaLabel="Density"
          options={[options[0]!]}
          value="compact"
          onChange={vi.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it('renders no options without throwing', () => {
    expect(() =>
      render(
        <SegmentedControl<TDensity>
          ariaLabel="Density"
          options={[]}
          value="compact"
          onChange={vi.fn()}
        />,
      ),
    ).not.toThrow();

    expect(
      screen.getByRole('group', { name: 'Density' }),
    ).toBeEmptyDOMElement();
  });
});
