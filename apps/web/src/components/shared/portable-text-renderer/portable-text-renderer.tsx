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
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from '@portabletext/react';
import { SmartLink } from '@web/components/shared/smart-link';

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

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    // Defensive: Studio's block-toolbar no longer offers 'h1' as a style, but
    // the schema doesn't reject a document written with one via another path
    // (API, import script, legacy content) — omitting this key entirely would
    // let `@portabletext/react` fall back to its own bare, unstyled `<h1>`
    // default, producing a second competing top-level heading on the page.
    // Downgrade to the same treatment as h2 so it can never outrank the real
    // page title.
    h1: ({ children }) => (
      <Heading level={2} visual="prose-h2">
        {children}
      </Heading>
    ),
    h2: ({ children }) => (
      <Heading level={2} visual="prose-h2">
        {children}
      </Heading>
    ),
    h3: ({ children }) => (
      <Heading level={3} visual="prose-h3">
        {children}
      </Heading>
    ),
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
      value,
    }: PortableTextMarkComponentProps<ILinkAnnotation>) =>
      value?.href ? (
        <ProseLink as={SmartLink} href={value.href}>
          {children}
        </ProseLink>
      ) : (
        <>{children}</>
      ),
  },
  types: {
    code: ({ value }: { value: Code }) => (
      <CodeBlock
        code={value.code ?? ''}
        language={value.language}
        filename={value.filename}
        highlightedLines={value.highlightedLines}
      />
    ),
  },
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
 * children sharing one spacing rhythm.
 *
 * @example
 * <ContentModule title={title}>
 *   <PortableTextRenderer value={body} />
 * </ContentModule>
 */
export const PortableTextRenderer = ({ value }: IPortableTextRendererProps) => (
  <Prose className={s.root()}>
    <PortableText value={value} components={components} />
  </Prose>
);
