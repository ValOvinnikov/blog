import {
  findGroupedListItem,
  groupedList,
  resolveGroupedListChild,
  type TGroupedListGroup,
  type TGroupedListItemSource,
} from '@cms/structure/grouped-list';
import { GroupedListPane } from '@cms/structure/grouped-list-pane';
import type { ChildResolverOptions, StructureBuilder } from 'sanity/structure';

const createItem = (
  overrides: Partial<TGroupedListItemSource> = {},
): TGroupedListItemSource => ({
  getId: () => 'item-id',
  getTitle: () => 'Item Title',
  getIcon: () => undefined,
  getChild: () => undefined,
  ...overrides,
});

const childResolverOptions = {} as ChildResolverOptions;

describe('findGroupedListItem', () => {
  it('finds an item nested inside any group by id', () => {
    const target = createItem({ getId: () => 'topic-pages' });
    const groups: TGroupedListGroup[] = [
      { title: 'Home Page', items: [createItem({ getId: () => 'page_home' })] },
      { title: 'Blog', items: [createItem({ getId: () => 'post' }), target] },
    ];

    expect(findGroupedListItem(groups, 'topic-pages')).toBe(target);
  });

  it('returns undefined when no item matches', () => {
    const groups: TGroupedListGroup[] = [
      { title: 'General', items: [createItem({ getId: () => 'page' })] },
    ];

    expect(findGroupedListItem(groups, 'missing')).toBeUndefined();
  });
});

describe('resolveGroupedListChild', () => {
  it('returns the static child of the matching item', () => {
    const staticChild = { type: 'document' };
    const groups: TGroupedListGroup[] = [
      {
        title: 'Home Page',
        items: [
          createItem({
            getId: () => 'page_home',
            getChild: () => staticChild as never,
          }),
        ],
      },
    ];

    const resolve = resolveGroupedListChild(groups);

    expect(resolve('page_home', childResolverOptions)).toBe(staticChild);
  });

  it('invokes a child resolver function with the itemId and options', () => {
    const resolvedChild = { type: 'documentTypeList' };
    const childResolverFn = vi.fn(() => resolvedChild);
    const groups: TGroupedListGroup[] = [
      {
        title: 'Blog',
        items: [
          createItem({
            getId: () => 'post',
            getChild: () => childResolverFn as never,
          }),
        ],
      },
    ];

    const resolve = resolveGroupedListChild(groups);
    const result = resolve('post', childResolverOptions);

    expect(childResolverFn).toHaveBeenCalledWith('post', childResolverOptions);
    expect(result).toBe(resolvedChild);
  });

  it('returns undefined when no item matches the clicked id', () => {
    const groups: TGroupedListGroup[] = [
      { title: 'General', items: [createItem({ getId: () => 'page' })] },
    ];

    const resolve = resolveGroupedListChild(groups);

    expect(resolve('missing', childResolverOptions)).toBeUndefined();
  });
});

describe('groupedList', () => {
  it('wires id, title, options, and a child resolver onto the component builder', () => {
    const builder = {
      id: vi.fn(function (this: unknown) {
        return this;
      }),
      title: vi.fn(function (this: unknown) {
        return this;
      }),
      options: vi.fn(function (this: unknown) {
        return this;
      }),
      child: vi.fn(function (this: unknown) {
        return this;
      }),
    };
    const S = {
      component: vi.fn(() => builder),
    } as unknown as StructureBuilder;
    const groups: TGroupedListGroup[] = [
      { title: 'Home Page', items: [createItem()] },
    ];

    const result = groupedList(S, { id: 'pages', title: 'Pages', groups });

    expect(S.component).toHaveBeenCalledWith(GroupedListPane);
    expect(builder.id).toHaveBeenCalledWith('pages');
    expect(builder.title).toHaveBeenCalledWith('Pages');
    expect(builder.options).toHaveBeenCalledWith({ groups });
    expect(builder.child).toHaveBeenCalledWith(expect.any(Function));
    expect(result).toBe(builder);
  });
});
