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

  it('calls onImageError when the image fails to load', () => {
    const onImageError = vi.fn();
    setup({
      src: '/broken-photo.jpg',
      alt: 'Profile photo',
      onImageError,
    });

    const image = screen.getByRole('img', { name: 'Profile photo' });
    fireEvent.error(image);

    expect(onImageError).toHaveBeenCalledOnce();
  });
});
