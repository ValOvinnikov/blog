import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type IPortableTextLinkMark,
} from '@blog/config';
import { InlineCode } from '@blog/ui/components/atoms/inline-code';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import type {
  PortableTextMarkComponentProps,
  PortableTextReactComponents,
} from '@portabletext/react';
import { SmartLink } from '@web/components/shared/smart-link';

import { CookiePreferencesLink } from './cookie-preferences-link';

export const markComponents: PortableTextReactComponents['marks'] = {
  code: ({ children }: PortableTextMarkComponentProps) => (
    <InlineCode>{children}</InlineCode>
  ),
  sub: ({ children }: PortableTextMarkComponentProps) => <sub>{children}</sub>,
  sup: ({ children }: PortableTextMarkComponentProps) => <sup>{children}</sup>,
  [PORTABLE_TEXT_BLOCK_TYPE.LINK_REF]: ({
    children,
    value: annotation,
  }: PortableTextMarkComponentProps<IPortableTextLinkMark>) =>
    annotation?.link ? (
      <TextLink
        appearance="prose"
        as={SmartLink}
        href={annotation.link.href}
        target={annotation.link.target}
      >
        {children}
      </TextLink>
    ) : (
      <>{children}</>
    ),
  [PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK]: ({
    children,
  }: PortableTextMarkComponentProps) => (
    <CookiePreferencesLink>{children}</CookiePreferencesLink>
  ),
};
