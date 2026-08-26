import { render, screen } from '@admin/testing/custom-render';

import { BrandMark } from './brand-mark';

describe(BrandMark, () => {
  it('renders the glyph', () => {
    render(<BrandMark />);
    expect(screen.getByText('V')).toBeInTheDocument();
  });

  it('is decorative by default', () => {
    const { container } = render(<BrandMark />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes an accessible name when a title is given', () => {
    render(<BrandMark title="Valstack" />);
    expect(screen.getByRole('img', { name: 'Valstack' })).toBeInTheDocument();
  });

  it('drops aria-hidden when a title is given', () => {
    render(<BrandMark title="Valstack" />);
    const mark = screen.getByRole('img', { name: 'Valstack' });
    expect(mark).not.toHaveAttribute('aria-hidden');
  });
});
