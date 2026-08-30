import type { LucideIcon } from 'lucide-react';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

type TDividerBuilder = ReturnType<StructureBuilder['divider']>;

export type TStructureGroupItem = {
  documentType: string;
  title: string;
  icon: LucideIcon;
  mode?: 'list' | 'singleton';
};

export type TStructureGroup = {
  title: string;
  items: TStructureGroupItem[];
};

const buildGroupItem = (
  S: StructureBuilder,
  item: TStructureGroupItem,
): ListItemBuilder => {
  if (item.mode === 'singleton') {
    return S.listItem()
      .title(item.title)
      .id(item.documentType)
      .icon(item.icon)
      .child(
        S.document()
          .schemaType(item.documentType)
          .documentId(item.documentType),
      );
  }

  return S.documentTypeListItem(item.documentType)
    .title(item.title)
    .icon(item.icon);
};

/** Flattens groups into `[divider(A), ...itemsA, divider(B), ...itemsB, ...]`, dropping any empty group. */
export const buildGroupedListItems = (
  S: StructureBuilder,
  groups: TStructureGroup[],
): (ListItemBuilder | TDividerBuilder)[] =>
  groups
    .filter((group) => group.items.length > 0)
    .flatMap((group) => [
      S.divider().title(group.title),
      ...group.items.map((item) => buildGroupItem(S, item)),
    ]);
