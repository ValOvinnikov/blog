import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { AuthorByline } from './author-byline';

faker.seed(123);

const name = faker.person.fullName();
const bio = faker.lorem.sentences(2);
const avatarUrl = faker.image.avatarGitHub();

const setup = customRender(AuthorByline, { name });

describe(`<${AuthorByline.name}/>`, () => {
  it('renders the author name as a heading', () => {
    setup();
    expect(screen.getByRole('heading', { name })).toBeVisible();
  });

  it('renders the bio when provided', () => {
    setup({ bio });
    expect(screen.getByText(bio)).toBeVisible();
  });

  it('omits the bio when not provided', () => {
    setup();
    expect(screen.queryByText(bio)).not.toBeInTheDocument();
  });

  it('renders the avatar image when avatarUrl is provided', () => {
    setup({ avatarUrl });
    expect(screen.getByRole('img', { name })).toBeVisible();
  });

  it('renders avatar initials when avatarUrl is not provided', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'author-byline' });
    expect(screen.getByTestId('author-byline')).toBeVisible();
  });
});
