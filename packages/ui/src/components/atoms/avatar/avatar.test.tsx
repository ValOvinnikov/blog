import {
  customRender,
  fireEvent,
  screen,
} from '@blog/ui/testing/custom-render';
import { MOCK_PERSON_NAME } from '@blog/ui/testing/fixtures';

import { Avatar } from './avatar';

const PHOTO_SRC = '/photo.jpg';
const PHOTO_ALT = 'Profile photo';

const setup = customRender(Avatar, {
  alt: MOCK_PERSON_NAME,
  name: MOCK_PERSON_NAME,
});

describe(`<${Avatar.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders initials when no src', () => {
      expect(screen.getByText('JD')).toBeVisible();
    });

    it('renders a text alternative for the initials fallback when alt is provided', () => {
      expect(screen.getByText(MOCK_PERSON_NAME)).toBeVisible();
    });
  });

  it('renders img when src is provided', () => {
    setup({ src: PHOTO_SRC, alt: PHOTO_ALT });
    expect(screen.getByRole('img', { name: PHOTO_ALT })).toBeVisible();
  });

  it.each([
    { case: 'a three-part name', name: 'John Michael Doe', initials: 'JM' },
    { case: 'a dotted email', name: 'jane.smith@example.com', initials: 'JS' },
    { case: 'an undotted email', name: 'madonna@example.com', initials: 'MA' },
    { case: 'a single token', name: 'madonna', initials: 'MA' },
  ])('derives 2 initials from $case', ({ name, initials }) => {
    setup({ alt: name, name });
    expect(screen.getByText(initials)).toBeVisible();
  });

  it('renders no accessible name on the image when alt is empty', () => {
    setup({ src: PHOTO_SRC, alt: '' });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders no sr-only name alongside the initials fallback when alt is empty', () => {
    setup({ alt: '' });
    expect(screen.getByText('JD')).toBeVisible();
    expect(screen.queryByText(MOCK_PERSON_NAME)).not.toBeInTheDocument();
  });

  it('calls onImageError when the image fails to load', () => {
    const onImageError = vi.fn();
    setup({
      src: '/broken-photo.jpg',
      alt: PHOTO_ALT,
      onImageError,
    });

    const image = screen.getByRole('img', { name: PHOTO_ALT });
    fireEvent.error(image);

    expect(onImageError).toHaveBeenCalledOnce();
  });
});
