import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { ImageWithCaption } from './image-with-caption';

faker.seed(123);

const caption = faker.lorem.sentence();
const altText = faker.lorem.words(3);

describe(`<${ImageWithCaption.name}/>`, () => {
  it('renders the root as a <figure> element', () => {
    const { container } = render(
      <ImageWithCaption caption={caption}>
        <img src="https://example.com/img.jpg" alt={altText} />
      </ImageWithCaption>,
    );
    expect(container.firstChild?.nodeName).toBe('FIGURE');
  });

  it('renders children inside the frame', () => {
    render(
      <ImageWithCaption caption={caption}>
        <img src="https://example.com/img.jpg" alt={altText} />
      </ImageWithCaption>,
    );
    expect(screen.getByRole('img')).toBeVisible();
  });

  it('renders Caption when caption is non-empty', () => {
    render(<ImageWithCaption caption={caption} />);
    expect(screen.getByText(caption)).toBeVisible();
  });

  it('does not render a <figcaption> when caption is an empty string', () => {
    const { container } = render(<ImageWithCaption caption="" />);
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('does not render a <figcaption> when caption is omitted', () => {
    const { container } = render(<ImageWithCaption />);
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('forwards className to MediaFrame', () => {
    const { container } = render(
      <ImageWithCaption caption={caption} className="aspect-video" />,
    );
    const frame = container.querySelector('.aspect-video');
    expect(frame).not.toBeNull();
  });

  it('forwards dataTestId to the root figure', () => {
    render(
      <ImageWithCaption caption={caption} dataTestId="image-with-caption" />,
    );
    expect(screen.getByTestId('image-with-caption')).toBeVisible();
  });
});
