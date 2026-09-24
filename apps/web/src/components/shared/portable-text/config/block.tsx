import { Heading } from '@blog/ui/components/atoms/heading';
import { QuoteBlock } from '@blog/ui/components/atoms/quote-block';
import type { PortableTextReactComponents } from '@portabletext/react';

import { portableTextVariants } from '../portable-text-variants';

const s = portableTextVariants();

export const blockComponents: PortableTextReactComponents['block'] = {
  h1: ({ children }) => (
    <Heading level={2} visual="prose-h2">
      {children}
    </Heading>
  ),
  h2: ({ children, value }) => (
    <Heading
      level={2}
      visual="prose-h2"
      id={value._key}
      className={s.headingAnchor()}
    >
      {children}
    </Heading>
  ),
  h3: ({ children, value }) => (
    <Heading
      level={3}
      visual="prose-h3"
      id={value._key}
      className={s.headingAnchor()}
    >
      {children}
    </Heading>
  ),
  h4: ({ children }) => (
    <Heading level={4} visual="prose-h4">
      {children}
    </Heading>
  ),
  blockquote: ({ children }) => <QuoteBlock>{children}</QuoteBlock>,
};
