import {
  customRender,
  fireEvent,
  screen,
} from '@blog/ui/testing/custom-render';
import { MOCK_PERSON_NAME } from '@blog/ui/testing/fixtures';
import { faker } from '@faker-js/faker';

import { Avatar } from './avatar';

faker.seed(123);

const MOCK_PHOTO_SRC = faker.image.url();
const MOCK_PHOTO_ALT = faker.lorem.words(2);
const MOCK_PERSON_INITIALS = 'JD';

const setup = customRender(Avatar, {
  alt: MOCK_PERSON_NAME,
  name: MOCK_PERSON_NAME,
});

describe(`<${Avatar.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders initials when there is no src', () => {
      const initials = screen.getByText(MOCK_PERSON_INITIALS);

      expect(initials).toBeVisible();
    });

    it('gives the initials a text alternative from alt', () => {
      const textAlternative = screen.getByText(MOCK_PERSON_NAME);

      expect(textAlternative).toBeVisible();
    });
  });

  it('renders the image when src is provided', () => {
    setup({ src: MOCK_PHOTO_SRC, alt: MOCK_PHOTO_ALT });

    const photo = screen.getByRole('img', { name: MOCK_PHOTO_ALT });

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

  it('renders no image when alt is empty', () => {
    setup({ src: MOCK_PHOTO_SRC, alt: '' });

    const photo = screen.queryByRole('img');

    expect(photo).not.toBeInTheDocument();
  });

  it('renders no text alternative beside the initials when alt is empty', () => {
    setup({ alt: '' });

    const initials = screen.getByText(MOCK_PERSON_INITIALS);
    const textAlternative = screen.queryByText(MOCK_PERSON_NAME);

    expect(initials).toBeVisible();
    expect(textAlternative).not.toBeInTheDocument();
  });

  it('calls onImageError when the image fails to load', () => {
    const onImageError = vi.fn();
    setup({ src: MOCK_PHOTO_SRC, alt: MOCK_PHOTO_ALT, onImageError });

    const image = screen.getByRole('img', { name: MOCK_PHOTO_ALT });
    fireEvent.error(image);

    expect(onImageError).toHaveBeenCalledOnce();
  });
});
