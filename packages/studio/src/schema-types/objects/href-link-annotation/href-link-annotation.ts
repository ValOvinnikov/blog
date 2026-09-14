import { defineArrayMember, defineField } from 'sanity';

/**
 * Reproduces Sanity's built-in block-level `link` annotation, so a block
 * type keeps the paste-a-URL shortcut once its `marks.annotations` is
 * stated explicitly instead of left to inherit the default. Deliberately
 * not registered in `objects/index.ts` — it shares the name `link` with the
 * registered `link` object, but a block's annotations resolve inline per
 * block rather than through the top-level type registry, so the same name
 * is safe here and would not be elsewhere.
 */
export const hrefLinkAnnotation = () =>
  defineArrayMember({
    type: 'object',
    name: 'link',
    title: 'Link',
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
