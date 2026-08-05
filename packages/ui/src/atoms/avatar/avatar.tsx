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

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('');
  }

  const token = words[0] ?? '';
  const localPart = token.split('@')[0] ?? token;
  const segments = localPart.split(/[._-]+/).filter(Boolean);

  if (segments.length > 1) {
    return segments
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? '')
      .join('');
  }

  return localPart.slice(0, 2).toUpperCase();
};

/**
 * Avatar atom — renders a provided image, or an initials badge derived
 * from `name` when no image is supplied. `onImageError` forwards the
 * native `<img>` load-failure event so a stateful caller can swap `src`
 * to `undefined` and trigger the same initials fallback on a runtime
 * load failure.
 */
export const Avatar = ({
  src,
  alt,
  name,
  size,
  className,
  onImageError,
}: TAvatarProps) => {
  const initials = getInitials(name);

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
