import type { Size } from '@blog/config';
import { useState } from 'react';

import {
  avatarImageVariants,
  avatarNameVariants,
  avatarVariants,
} from './avatar-variants';

export type TAvatarProps = {
  src?: string;
  alt: string;
  name: string;
  size?: typeof Size.SM | typeof Size.MD | typeof Size.LG;
  className?: string;
};

/**
 * Avatar atom — renders a provided image when it loads successfully, and
 * falls back to a two-letter initials badge both when no image is supplied
 * and when a supplied image fails to load at runtime.
 */
export const Avatar = ({ src, alt, name, size, className }: TAvatarProps) => {
  const [hasImageError, setHasImageError] = useState(false);

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  const showFallback = !src || hasImageError;

  return (
    <span className={avatarVariants({ size, class: className })}>
      {showFallback ? (
        <>
          <span aria-hidden="true">{initials}</span>
          <span className={avatarNameVariants()}>{name}</span>
        </>
      ) : (
        <img
          src={src}
          alt={alt}
          className={avatarImageVariants()}
          onError={() => setHasImageError(true)}
        />
      )}
    </span>
  );
};
