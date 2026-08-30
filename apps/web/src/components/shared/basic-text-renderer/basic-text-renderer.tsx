import type { BasicText, Link } from '@blog/config';
import { ProseLink } from '@blog/ui/atoms/prose-link';
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from '@portabletext/react';
import { SmartLink } from '@web/components/shared/smart-link';

import { basicTextRendererVariants } from './basic-text-renderer-variants';

export interface IBasicTextRendererProps {
  value: BasicText;
}

const s = basicTextRendererVariants();

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
    link: ({
      children,
      value: annotation,
    }: PortableTextMarkComponentProps<Link>) =>
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
 * and inline links only (no headings, images, code, or asides). `link`
 * annotations route through `SmartLink`.
 */
export const BasicTextRenderer = ({ value }: IBasicTextRendererProps) => (
  <PortableText value={value} components={components} />
);
