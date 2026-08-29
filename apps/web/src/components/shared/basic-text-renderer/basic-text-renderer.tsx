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
      // Both `EXTERNAL` and `INTERNAL` links carry a resolved `url` here —
      // the service derefs `content`'s markDefs before this component ever
      // sees them, same as CTA `actions`. The plain-text fallback below is
      // for the remaining case: an `INTERNAL` reference that failed to
      // resolve (e.g. a deleted target).
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
