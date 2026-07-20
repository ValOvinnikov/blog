import type { ISanityImage } from '@blog/config';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SanityImage } from './sanity-image';

const image: ISanityImage = {
  assetId: 'image-abc123-800x600-jpg',
  alt: 'A scenic mountain range',
  hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
  crop: undefined,
  lqip: undefined,
  dimensions: { width: 800, height: 600, aspectRatio: 800 / 600 },
};

describe('SanityImage', () => {
  it('renders an img pointing at the Sanity CDN with a srcset', () => {
    render(<SanityImage image={image} width={960} height={720} />);

    const img = screen.getByRole('img', { name: image.alt });
    expect(img).toHaveAttribute(
      'src',
      expect.stringContaining('https://cdn.sanity.io'),
    );
    expect(img.getAttribute('srcset')).toContain('cdn.sanity.io');
  });

  it('falls back to the image alt text when no override is provided', () => {
    render(<SanityImage image={image} width={960} height={720} />);

    expect(screen.getByAltText(image.alt)).toBeVisible();
  });

  it('uses the provided alt override instead of the image alt', () => {
    render(
      <SanityImage image={image} width={960} height={720} alt="Custom alt" />,
    );

    expect(screen.getByAltText('Custom alt')).toBeVisible();
    expect(screen.queryByAltText(image.alt)).not.toBeInTheDocument();
  });

  it('forwards className, sizes and loading to the rendered element', () => {
    render(
      <SanityImage
        image={image}
        width={960}
        height={720}
        className="rounded-lg"
        sizes="(min-width: 1024px) 50vw, 100vw"
        loading="eager"
      />,
    );

    const img = screen.getByRole('img', { name: image.alt });
    expect(img).toHaveClass('rounded-lg');
    expect(img).toHaveAttribute('sizes', '(min-width: 1024px) 50vw, 100vw');
    expect(img).toHaveAttribute('loading', 'eager');
  });
});
