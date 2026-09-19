import { House, Link2, List, Settings, Tag } from 'lucide-react';
import type { StructureBuilder } from 'sanity/structure';

import { buildSections, type TStructureSection } from './build-section';

type TCall = { method: string; args: unknown[] };

type TMockBuilder = {
  kind: string;
  documentType?: string;
  calls: TCall[];
} & Record<string, unknown>;

const CHAINABLE_METHODS = [
  'title',
  'id',
  'icon',
  'child',
  'schemaType',
  'documentId',
  'items',
] as const;

const makeMockBuilder = (kind: string, documentType?: string): TMockBuilder => {
  const calls: TCall[] = [];
  const builder: TMockBuilder = { kind, documentType, calls };
  for (const method of CHAINABLE_METHODS) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  return builder;
};

const callArgs = (builder: TMockBuilder, method: string) =>
  builder.calls.find((call) => call.method === method)?.args;

const makeMockStructureBuilder = () => ({
  divider: vi.fn(() => makeMockBuilder('divider')),
  listItem: vi.fn(() => makeMockBuilder('listItem')),
  documentTypeListItem: vi.fn((documentType: string) =>
    makeMockBuilder('documentTypeListItem', documentType),
  ),
  documentTypeList: vi.fn((documentType: string) =>
    makeMockBuilder('documentTypeList', documentType),
  ),
  document: vi.fn(() => makeMockBuilder('document')),
  list: vi.fn(() => makeMockBuilder('list')),
});

const asStructureBuilder = (S: ReturnType<typeof makeMockStructureBuilder>) =>
  S as unknown as StructureBuilder;

const buildOneSection = (
  S: ReturnType<typeof makeMockStructureBuilder>,
  section: TStructureSection,
): TMockBuilder => {
  const [result] = buildSections(asStructureBuilder(S), [
    section,
  ]) as unknown as TMockBuilder[];
  return result!;
};

const getGroupItems = (
  S: ReturnType<typeof makeMockStructureBuilder>,
  groups: TStructureSection['groups'],
): TMockBuilder[] => {
  const sectionItem = buildOneSection(S, {
    title: 'Section',
    id: 'section',
    icon: List,
    groups,
  });
  const childList = callArgs(sectionItem, 'child')?.[0] as TMockBuilder;
  return callArgs(childList, 'items')?.[0] as TMockBuilder[];
};

describe(buildSections, () => {
  it('flattens 3 groups into divider + items, preserving declared order with no leading/trailing extra divider', () => {
    const S = makeMockStructureBuilder();
    const items = getGroupItems(S, [
      {
        title: 'Group A',
        items: [
          { schema: { name: 'moduleOne', title: 'Module One', icon: List } },
          { schema: { name: 'moduleTwo', title: 'Module Two', icon: Tag } },
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
              title: 'Site Settings',
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
    const S = makeMockStructureBuilder();
    const items = getGroupItems(S, [
      {
        title: 'Group A',
        items: [
          { schema: { name: 'moduleOne', title: 'Module One', icon: List } },
        ],
      },
      { title: 'Group B (empty)', items: [] },
      {
        title: 'Group C',
        items: [
          { schema: { name: 'moduleTwo', title: 'Module Two', icon: Tag } },
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
    const S = makeMockStructureBuilder();
    const items = getGroupItems(S, [
      {
        title: 'Group',
        items: [
          { schema: { name: 'listType', title: 'List Item', icon: List } },
          {
            schema: {
              name: 'singletonType',
              title: 'Singleton Item',
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
    expect(callArgs(singletonBuilder!, 'title')).toEqual(['Singleton Item']);
    expect(callArgs(singletonBuilder!, 'icon')).toEqual([House]);

    const childArgs = callArgs(singletonBuilder!, 'child');
    const childBuilder = childArgs?.[0] as TMockBuilder;
    expect(childBuilder.kind).toBe('document');
    expect(callArgs(childBuilder, 'schemaType')).toEqual(['singletonType']);
    expect(callArgs(childBuilder, 'documentId')).toEqual(['singletonType']);
    expect(S.document).toHaveBeenCalledTimes(1);
  });

  it('treats an omitted mode the same as an explicit "list" mode', () => {
    const S = makeMockStructureBuilder();
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
    const S = makeMockStructureBuilder();
    const items = getGroupItems(S, [
      {
        items: [
          {
            schema: { name: 'homePage', title: 'Home Page', icon: House },
            mode: 'singleton',
          },
          {
            schema: { name: 'landingPage', title: 'Landing Page', icon: List },
          },
        ],
      },
      {
        title: 'Settings',
        items: [
          {
            schema: {
              name: 'siteSettings',
              title: 'Site Settings',
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
    expect(callArgs(items[1]!, 'title')).toEqual(['Landing Page']);
  });

  it('emits a bare divider before an untitled group carrying dividerBefore', () => {
    const S = makeMockStructureBuilder();
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
              title: 'Site Settings',
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
    const S = makeMockStructureBuilder();
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
    const childList = childArgs?.[0] as TMockBuilder;
    expect(childList.kind).toBe('list');
    expect(callArgs(childList, 'title')).toEqual(['Pages']);

    const items = callArgs(childList, 'items')?.[0] as TMockBuilder[];
    expect(items.map((item) => item.kind)).toEqual(['documentTypeListItem']);
    expect(S.list).toHaveBeenCalledTimes(1);
  });

  it('skips the middle list and children straight into the document list when flattenSingleItem is set on a single non-singleton item', () => {
    const S = makeMockStructureBuilder();
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
    const childList = childArgs?.[0] as TMockBuilder;
    expect(childList.kind).toBe('documentTypeList');
    expect(childList.documentType).toBe('link');
    expect(callArgs(childList, 'title')).toEqual(['Links']);
    expect(S.documentTypeList).toHaveBeenCalledTimes(1);
    expect(S.list).not.toHaveBeenCalled();
  });

  it('throws when flattenSingleItem is set but the section has more than one item', () => {
    const S = makeMockStructureBuilder();
    const section: TStructureSection = {
      title: 'Modules',
      id: 'modules',
      icon: List,
      flattenSingleItem: true,
      groups: [
        {
          items: [
            { schema: { name: 'moduleOne', title: 'Module One', icon: List } },
            { schema: { name: 'moduleTwo', title: 'Module Two', icon: Tag } },
          ],
        },
      ],
    };

    expect(() => buildSections(asStructureBuilder(S), [section])).toThrow(
      /flattenSingleItem/,
    );
  });

  it('throws when flattenSingleItem is set but the single item is a singleton', () => {
    const S = makeMockStructureBuilder();
    const section: TStructureSection = {
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
                title: 'Site Settings',
                icon: Settings,
              },
              mode: 'singleton',
            },
          ],
        },
      ],
    };

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

    const S = makeMockStructureBuilder();
    const result = buildSections(
      asStructureBuilder(S),
      sections,
    ) as unknown as TMockBuilder[];

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
                  title: 'Site Settings',
                  icon: Settings,
                },
              },
            ],
          },
        ],
      },
    ];

    const S = makeMockStructureBuilder();
    const result = buildSections(
      asStructureBuilder(S),
      sections,
    ) as unknown as TMockBuilder[];

    expect(result.map((builder) => builder.kind)).toEqual([
      'listItem',
      'divider',
      'listItem',
    ]);
    expect(callArgs(result[0]!, 'id')).toEqual(['modules']);
    expect(callArgs(result[2]!, 'id')).toEqual(['settings']);
  });
});
