import { Size } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Avatar } from './avatar';

const setup = customRender(Avatar, {
  alt: 'Jane Doe',
  name: 'Jane Doe',
});

describe(`<${Avatar.name}/>`, () => {
  it('renders img when src is provided', () => {
    setup({ src: '/photo.jpg', alt: 'Profile photo' });
    expect(screen.getByRole('img', { name: 'Profile photo' })).toBeVisible();
  });

  it('renders initials when no src', () => {
    setup();
    expect(screen.getByText('JD')).toBeVisible();
  });

  it('caps initials at 2 chars', () => {
    setup({ alt: 'John Michael Doe', name: 'John Michael Doe' });
    expect(screen.getByText('JM')).toBeVisible();
  });

  it('applies sm size class', () => {
    const { container } = setup({ size: Size.SM });
    expect(container.firstChild).toHaveClass('h-8');
  });

  it('applies lg size class', () => {
    const { container } = setup({ size: Size.LG });
    expect(container.firstChild).toHaveClass('h-14');
  });
});
