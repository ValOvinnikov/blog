import { spacingAndDividerFields } from '@blog/studio/schema-types/objects/layout';
import { SlidersHorizontal } from 'lucide-react';
import { defineType } from 'sanity';

/**
 * Hero's trimmed Layout — no `containerWidth`, since Hero's grid always
 * manages its own width. Shares its fields with `layoutSchema` via
 * `spacingAndDividerFields()` but is a distinct registered type (Sanity
 * validation/fields are fixed per named type, so two modules needing
 * different field sets need two types — same reasoning as
 * `imageWithAlt`/`bodyImage`).
 */
export const heroLayoutSchema = defineType({
  name: 'heroLayout',
  title: 'Layout',
  type: 'object',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: spacingAndDividerFields(),
});
