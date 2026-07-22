import { MediaFrame } from '@blog/ui/atoms/media-frame';
import type { ComponentPropsWithoutRef } from 'react';

import { heroMediaVariants } from './hero-media-variants';

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
