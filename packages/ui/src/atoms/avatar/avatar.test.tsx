import { Size } from '@blog/config';
import { render, screen } from '@testing-library/react';

import { Avatar } from './avatar';

describe(`<${Avatar.name}/>`, () => {
  it('renders img when src is provided', () => {
    render(<Avatar src="/photo.jpg" alt="Profile photo" name="Jane Doe" />);
    expect(screen.getByRole('img', { name: 'Profile photo' })).toBeVisible();
  });

  it('renders initials when no src', () => {
    render(<Avatar alt="Jane Doe" name="Jane Doe" />);
    expect(screen.getByText('JD')).toBeVisible();
  });

  it('caps initials at 2 chars', () => {
    render(<Avatar alt="John Michael Doe" name="John Michael Doe" />);
    expect(screen.getByText('JM')).toBeVisible();
  });

  it('applies sm size class', () => {
    const { container } = render(
      <Avatar alt="Jane Doe" name="Jane Doe" size={Size.SM} />,
    );
    expect(container.firstChild).toHaveClass('h-8');
  });

  it('applies lg size class', () => {
    const { container } = render(
      <Avatar alt="Jane Doe" name="Jane Doe" size={Size.LG} />,
    );
    expect(container.firstChild).toHaveClass('h-14');
  });
});
