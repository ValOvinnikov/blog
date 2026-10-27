import {
  LOCALE_ISO_CODES,
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import {
  mockHomePage,
  mockLandingPage,
  mockPage,
} from '@blog/studio/testing/mock-documents';
import {
  asStructureBuilder,
  matchingIds,
  mockStructureBuilder,
  type TMockStructureBuilder,
} from '@blog/studio/testing/structure/mock-structure-builder';
import {
  callArgs,
  type TMockStructureNode,
} from '@blog/studio/testing/structure/mock-structure-node';
import { faker } from '@faker-js/faker';
import { House, List } from 'lucide-react';
import { getDraftId } from 'sanity';

import { buildSections, type TStructureSection } from './build-section';

faker.seed(6017);

vi.mock('@sanity/orderable-document-list', () => ({
  OrderableDocumentList: () => null,
}));

type TGroup = TStructureSection['groups'][number];
type TGroupItem = TGroup['items'][number];

const { EN, NL, DE } = LOCALE_ISO_CODES;
const EVERY_LOCALE = Object.values(LOCALE_ISO_CODES);
const LIVE_LOCALES = [NL, EN, DE];

const mockSchema = () => ({
  name: faker.string.alpha(12),
  title: faker.lorem.words(2),
  icon: List,
});

const mockSection = (
  overrides: Partial<TStructureSection> = {},
): TStructureSection => ({
  title: faker.lorem.word(),
  id: faker.string.alpha(10),
  icon: House,
  groups: [{ items: [{ schema: mockSchema() }] }],
  ...overrides,
});

const MOCK_LIST_ITEM: TGroupItem = { schema: mockSchema() };
const MOCK_OTHER_LIST_ITEM: TGroupItem = { schema: mockSchema() };
const MOCK_SINGLETON_ITEM: TGroupItem = {
  schema: mockSchema(),
  mode: 'singleton',
};
const [MOCK_GROUP_TITLE, MOCK_OTHER_GROUP_TITLE] = [
  faker.lorem.words(2),
  faker.lorem.words(2),
];
const MOCK_LANDING_SCHEMA = { ...mockSchema(), name: PAGE_LANDING_TYPE };
const MOCK_HOME_SCHEMA = { ...mockSchema(), name: PAGE_HOME_TYPE };

const MOCK_EN_PAGE = mockLandingPage({
  _id: faker.string.uuid(),
  language: EN,
});
const MOCK_NL_PAGE = mockLandingPage({
  _id: faker.string.uuid(),
  language: NL,
});
const MOCK_UNSET_PAGE = mockLandingPage({ _id: faker.string.uuid() });
const MOCK_NL_CHILD = mockLandingPage({
  _id: faker.string.uuid(),
  language: NL,
  parent: MOCK_NL_PAGE._id,
});
const MOCK_LANDING_DATASET = [
  MOCK_EN_PAGE,
  MOCK_NL_PAGE,
  MOCK_UNSET_PAGE,
  MOCK_NL_CHILD,
  mockPage({ _id: faker.string.uuid(), _type: PAGE_POST_TYPE, language: NL }),
];

const MOCK_HOME_NL_ID = faker.string.uuid();
const MOCK_HOME_EN_ID = faker.string.uuid();
const MOCK_HOME_UNSET_ID = faker.string.uuid();
const MOCK_NEW_DOCUMENT_ID = faker.string.uuid() as ReturnType<
  typeof crypto.randomUUID
>;

const templateIdOf = (name: string, locale: TLocaleIsoCode) =>
  `${name}-${locale}`;

const childOf = (node: TMockStructureNode) =>
  callArgs(node, 'child')?.[0] as TMockStructureNode;

const itemsOf = (node: TMockStructureNode) =>
  callArgs(node, 'items')?.[0] as TMockStructureNode[];

const titleOf = (node: TMockStructureNode) => callArgs(node, 'title')?.[0];

const kindAndTitle = (node: TMockStructureNode) => [node.kind, titleOf(node)];

const buildNodes = (
  S: TMockStructureBuilder,
  sections: TStructureSection[],
  locales?: readonly TLocaleIsoCode[],
) =>
  buildSections(
    asStructureBuilder(S),
    sections,
    locales,
  ) as unknown as TMockStructureNode[];

const buildGroupItems = (
  S: TMockStructureBuilder,
  groups: TGroup[],
  locales?: readonly TLocaleIsoCode[],
) => {
  const [section] = buildNodes(S, [mockSection({ groups })], locales);
  return itemsOf(childOf(section!));
};

const buildSingleItem = (
  S: TMockStructureBuilder,
  item: TGroupItem,
  locales?: readonly TLocaleIsoCode[],
) => {
  const [node] = buildGroupItems(S, [{ items: [item] }], locales);
  return node!;
};

const listedIds = (list: TMockStructureNode) => {
  const [filter] = callArgs(list, 'filter') as [string];
  const [params] = callArgs(list, 'params') as [Record<string, unknown>];
  return matchingIds(MOCK_LANDING_DATASET, filter, params);
};

describe(buildSections, () => {
  let S: TMockStructureBuilder;

  beforeEach(() => {
    S = mockStructureBuilder();
  });

  it.each<{ case: string; groups: TGroup[]; expected: unknown[][] }>([
    {
      case: 'puts a titled divider before each group, in declared order',
      groups: [
        {
          title: MOCK_GROUP_TITLE,
          items: [MOCK_LIST_ITEM, MOCK_SINGLETON_ITEM],
        },
        { title: MOCK_OTHER_GROUP_TITLE, items: [MOCK_OTHER_LIST_ITEM] },
      ],
      expected: [
        ['divider', MOCK_GROUP_TITLE],
        ['documentTypeListItem', MOCK_LIST_ITEM.schema.title],
        ['listItem', MOCK_SINGLETON_ITEM.schema.title],
        ['divider', MOCK_OTHER_GROUP_TITLE],
        ['documentTypeListItem', MOCK_OTHER_LIST_ITEM.schema.title],
      ],
    },
    {
      case: 'drops an empty group along with its divider',
      groups: [
        { title: MOCK_GROUP_TITLE, items: [] },
        { title: MOCK_OTHER_GROUP_TITLE, items: [MOCK_LIST_ITEM] },
      ],
      expected: [
        ['divider', MOCK_OTHER_GROUP_TITLE],
        ['documentTypeListItem', MOCK_LIST_ITEM.schema.title],
      ],
    },
    {
      case: 'gives an untitled group no divider',
      groups: [
        { items: [MOCK_LIST_ITEM] },
        { title: MOCK_GROUP_TITLE, items: [MOCK_OTHER_LIST_ITEM] },
      ],
      expected: [
        ['documentTypeListItem', MOCK_LIST_ITEM.schema.title],
        ['divider', MOCK_GROUP_TITLE],
        ['documentTypeListItem', MOCK_OTHER_LIST_ITEM.schema.title],
      ],
    },
    {
      case: 'puts a bare divider before an untitled group marked dividerBefore',
      groups: [
        { items: [MOCK_LIST_ITEM] },
        { dividerBefore: true, items: [MOCK_OTHER_LIST_ITEM] },
      ],
      expected: [
        ['documentTypeListItem', MOCK_LIST_ITEM.schema.title],
        ['divider', undefined],
        ['documentTypeListItem', MOCK_OTHER_LIST_ITEM.schema.title],
      ],
    },
  ])('$case', ({ groups, expected }) => {
    const items = buildGroupItems(S, groups);

    expect(items.map(kindAndTitle)).toEqual(expected);
  });

  it.each<{ case: string; item: TGroupItem }>([
    { case: 'with no mode', item: MOCK_LIST_ITEM },
    { case: 'in list mode', item: { ...MOCK_LIST_ITEM, mode: 'list' } },
  ])('lists every document of a type $case', ({ item }) => {
    const node = buildSingleItem(S, item);
    const { name, title, icon } = item.schema;

    expect(node.kind).toBe('documentTypeListItem');
    expect(node.documentType).toBe(name);
    expect(callArgs(node, 'title')).toEqual([title]);
    expect(callArgs(node, 'icon')).toEqual([icon]);
  });

  it('opens a singleton as the one document whose id is its type', () => {
    const node = buildSingleItem(S, MOCK_SINGLETON_ITEM);
    const { name, title, icon } = MOCK_SINGLETON_ITEM.schema;
    const document = childOf(node);

    expect(callArgs(node, 'id')).toEqual([name]);
    expect(callArgs(node, 'title')).toEqual([title]);
    expect(callArgs(node, 'icon')).toEqual([icon]);
    expect(document.kind).toBe('document');
    expect(callArgs(document, 'schemaType')).toEqual([name]);
    expect(callArgs(document, 'documentId')).toEqual([name]);
  });

  it('nests the groups in a list under the section title, id and icon', () => {
    const section = mockSection();
    const [node] = buildNodes(S, [section]);
    const list = childOf(node!);

    expect(callArgs(node!, 'title')).toEqual([section.title]);
    expect(callArgs(node!, 'id')).toEqual([section.id]);
    expect(callArgs(node!, 'icon')).toEqual([section.icon]);
    expect(list.kind).toBe('list');
    expect(callArgs(list, 'title')).toEqual([section.title]);
    expect(itemsOf(list).map((item) => item.kind)).toEqual([
      'documentTypeListItem',
    ]);
  });

  it('opens a flattened section straight on its one type under the section title', () => {
    const section = mockSection({
      flattenSingleItem: true,
      groups: [{ items: [MOCK_LIST_ITEM] }],
    });
    const [node] = buildNodes(S, [section]);
    const documentList = childOf(node!);

    expect(callArgs(node!, 'title')).toEqual([section.title]);
    expect(callArgs(node!, 'id')).toEqual([section.id]);
    expect(documentList.kind).toBe('documentTypeList');
    expect(documentList.documentType).toBe(MOCK_LIST_ITEM.schema.name);
    expect(callArgs(documentList, 'title')).toEqual([section.title]);
    expect(S.list).not.toHaveBeenCalled();
  });

  it.each<{ case: string; items: TGroupItem[] }>([
    {
      case: 'the section has more than one item',
      items: [MOCK_LIST_ITEM, MOCK_OTHER_LIST_ITEM],
    },
    { case: 'the single item is a singleton', items: [MOCK_SINGLETON_ITEM] },
  ])('refuses to flatten a section when $case', ({ items }) => {
    const section = mockSection({
      flattenSingleItem: true,
      groups: [{ items }],
    });

    expect(() => buildNodes(S, [section])).toThrow(/flattenSingleItem/);
  });

  it.each([
    { dividerBefore: false, expected: ['listItem', 'listItem'] },
    { dividerBefore: true, expected: ['listItem', 'divider', 'listItem'] },
  ])(
    'divides a section from the one before only with dividerBefore ($dividerBefore)',
    ({ dividerBefore, expected }) => {
      const nodes = buildNodes(S, [
        mockSection(),
        mockSection({ dividerBefore }),
      ]);

      expect(nodes.map((node) => node.kind)).toEqual(expected);
    },
  );

  describe('byLanguage items', () => {
    const buildLanguageLists = (locales?: readonly TLocaleIsoCode[]) =>
      itemsOf(
        childOf(
          buildSingleItem(
            S,
            { schema: MOCK_LANDING_SCHEMA, mode: 'byLanguage' },
            locales,
          ),
        ),
      );

    describe('with one live language', () => {
      let item: TMockStructureNode;
      let documentList: TMockStructureNode;

      beforeEach(() => {
        item = buildSingleItem(
          S,
          { schema: MOCK_LANDING_SCHEMA, mode: 'byLanguage' },
          [NL],
        );
        documentList = childOf(item);
      });

      it('opens one plain list of the type, creating pages in that language', () => {
        expect(callArgs(item, 'title')).toEqual([MOCK_LANDING_SCHEMA.title]);
        expect(documentList.kind).toBe('documentTypeList');
        expect(documentList.documentType).toBe(PAGE_LANDING_TYPE);
        expect(callArgs(documentList, 'title')).toEqual([
          MOCK_LANDING_SCHEMA.title,
        ]);
        expect(callArgs(documentList, 'initialValueTemplates')).toEqual([
          [{ templateId: templateIdOf(PAGE_LANDING_TYPE, NL) }],
        ]);
        expect(S.list).toHaveBeenCalledTimes(1);
      });

      it('lists only default-language pages, and pages with no language', async () => {
        const ids = await listedIds(documentList);

        expect(ids).toEqual([
          MOCK_NL_PAGE._id,
          MOCK_UNSET_PAGE._id,
          MOCK_NL_CHILD._id,
        ]);
      });
    });

    it.each<{ case: string; locales: TMaybeUndefined<TLocaleIsoCode[]> }>([
      { case: 'each live language', locales: [EN, NL] },
      { case: 'every locale by default', locales: undefined },
    ])('lists $case by name, then a divider, then all pages', ({ locales }) => {
      const expectedLocales = locales ?? EVERY_LOCALE;
      const lists = buildLanguageLists(locales);

      expect(lists.map((list) => list.kind)).toEqual([
        ...expectedLocales.map(() => 'listItem'),
        'divider',
        'listItem',
      ]);
      expect(lists.slice(0, expectedLocales.length).map(titleOf)).toEqual(
        expectedLocales.map((locale) => LOCALE_NATIVE_LABEL[locale]),
      );
    });

    describe('with several live languages', () => {
      let lists: TMockStructureNode[];
      let languageLists: TMockStructureNode[];

      beforeEach(() => {
        lists = buildLanguageLists();
        languageLists = lists.filter((list) => list.kind === 'listItem');
      });

      it.each([
        { locale: EN, expected: [MOCK_EN_PAGE._id] },
        { locale: NL, expected: [MOCK_NL_PAGE._id, MOCK_NL_CHILD._id] },
      ])(
        'lists only the $locale pages in the $locale list',
        async ({ locale, expected }) => {
          const ids = await listedIds(
            childOf(lists[EVERY_LOCALE.indexOf(locale)]!),
          );

          expect(ids).toEqual(expected);
        },
      );

      it('lists every page of the type under all pages', async () => {
        const ids = await listedIds(childOf(lists.at(-1)!));

        expect(ids).toEqual([
          MOCK_EN_PAGE._id,
          MOCK_NL_PAGE._id,
          MOCK_UNSET_PAGE._id,
          MOCK_NL_CHILD._id,
        ]);
      });

      it('creates pages in each list language, or in any language from all pages', () => {
        const templates = languageLists.map((list) =>
          callArgs(childOf(list), 'initialValueTemplates'),
        );

        expect(templates).toEqual([
          ...EVERY_LOCALE.map((locale) => [
            [{ templateId: templateIdOf(PAGE_LANDING_TYPE, locale) }],
          ]),
          [
            EVERY_LOCALE.map((locale) => ({
              templateId: templateIdOf(PAGE_LANDING_TYPE, locale),
            })),
          ],
        ]);
      });

      it('builds every list from the document type list so it keeps the sort menu', () => {
        const documentLists = languageLists.map(childOf);

        expect(
          documentLists.map((list) => [list.kind, list.documentType]),
        ).toEqual(
          languageLists.map(() => ['documentTypeList', PAGE_LANDING_TYPE]),
        );
      });
    });
  });

  describe('pageTree items', () => {
    const buildTreeList = (locales?: readonly TLocaleIsoCode[]) =>
      childOf(
        buildSingleItem(
          S,
          { schema: MOCK_LANDING_SCHEMA, mode: 'pageTree' },
          locales,
        ),
      );

    it('lists only top-level pages per language and opens each through the tree', async () => {
      const dutch = itemsOf(buildTreeList())[EVERY_LOCALE.indexOf(NL)]!;
      const dutchList = childOf(dutch);

      const ids = await listedIds(dutchList);

      expect(ids).toEqual([MOCK_NL_PAGE._id]);
      expect(childOf(dutchList)).toBeTypeOf('function');
    });

    it('keeps all pages as one flat list of every page', async () => {
      const allPagesList = childOf(itemsOf(buildTreeList()).at(-1)!);

      const ids = await listedIds(allPagesList);

      expect(ids).toEqual([
        MOCK_EN_PAGE._id,
        MOCK_NL_PAGE._id,
        MOCK_UNSET_PAGE._id,
        MOCK_NL_CHILD._id,
      ]);
      expect(callArgs(allPagesList, 'child')).toBeUndefined();
    });

    it('lists only top-level default-language pages with one live language', async () => {
      const documentList = buildTreeList([NL]);

      const ids = await listedIds(documentList);

      expect(documentList.kind).toBe('documentTypeList');
      expect(ids).toEqual([MOCK_NL_PAGE._id, MOCK_UNSET_PAGE._id]);
      expect(callArgs(documentList, 'initialValueTemplates')).toEqual([
        [{ templateId: templateIdOf(PAGE_LANDING_TYPE, NL) }],
      ]);
      expect(childOf(documentList)).toBeTypeOf('function');
    });
  });

  describe('onePerLanguage items', () => {
    const buildHomeEntry = (
      dataset: Record<string, unknown>[],
      locales: readonly TLocaleIsoCode[] = LIVE_LOCALES,
    ) =>
      buildSingleItem(
        mockStructureBuilder(dataset),
        { schema: MOCK_HOME_SCHEMA, mode: 'onePerLanguage' },
        locales,
      );

    const resolveHome = async (
      dataset: Record<string, unknown>[],
      locales: readonly TLocaleIsoCode[],
      locale: TLocaleIsoCode,
    ) => {
      const entry = buildHomeEntry(dataset, locales);
      const opener =
        locales.length > 1
          ? itemsOf(childOf(entry))[locales.indexOf(locale)]!
          : entry;
      const resolver = callArgs(
        opener,
        'child',
      )?.[0] as () => Promise<TMockStructureNode>;
      const document = await resolver();

      return {
        kind: document.kind,
        schemaType: callArgs(document, 'schemaType')?.[0],
        documentId: callArgs(document, 'documentId')?.[0],
        template: callArgs(document, 'initialValueTemplate')?.[0],
      };
    };

    it('shows one entry for the type that opens a list of its languages', () => {
      const entry = buildHomeEntry([]);
      const languages = childOf(entry);

      expect(callArgs(entry, 'title')).toEqual([MOCK_HOME_SCHEMA.title]);
      expect(callArgs(entry, 'id')).toEqual([PAGE_HOME_TYPE]);
      expect(languages.kind).toBe('list');
      expect(callArgs(languages, 'title')).toEqual([MOCK_HOME_SCHEMA.title]);
      expect(itemsOf(languages).map(titleOf)).toEqual(
        LIVE_LOCALES.map((locale) => LOCALE_NATIVE_LABEL[locale]),
      );
    });

    it.each([
      {
        case: 'opens the document of the only live language directly',
        dataset: [mockHomePage({ _id: MOCK_HOME_NL_ID, language: NL })],
        locales: [NL],
        locale: NL,
        expectedId: MOCK_HOME_NL_ID,
      },
      {
        case: 'opens the document of a language by its published id',
        dataset: [
          mockHomePage({ _id: MOCK_HOME_NL_ID, language: NL }),
          mockHomePage({ _id: getDraftId(MOCK_HOME_EN_ID), language: EN }),
        ],
        locales: LIVE_LOCALES,
        locale: EN,
        expectedId: MOCK_HOME_EN_ID,
      },
      {
        case: 'opens a document without a language under the default language',
        dataset: [mockHomePage({ _id: MOCK_HOME_UNSET_ID })],
        locales: LIVE_LOCALES,
        locale: NL,
        expectedId: MOCK_HOME_UNSET_ID,
      },
    ])('$case', async ({ dataset, locales, locale, expectedId }) => {
      const document = await resolveHome(dataset, locales, locale);

      expect(document).toEqual({
        kind: 'document',
        schemaType: PAGE_HOME_TYPE,
        documentId: expectedId,
        template: undefined,
      });
    });

    it.each([{ locales: [NL] }, { locales: LIVE_LOCALES }])(
      'creates the default-language document under its type id ($locales)',
      async ({ locales }) => {
        const document = await resolveHome([], locales, NL);

        expect(document).toEqual({
          kind: 'document',
          schemaType: PAGE_HOME_TYPE,
          documentId: PAGE_HOME_TYPE,
          template: templateIdOf(PAGE_HOME_TYPE, NL),
        });
      },
    );

    it('creates a new document in a language that has none', async () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce(MOCK_NEW_DOCUMENT_ID);

      const document = await resolveHome(
        [mockHomePage({ _id: MOCK_HOME_NL_ID, language: NL })],
        LIVE_LOCALES,
        EN,
      );

      expect(document).toEqual({
        kind: 'document',
        schemaType: PAGE_HOME_TYPE,
        documentId: MOCK_NEW_DOCUMENT_ID,
        template: templateIdOf(PAGE_HOME_TYPE, EN),
      });
    });
  });
});
