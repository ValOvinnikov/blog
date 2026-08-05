import type { Size } from '@blog/config';

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
  onImageError?: () => void;
};

/**
 * Avatar atom — renders a provided image, or a two-letter initials badge
 * when no image is supplied. `onImageError` forwards the native `<img>`
 * load-failure event so a stateful caller can swap `src` to `undefined`
 * and trigger the same initials fallback on a runtime load failure.
 */
export const Avatar = ({
  src,
  alt,
  name,
  size,
  className,
  onImageError,
}: TAvatarProps) => {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <span className={avatarVariants({ size, class: className })}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={avatarImageVariants()}
          onError={onImageError}
        />
      ) : (
        <>
          <span aria-hidden="true">{initials}</span>
          <span className={avatarNameVariants()}>{name}</span>
        </>
      )}
    </span>
  );
};
