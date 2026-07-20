import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { AuthorByline } from './author-byline';

faker.seed(123);

const name = faker.person.fullName();
const bio = faker.lorem.sentences(2);
const avatarUrl = faker.image.avatarGitHub();

describe(`<${AuthorByline.name}/>`, () => {
  it('renders the author name as a heading', () => {
    render(<AuthorByline name={name} />);
    expect(screen.getByRole('heading', { name })).toBeVisible();
  });

  it('renders the bio when provided', () => {
    render(<AuthorByline name={name} bio={bio} />);
    expect(screen.getByText(bio)).toBeVisible();
  });

  it('omits the bio when not provided', () => {
    render(<AuthorByline name={name} />);
    expect(screen.queryByText(bio)).not.toBeInTheDocument();
  });

  it('renders the avatar image when avatarUrl is provided', () => {
    render(<AuthorByline name={name} avatarUrl={avatarUrl} />);
    expect(screen.getByRole('img', { name })).toBeVisible();
  });

  it('renders avatar initials when avatarUrl is not provided', () => {
    render(<AuthorByline name={name} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    render(<AuthorByline name={name} dataTestId="author-byline" />);
    expect(screen.getByTestId('author-byline')).toBeVisible();
  });
});
