import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import {
  buildGroupedListItems,
  type TDividerBuilder,
  type TStructureGroup,
  type TStructureGroupItem,
} from '@blog/studio/structure/build-group-items/build-group-items';
import type { ComponentType } from 'react';
import type { ListItemBuilder, StructureBuilder } from 'sanity/structure';

export type TStructureSection = {
  title: string;
  id: string;
  icon: ComponentType;
  groups: TStructureGroup[];
  dividerBefore?: boolean;
  flattenSingleItem?: boolean;
};

const getFlattenableItem = (
  section: TStructureSection,
): TMaybeUndefined<TStructureGroupItem> => {
  const items = section.groups.flatMap((group) => group.items);
  const [item] = items;
  return items.length === 1 && item?.mode !== 'singleton' ? item : undefined;
};

const buildSection = (
  S: StructureBuilder,
  section: TStructureSection,
  locales: readonly TLocaleIsoCode[],
): ListItemBuilder => {
  if (section.flattenSingleItem) {
    const item = getFlattenableItem(section);
    if (!item) {
      throw new Error(
        `Studio desk section "${section.id}" sets flattenSingleItem but has no single non-singleton item to flatten.`,
      );
    }
    const { name } = item.schema;

    return S.listItem()
      .title(section.title)
      .id(section.id)
      .icon(section.icon)
      .child(S.documentTypeList(name).title(section.title));
  }

  return S.listItem()
    .title(section.title)
    .id(section.id)
    .icon(section.icon)
    .child(
      S.list()
        .title(section.title)
        .items(buildGroupedListItems(S, section.groups, locales)),
    );
};

export const buildSections = (
  S: StructureBuilder,
  sections: TStructureSection[],
  locales: readonly TLocaleIsoCode[] = Object.values(LOCALE_ISO_CODES),
): (ListItemBuilder | TDividerBuilder)[] =>
  sections.flatMap((section) => [
    ...(section.dividerBefore ? [S.divider()] : []),
    buildSection(S, section, locales),
  ]);
