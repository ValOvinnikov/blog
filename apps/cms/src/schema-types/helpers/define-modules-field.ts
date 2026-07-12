import type { TModuleType } from '@blog/config/constants';
import { defineArrayMember, defineField } from 'sanity';

/**
 * Builds the `modules` reference array field shared by every page document.
 * Each page passes the subset of `MODULE_TYPE` values it allows, so adding a
 * module type to a page is a one-line change instead of a duplicated field
 * block.
 */
export const defineModulesField = ({
  allow,
  description,
}: {
  allow: TModuleType[];
  description?: string;
}) =>
  defineField({
    name: 'modules',
    title: 'Modules',
    type: 'array',
    description: description ?? 'Ordered content modules that build this page.',
    of: allow.map((type) =>
      defineArrayMember({ type: 'reference', to: [{ type }] }),
    ),
  });
