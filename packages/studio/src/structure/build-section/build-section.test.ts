import { House, List, Settings, Tag } from 'lucide-react';
import type { StructureBuilder } from 'sanity/structure';

import {
  buildGroupedListItems,
  buildSection,
  buildSections,
  type TStructureGroup,
  type TStructureSection,
} from './build-section';

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
  document: vi.fn(() => makeMockBuilder('document')),
  list: vi.fn(() => makeMockBuilder('list')),
});

const asStructureBuilder = (S: ReturnType<typeof makeMockStructureBuilder>) =>
  S as unknown as StructureBuilder;

describe(buildGroupedListItems, () => {
  it('flattens 3 groups into divider + items, preserving declared order with no leading/trailing extra divider', () => {
    const groups: TStructureGroup[] = [
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
    ];

    const S = makeMockStructureBuilder();
    const result = buildGroupedListItems(
      asStructureBuilder(S),
      groups,
    ) as unknown as TMockBuilder[];

    expect(result.map((builder) => builder.kind)).toEqual([
      'divider',
      'documentTypeListItem',
      'documentTypeListItem',
      'divider',
      'listItem',
      'divider',
      'documentTypeListItem',
      'listItem',
    ]);

    // A divider precedes every group, including the first, carrying its title.
    expect(callArgs(result[0]!, 'title')).toEqual(['Group A']);
    expect(callArgs(result[3]!, 'title')).toEqual(['Group B']);
    expect(callArgs(result[5]!, 'title')).toEqual(['Group C']);
    // Nothing trails the last group's items.
    expect(result.at(-1)?.kind).not.toBe('divider');

    // Items preserve declared order within a group, not sorted.
    expect(result[1]?.documentType).toBe('moduleOne');
    expect(result[2]?.documentType).toBe('moduleTwo');
    expect(result[6]?.documentType).toBe('tagPage');
    expect(callArgs(result[7]!, 'id')).toEqual(['siteSettings']);
  });

  it('drops an empty group entirely, including its divider, without crashing', () => {
    const groups: TStructureGroup[] = [
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
    ];

    const S = makeMockStructureBuilder();
    const result = buildGroupedListItems(
      asStructureBuilder(S),
      groups,
    ) as unknown as TMockBuilder[];

    expect(result.map((builder) => builder.kind)).toEqual([
      'divider',
      'documentTypeListItem',
      'divider',
      'documentTypeListItem',
    ]);
    expect(callArgs(result[0]!, 'title')).toEqual(['Group A']);
    expect(callArgs(result[2]!, 'title')).toEqual(['Group C']);
  });

  it('builds a list item via S.documentTypeListItem() and a singleton item via S.listItem()/S.document()', () => {
    const groups: TStructureGroup[] = [
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
    ];

    const S = makeMockStructureBuilder();
    const result = buildGroupedListItems(
      asStructureBuilder(S),
      groups,
    ) as unknown as TMockBuilder[];

    const [, listItemBuilder, singletonBuilder] = result;

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
    const groups: TStructureGroup[] = [
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
    ];

    const S = makeMockStructureBuilder();
    const result = buildGroupedListItems(
      asStructureBuilder(S),
      groups,
    ) as unknown as TMockBuilder[];

    expect(result.map((builder) => builder.kind)).toEqual([
      'divider',
      'documentTypeListItem',
      'documentTypeListItem',
    ]);
    expect(S.documentTypeListItem).toHaveBeenCalledTimes(2);
    expect(S.listItem).not.toHaveBeenCalled();
    expect(S.document).not.toHaveBeenCalled();
  });

  it('emits an untitled group with no divider while a titled group still gets one', () => {
    const groups: TStructureGroup[] = [
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
    ];

    const S = makeMockStructureBuilder();
    const result = buildGroupedListItems(
      asStructureBuilder(S),
      groups,
    ) as unknown as TMockBuilder[];

    expect(result.map((builder) => builder.kind)).toEqual([
      'listItem',
      'documentTypeListItem',
      'divider',
      'documentTypeListItem',
    ]);
    expect(S.divider).toHaveBeenCalledTimes(1);
    expect(callArgs(result[2]!, 'title')).toEqual(['Settings']);
    expect(callArgs(result[0]!, 'id')).toEqual(['homePage']);
    expect(callArgs(result[1]!, 'title')).toEqual(['Landing Page']);
  });

  it('emits a bare divider before an untitled group carrying dividerBefore', () => {
    const groups: TStructureGroup[] = [
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
    ];

    const S = makeMockStructureBuilder();
    const result = buildGroupedListItems(
      asStructureBuilder(S),
      groups,
    ) as unknown as TMockBuilder[];

    expect(result.map((builder) => builder.kind)).toEqual([
      'documentTypeListItem',
      'divider',
      'documentTypeListItem',
    ]);
    expect(callArgs(result[1]!, 'title')).toBeUndefined();
  });
});

describe(buildSection, () => {
  it('builds a listItem with the section title/id/icon and a matching child list', () => {
    const section: TStructureSection = {
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
    };

    const S = makeMockStructureBuilder();
    const result = buildSection(
      asStructureBuilder(S),
      section,
    ) as unknown as TMockBuilder;

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
});

describe(buildSections, () => {
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
