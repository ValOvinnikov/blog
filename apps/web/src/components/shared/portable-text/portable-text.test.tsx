import { ASIDE_KIND, type TPortableText } from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  portableTextBlock,
  portableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';
import type { ReactNode } from 'react';

import { PortableText } from './portable-text';

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

const setup = customRender(PortableText, {
  value: [],
});

describe(`<${PortableText.name}/>`, () => {
  it('renders a normal-style block as a paragraph', () => {
    const value: TPortableTextBody = [portableTextBlock('Hello world')];

    setup({ value });

    expect(screen.getByText('Hello world', { selector: 'p' })).toBeVisible();
  });

  it('renders an h1-style block downgraded to a level 2 heading, never a bare h1', () => {
    const value: TPortableTextBody = [
      portableTextBlock('Heading 1', { style: 'h1' }),
    ];

    setup({ value });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Heading 1',
    });
    expect(heading).toBeVisible();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  ([2, 3, 4] as const).forEach((level) => {
    it(`renders an h${level}-style block as a level ${level} heading`, () => {
      const value: TPortableTextBody = [
        portableTextBlock(`Heading ${level}`, {
          style: `h${level}` as TPortableText['style'],
        }),
      ];

      setup({ value });

      expect(
        screen.getByRole('heading', { level, name: `Heading ${level}` }),
      ).toBeVisible();
    });
  });

  it('gives every h2/h3 block a stable id from its own _key, with no lookup table needed', () => {
    const value: TPortableTextBody = [
      portableTextBlock('Getting started', { style: 'h2', key: 'section-1' }),
      portableTextBlock('Prerequisites', { style: 'h3', key: 'section-2' }),
    ];

    setup({ value });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Getting started' }),
    ).toHaveAttribute('id', 'section-1');
    expect(
      screen.getByRole('heading', { level: 3, name: 'Prerequisites' }),
    ).toHaveAttribute('id', 'section-2');
  });

  it('never lets two separate PortableText instances on the same page collide on heading ids, since each id comes from its own block _key', () => {
    const firstBody: TPortableTextBody = [
      portableTextBlock('Overview', { style: 'h2', key: 'overview-1' }),
    ];
    const secondBody: TPortableTextBody = [
      portableTextBlock('Overview', { style: 'h2', key: 'overview-2' }),
    ];

    renderElement(<PortableText value={firstBody} />);
    renderElement(<PortableText value={secondBody} />);

    const headings = screen.getAllByRole('heading', { level: 2 });

    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveAttribute('id', 'overview-1');
    expect(headings[1]).toHaveAttribute('id', 'overview-2');
  });

  it('renders a blockquote-style block as a blockquote', () => {
    const value: TPortableTextBody = [
      portableTextBlock('A quote', { style: 'blockquote' }),
    ];

    setup({ value });

    expect(
      screen.getByText('A quote', { selector: 'blockquote' }),
    ).toBeVisible();
  });

  it('renders the strong mark as bold text, inherited from the library defaults', () => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan('bold text', ['strong'])]),
    ];

    setup({ value });

    expect(screen.getByText('bold text').tagName).toBe('STRONG');
  });

  it('renders the em mark as italic text, inherited from the library defaults', () => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan('italic text', ['em'])]),
    ];

    setup({ value });

    expect(screen.getByText('italic text').tagName).toBe('EM');
  });

  it('renders the code mark as inline code', () => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan('const x = 1', ['code'])]),
    ];

    setup({ value });

    expect(screen.getByText('const x = 1').tagName).toBe('CODE');
  });

  it('renders bullet and numbered lists', () => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan('First bullet')], {
        listItem: 'bullet',
      }),
      portableTextBlock([portableTextSpan('Second bullet')], {
        listItem: 'bullet',
      }),
    ];

    setup({ value });

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders a resolved linkRef annotation as a link', () => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan('a link', ['link-1'])], {
        markDefs: [
          {
            _type: 'linkRef',
            _key: 'link-1',
            link: { href: 'https://example.com', target: undefined },
          },
        ],
      }),
    ];

    setup({ value });

    const link = screen.getByRole('link', { name: 'a link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders a dangling linkRef annotation as plain text, not a broken anchor', () => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan('incomplete link', ['link-1'])], {
        markDefs: [{ _type: 'linkRef', _key: 'link-1', link: undefined }],
      }),
    ];

    setup({ value });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('incomplete link')).toBeVisible();
  });

  it('renders sibling blocks as direct children with no wrapper of its own — PortableText renders bare', () => {
    const value: TPortableTextBody = [
      portableTextBlock('Section', { style: 'h2' }),
      portableTextBlock('First paragraph'),
      portableTextBlock('Second paragraph'),
    ];

    const { container } = setup({ value });

    expect(container.children).toHaveLength(3);
    expect(container.children[0]?.tagName).toBe('H2');
    expect(container.children[1]?.tagName).toBe('P');
    expect(container.children[2]?.tagName).toBe('P');
  });

  it('renders a code block with syntax highlighting', () => {
    const value: TPortableTextBody = [
      {
        _type: 'code',
        _key: 'code-1',
        language: 'typescript',
        filename: 'example.ts',
        code: 'const x = 1;',
      },
    ];

    setup({ value });

    expect(screen.getByText('example.ts')).toBeVisible();
    expect(screen.getByTestId('code-content').textContent).toContain(
      'const x = 1;',
    );
  });

  it('renders a bodyImage block as an img with the CMS alt text', () => {
    const value: TPortableTextBody = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: undefined,
        image: makeSanityImage({ alt: 'A scenic mountain range' }),
      },
    ];

    setup({ value });

    const img = screen.getByRole('img', { name: 'A scenic mountain range' });
    expect(img).toHaveAttribute(
      'src',
      expect.stringContaining('https://cdn.sanity.io'),
    );
  });

  it('renders nothing for a bodyImage block whose asset never resolved', () => {
    const value: TPortableTextBody = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: undefined,
        image: undefined,
      },
    ];

    setup({ value });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders an aside block as a DeepAside, with its body rendered through the same block components', () => {
    const value: TPortableTextBody = [
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: ASIDE_KIND.WHY_NOT,
        body: [portableTextBlock('Because Y.')],
      },
    ];

    setup({ value });

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Because Y.')).toBeVisible();
  });

  it('falls back to the raw kind value as the aside label when no override supplies a label', () => {
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

  it('treats a missing aside kind as CONTEXT (forward-compat)', () => {
    const value: TPortableTextBody = [
      {
        _type: 'aside',
        _key: 'aside-1',
        body: [portableTextBlock('Some context.')],
      },
    ];

    setup({ value });

    expect(screen.getByText(ASIDE_KIND.CONTEXT)).toBeVisible();
  });

  it('renders a resolved linkRef annotation nested in an aside body as a link', () => {
    const value: TPortableTextBody = [
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: ASIDE_KIND.CONTEXT,
        body: [
          portableTextBlock([portableTextSpan('a nested link', ['link-1'])], {
            markDefs: [
              {
                _type: 'linkRef',
                _key: 'link-1',
                link: { href: 'https://example.com', target: undefined },
              },
            ],
          }),
        ],
      },
    ];

    setup({ value });

    const link = screen.getByRole('link', { name: 'a nested link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('merges a caller-supplied components override non-destructively: overriding the code mark leaves the strong mark, inherited from the library defaults, intact', () => {
    const value: TPortableTextBody = [
      portableTextBlock([
        portableTextSpan('bold text', ['strong']),
        portableTextSpan(' and '),
        portableTextSpan('code text', ['code']),
      ]),
    ];

    setup({
      value,
      components: {
        marks: {
          code: ({ children }) => (
            <mark data-testid="custom-code">{children}</mark>
          ),
        },
      },
    });

    expect(screen.getByText('bold text').tagName).toBe('STRONG');
    expect(screen.getByTestId('custom-code')).toHaveTextContent('code text');
  });
});
