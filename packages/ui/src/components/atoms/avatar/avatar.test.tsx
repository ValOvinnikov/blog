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

  it('derives 2 initials from an email address with no whitespace', () => {
    setup({
      alt: 'jane.smith@example.com',
      name: 'jane.smith@example.com',
    });
    expect(screen.getByText('JS')).toBeVisible();
  });

  it('derives 2 initials from an email local-part with no secondary delimiter', () => {
    setup({ alt: 'madonna@example.com', name: 'madonna@example.com' });
    expect(screen.getByText('MA')).toBeVisible();
  });

  it('derives 2 initials from a single unstructured token with no whitespace', () => {
    setup({ alt: 'madonna', name: 'madonna' });
    expect(screen.getByText('MA')).toBeVisible();
  });

  it('renders no accessible name on the image when alt is empty', () => {
    setup({ src: '/photo.jpg', alt: '' });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders no sr-only name alongside the initials fallback when alt is empty', () => {
    setup({ alt: '' });
    expect(screen.getByText('JD')).toBeVisible();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('renders a text alternative for the initials fallback when alt is provided', () => {
    setup();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
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
