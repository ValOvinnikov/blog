import type { BlockText } from '@blog/config';

/**
 * Flattens a `BlockText` (simple Portable Text blocks — author bio, no
 * custom types) to a plain string, joining blocks with a space. `@blog/ui`'s
 * `AuthorByline` renders a plain-text `bio` snippet rather than rich markup,
 * so this is the one place that concatenation happens rather than rendering
 * through `PortableTextRenderer`.
 *
 * @example
 * const bio = blockTextToPlain(post.author?.bio);
 * return <AuthorByline name={author.name} bio={bio} />;
 */
export function blockTextToPlain(
  blocks: BlockText | undefined,
): string | undefined {
  if (!blocks || blocks.length === 0) return undefined;

  const text = blocks
    .map((block) =>
      (block.children ?? []).map((child) => child.text ?? '').join(''),
    )
    .filter(Boolean)
    .join(' ');

  return text.length > 0 ? text : undefined;
}
