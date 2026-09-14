import type { TCtaContent, TSharedLinkAnnotation } from '@blog/service';
import { ProseLink } from '@blog/ui/atoms/prose-link';
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from '@portabletext/react';
import { SmartLink } from '@web/components/shared/smart-link';

import { inlineTextRendererVariants } from './inline-text-renderer-variants';

export interface IInlineTextRendererProps {
  value: TCtaContent;
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
    sharedLinkAnnotation: ({
      children,
      value: annotation,
    }: PortableTextMarkComponentProps<TSharedLinkAnnotation>) =>
      annotation?.link?.href ? (
        <ProseLink as={SmartLink} href={annotation.link.href}>
          {children}
        </ProseLink>
      ) : (
        <>{children}</>
      ),
  },
};

/**
 * Renders a constrained Portable Text shape — paragraphs, lists, bold/italic,
 * and inline links only (no headings, images, code, or asides). Links come
 * from the `shared_link` library only; a `sharedLinkAnnotation` mark with no
 * resolved link renders as plain text.
 */
export const InlineTextRenderer = ({ value }: IInlineTextRendererProps) => (
  <PortableText value={value} components={components} />
);
