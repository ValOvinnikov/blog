import type { IPortableTextLinkMark } from '@blog/config';
import { InlineCode } from '@blog/ui/components/atoms/inline-code';
import { ProseLink } from '@blog/ui/components/atoms/prose-link';
import type {
  PortableTextMarkComponentProps,
  PortableTextReactComponents,
} from '@portabletext/react';
import { SmartLink } from '@web/components/shared/smart-link';

export const markComponents: PortableTextReactComponents['marks'] = {
  code: ({ children }: PortableTextMarkComponentProps) => (
    <InlineCode>{children}</InlineCode>
  ),
  linkRef: ({
    children,
    value: annotation,
  }: PortableTextMarkComponentProps<IPortableTextLinkMark>) =>
    annotation?.link ? (
      <ProseLink
        as={SmartLink}
        href={annotation.link.href}
        target={annotation.link.target}
      >
        {children}
      </ProseLink>
    ) : (
      <>{children}</>
    ),
};
