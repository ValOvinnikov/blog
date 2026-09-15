import type { InlineLink, InlineText } from '@blog/config';
import { ProseLink } from '@blog/ui/atoms/prose-link';
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from '@portabletext/react';
import { SmartLink } from '@web/components/shared/smart-link';

import { inlineTextRendererVariants } from './inline-text-renderer-variants';

export interface IInlineTextRendererProps {
  value: InlineText;
}

const s = inlineTextRendererVariants();

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className={s.bulletList()}>{children}</ul>,
    number: ({ children }) => <ol className={s.numberList()}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    inlineLink: ({
      children,
      value: annotation,
    }: PortableTextMarkComponentProps<InlineLink>) =>
      // `url` is already resolved for both link types; the fallback is only for an unresolved reference.
      annotation?.url ? (
        <ProseLink as={SmartLink} href={annotation.url}>
          {children}
        </ProseLink>
      ) : (
        <>{children}</>
      ),
  },
};

/**
 * Renders a constrained Portable Text shape — paragraphs, lists, bold/italic,
 * and inline links only (no headings, images, code, or asides). `inlineLink`
 * annotations route through `SmartLink`.
 */
export const InlineTextRenderer = ({ value }: IInlineTextRendererProps) => (
  <PortableText value={value} components={components} />
);
