import { render, screen } from '@platform/testing/custom-render';

import { BrandMark } from './brand-mark';

const ARIA_HIDDEN = 'aria-hidden';

describe(BrandMark, () => {
  it('renders the glyph', () => {
    render(<BrandMark />);
    expect(screen.getByText('V')).toBeVisible();
  });

  it('is decorative by default', () => {
    const { container } = render(<BrandMark />);
    // eslint-disable-next-line testing-library/no-node-access -- TODO: #5995
    expect(container.firstChild).toHaveAttribute(ARIA_HIDDEN, 'true');
  });

  it('exposes an accessible name when a title is given', () => {
    render(<BrandMark title="Valstack" />);
    expect(screen.getByRole('img', { name: 'Valstack' })).toBeVisible();
  });

  it('drops aria-hidden when a title is given', () => {
    render(<BrandMark title="Valstack" />);
    const mark = screen.getByRole('img', { name: 'Valstack' });
    expect(mark).not.toHaveAttribute(ARIA_HIDDEN);
  });
});
