import {
  customRender,
  fireEvent,
  screen,
} from '@blog/ui/testing/custom-render';

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

  it('falls back to initials when the image fails to load', () => {
    setup({ src: '/broken-photo.jpg', alt: 'Profile photo' });

    const image = screen.getByRole('img', { name: 'Profile photo' });
    fireEvent.error(image);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JD')).toBeVisible();
  });
});
