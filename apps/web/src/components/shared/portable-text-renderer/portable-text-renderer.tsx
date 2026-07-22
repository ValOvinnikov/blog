import type { Code, RichText as TPortableText } from '@blog/config';
import { Heading, InlineCode, Prose, ProseLink, QuoteBlock } from '@blog/ui';
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
    h1: ({ children }) => <Heading level={1}>{children}</Heading>,
    h2: ({ children }) => <Heading level={2}>{children}</Heading>,
    h3: ({ children }) => <Heading level={3}>{children}</Heading>,
    h4: ({ children }) => <Heading level={4}>{children}</Heading>,
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
