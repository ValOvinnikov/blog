import { House, List, Settings, Tag } from 'lucide-react';
import type { StructureBuilder } from 'sanity/structure';

import {
  buildGroupedListItems,
  type TStructureGroup,
} from './build-grouped-list';

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
});

const asStructureBuilder = (S: ReturnType<typeof makeMockStructureBuilder>) =>
  S as unknown as StructureBuilder;

describe(buildGroupedListItems, () => {
  it('flattens 3 groups into divider + items, preserving declared order with no leading/trailing extra divider', () => {
    const groups: TStructureGroup[] = [
      {
        title: 'Group A',
        items: [
          { documentType: 'moduleOne', title: 'Module One', icon: List },
          { documentType: 'moduleTwo', title: 'Module Two', icon: Tag },
        ],
      },
      {
        title: 'Group B',
        items: [
          {
            documentType: 'homePage',
            title: 'Home Page',
            icon: House,
            mode: 'singleton',
          },
        ],
      },
      {
        title: 'Group C',
        items: [
          { documentType: 'tagPage', title: 'Tag Pages', icon: Tag },
          {
            documentType: 'siteSettings',
            title: 'Site Settings',
            icon: Settings,
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
        items: [{ documentType: 'moduleOne', title: 'Module One', icon: List }],
      },
      { title: 'Group B (empty)', items: [] },
      {
        title: 'Group C',
        items: [{ documentType: 'moduleTwo', title: 'Module Two', icon: Tag }],
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
          { documentType: 'listType', title: 'List Item', icon: List },
          {
            documentType: 'singletonType',
            title: 'Singleton Item',
            icon: House,
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
          { documentType: 'defaultMode', title: 'Default Mode', icon: List },
          {
            documentType: 'explicitList',
            title: 'Explicit List',
            icon: Tag,
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
});
