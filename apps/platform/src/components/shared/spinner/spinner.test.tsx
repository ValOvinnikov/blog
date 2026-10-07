import { SIZE } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';

import { Spinner } from './spinner';

describe(Spinner, () => {
  describe('with the default label', () => {
    beforeEach(() => {
      render(<Spinner label="Creating…" />);
    });

    it('renders a status role with the accessible name from label', () => {
      expect(screen.getByRole('status', { name: 'Creating…' })).toBeVisible();
    });

    it('does not render the label as visible text by default', () => {
      expect(screen.queryByText('Creating…')).not.toBeInTheDocument();
    });
  });

  it('keeps the accessible name from label even when hasLabel is false', () => {
    render(<Spinner label="Creating…" hasLabel={false} />);
    expect(screen.getByRole('status', { name: 'Creating…' })).toBeVisible();
  });

  describe('with hasLabel enabled', () => {
    beforeEach(() => {
      render(<Spinner label="Creating…" hasLabel={true} />);
    });

    it('keeps the accessible name from label when hasLabel is true', () => {
      expect(screen.getByRole('status', { name: 'Creating…' })).toBeVisible();
    });

    it('renders the label as visible text when hasLabel is true', () => {
      expect(screen.getByText('Creating…')).toBeVisible();
    });
  });

  it('renders every size without throwing', () => {
    for (const size of [SIZE.SM, SIZE.MD, SIZE.LG] as const) {
      expect(() =>
        render(<Spinner label="Loading" size={size} />),
      ).not.toThrow();
    }
  });
});
