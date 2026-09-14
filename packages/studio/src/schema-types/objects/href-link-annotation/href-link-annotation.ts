import { defineArrayMember, defineField } from 'sanity';

/**
 * Reproduces Sanity's built-in block-level `link` annotation, so a block
 * type keeps the paste-a-URL shortcut once its `marks.annotations` is
 * stated explicitly instead of left to inherit the default. Deliberately
 * not registered in `objects/index.ts` — a block's annotations resolve
 * inline per block rather than through the top-level type registry, so this
 * only needs to exist where a block type spreads it into its own `marks`.
 */
export const hrefLinkAnnotation = () =>
  defineArrayMember({
    type: 'object',
    name: 'link',
    title: 'Link',
    options: { modal: { type: 'popover' } },
    fields: [
      defineField({
        name: 'href',
        title: 'Link',
        type: 'url',
        description: 'A valid web, email, phone, or relative link.',
        validation: (rule) =>
          rule.uri({
            scheme: ['http', 'https', 'tel', 'mailto'],
            allowRelative: true,
          }),
      }),
    ],
  });
