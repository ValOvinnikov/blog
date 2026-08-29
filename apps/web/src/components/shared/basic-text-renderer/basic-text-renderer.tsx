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
      // Only `EXTERNAL` links carry a usable `url` here — `content`'s
      // markDefs aren't deref-projected, so an `INTERNAL` reference has no
      // resolved href to route through.
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
 * BasicTextRenderer — renders the CTA module's optional `content` field, a
 * narrower Portable Text shape than the post body's full `RichText`
 * (paragraphs, lists, bold/italic, and inline links only — no headings,
 * images, code, or asides). `link` annotations route through the same
 * `SmartLink` the module's actions use.
 */
export const BasicTextRenderer = ({ value }: IBasicTextRendererProps) => (
  <PortableText value={value} components={components} />
);
