import { ASIDE_KIND } from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import type { ReactNode } from 'react';

import { PostBody } from './post-body';

vi.mock('@blog/ui/molecules/image-with-caption', () => ({
  ImageWithCaption: ({
    layout,
    children,
  }: {
    layout?: string;
    children?: ReactNode;
  }) => (
    <div data-testid="image-with-caption" data-layout={layout}>
      {children}
    </div>
  ),
}));

const setup = customRender(PostBody, {
  value: [],
});

describe(`<${PostBody.name}/>`, () => {
  it('renders every block as a direct child of a single Prose wrapper when the body has no FULL_BLEED image', () => {
    const value: TPortableTextBody = [
      portableTextBlock('Section', { style: 'h2' }),
      portableTextBlock('First paragraph'),
      portableTextBlock('Second paragraph'),
    ];

    const { container } = setup({ value });

    const root = container.firstElementChild;

    expect(root?.children).toHaveLength(3);
    expect(root?.children[0]?.tagName).toBe('H2');
    expect(root?.children[1]?.tagName).toBe('P');
    expect(root?.children[2]?.tagName).toBe('P');
  });

  it('renders a FULL_BLEED bodyImage as a sibling of the surrounding text, not nested inside the same wrapper as the text before/after it (#1070 — a FULL_BLEED image must be free of the text measure cap)', () => {
    const value: TPortableTextBody = [
      portableTextBlock('Before the image.'),
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: 'FULL_BLEED',
        image: makeSanityImage({ alt: 'A scenic mountain range' }),
      },
      portableTextBlock('After the image.'),
    ];

    setup({ value });

    const image = screen.getByTestId('image-with-caption');
    expect(image).toHaveAttribute('data-layout', 'FULL_BLEED');

    const before = screen.getByText('Before the image.');
    const after = screen.getByText('After the image.');

    expect(image.parentElement).not.toBe(before.parentElement);
    expect(image.parentElement).not.toBe(after.parentElement);
    expect(before.parentElement).not.toBe(after.parentElement);
  });

  it('keeps every block a direct child of a single wrapper when the body has a non-FULL_BLEED bodyImage', () => {
    const value: TPortableTextBody = [
      portableTextBlock('Before the image.'),
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: 'FLOAT_LEFT',
        image: makeSanityImage({ alt: 'A scenic mountain range' }),
      },
      portableTextBlock('After the image.'),
    ];

    setup({ value });

    const image = screen.getByTestId('image-with-caption');
    const before = screen.getByText('Before the image.');
    const after = screen.getByText('After the image.');

    expect(image.parentElement).toBe(before.parentElement);
    expect(image.parentElement).toBe(after.parentElement);
  });

  it('renders an aside with the label supplied through asideKindLabels', () => {
    const value: TPortableTextBody = [
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: ASIDE_KIND.WHY_NOT,
        body: [portableTextBlock('Because Y.')],
      },
    ];

    setup({ value, asideKindLabels: { [ASIDE_KIND.WHY_NOT]: 'Why not X' } });

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Why not X')).toBeVisible();
    expect(screen.getByText('Because Y.')).toBeVisible();
  });

  it('falls back to the raw kind value as the aside label when asideKindLabels is omitted', () => {
    const value: TPortableTextBody = [
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: ASIDE_KIND.DIGRESSION,
        body: [portableTextBlock('A tangent.')],
      },
    ];

    setup({ value });

    expect(screen.getByText(ASIDE_KIND.DIGRESSION)).toBeVisible();
  });
});
