import { render, screen } from '@admin/testing/custom-render';

import { Avatar } from './avatar';

describe(Avatar, () => {
  it('renders initials from a first and last name', () => {
    render(<Avatar name="Jane Doe" variant="table" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('uses the first and last word for a name with a middle name', () => {
    render(<Avatar name="Jane Middle Doe" variant="table" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('takes the first two letters of a single-word name', () => {
    render(<Avatar name="Madonna" variant="chip" />);
    expect(screen.getByText('MA')).toBeInTheDocument();
  });

  it('uppercases lowercase input', () => {
    render(<Avatar name="jane doe" variant="table" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('collapses extra whitespace between name parts', () => {
    render(<Avatar name="  Jane    Doe  " variant="table" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders no initials for an empty name without throwing', () => {
    const { container } = render(<Avatar name="" variant="table" />);
    expect(container.querySelector('span')).toHaveTextContent('');
  });

  it('is decorative — hidden from assistive tech', () => {
    const { container } = render(<Avatar name="Jane Doe" variant="table" />);
    expect(container.querySelector('span')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('renders both variants without throwing', () => {
    expect(() =>
      render(<Avatar name="Jane Doe" variant="table" />),
    ).not.toThrow();
    expect(() =>
      render(<Avatar name="Jane Doe" variant="chip" />),
    ).not.toThrow();
  });
});
