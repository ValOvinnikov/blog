import { getModulePack } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { isNull, isUndefined } from '@blog/utils/primitives';
import type { ComponentType } from 'react';
import {
  type InsertMenuOptions,
  isReferenceSchemaType,
  type SchemaType,
} from 'sanity';

type TPickerType = { name: string };

type TPickerGroup = NonNullable<InsertMenuOptions['groups']>[number];

const AUTO_FILTER_MIN_TYPES = 6;

export const ALL_ITEMS_TAB = 'all-items';

export const hasModuleMembers = (types: readonly TPickerType[]) =>
  types.some(({ name }) => !isNull(getModulePack(name)));

export const isModulePickerSearchShown = (
  filter: InsertMenuOptions['filter'],
  typeCount: number,
) =>
  isUndefined(filter) || filter === 'auto'
    ? typeCount >= AUTO_FILTER_MIN_TYPES
    : filter;

const matchesQuery = ({ name, title }: SchemaType, query: string) => {
  const needle = query.trim().toLowerCase();

  return title ? title.toLowerCase().includes(needle) : name.includes(needle);
};

const matchesTab = (
  { name }: SchemaType,
  groups: readonly TPickerGroup[],
  tab: string,
) =>
  tab === ALL_ITEMS_TAB ||
  Boolean(groups.find((group) => group.name === tab)?.of?.includes(name));

export const filterModulePickerTypes = ({
  types,
  groups = [],
  tab,
  query,
}: {
  types: readonly SchemaType[];
  groups?: readonly TPickerGroup[];
  tab: string;
  query: string;
}) =>
  types.filter(
    (type) => matchesTab(type, groups, tab) && matchesQuery(type, query),
  );

export const getModulePickerIcon = (
  type: SchemaType,
): TMaybeUndefined<ComponentType> => {
  const referenceIcon =
    isReferenceSchemaType(type) && type.to.length === 1
      ? type.to[0]?.icon
      : undefined;

  return type.icon ?? type.type?.icon ?? referenceIcon;
};
