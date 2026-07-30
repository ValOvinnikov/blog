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
import { extractPostHeadings } from '@web/utils/extract-post-headings/extract-post-headings';

import { CodeBlock } from './code-block';
import { portableTextRendererVariants } from './portable-text-renderer-variants';

export interface IPortableTextRendererProps {
  value: TPortableText;
}

interface ILinkAnnotation {
  _type: 'link';
  href?: string;
}

const s = portableTextRendererVariants();

/**
 * Builds the `block.h2`/`block.h3` renderers for a single `value` — closing
 * over a `_key` → slug `id` map (from `extractPostHeadings`, the single
 * source of truth for these ids) so each rendered heading gets the exact
 * `id` `PostContentsRail`'s links point at. Below the 3-H2 threshold the map
 * is empty and headings render without an `id`, same as before.
 */
const headingBlockComponents = (
  value: TPortableText,
): Record<'h2' | 'h3', PortableTextBlockComponent> => {
  const idByKey = new Map(
    extractPostHeadings(value).map((heading) => [heading.key, heading.id]),
  );
  const headingId = (key?: string) => (key ? idByKey.get(key) : undefined);

  const H2: PortableTextBlockComponent = ({ children, value: block }) => (
    <Heading level={2} visual="prose-h2" id={headingId(block._key)}>
      {children}
    </Heading>
  );

  const H3: PortableTextBlockComponent = ({ children, value: block }) => (
    <Heading level={3} visual="prose-h3" id={headingId(block._key)}>
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
 * stable, URL-safe `id` (see `headingBlockComponents`) so `PostContentsRail`
 * links and deep-links resolve to a real in-page anchor.
 *
 * @example
 * <ContentModule title={title}>
 *   <PortableTextRenderer value={body} />
 * </ContentModule>
 */
export const PortableTextRenderer = ({ value }: IPortableTextRendererProps) => {
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
      ...headingBlockComponents(value),
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
