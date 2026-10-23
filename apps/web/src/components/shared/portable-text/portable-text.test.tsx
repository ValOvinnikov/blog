import {
  ASIDE_KIND,
  PORTABLE_TEXT_BLOCK_TYPE,
  type TPortableTextBlock,
} from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers/providers';
import {
  portableTextBlock,
  portableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';

import { PortableText } from './portable-text';

vi.mock('@web/i18n/navigation');

const setup = customRender(PortableText, {
  value: [],
});

type TBlock = TPortableTextBody[number];
type TAsideBlock = Extract<
  TBlock,
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.ASIDE }
>;
type TBodyImageBlock = Extract<
  TBlock,
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE }
>;

const LINK_HREF = 'https://example.com';
const LINK_KEY = 'link-1';
const PARAGRAPH_TEXT = 'Hello world';
const SECTION_HEADING = 'Getting started';
const SUBSECTION_HEADING = 'Prerequisites';
const FIRST_OVERVIEW_KEY = 'overview-1';
const SECOND_OVERVIEW_KEY = 'overview-2';
const DANGLING_LINK_TEXT = 'incomplete link';
const CODE_FILENAME = 'example.ts';
const CODE_SOURCE = 'const x = 1;';
const IMAGE_ALT = 'A scenic mountain range';
const ASIDE_BODY_TEXT = 'Because Y.';
const NESTED_LINK_TEXT = 'a nested link';

const RESOLVED_LINK_REF = {
  _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
  _key: LINK_KEY,
  link: { href: LINK_HREF, target: undefined },
} as const;

const mockAsideBlock = (
  body: TAsideBlock['body'],
  kind?: TAsideBlock['kind'],
): TAsideBlock => ({
  _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
  _key: 'aside-1',
  kind,
  body,
});

const mockBodyImageBlock = (
  image: TBodyImageBlock['image'],
): TBodyImageBlock => ({
  _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
  _key: 'image-1',
  layout: undefined,
  image,
});

describe(`<${PortableText.name}/>`, () => {
  it('renders a normal-style block as a paragraph', () => {
    const value: TPortableTextBody = [portableTextBlock(PARAGRAPH_TEXT)];

    setup({ value });

    const paragraph = screen.getByText(PARAGRAPH_TEXT, { selector: 'p' });
    expect(paragraph).toBeVisible();
  });

  it('downgrades an h1-style block to a level 2 heading', () => {
    const value: TPortableTextBody = [
      portableTextBlock('Heading 1', { style: 'h1' }),
    ];

    setup({ value });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Heading 1',
    });
    const pageHeading = screen.queryByRole('heading', { level: 1 });
    expect(heading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });

  it.each([2, 3, 4] as const)(
    'renders an h%i-style block as a heading of that level',
    (level) => {
      const value: TPortableTextBody = [
        portableTextBlock(`Heading ${level}`, {
          style: `h${level}` as TPortableTextBlock['style'],
        }),
      ];

      setup({ value });

      const heading = screen.getByRole('heading', {
        level,
        name: `Heading ${level}`,
      });
      expect(heading).toBeVisible();
    },
  );

  it('gives every h2/h3 block a stable id from its own _key', () => {
    const value: TPortableTextBody = [
      portableTextBlock(SECTION_HEADING, { style: 'h2', key: 'section-1' }),
      portableTextBlock(SUBSECTION_HEADING, { style: 'h3', key: 'section-2' }),
    ];

    setup({ value });

    const sectionHeading = screen.getByRole('heading', {
      level: 2,
      name: SECTION_HEADING,
    });
    const subsectionHeading = screen.getByRole('heading', {
      level: 3,
      name: SUBSECTION_HEADING,
    });
    expect(sectionHeading).toHaveAttribute('id', 'section-1');
    expect(subsectionHeading).toHaveAttribute('id', 'section-2');
  });

  it('keeps heading ids distinct across two PortableText instances', () => {
    const firstBody: TPortableTextBody = [
      portableTextBlock('Overview', { style: 'h2', key: FIRST_OVERVIEW_KEY }),
    ];
    const secondBody: TPortableTextBody = [
      portableTextBlock('Overview', { style: 'h2', key: SECOND_OVERVIEW_KEY }),
    ];

    renderElement(<PortableText value={firstBody} />);
    renderElement(<PortableText value={secondBody} />);

    const headings = screen.getAllByRole('heading', { level: 2 });

    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveAttribute('id', FIRST_OVERVIEW_KEY);
    expect(headings[1]).toHaveAttribute('id', SECOND_OVERVIEW_KEY);
  });

  it('renders a blockquote-style block as a blockquote', () => {
    const value: TPortableTextBody = [
      portableTextBlock('A quote', { style: 'blockquote' }),
    ];

    setup({ value });

    const quote = screen.getByText('A quote', { selector: 'blockquote' });
    expect(quote).toBeVisible();
  });

  it.each([
    { mark: 'strong', text: 'bold text' },
    { mark: 'em', text: 'italic text' },
    { mark: 'code', text: 'const x = 1' },
  ])('renders the $mark mark as a $mark element', ({ mark, text }) => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan(text, [mark])]),
    ];

    setup({ value });

    const markedText = screen.getByText(text, { selector: mark });
    expect(markedText).toBeVisible();
  });

  it('renders the sub mark as subscript and the sup mark as superscript', () => {
    const value: TPortableTextBody = [
      portableTextBlock([
        portableTextSpan('H'),
        portableTextSpan('2', ['sub']),
        portableTextSpan('O and x'),
        portableTextSpan('n', ['sup']),
      ]),
    ];

    setup({ value });

    const subscript = screen.getByText('2');
    const superscript = screen.getByText('n');
    expect(subscript.tagName).toBe('SUB');
    expect(superscript.tagName).toBe('SUP');
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
    const listItems = screen.getAllByRole('listitem');
    expect(list.tagName).toBe('UL');
    expect(listItems).toHaveLength(2);
  });

  it('renders a resolved linkRef annotation as a link', () => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan('a link', [LINK_KEY])], {
        markDefs: [RESOLVED_LINK_REF],
      }),
    ];

    setup({ value });

    const link = screen.getByRole('link', { name: 'a link' });
    expect(link).toHaveAttribute('href', LINK_HREF);
  });

  it('renders a dangling linkRef annotation as plain text', () => {
    const value: TPortableTextBody = [
      portableTextBlock([portableTextSpan(DANGLING_LINK_TEXT, [LINK_KEY])], {
        markDefs: [{ ...RESOLVED_LINK_REF, link: undefined }],
      }),
    ];

    setup({ value });

    const link = screen.queryByRole('link');
    const text = screen.getByText(DANGLING_LINK_TEXT);
    expect(link).not.toBeInTheDocument();
    expect(text).toBeVisible();
  });

  it('renders sibling blocks bare, with no wrapper of its own', () => {
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
        filename: CODE_FILENAME,
        code: CODE_SOURCE,
      },
    ];

    setup({ value });

    const filename = screen.getByText(CODE_FILENAME);
    const codeContent = screen.getByTestId('code-content');
    expect(filename).toBeVisible();
    expect(codeContent.textContent).toContain(CODE_SOURCE);
  });

  it('renders a bodyImage block as an img with the CMS alt text', () => {
    const value: TPortableTextBody = [
      mockBodyImageBlock(mockSanityImage({ alt: IMAGE_ALT })),
    ];

    setup({ value });

    const img = screen.getByRole('img', { name: IMAGE_ALT });
    expect(img).toHaveAttribute(
      'src',
      `${STATIC_SANITY_IMAGE_BASE_URL}6205dacc42424f7a83d8e20a7000d895f7cdc7dd-2400x1260.png?auto=format&fit=max&q=75&w=1200`,
    );
  });

  it('renders nothing for a bodyImage block whose asset never resolved', () => {
    const value: TPortableTextBody = [mockBodyImageBlock(undefined)];

    setup({ value });

    const img = screen.queryByRole('img');
    expect(img).not.toBeInTheDocument();
  });

  it('renders an aside block with its body through the same components', () => {
    const value: TPortableTextBody = [
      mockAsideBlock([portableTextBlock(ASIDE_BODY_TEXT)], ASIDE_KIND.WHY_NOT),
    ];

    setup({ value });

    const aside = screen.getByRole('note');
    const asideBody = screen.getByText(ASIDE_BODY_TEXT);
    expect(aside).toBeVisible();
    expect(asideBody).toBeVisible();
  });

  it('labels an aside with its raw kind when no override supplies a label', () => {
    const value: TPortableTextBody = [
      mockAsideBlock([portableTextBlock('A tangent.')], ASIDE_KIND.DIGRESSION),
    ];

    setup({ value });

    const label = screen.getByText(ASIDE_KIND.DIGRESSION);
    expect(label).toBeVisible();
  });

  it('labels an aside with no kind as CONTEXT', () => {
    const value: TPortableTextBody = [
      mockAsideBlock([portableTextBlock('Some context.')]),
    ];

    setup({ value });

    const label = screen.getByText(ASIDE_KIND.CONTEXT);
    expect(label).toBeVisible();
  });

  it('renders a resolved linkRef annotation inside an aside as a link', () => {
    const value: TPortableTextBody = [
      mockAsideBlock(
        [
          portableTextBlock([portableTextSpan(NESTED_LINK_TEXT, [LINK_KEY])], {
            markDefs: [RESOLVED_LINK_REF],
          }),
        ],
        ASIDE_KIND.CONTEXT,
      ),
    ];

    setup({ value });

    const link = screen.getByRole('link', { name: NESTED_LINK_TEXT });
    expect(link).toHaveAttribute('href', LINK_HREF);
  });

  it('keeps the default strong mark when a caller overrides the code mark', () => {
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

    const boldText = screen.getByText('bold text');
    const customCode = screen.getByTestId('custom-code');
    expect(boldText.tagName).toBe('STRONG');
    expect(customCode).toHaveTextContent('code text');
  });
});
