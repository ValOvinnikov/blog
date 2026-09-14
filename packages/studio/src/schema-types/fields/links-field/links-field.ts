import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { defineArrayMember, defineField } from 'sanity';

type TLinkRefItem = {
  link?: { _ref?: string };
};

const validateUniqueSharedLink = (value: unknown) => {
  const items = (value ?? []) as TLinkRefItem[];
  const refs = items.map((item) => item.link?._ref).filter(Boolean);

  return new Set(refs).size !== refs.length
    ? 'Each shared link can only be referenced once in this list.'
    : true;
};

/**
 * Builds a `linkRef`-shaped array field — the one way any call site authors
 * a link by choosing a `shared_link` document. `unique()` cannot catch a
 * duplicate here since these array members are wrapper objects rather than
 * bare references, so this always guards against the same shared link being
 * picked twice.
 */
export const linksField = ({
  name,
  title,
  description,
  of,
  max,
  min,
}: {
  name: string;
  title: string;
  description?: string;
  of?: string[];
  max?: number;
  min?: number;
}) =>
  defineField({
    name,
    title,
    type: 'array',
    description: description ?? 'Links, each pointing to a shared link.',
    of: (of ?? [linkRefSchema.name]).map((type) => defineArrayMember({ type })),
    validation: (rule) => {
      let nextRule = rule;

      if (typeof min === 'number') nextRule = nextRule.min(min);
      if (typeof max === 'number') nextRule = nextRule.max(max);

      return nextRule.custom(validateUniqueSharedLink);
    },
  });
