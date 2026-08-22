import { GroupedListPane } from '@cms/structure/grouped-list-pane';
import type {
  ChildResolver,
  ChildResolverOptions,
  ComponentBuilder,
  PartialListItem,
  StructureBuilder,
  UnserializedListItemChild,
} from 'sanity/structure';

/**
 * The narrow surface a grouped list needs from a `ListItemBuilder` — not the
 * full class (its protected members block plain-object fixtures from
 * structurally matching it), so tests can build fixtures with no Studio
 * runtime involved.
 */
export type TGroupedListItemSource = {
  getId(): string | undefined;
  getTitle(): string | undefined;
  getIcon(): PartialListItem['icon'];
  getChild(): UnserializedListItemChild | undefined;
};

export type TGroupedListGroup<
  TItem extends TGroupedListItemSource = TGroupedListItemSource,
> = {
  title: string;
  items: TItem[];
};

export type TGroupedListConfig = {
  id: string;
  title: string;
  groups: TGroupedListGroup[];
};

export const findGroupedListItem = (
  groups: TGroupedListGroup[],
  itemId: string,
): TGroupedListItemSource | undefined =>
  groups
    .flatMap((group) => group.items)
    .find((item) => item.getId() === itemId);

/**
 * Delegates child-pane resolution to whichever item's id matches the clicked
 * row — the lookup a stock `S.list()` pane gets for free from its `.items()`,
 * reimplemented here because an `S.component()` pane gets none of that.
 */
export const resolveGroupedListChild =
  (groups: TGroupedListGroup[]): ChildResolver =>
  (itemId: string, options: ChildResolverOptions) => {
    const item = findGroupedListItem(groups, itemId);
    if (!item) return undefined;

    const child = item.getChild();
    return typeof child === 'function' ? child(itemId, options) : child;
  };

/**
 * `structureTool`'s `List`/`ListItem`/`Divider` API has no non-interactive
 * label row — every row is either a clickable item or a bare rule. This
 * renders each group's title as a real heading with its items as flat
 * clickable rows beneath it (no extra nested pane), reusing whatever
 * `ListItemBuilder`s a stock `S.list()` would have taken so navigation
 * behavior (document vs. document-type list) is unchanged.
 */
export const groupedList = (
  S: StructureBuilder,
  config: TGroupedListConfig,
): ComponentBuilder =>
  S.component(GroupedListPane)
    .id(config.id)
    .title(config.title)
    .options({ groups: config.groups })
    .child(resolveGroupedListChild(config.groups));
