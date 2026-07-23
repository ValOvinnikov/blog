import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { ImageWithCaption } from './image-with-caption';

faker.seed(123);

const caption = faker.lorem.sentence();
const altText = faker.lorem.words(3);

const setup = customRender(ImageWithCaption, {
  caption,
  children: <img src="https://example.com/img.jpg" alt={altText} />,
});

describe(`<${ImageWithCaption.name}/>`, () => {
  it('renders the root as a <figure> element', () => {
    const { container } = setup();
    expect(container.firstChild?.nodeName).toBe('FIGURE');
  });

  it('renders children inside the frame', () => {
    setup();
    expect(screen.getByRole('img')).toBeVisible();
  });

  it('renders Caption when caption is non-empty', () => {
    setup({ children: undefined });
    expect(screen.getByText(caption)).toBeVisible();
  });

  it('does not render a <figcaption> when caption is an empty string', () => {
    const { container } = setup({ caption: '', children: undefined });
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('does not render a <figcaption> when caption is omitted', () => {
    const { container } = setup({ caption: undefined, children: undefined });
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('forwards className to MediaFrame', () => {
    const { container } = setup({
      className: 'aspect-video',
      children: undefined,
    });
    const frame = container.querySelector('.aspect-video');
    expect(frame).not.toBeNull();
  });

  it('forwards dataTestId to the root figure', () => {
    setup({ dataTestId: 'image-with-caption', children: undefined });
    expect(screen.getByTestId('image-with-caption')).toBeVisible();
  });
});
