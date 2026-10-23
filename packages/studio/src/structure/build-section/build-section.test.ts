import {
  LOCALE_ISO_CODES,
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import {
  callArgs,
  mockStructureNode,
  type TMockStructureNode,
} from '@blog/studio/testing/structure/mock-structure-node';
import { House, Link2, List, Settings, Tag } from 'lucide-react';
import type { StructureBuilder } from 'sanity/structure';

import { buildSections, type TStructureSection } from './build-section';

const MODULE_TWO_TITLE = 'Module Two';
const LANDING_PAGES_TITLE = 'Landing Pages';
const UNSET_PAGE_ID = 'unset-page';
const MODULE_ONE_TITLE = 'Module One';
const SITE_SETTINGS_TITLE = 'Site Settings';
const SINGLETON_ITEM_TITLE = 'Singleton Item';
const LANDING_PAGE_TITLE = 'Landing Page';
const TYPE_FILTER = '_type == $type';
const DUTCH_HOME_TEMPLATE_ID = 'homePage-NL';
const ENGLISH_LANDING_TEMPLATE_ID = 'landingPage-EN';
const DUTCH_LANDING_TEMPLATE_ID = 'landingPage-NL';

vi.mock('@sanity/orderable-document-list', () => ({
  OrderableDocumentList: () => null,
}));

const LANGUAGE_DATASET = [
  { _id: 'en-page', _type: 'landingPage', language: LOCALE_ISO_CODES.EN },
  { _id: 'nl-page', _type: 'landingPage', language: LOCALE_ISO_CODES.NL },
  { _id: UNSET_PAGE_ID, _type: 'landingPage' },
  {
    _id: 'nl-child',
    _type: 'landingPage',
    language: LOCALE_ISO_CODES.NL,
    parent: { _type: 'reference', _ref: 'nl-page' },
  },
  { _id: 'nl-post', _type: 'postPage', language: LOCALE_ISO_CODES.NL },
];

const listedIds = async (list: TMockStructureNode) => {
  const [filter] = callArgs(list, 'filter') as [string];
  const [params] = callArgs(list, 'params') as [Record<string, unknown>];
  return mockGroqFetch(LANGUAGE_DATASET)(`*[${filter}]._id`, params);
};

const makeMockStructureBuilder = (dataset: Record<string, unknown>[] = []) => ({
  context: {
    getClient: () => ({ fetch: mockGroqFetch(dataset) }),
  },
  divider: vi.fn(() => mockStructureNode('divider')),
  listItem: vi.fn(() => mockStructureNode('listItem')),
  documentTypeListItem: vi.fn((documentType: string) =>
    mockStructureNode('documentTypeListItem', documentType),
  ),
  documentTypeList: vi.fn((documentType: string) =>
    mockStructureNode('documentTypeList', documentType),
  ),
  document: vi.fn(() => mockStructureNode('document')),
  list: vi.fn(() => mockStructureNode('list')),
  documentList: vi.fn(() => mockStructureNode('documentList')),
  initialValueTemplateItem: vi.fn((templateId: string) => ({ templateId })),
});

const asStructureBuilder = (S: ReturnType<typeof makeMockStructureBuilder>) =>
  S as unknown as StructureBuilder;

const buildOneSection = (
  S: ReturnType<typeof makeMockStructureBuilder>,
  section: TStructureSection,
  locales?: readonly TLocaleIsoCode[],
): TMockStructureNode => {
  const [result] = buildSections(
    asStructureBuilder(S),
    [section],
    locales,
  ) as unknown as TMockStructureNode[];
  return result!;
};

const getGroupItems = (
  S: ReturnType<typeof makeMockStructureBuilder>,
  groups: TStructureSection['groups'],
  locales?: readonly TLocaleIsoCode[],
): TMockStructureNode[] => {
  const sectionItem = buildOneSection(
    S,
    {
      title: 'Section',
      id: 'section',
      icon: List,
      groups,
    },
    locales,
  );
  const childList = callArgs(sectionItem, 'child')?.[0] as TMockStructureNode;
  return callArgs(childList, 'items')?.[0] as TMockStructureNode[];
};

describe(buildSections, () => {
  let S: ReturnType<typeof makeMockStructureBuilder>;

  beforeEach(() => {
    S = makeMockStructureBuilder();
  });

  it('flattens 3 groups into divider + items, preserving declared order with no leading/trailing extra divider', () => {
    const items = getGroupItems(S, [
      {
        title: 'Group A',
        items: [
          {
            schema: { name: 'moduleOne', title: MODULE_ONE_TITLE, icon: List },
          },
          { schema: { name: 'moduleTwo', title: MODULE_TWO_TITLE, icon: Tag } },
        ],
      },
      {
        title: 'Group B',
        items: [
          {
            schema: { name: 'homePage', title: 'Home Page', icon: House },
            mode: 'singleton',
          },
        ],
      },
      {
        title: 'Group C',
        items: [
          { schema: { name: 'tagPage', title: 'Tag Pages', icon: Tag } },
          {
            schema: {
              name: 'siteSettings',
              title: SITE_SETTINGS_TITLE,
              icon: Settings,
            },
            mode: 'singleton',
          },
        ],
      },
    ]);

    expect(items.map((builder) => builder.kind)).toEqual([
      'divider',
      'documentTypeListItem',
      'documentTypeListItem',
      'divider',
      'listItem',
      'divider',
      'documentTypeListItem',
      'listItem',
    ]);

    expect(callArgs(items[0]!, 'title')).toEqual(['Group A']);
    expect(callArgs(items[3]!, 'title')).toEqual(['Group B']);
    expect(callArgs(items[5]!, 'title')).toEqual(['Group C']);
    expect(items.at(-1)?.kind).not.toBe('divider');

    expect(items[1]?.documentType).toBe('moduleOne');
    expect(items[2]?.documentType).toBe('moduleTwo');
    expect(items[6]?.documentType).toBe('tagPage');
    expect(callArgs(items[7]!, 'id')).toEqual(['siteSettings']);
  });

  it('drops an empty group entirely, including its divider, without crashing', () => {
    const items = getGroupItems(S, [
      {
        title: 'Group A',
        items: [
          {
            schema: { name: 'moduleOne', title: MODULE_ONE_TITLE, icon: List },
          },
        ],
      },
      { title: 'Group B (empty)', items: [] },
      {
        title: 'Group C',
        items: [
          { schema: { name: 'moduleTwo', title: MODULE_TWO_TITLE, icon: Tag } },
        ],
      },
    ]);

    expect(items.map((builder) => builder.kind)).toEqual([
      'divider',
      'documentTypeListItem',
      'divider',
      'documentTypeListItem',
    ]);
    expect(callArgs(items[0]!, 'title')).toEqual(['Group A']);
    expect(callArgs(items[2]!, 'title')).toEqual(['Group C']);
  });

  it('builds a list item via S.documentTypeListItem() and a singleton item via S.listItem()/S.document()', () => {
    const items = getGroupItems(S, [
      {
        title: 'Group',
        items: [
          { schema: { name: 'listType', title: 'List Item', icon: List } },
          {
            schema: {
              name: 'singletonType',
              title: SINGLETON_ITEM_TITLE,
              icon: House,
            },
            mode: 'singleton',
          },
        ],
      },
    ]);

    const [, listItemBuilder, singletonBuilder] = items;

    expect(listItemBuilder?.kind).toBe('documentTypeListItem');
    expect(listItemBuilder?.documentType).toBe('listType');
    expect(callArgs(listItemBuilder!, 'title')).toEqual(['List Item']);
    expect(callArgs(listItemBuilder!, 'icon')).toEqual([List]);
    expect(S.documentTypeListItem).toHaveBeenCalledTimes(1);
    expect(S.documentTypeListItem).toHaveBeenCalledWith('listType');

    expect(singletonBuilder?.kind).toBe('listItem');
    expect(callArgs(singletonBuilder!, 'id')).toEqual(['singletonType']);
    expect(callArgs(singletonBuilder!, 'title')).toEqual([
      SINGLETON_ITEM_TITLE,
    ]);
    expect(callArgs(singletonBuilder!, 'icon')).toEqual([House]);

    const childArgs = callArgs(singletonBuilder!, 'child');
    const childBuilder = childArgs?.[0] as TMockStructureNode;
    expect(childBuilder.kind).toBe('document');
    expect(callArgs(childBuilder, 'schemaType')).toEqual(['singletonType']);
    expect(callArgs(childBuilder, 'documentId')).toEqual(['singletonType']);
    expect(S.document).toHaveBeenCalledTimes(1);
  });

  it('treats an omitted mode the same as an explicit "list" mode', () => {
    const items = getGroupItems(S, [
      {
        title: 'Group',
        items: [
          {
            schema: { name: 'defaultMode', title: 'Default Mode', icon: List },
          },
          {
            schema: { name: 'explicitList', title: 'Explicit List', icon: Tag },
            mode: 'list',
          },
        ],
      },
    ]);

    expect(items.map((builder) => builder.kind)).toEqual([
      'divider',
      'documentTypeListItem',
      'documentTypeListItem',
    ]);
    expect(S.documentTypeListItem).toHaveBeenCalledTimes(2);
    expect(S.document).not.toHaveBeenCalled();
  });

  it('emits an untitled group with no divider while a titled group still gets one', () => {
    const items = getGroupItems(S, [
      {
        items: [
          {
            schema: { name: 'homePage', title: 'Home Page', icon: House },
            mode: 'singleton',
          },
          {
            schema: {
              name: 'landingPage',
              title: LANDING_PAGE_TITLE,
              icon: List,
            },
          },
        ],
      },
      {
        title: 'Settings',
        items: [
          {
            schema: {
              name: 'siteSettings',
              title: SITE_SETTINGS_TITLE,
              icon: Settings,
            },
          },
        ],
      },
    ]);

    expect(items.map((builder) => builder.kind)).toEqual([
      'listItem',
      'documentTypeListItem',
      'divider',
      'documentTypeListItem',
    ]);
    expect(S.divider).toHaveBeenCalledTimes(1);
    expect(callArgs(items[2]!, 'title')).toEqual(['Settings']);
    expect(callArgs(items[0]!, 'id')).toEqual(['homePage']);
    expect(callArgs(items[1]!, 'title')).toEqual([LANDING_PAGE_TITLE]);
  });

  it('emits a bare divider before an untitled group carrying dividerBefore', () => {
    const items = getGroupItems(S, [
      {
        items: [
          { schema: { name: 'navigation', title: 'Navigation', icon: List } },
        ],
      },
      {
        dividerBefore: true,
        items: [
          {
            schema: {
              name: 'siteSettings',
              title: SITE_SETTINGS_TITLE,
              icon: Settings,
            },
          },
        ],
      },
    ]);

    expect(items.map((builder) => builder.kind)).toEqual([
      'documentTypeListItem',
      'divider',
      'documentTypeListItem',
    ]);
    expect(callArgs(items[1]!, 'title')).toBeUndefined();
  });

  it('builds a listItem with the section title/id/icon and a matching child list', () => {
    const result = buildOneSection(S, {
      title: 'Pages',
      id: 'pages',
      icon: List,
      groups: [
        {
          items: [
            { schema: { name: 'homePage', title: 'Home Page', icon: House } },
          ],
        },
      ],
    });

    expect(result.kind).toBe('listItem');
    expect(callArgs(result, 'title')).toEqual(['Pages']);
    expect(callArgs(result, 'id')).toEqual(['pages']);
    expect(callArgs(result, 'icon')).toEqual([List]);

    const childArgs = callArgs(result, 'child');
    const childList = childArgs?.[0] as TMockStructureNode;
    expect(childList.kind).toBe('list');
    expect(callArgs(childList, 'title')).toEqual(['Pages']);

    const items = callArgs(childList, 'items')?.[0] as TMockStructureNode[];
    expect(items.map((item) => item.kind)).toEqual(['documentTypeListItem']);
    expect(S.list).toHaveBeenCalledTimes(1);
  });

  it('skips the middle list and children straight into the document list when flattenSingleItem is set on a single non-singleton item, keeping the section title rather than the item schema title', () => {
    const result = buildOneSection(S, {
      title: 'Links',
      id: 'links',
      icon: Link2,
      flattenSingleItem: true,
      groups: [
        {
          items: [{ schema: { name: 'link', title: 'Link', icon: Link2 } }],
        },
      ],
    });

    expect(result.kind).toBe('listItem');
    expect(callArgs(result, 'title')).toEqual(['Links']);
    expect(callArgs(result, 'id')).toEqual(['links']);
    expect(callArgs(result, 'icon')).toEqual([Link2]);

    const childArgs = callArgs(result, 'child');
    const childList = childArgs?.[0] as TMockStructureNode;
    expect(childList.kind).toBe('documentTypeList');
    expect(childList.documentType).toBe('link');
    expect(callArgs(childList, 'title')).toEqual(['Links']);
    expect(S.documentTypeList).toHaveBeenCalledTimes(1);
    expect(S.list).not.toHaveBeenCalled();
  });

  it.each<[string, TStructureSection]>([
    [
      'the section has more than one item',
      {
        title: 'Modules',
        id: 'modules',
        icon: List,
        flattenSingleItem: true,
        groups: [
          {
            items: [
              {
                schema: {
                  name: 'moduleOne',
                  title: MODULE_ONE_TITLE,
                  icon: List,
                },
              },
              {
                schema: {
                  name: 'moduleTwo',
                  title: MODULE_TWO_TITLE,
                  icon: Tag,
                },
              },
            ],
          },
        ],
      },
    ],
    [
      'the single item is a singleton',
      {
        title: 'Settings',
        id: 'settings',
        icon: Settings,
        flattenSingleItem: true,
        groups: [
          {
            items: [
              {
                schema: {
                  name: 'siteSettings',
                  title: SITE_SETTINGS_TITLE,
                  icon: Settings,
                },
                mode: 'singleton',
              },
            ],
          },
        ],
      },
    ],
  ])('throws when flattenSingleItem is set but %s', (_description, section) => {
    expect(() => buildSections(asStructureBuilder(S), [section])).toThrow(
      /flattenSingleItem/,
    );
  });

  it('places no divider before the first section and none between sections without dividerBefore', () => {
    const sections: TStructureSection[] = [
      {
        title: 'Pages',
        id: 'pages',
        icon: List,
        groups: [
          {
            items: [
              { schema: { name: 'homePage', title: 'Home Page', icon: House } },
            ],
          },
        ],
      },
      {
        title: 'Blog',
        id: 'blog',
        icon: Tag,
        groups: [
          {
            items: [
              { schema: { name: 'blogPage', title: 'Blog Page', icon: Tag } },
            ],
          },
        ],
      },
    ];

    const result = buildSections(
      asStructureBuilder(S),
      sections,
    ) as unknown as TMockStructureNode[];

    expect(result.map((builder) => builder.kind)).toEqual([
      'listItem',
      'listItem',
    ]);
    expect(S.divider).not.toHaveBeenCalled();
  });

  it('places a bare divider before a section carrying dividerBefore', () => {
    const sections: TStructureSection[] = [
      {
        title: 'Modules',
        id: 'modules',
        icon: List,
        groups: [
          { items: [{ schema: { name: 'cta', title: 'CTA', icon: Tag } }] },
        ],
      },
      {
        title: 'Settings',
        id: 'settings',
        icon: Settings,
        dividerBefore: true,
        groups: [
          {
            items: [
              {
                schema: {
                  name: 'siteSettings',
                  title: SITE_SETTINGS_TITLE,
                  icon: Settings,
                },
              },
            ],
          },
        ],
      },
    ];

    const result = buildSections(
      asStructureBuilder(S),
      sections,
    ) as unknown as TMockStructureNode[];

    expect(result.map((builder) => builder.kind)).toEqual([
      'listItem',
      'divider',
      'listItem',
    ]);
    expect(callArgs(result[0]!, 'id')).toEqual(['modules']);
    expect(callArgs(result[2]!, 'id')).toEqual(['settings']);
  });
  describe('byLanguage items', () => {
    const buildLandingItem = (locales?: readonly TLocaleIsoCode[]) => {
      const S = makeMockStructureBuilder();
      const [item] = getGroupItems(
        S,
        [
          {
            items: [
              {
                schema: {
                  name: 'landingPage',
                  title: LANDING_PAGES_TITLE,
                  icon: List,
                },
                mode: 'byLanguage',
              },
            ],
          },
        ],
        locales,
      );
      return { S, item: item! };
    };

    const listOf = (languageItem: TMockStructureNode) =>
      callArgs(languageItem, 'child')?.[0] as TMockStructureNode;

    const buildLanguageLists = (locales?: readonly TLocaleIsoCode[]) => {
      const { item } = buildLandingItem(locales);
      const list = callArgs(item, 'child')?.[0] as TMockStructureNode;
      return callArgs(list, 'items')?.[0] as TMockStructureNode[];
    };

    it('shows one plain list of every page with one live language, creating pages in it', () => {
      const { S, item } = buildLandingItem([LOCALE_ISO_CODES.NL]);
      const documentList = callArgs(item, 'child')?.[0] as TMockStructureNode;

      expect(callArgs(item, 'title')).toEqual([LANDING_PAGES_TITLE]);
      expect(documentList.kind).toBe('documentTypeList');
      expect(documentList.documentType).toBe('landingPage');
      expect(callArgs(documentList, 'title')).toEqual([LANDING_PAGES_TITLE]);
      expect(callArgs(documentList, 'initialValueTemplates')).toEqual([
        [{ templateId: DUTCH_LANDING_TEMPLATE_ID }],
      ]);
      expect(S.list).toHaveBeenCalledTimes(1);
      expect(S.divider).not.toHaveBeenCalled();
    });

    it('lists only default-language pages, and pages with no language, with one live language', async () => {
      const { item } = buildLandingItem([LOCALE_ISO_CODES.NL]);

      expect(
        await listedIds(callArgs(item, 'child')?.[0] as TMockStructureNode),
      ).toEqual(['nl-page', UNSET_PAGE_ID, 'nl-child']);
    });

    it('lists the other language again once it is live', async () => {
      const lists = buildLanguageLists([
        LOCALE_ISO_CODES.EN,
        LOCALE_ISO_CODES.NL,
      ]);

      expect(await listedIds(listOf(lists[0]!))).toEqual(['en-page']);
      expect(await listedIds(listOf(lists.at(-1)!))).toEqual([
        'en-page',
        'nl-page',
        UNSET_PAGE_ID,
        'nl-child',
      ]);
    });

    it('keeps a list per language and all pages with two live languages', () => {
      const lists = buildLanguageLists([
        LOCALE_ISO_CODES.EN,
        LOCALE_ISO_CODES.NL,
      ]);

      expect(lists.map((list) => list.kind)).toEqual([
        'listItem',
        'listItem',
        'divider',
        'listItem',
      ]);
      expect(
        lists
          .filter((list) => list.kind === 'listItem')
          .map((list) => callArgs(list, 'title')?.[0]),
      ).toEqual([
        LOCALE_NATIVE_LABEL[LOCALE_ISO_CODES.EN],
        LOCALE_NATIVE_LABEL[LOCALE_ISO_CODES.NL],
        'All pages',
      ]);
    });

    it('lists every locale by its own name, then a divider, then all pages', () => {
      const lists = buildLanguageLists();

      expect(lists.map((list) => list.kind)).toEqual([
        ...Object.values(LOCALE_ISO_CODES).map(() => 'listItem'),
        'divider',
        'listItem',
      ]);
      expect(
        lists
          .filter((list) => list.kind === 'listItem')
          .map((list) => callArgs(list, 'title')?.[0]),
      ).toEqual([
        ...Object.values(LOCALE_ISO_CODES).map(
          (locale) => LOCALE_NATIVE_LABEL[locale],
        ),
        'All pages',
      ]);
    });

    it('lists every page in all pages and offers a template per language', () => {
      const documentList = listOf(buildLanguageLists().at(-1)!);

      expect(callArgs(documentList, 'filter')).toEqual([TYPE_FILTER]);
      expect(callArgs(documentList, 'initialValueTemplates')).toEqual([
        Object.values(LOCALE_ISO_CODES).map((locale) => ({
          templateId: `landingPage-${locale}`,
        })),
      ]);
    });

    it('filters each language list to its language and creates pages in it', () => {
      const [english] = buildLanguageLists();
      const documentList = listOf(english!);

      expect(callArgs(documentList, 'filter')).toEqual([
        '_type == $type && language == $language',
      ]);
      expect(callArgs(documentList, 'params')).toEqual([
        { type: 'landingPage', language: LOCALE_ISO_CODES.EN },
      ]);
      expect(callArgs(documentList, 'initialValueTemplates')).toEqual([
        [{ templateId: ENGLISH_LANDING_TEMPLATE_ID }],
      ]);
    });

    it('builds every list from the document type list so it keeps the sort menu', () => {
      const lists = buildLanguageLists().filter(
        (list) => list.kind === 'listItem',
      );

      expect(lists.map((list) => listOf(list).kind)).toEqual(
        lists.map(() => 'documentTypeList'),
      );
      expect(lists.map((list) => listOf(list).documentType)).toEqual(
        lists.map(() => 'landingPage'),
      );
    });
  });

  describe('pageTree items', () => {
    const buildTreeItem = (locales?: readonly TLocaleIsoCode[]) => {
      const S = makeMockStructureBuilder();
      const [item] = getGroupItems(
        S,
        [
          {
            items: [
              {
                schema: {
                  name: 'landingPage',
                  title: LANDING_PAGES_TITLE,
                  icon: List,
                },
                mode: 'pageTree',
              },
            ],
          },
        ],
        locales,
      );
      return item!;
    };

    const documentListOf = (item: TMockStructureNode) =>
      callArgs(item, 'child')?.[0] as TMockStructureNode;

    let list: TMockStructureNode;

    beforeEach(() => {
      list = documentListOf(buildTreeItem());
    });

    it('lists only top-level pages per language and opens each through the tree', () => {
      const [english] = callArgs(list, 'items')?.[0] as TMockStructureNode[];
      const englishList = documentListOf(english!);

      expect(callArgs(englishList, 'filter')).toEqual([
        '_type == $type && language == $language && !defined(parent)',
      ]);
      expect(callArgs(englishList, 'initialValueTemplates')).toEqual([
        [{ templateId: ENGLISH_LANDING_TEMPLATE_ID }],
      ]);
      expect(callArgs(englishList, 'child')?.[0]).toBeTypeOf('function');
    });

    it('keeps all pages as one flat list of every page', () => {
      const allPages = (
        callArgs(list, 'items')?.[0] as TMockStructureNode[]
      ).at(-1)!;
      const allPagesList = documentListOf(allPages);

      expect(callArgs(allPages, 'title')).toEqual(['All pages']);
      expect(callArgs(allPagesList, 'filter')).toEqual([TYPE_FILTER]);
      expect(callArgs(allPagesList, 'child')).toBeUndefined();
    });

    it('lists only top-level default-language pages with one live language', async () => {
      const documentList = documentListOf(buildTreeItem([LOCALE_ISO_CODES.NL]));

      expect(documentList.kind).toBe('documentTypeList');
      expect(await listedIds(documentList)).toEqual(['nl-page', UNSET_PAGE_ID]);
      expect(callArgs(documentList, 'initialValueTemplates')).toEqual([
        [{ templateId: DUTCH_LANDING_TEMPLATE_ID }],
      ]);
      expect(callArgs(documentList, 'child')?.[0]).toBeTypeOf('function');
    });
  });

  describe('onePerLanguage items', () => {
    const { EN, NL, DE } = LOCALE_ISO_CODES;

    const buildHomeEntries = (
      dataset: Record<string, unknown>[],
      locales: readonly TLocaleIsoCode[] = [NL, EN, DE],
    ) => {
      const S = makeMockStructureBuilder(dataset);
      const [section] = buildSections(
        asStructureBuilder(S),
        [
          {
            title: 'Pages',
            id: 'pages',
            icon: List,
            groups: [
              {
                items: [
                  {
                    schema: { name: 'homePage', title: 'Home', icon: House },
                    mode: 'onePerLanguage',
                  },
                ],
              },
            ],
          },
        ],
        locales,
      ) as unknown as TMockStructureNode[];
      const list = callArgs(section!, 'child')?.[0] as TMockStructureNode;
      return callArgs(list, 'items')?.[0] as TMockStructureNode[];
    };

    const buildHomeItems = (dataset: Record<string, unknown>[]) => {
      const [home] = buildHomeEntries(dataset);
      const languages = callArgs(home!, 'child')?.[0] as TMockStructureNode;
      return callArgs(languages, 'items')?.[0] as TMockStructureNode[];
    };

    const resolveChild = async (item: TMockStructureNode) => {
      const resolver = callArgs(
        item,
        'child',
      )?.[0] as () => Promise<TMockStructureNode>;
      return resolver();
    };

    it('shows one Home entry that opens its language list', () => {
      const entries = buildHomeEntries([]);
      const languages = callArgs(
        entries[0]!,
        'child',
      )?.[0] as TMockStructureNode;

      expect(entries).toHaveLength(1);
      expect(callArgs(entries[0]!, 'title')).toEqual(['Home']);
      expect(callArgs(entries[0]!, 'id')).toEqual(['homePage']);
      expect(languages.kind).toBe('list');
      expect(callArgs(languages, 'title')).toEqual(['Home']);
    });

    it('opens the default-language Home directly with one live language', async () => {
      const [home, ...rest] = buildHomeEntries(
        [{ _id: 'home-nl', _type: 'homePage', language: NL }],
        [NL],
      );

      const child = await resolveChild(home!);

      expect(rest).toHaveLength(0);
      expect(callArgs(home!, 'title')).toEqual(['Home']);
      expect(child.kind).toBe('document');
      expect(callArgs(child, 'documentId')).toEqual(['home-nl']);
    });

    it('creates the default-language Home with one live language when there is none', async () => {
      const [home] = buildHomeEntries([], [NL]);

      const child = await resolveChild(home!);

      expect(callArgs(child, 'documentId')).toEqual(['homePage']);
      expect(callArgs(child, 'initialValueTemplate')).toEqual([
        DUTCH_HOME_TEMPLATE_ID,
      ]);
    });

    it('keeps one entry per language with two live languages', () => {
      const [home] = buildHomeEntries([], [NL, EN]);
      const languages = callArgs(home!, 'child')?.[0] as TMockStructureNode;
      const items = callArgs(languages, 'items')?.[0] as TMockStructureNode[];

      expect(languages.kind).toBe('list');
      expect(items.map((item) => callArgs(item, 'title')?.[0])).toEqual([
        LOCALE_NATIVE_LABEL[NL],
        LOCALE_NATIVE_LABEL[EN],
      ]);
    });

    it('lists one entry per language by its own name, default language first', () => {
      const items = buildHomeItems([]);

      expect(items.map((item) => callArgs(item, 'title')?.[0])).toEqual([
        LOCALE_NATIVE_LABEL[NL],
        LOCALE_NATIVE_LABEL[EN],
        LOCALE_NATIVE_LABEL[DE],
      ]);
    });

    it("opens the language's own document by its published id", async () => {
      const [, english] = buildHomeItems([
        { _id: 'home-nl', _type: 'homePage', language: NL },
        { _id: 'drafts.home-en', _type: 'homePage', language: EN },
      ]);

      const child = await resolveChild(english!);

      expect(child.kind).toBe('document');
      expect(callArgs(child, 'documentId')).toEqual(['home-en']);
    });

    it('opens a document without a language under the default language', async () => {
      const [dutch] = buildHomeItems([{ _id: 'homePage', _type: 'homePage' }]);

      const child = await resolveChild(dutch!);

      expect(callArgs(child, 'documentId')).toEqual(['homePage']);
    });

    it('creates the default-language document in its language when there is none', async () => {
      const [dutch] = buildHomeItems([]);

      const child = await resolveChild(dutch!);

      expect(child.kind).toBe('document');
      expect(callArgs(child, 'initialValueTemplate')).toEqual([
        DUTCH_HOME_TEMPLATE_ID,
      ]);
    });

    it('opens a new document in a language that has none', async () => {
      const [, english] = buildHomeItems([
        { _id: 'homePage', _type: 'homePage', language: NL },
      ]);

      const child = await resolveChild(english!);

      expect(child.kind).toBe('document');
      expect(callArgs(child, 'schemaType')).toEqual(['homePage']);
      expect(callArgs(child, 'initialValueTemplate')).toEqual(['homePage-EN']);
      expect(callArgs(child, 'documentId')).not.toEqual(['homePage']);
    });
  });
});
