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
      const initials = screen.getByText('JD');
      expect(initials).toBeVisible();
    });

    it('renders a text alternative for the initials fallback when alt is provided', () => {
      const textAlternative = screen.getByText(MOCK_PERSON_NAME);
      expect(textAlternative).toBeVisible();
    });
  });

  it('renders img when src is provided', () => {
    setup({ src: PHOTO_SRC, alt: PHOTO_ALT });
    const photo = screen.getByRole('img', { name: PHOTO_ALT });
    expect(photo).toBeVisible();
  });

  it.each([
    { case: 'a three-part name', name: 'John Michael Doe', initials: 'JM' },
    { case: 'a dotted email', name: 'jane.smith@example.com', initials: 'JS' },
    { case: 'an undotted email', name: 'madonna@example.com', initials: 'MA' },
    { case: 'a single token', name: 'madonna', initials: 'MA' },
  ])('derives 2 initials from $case', ({ name, initials }) => {
    setup({ alt: name, name });
    const derivedInitials = screen.getByText(initials);
    expect(derivedInitials).toBeVisible();
  });

  it('renders no accessible name on the image when alt is empty', () => {
    setup({ src: PHOTO_SRC, alt: '' });
    const photo = screen.queryByRole('img');
    expect(photo).not.toBeInTheDocument();
  });

  it('renders no sr-only name alongside the initials fallback when alt is empty', () => {
    setup({ alt: '' });
    const initials = screen.getByText('JD');
    const textAlternative = screen.queryByText(MOCK_PERSON_NAME);
    expect(initials).toBeVisible();
    expect(textAlternative).not.toBeInTheDocument();
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
