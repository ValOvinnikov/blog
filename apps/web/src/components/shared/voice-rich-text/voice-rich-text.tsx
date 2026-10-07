import type { TVoicePortableText } from '@blog/config';
import type { PortableTextComponents } from '@portabletext/react';
import { PortableText } from '@web/components/shared/portable-text';
import { voicePortableTextToInlineText } from '@web/utils/voice-portable-text-to-inline-text';

import { voiceRichTextVariants } from './voice-rich-text-variants';

export interface IVoiceRichTextProps {
  value: TVoicePortableText;
}

const s = voiceRichTextVariants();

const inlineComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> },
};

const stackedComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <span className={s.line()}>{children}</span>,
  },
};

/** Renders a RICH voice value as phrasing content, so it can sit inside the sink's own `<p>`. */
export const VoiceRichText = ({ value }: IVoiceRichTextProps) => (
  <PortableText
    value={voicePortableTextToInlineText(value)}
    components={value.length > 1 ? stackedComponents : inlineComponents}
  />
);
