import { routes, type ILink, type TMaybeUndefined } from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

const DEFAULT_PRIMARY_ACTION_LABEL = 'Read more';

/**
 * The hero's primary CTA has no `ariaLabel` — unlike `ILink`, whose
 * `ariaLabel` targets assistive tech only. Lighthouse's SEO `link-text`
 * audit reads the link's visible text content, not `aria-label`, so a
 * descriptive suffix for the generic fallback label must be rendered as
 * real (if visually hidden) text. `hiddenLabelSuffix` carries that text;
 * the web layer renders it as an `sr-only` span appended to `label`.
 */
export type THeroPrimaryAction = Omit<ILink, 'ariaLabel'> & {
  hiddenLabelSuffix: TMaybeUndefined<string>;
};

export function toHeroPrimaryAction(
  label: string | null | undefined,
  post: TPostCard | undefined,
): TMaybeUndefined<THeroPrimaryAction> {
  if (!post) return undefined;

  return {
    label: label ?? DEFAULT_PRIMARY_ACTION_LABEL,
    href: routes.post(post.slug),
    target: undefined,
    platform: undefined,
    hiddenLabelSuffix: label ? undefined : post.title,
  };
}
