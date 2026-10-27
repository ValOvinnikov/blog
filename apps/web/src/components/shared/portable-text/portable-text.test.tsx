import {
  ASIDE_KIND,
  PORTABLE_TEXT_BLOCK_TYPE,
  SITE_MESSAGES,
  type TPortableTextBlock,
} from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { faker } from '@faker-js/faker';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { STATIC_SANITY_IMAGE_BASE_URL } from '@web/testing/providers';
import {
  mockPortableTextBlock,
  mockPortableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';

import { PortableText } from './portable-text';

vi.mock('@web/i18n/navigation');

faker.seed(6007);

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

const MOCK_LINK_HREF = faker.internet.url();
const MOCK_LINK_KEY = faker.string.uuid();
const MOCK_LINK_TEXT = faker.lorem.words(2);
const MOCK_PARAGRAPH_TEXT = faker.lorem.sentence();
const MOCK_SECTION_HEADING = faker.lorem.words(2);
const MOCK_SUBSECTION_HEADING = faker.lorem.words(2);
const MOCK_OVERVIEW_HEADING = faker.lorem.words(2);
const MOCK_FIRST_OVERVIEW_KEY = faker.string.uuid();
const MOCK_SECOND_OVERVIEW_KEY = faker.string.uuid();
const MOCK_SECTION_KEY = faker.string.uuid();
const MOCK_SUBSECTION_KEY = faker.string.uuid();
const MOCK_DANGLING_LINK_TEXT = faker.lorem.words(2);
const MOCK_QUOTE_TEXT = faker.lorem.sentence();
const MOCK_CODE_FILENAME = faker.system.commonFileName('ts');
const MOCK_CODE_SOURCE = 'const x = 1;';
const MOCK_IMAGE_ALT = faker.lorem.words(3);
const MOCK_ASIDE_BODY_TEXT = faker.lorem.sentence();
const MOCK_ASIDE_KIND_BODY_TEXT = faker.lorem.sentence();
const MOCK_ASIDE_CONTEXT_TEXT = faker.lorem.sentence();
const MOCK_NESTED_LINK_TEXT = faker.lorem.words(2);
const MOCK_BOLD_TEXT = faker.lorem.words(2);
const MOCK_CUSTOM_CODE_TEXT = faker.lorem.words(2);
const MOCK_HOST_TEST_ID = faker.string.uuid();
const CODE_REGION_NAME = SITE_MESSAGES.codeBlock.regionLabel;

const RESOLVED_LINK_REF = {
  _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
  _key: MOCK_LINK_KEY,
  link: { href: MOCK_LINK_HREF, target: undefined },
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

const MARK_CASES = [
  { mark: 'strong', element: 'strong' },
  { mark: 'em', element: 'em' },
  { mark: 'code', element: 'code' },
  { mark: 'sub', element: 'sub' },
  { mark: 'sup', element: 'sup' },
];

const LIST_CASES = [
  { listItem: 'bullet', element: 'UL' },
  { listItem: 'number', element: 'OL' },
] as const;

describe(`<${PortableText.name}/>`, () => {
  it('renders a normal-style block as a paragraph', () => {
    const value: TPortableTextBody = [
      mockPortableTextBlock(MOCK_PARAGRAPH_TEXT),
    ];

    setup({ value });

    const paragraph = screen.getByText(MOCK_PARAGRAPH_TEXT, { selector: 'p' });
    expect(paragraph).toBeVisible();
  });

  it('downgrades an h1-style block to a level 2 heading', () => {
    const value: TPortableTextBody = [
      mockPortableTextBlock(MOCK_SECTION_HEADING, { style: 'h1' }),
    ];

    setup({ value });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_SECTION_HEADING,
    });
    const pageHeading = screen.queryByRole('heading', { level: 1 });
    expect(heading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });

  it.each([2, 3, 4] as const)(
    'renders an h%i-style block as a heading of that level',
    (level) => {
      const value: TPortableTextBody = [
        mockPortableTextBlock(MOCK_SECTION_HEADING, {
          style: `h${level}` as TPortableTextBlock['style'],
        }),
      ];

      setup({ value });

      const heading = screen.getByRole('heading', {
        level,
        name: MOCK_SECTION_HEADING,
      });
      expect(heading).toBeVisible();
    },
  );

  it('gives every h2/h3 block a stable id from its own _key', () => {
    const value: TPortableTextBody = [
      mockPortableTextBlock(MOCK_SECTION_HEADING, {
        style: 'h2',
        key: MOCK_SECTION_KEY,
      }),
      mockPortableTextBlock(MOCK_SUBSECTION_HEADING, {
        style: 'h3',
        key: MOCK_SUBSECTION_KEY,
      }),
    ];

    setup({ value });

    const sectionHeading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_SECTION_HEADING,
    });
    const subsectionHeading = screen.getByRole('heading', {
      level: 3,
      name: MOCK_SUBSECTION_HEADING,
    });
    expect(sectionHeading).toHaveAttribute('id', MOCK_SECTION_KEY);
    expect(subsectionHeading).toHaveAttribute('id', MOCK_SUBSECTION_KEY);
  });

  it('keeps heading ids distinct across two PortableText instances', () => {
    const firstBody: TPortableTextBody = [
      mockPortableTextBlock(MOCK_OVERVIEW_HEADING, {
        style: 'h2',
        key: MOCK_FIRST_OVERVIEW_KEY,
      }),
    ];
    const secondBody: TPortableTextBody = [
      mockPortableTextBlock(MOCK_OVERVIEW_HEADING, {
        style: 'h2',
        key: MOCK_SECOND_OVERVIEW_KEY,
      }),
    ];

    renderElement(<PortableText value={firstBody} />);
    renderElement(<PortableText value={secondBody} />);

    const [firstHeading, secondHeading, ...otherHeadings] = screen.getAllByRole(
      'heading',
      { level: 2 },
    );
    expect(firstHeading).toHaveAttribute('id', MOCK_FIRST_OVERVIEW_KEY);
    expect(secondHeading).toHaveAttribute('id', MOCK_SECOND_OVERVIEW_KEY);
    expect(otherHeadings).toHaveLength(0);
  });

  it('renders a blockquote-style block as a blockquote', () => {
    const value: TPortableTextBody = [
      mockPortableTextBlock(MOCK_QUOTE_TEXT, { style: 'blockquote' }),
    ];

    setup({ value });

    const quote = screen.getByText(MOCK_QUOTE_TEXT, {
      selector: 'blockquote',
    });
    expect(quote).toBeVisible();
  });

  it.each(MARK_CASES)(
    'renders the $mark mark as a $element element',
    ({ mark, element }) => {
      const markedText = faker.lorem.words(2);
      const value: TPortableTextBody = [
        mockPortableTextBlock([mockPortableTextSpan(markedText, [mark])]),
      ];

      setup({ value });

      const markedElement = screen.getByText(markedText, { selector: element });
      expect(markedElement).toBeVisible();
    },
  );

  it.each(LIST_CASES)(
    'renders $listItem items as a list of that kind',
    ({ listItem, element }) => {
      const value: TPortableTextBody = [
        mockPortableTextBlock(faker.lorem.words(2), { listItem }),
        mockPortableTextBlock(faker.lorem.words(2), { listItem }),
      ];

      setup({ value });

      const list = screen.getByRole('list');
      const listItems = screen.getAllByRole('listitem');
      expect(list.tagName).toBe(element);
      expect(listItems).toHaveLength(value.length);
    },
  );

  it('renders a resolved linkRef annotation as a link', () => {
    const value: TPortableTextBody = [
      mockPortableTextBlock(
        [mockPortableTextSpan(MOCK_LINK_TEXT, [MOCK_LINK_KEY])],
        { markDefs: [RESOLVED_LINK_REF] },
      ),
    ];

    setup({ value });

    const link = screen.getByRole('link', { name: MOCK_LINK_TEXT });
    expect(link).toHaveAttribute('href', MOCK_LINK_HREF);
  });

  it('renders a dangling linkRef annotation as plain text', () => {
    const value: TPortableTextBody = [
      mockPortableTextBlock(
        [mockPortableTextSpan(MOCK_DANGLING_LINK_TEXT, [MOCK_LINK_KEY])],
        { markDefs: [{ ...RESOLVED_LINK_REF, link: undefined }] },
      ),
    ];

    setup({ value });

    const link = screen.queryByRole('link');
    const text = screen.getByText(MOCK_DANGLING_LINK_TEXT);
    expect(link).not.toBeInTheDocument();
    expect(text).toBeVisible();
  });

  it('renders sibling blocks as direct children of the host, with no wrapper', () => {
    const value: TPortableTextBody = [
      mockPortableTextBlock(MOCK_SECTION_HEADING, { style: 'h2' }),
      mockPortableTextBlock(faker.lorem.sentence()),
      mockPortableTextBlock(faker.lorem.sentence()),
    ];

    renderElement(
      <div data-testid={MOCK_HOST_TEST_ID}>
        <PortableText value={value} />
      </div>,
    );

    const host = screen.getByTestId(MOCK_HOST_TEST_ID);
    // eslint-disable-next-line testing-library/no-node-access -- structural claim: the blocks are the host's direct children, which has no semantic handle
    const tagNames = Array.from(host.children, (child) => child.tagName);

    expect(tagNames).toEqual(['H2', 'P', 'P']);
  });

  it('renders a code block with its filename and source', () => {
    const value: TPortableTextBody = [
      {
        _type: 'code',
        _key: faker.string.uuid(),
        language: 'typescript',
        filename: MOCK_CODE_FILENAME,
        code: MOCK_CODE_SOURCE,
      },
    ];

    setup({ value });

    const filename = screen.getByText(MOCK_CODE_FILENAME);
    const codeRegion = screen.getByRole('region', { name: CODE_REGION_NAME });
    expect(filename).toBeVisible();
    expect(codeRegion).toHaveTextContent(MOCK_CODE_SOURCE);
  });

  it('renders a bodyImage block as an img with the CMS alt text', () => {
    const sanityImage = mockSanityImage({ alt: MOCK_IMAGE_ALT });
    const [, assetHash] = /^image-(\w+)-/.exec(sanityImage.assetId) ?? [];
    const value: TPortableTextBody = [mockBodyImageBlock(sanityImage)];

    setup({ value });

    const img = screen.getByRole('img', { name: MOCK_IMAGE_ALT });
    expect(img.getAttribute('src')).toContain(
      `${STATIC_SANITY_IMAGE_BASE_URL}${assetHash}`,
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
      mockAsideBlock(
        [mockPortableTextBlock(MOCK_ASIDE_BODY_TEXT)],
        ASIDE_KIND.WHY_NOT,
      ),
    ];

    setup({ value });

    const aside = screen.getByRole('note');
    const asideBody = screen.getByText(MOCK_ASIDE_BODY_TEXT);
    expect(aside).toBeVisible();
    expect(asideBody).toBeVisible();
  });

  it('labels an aside with its raw kind when no override supplies a label', () => {
    const value: TPortableTextBody = [
      mockAsideBlock(
        [mockPortableTextBlock(MOCK_ASIDE_KIND_BODY_TEXT)],
        ASIDE_KIND.DIGRESSION,
      ),
    ];

    setup({ value });

    const label = screen.getByText(ASIDE_KIND.DIGRESSION);
    expect(label).toBeVisible();
  });

  it('labels an aside with no kind as CONTEXT', () => {
    const value: TPortableTextBody = [
      mockAsideBlock([mockPortableTextBlock(MOCK_ASIDE_CONTEXT_TEXT)]),
    ];

    setup({ value });

    const label = screen.getByText(ASIDE_KIND.CONTEXT);
    expect(label).toBeVisible();
  });

  it('renders a resolved linkRef annotation inside an aside as a link', () => {
    const value: TPortableTextBody = [
      mockAsideBlock(
        [
          mockPortableTextBlock(
            [mockPortableTextSpan(MOCK_NESTED_LINK_TEXT, [MOCK_LINK_KEY])],
            { markDefs: [RESOLVED_LINK_REF] },
          ),
        ],
        ASIDE_KIND.CONTEXT,
      ),
    ];

    setup({ value });

    const link = screen.getByRole('link', { name: MOCK_NESTED_LINK_TEXT });
    expect(link).toHaveAttribute('href', MOCK_LINK_HREF);
  });

  it('keeps the default strong mark when a caller overrides the code mark', () => {
    const value: TPortableTextBody = [
      mockPortableTextBlock([
        mockPortableTextSpan(MOCK_BOLD_TEXT, ['strong']),
        mockPortableTextSpan(' and '),
        mockPortableTextSpan(MOCK_CUSTOM_CODE_TEXT, ['code']),
      ]),
    ];

    setup({
      value,
      components: {
        marks: {
          code: ({ children }) => <mark>{children}</mark>,
        },
      },
    });

    const boldText = screen.getByText(MOCK_BOLD_TEXT, { selector: 'strong' });
    const customCode = screen.getByText(MOCK_CUSTOM_CODE_TEXT, {
      selector: 'mark',
    });
    expect(boldText).toBeVisible();
    expect(customCode).toBeVisible();
  });
});
