import type { Code, RichText as TPortableText } from '@blog/config';
import {
  Heading,
  InlineCode,
  Prose,
  ProseLink,
  QuoteBlock,
} from '@blog/ui/atoms';
import {
  PortableText,
  type PortableTextBlockComponent,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from '@portabletext/react';
import { SmartLink } from '@web/components/shared/smart-link';
import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';

import { CodeBlock } from './code-block';
import { portableTextRendererVariants } from './portable-text-renderer-variants';

export interface IPortableTextRendererProps {
  value: TPortableText;
  /**
   * The already-computed `extractPostHeadings(value)` outline. Passing it
   * both opts each rendered h2/h3 into carrying its outline `id` (plus a
   * matching `scroll-mt-*` so an anchor jump clears the sticky `Header`) and
   * skips recomputing the outline a second time here. Only `BlogPostPage`
   * passes this, for the post body it already extracted headings from for
   * `PostContentsRail`'s gate. Every other consumer (page-builder modules
   * such as `ContentModule`, which can render more than once on the same
   * page) omits it, so their headings never carry an `id` that could
   * collide with a same-titled heading in a sibling module.
   */
  headings?: TPostHeading[];
}

interface ILinkAnnotation {
  _type: 'link';
  href?: string;
}

const s = portableTextRendererVariants();

/**
 * Builds the `block.h2`/`block.h3` renderers for a single `value` — closing
 * over a `_key` → slug `id` map (from the caller-supplied `headings`, the
 * single source of truth for these ids) so each rendered heading gets the
 * exact `id` `PostContentsRail`'s links point at, plus the matching
 * `scroll-mt-*` so the anchor jump clears the sticky header. `headings`
 * omitted (the default for every consumer but `BlogPostPage`) leaves the map
 * empty, so headings render with neither an `id` nor the anchor offset, same
 * as before.
 */
const headingBlockComponents = (
  headings: TPostHeading[],
): Record<'h2' | 'h3', PortableTextBlockComponent> => {
  const idByKey = new Map(headings.map((heading) => [heading.key, heading.id]));
  const headingId = (key?: string) => (key ? idByKey.get(key) : undefined);
  const headingClassName = (key?: string) =>
    headingId(key) ? s.headingAnchor() : undefined;

  const H2: PortableTextBlockComponent = ({ children, value: block }) => (
    <Heading
      level={2}
      visual="prose-h2"
      id={headingId(block._key)}
      className={headingClassName(block._key)}
    >
      {children}
    </Heading>
  );

  const H3: PortableTextBlockComponent = ({ children, value: block }) => (
    <Heading
      level={3}
      visual="prose-h3"
      id={headingId(block._key)}
      className={headingClassName(block._key)}
    >
      {children}
    </Heading>
  );

  return { h2: H2, h3: H3 };
};

/**
 * PortableTextRenderer — web-owned bridge from a Sanity Portable Text field
 * (the service layer's `RichText` view-model type) to rendered markup, via
 * `@portabletext/react`. Maps block styles and marks to `@blog/ui` atoms
 * (`Prose`, `Heading`) and custom types (a `code` block) to a syntax-
 * highlighted `CodeBlock` — the one place this bridges Sanity content and
 * `@blog/ui` presentation, keeping `@blog/ui` itself Sanity-free. `Prose`
 * wraps the whole rendered output once (it's width-agnostic typography, not
 * a per-block wrapper) so sibling paragraphs/headings/code blocks are direct
 * children sharing one spacing rhythm. `h2`/`h3` blocks additionally get a
 * stable, URL-safe `id` (see `headingBlockComponents`), but only when the
 * caller opts in via `headings` — omitted by every consumer except
 * `BlogPostPage`, so a page-builder module rendered more than once on the
 * same page (`ContentModule`) never stamps a colliding `id` on a same-titled
 * heading in a sibling instance.
 *
 * @example
 * <ContentModule title={title}>
 *   <PortableTextRenderer value={body} />
 * </ContentModule>
 *
 * @example
 * <PortableTextRenderer value={body} headings={extractPostHeadings(body)} />
 */
export const PortableTextRenderer = ({
  value,
  headings,
}: IPortableTextRendererProps) => {
  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      // Defensive: Studio's block-toolbar no longer offers 'h1' as a style,
      // but the schema doesn't reject a document written with one via
      // another path (API, import script, legacy content) — omitting this
      // key entirely would let `@portabletext/react` fall back to its own
      // bare, unstyled `<h1>` default, producing a second competing
      // top-level heading on the page. Downgrade to the same treatment as
      // h2 so it can never outrank the real page title (never part of the
      // rail's outline — `extractPostHeadings` only looks at h2/h3).
      h1: ({ children }) => (
        <Heading level={2} visual="prose-h2">
          {children}
        </Heading>
      ),
      ...headingBlockComponents(headings ?? []),
      h4: ({ children }) => (
        <Heading level={4} visual="prose-h4">
          {children}
        </Heading>
      ),
      blockquote: ({ children }) => <QuoteBlock>{children}</QuoteBlock>,
    },
    marks: {
      code: ({ children }: PortableTextMarkComponentProps) => (
        <InlineCode>{children}</InlineCode>
      ),
      link: ({
        children,
        value: annotation,
      }: PortableTextMarkComponentProps<ILinkAnnotation>) =>
        annotation?.href ? (
          <ProseLink as={SmartLink} href={annotation.href}>
            {children}
          </ProseLink>
        ) : (
          <>{children}</>
        ),
    },
    types: {
      code: ({ value: codeValue }: { value: Code }) => (
        <CodeBlock
          code={codeValue.code ?? ''}
          language={codeValue.language}
          filename={codeValue.filename}
          highlightedLines={codeValue.highlightedLines}
        />
      ),
    },
  };

  return (
    <Prose className={s.root()}>
      <PortableText value={value} components={components} />
    </Prose>
  );
};
