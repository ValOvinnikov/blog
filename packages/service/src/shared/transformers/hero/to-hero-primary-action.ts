import {
  routes,
  type ILink,
  type TCtaActionAppearance,
  type TMaybeNull,
  type TMaybeUndefined,
  type TNullable,
} from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';

const DEFAULT_PRIMARY_ACTION_LABEL = 'Read more';

// Lighthouse's `link-text` audit ignores `aria-label`, so the suffix renders as sr-only text.
export type THeroPrimaryAction = ILink & {
  hiddenLabelSuffix: TMaybeUndefined<string>;
  appearance: TMaybeUndefined<TCtaActionAppearance>;
};

export function toHeroPrimaryAction(
  label: TNullable<string>,
  post: TMaybeUndefined<TPostCard>,
  appearance?: TMaybeNull<TCtaActionAppearance>,
): TMaybeUndefined<THeroPrimaryAction> {
  if (!post) return undefined;

  return {
    label: label ?? DEFAULT_PRIMARY_ACTION_LABEL,
    href: routes.post(post.slug),
    target: undefined,
    platform: undefined,
    hiddenLabelSuffix: label ? undefined : post.title,
    appearance: appearance ?? undefined,
  };
}
