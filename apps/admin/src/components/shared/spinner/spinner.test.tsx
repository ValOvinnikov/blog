import { render, screen } from '@admin/testing/custom-render';
import { Size } from '@blog/config';

import { Spinner } from './spinner';

describe(Spinner, () => {
  it('renders a status role with the accessible name from label', () => {
    render(<Spinner label="Creating…" />);
    expect(screen.getByRole('status', { name: 'Creating…' })).toBeVisible();
  });

  it('keeps the accessible name from label even when hasLabel is false', () => {
    render(<Spinner label="Creating…" hasLabel={false} />);
    expect(screen.getByRole('status', { name: 'Creating…' })).toBeVisible();
  });

  it('keeps the accessible name from label when hasLabel is true', () => {
    render(<Spinner label="Creating…" hasLabel={true} />);
    expect(screen.getByRole('status', { name: 'Creating…' })).toBeVisible();
  });

  it('does not render the label as visible text by default', () => {
    render(<Spinner label="Creating…" />);
    expect(screen.queryByText('Creating…')).not.toBeInTheDocument();
  });

  it('renders the label as visible text when hasLabel is true', () => {
    render(<Spinner label="Creating…" hasLabel={true} />);
    expect(screen.getByText('Creating…')).toBeInTheDocument();
  });

  it('renders every size without throwing', () => {
    for (const size of [Size.SM, Size.MD, Size.LG] as const) {
      expect(() =>
        render(<Spinner label="Loading" size={size} />),
      ).not.toThrow();
    }
  });
});
