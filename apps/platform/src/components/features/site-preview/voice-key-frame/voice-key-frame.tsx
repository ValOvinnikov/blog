import type { TVoiceFieldId } from '@blog/config';
import type { ReactNode } from 'react';

import { voiceKeyFrameVariants } from './voice-key-frame-variants';

export type TVoiceKeyFrameProps = {
  fieldId: TVoiceFieldId;
  isFocused: boolean;
  isInline?: boolean;
  children: ReactNode;
};

/** Marks the specimen text a Voice field renders, so focusing that field can outline it without widening a `@blog/ui` prop. */
export const VoiceKeyFrame = ({
  fieldId,
  isFocused,
  isInline = false,
  children,
}: TVoiceKeyFrameProps) => {
  const Element = isInline ? 'span' : 'div';

  return (
    <Element
      data-voice-key={fieldId}
      data-focused={isFocused}
      data-testid={`voice-key-${fieldId}`}
      className={voiceKeyFrameVariants({ isFocused })}
    >
      {children}
    </Element>
  );
};
