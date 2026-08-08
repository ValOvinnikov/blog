import { MediaFrame } from '@blog/ui/atoms/media-frame';
import type { ComponentPropsWithoutRef } from 'react';

import { heroMediaVariants } from './hero-media-variants';

/**
 * HeroMedia — the media slot of a `Hero`; frames its content at a 16:9 ratio via
 * `MediaFrame`.
 */
export const HeroMedia = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <MediaFrame
    ratio="video"
    className={heroMediaVariants({ class: className })}
    {...rest}
  />
);
